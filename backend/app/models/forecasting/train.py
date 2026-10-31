"""Demand forecasting pipeline – trains multiple models and selects the best.

Model zoo
---------
  1. seasonal_naive        – previous-week same-weekday
  2. moving_average        – 7-day rolling mean of quantity
  3. exponential_smoothing – simple ETS per store-SKU
  4. random_forest         – scikit-learn RandomForestRegressor
  5. lightgbm              – LGBMRegressor with early stopping
                             (falls back to random_forest if lgbm not installed)

Best model is selected by lowest WAPE on the validation split and persisted
to MODELS_DIR / best_model.pkl.
"""
from __future__ import annotations

import os
import sys
import pickle
import warnings
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# LightGBM is optional
try:
    from lightgbm import LGBMRegressor
    _LGBM_AVAILABLE = True
except ImportError:
    _LGBM_AVAILABLE = False
    warnings.warn("lightgbm not installed – will fall back to RandomForest.", stacklevel=2)

from app.core.config import MODELS_DIR
from app.core.logging_cfg import get_logger
from app.models.forecasting.evaluate import compute_metrics

log = get_logger(__name__)

BEST_MODEL_PATH = MODELS_DIR / "best_model.pkl"


class ForecastingPipeline:
    """End-to-end demand forecasting pipeline.

    Example::

        from app.features.demand_features import DemandFeatureEngineer
        from app.data.repository import get_sales_train, get_sales_validation, ...

        fe = DemandFeatureEngineer()
        pipeline = ForecastingPipeline(model_name="lightgbm")
        val_metrics = pipeline.fit(train_df, val_df, fe)
        forecasts = pipeline.predict("ST001", "SKU0001", horizon_days=7)
    """

    def __init__(self, model_name: str = "lightgbm") -> None:
        self.model_name = model_name if _LGBM_AVAILABLE else "random_forest"
        self.best_model_name: Optional[str] = None
        self.best_model: Any = None

        # Baseline model stores: {(store_id, sku_id): pd.Series indexed by date}
        self._history: Dict[tuple, pd.Series] = {}
        self._feature_engineer: Optional[Any] = None  # DemandFeatureEngineer
        self._feature_cols: List[str] = []

        # Lazy-loaded train frame for baseline inference
        self._train_df: Optional[pd.DataFrame] = None

    # ──────────────────────────────────────────────────────────────────────────
    # Fit
    # ──────────────────────────────────────────────────────────────────────────

    def fit(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame,
        feature_engineer,  # DemandFeatureEngineer
    ) -> Dict[str, Dict[str, float]]:
        """Train all models, evaluate on val_df, persist the best.

        Returns
        -------
        dict {model_name: {wape, mae, rmse, bias}}
        """
        log.info("Starting ForecastingPipeline.fit()  train=%d  val=%d",
                 len(train_df), len(val_df))

        self._feature_engineer = feature_engineer
        self._train_df = train_df.copy()
        self._train_df["date"] = pd.to_datetime(self._train_df["date"])

        # ── 1. Build history index for baselines ──────────────────────────────
        self._build_history_index(self._train_df)

        # ── 2. Build feature matrices ─────────────────────────────────────────
        log.info("Engineering features on train split…")

        from app.data.repository import get_stores, get_products, get_events, get_promotions
        stores = get_stores()
        products = get_products()
        events = get_events()
        promotions = get_promotions()

        train_feat = feature_engineer.build_features(
            train_df, stores, products, events, promotions, fit=True
        )
        self._feature_cols = feature_engineer.get_feature_columns()

        # Validation features (transform only)
        log.info("Engineering features on validation split…")
        val_feat = feature_engineer.build_features(
            val_df, stores, products, events, promotions, fit=False
        )

        # Extract X / y
        y_train = train_df.sort_values(["store_id", "sku_id", "date"])["demand_units"].values
        X_train = train_feat[self._feature_cols].values

        val_sorted = val_df.sort_values(["store_id", "sku_id", "date"])
        y_val = val_sorted["demand_units"].values
        X_val = val_feat[self._feature_cols].values

        all_metrics: Dict[str, Dict[str, float]] = {}

        # ── 3. Baseline models ────────────────────────────────────────────────
        for name, pred_fn in [
            ("seasonal_naive", self._predict_seasonal_naive),
            ("moving_average", self._predict_moving_average),
            ("exponential_smoothing", self._predict_exp_smoothing),
        ]:
            log.info("Evaluating baseline: %s", name)
            try:
                y_hat = self._baseline_predict_for_df(val_sorted, pred_fn)
                metrics = compute_metrics(y_val, y_hat)
                all_metrics[name] = metrics
                log.info("  %s val WAPE=%.4f  MAE=%.2f", name, metrics["wape"], metrics["mae"])
            except Exception as exc:
                log.warning("  %s failed: %s", name, exc)
                all_metrics[name] = {"wape": 9999.0, "mae": 9999.0, "rmse": 9999.0, "bias": 0.0}

        # ── 4. Random Forest ──────────────────────────────────────────────────
        log.info("Training Random Forest…")
        rf_model = self._fit_random_forest(X_train, y_train)
        rf_preds = rf_model.predict(X_val).clip(min=0)
        rf_metrics = compute_metrics(y_val, rf_preds)
        all_metrics["random_forest"] = rf_metrics
        log.info("  random_forest val WAPE=%.4f  MAE=%.2f", rf_metrics["wape"], rf_metrics["mae"])

        # ── 5. LightGBM ───────────────────────────────────────────────────────
        if _LGBM_AVAILABLE:
            log.info("Training LightGBM…")
            try:
                lgbm_model = self._fit_lightgbm(X_train, y_train, X_val, y_val)
                lgbm_preds = lgbm_model.predict(X_val).clip(min=0)
                lgbm_metrics = compute_metrics(y_val, lgbm_preds)
                all_metrics["lightgbm"] = lgbm_metrics
                log.info("  lightgbm val WAPE=%.4f  MAE=%.2f",
                         lgbm_metrics["wape"], lgbm_metrics["mae"])
            except Exception as exc:
                log.warning("  lightgbm training failed: %s", exc)
                all_metrics["lightgbm"] = {"wape": 9999.0, "mae": 9999.0,
                                           "rmse": 9999.0, "bias": 0.0}

        # ── 6. Pick best by WAPE ──────────────────────────────────────────────
        self.best_model_name = min(all_metrics, key=lambda k: all_metrics[k]["wape"])
        log.info("Best model: %s  (WAPE=%.4f)", self.best_model_name,
                 all_metrics[self.best_model_name]["wape"])

        # Store the winning artifact
        if self.best_model_name == "random_forest":
            self.best_model = rf_model
        elif self.best_model_name == "lightgbm" and _LGBM_AVAILABLE:
            self.best_model = lgbm_model  # type: ignore[possibly-undefined]
        else:
            self.best_model = None  # baseline model – no sklearn artifact

        # ── 7. Persist ────────────────────────────────────────────────────────
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        artifact = {
            "best_model_name": self.best_model_name,
            "best_model": self.best_model,
            "feature_cols": self._feature_cols,
            "history": self._history,
            "all_metrics": all_metrics,
        }
        with open(BEST_MODEL_PATH, "wb") as f:
            pickle.dump(artifact, f)
        log.info("Saved best model artifact to %s", BEST_MODEL_PATH)

        return all_metrics

    # ──────────────────────────────────────────────────────────────────────────
    # Individual model trainers
    # ──────────────────────────────────────────────────────────────────────────

    def _fit_seasonal_naive(self, df: pd.DataFrame) -> None:
        """Seasonal naïve uses previous week same weekday – stored in history index."""
        # No explicit fit needed; _build_history_index does the work.
        pass

    def _fit_moving_average(self, df: pd.DataFrame) -> None:
        """7-day moving average – stored in history index."""
        pass

    def _fit_exp_smoothing(self, df: pd.DataFrame) -> None:
        """Simple exponential smoothing per store-SKU – stored in history index."""
        pass

    def _fit_random_forest(
        self, X_train: np.ndarray, y_train: np.ndarray
    ) -> RandomForestRegressor:
        rf = RandomForestRegressor(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=42,
        )
        rf.fit(X_train, y_train)
        return rf

    def _fit_lightgbm(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ) -> "LGBMRegressor":
        model = LGBMRegressor(
            n_estimators=1000,
            learning_rate=0.05,
            num_leaves=63,
            max_depth=-1,
            min_child_samples=20,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=42,
            n_jobs=-1,
            verbose=-1,
        )
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[
                __import__("lightgbm").early_stopping(stopping_rounds=50, verbose=False),
                __import__("lightgbm").log_evaluation(period=-1),
            ],
        )
        return model

    # ──────────────────────────────────────────────────────────────────────────
    # History index (for baseline models)
    # ──────────────────────────────────────────────────────────────────────────

    def _build_history_index(self, df: pd.DataFrame) -> None:
        """Build a {(store_id, sku_id): pd.Series[date → quantity]} index."""
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])
        self._history = {}
        for (store_id, sku_id), grp in df.groupby(["store_id", "sku_id"]):
            self._history[(store_id, sku_id)] = (
                grp.set_index("date")["quantity"].sort_index()
            )
        log.info("History index built for %d store-SKU pairs.", len(self._history))

    def _get_history(self, store_id: str, sku_id: str) -> pd.Series:
        """Return historical quantity series for a store-SKU pair."""
        return self._history.get((store_id, sku_id), pd.Series(dtype=float, index=pd.DatetimeIndex([])))

    # ──────────────────────────────────────────────────────────────────────────
    # Baseline predictors (per single row)
    # ──────────────────────────────────────────────────────────────────────────

    def _predict_seasonal_naive(
        self, store_id: str, sku_id: str, forecast_date: pd.Timestamp
    ) -> float:
        hist = self._get_history(store_id, sku_id)
        if hist.empty:
            return 0.0
        target = forecast_date - timedelta(weeks=1)
        if target in hist.index:
            return float(hist[target])
        # Fallback: same weekday within past 4 weeks
        for w in range(1, 5):
            t = forecast_date - timedelta(weeks=w)
            if t in hist.index:
                return float(hist[t])
        return float(hist.iloc[-1]) if len(hist) else 0.0

    def _predict_moving_average(
        self, store_id: str, sku_id: str, forecast_date: pd.Timestamp
    ) -> float:
        hist = self._get_history(store_id, sku_id)
        past = hist[hist.index < forecast_date]
        if past.empty:
            return 0.0
        return float(past.tail(7).mean())

    def _predict_exp_smoothing(
        self, store_id: str, sku_id: str, forecast_date: pd.Timestamp, alpha: float = 0.3
    ) -> float:
        hist = self._get_history(store_id, sku_id)
        past = hist[hist.index < forecast_date]
        if past.empty:
            return 0.0
        level = float(past.iloc[0])
        for val in past.iloc[1:]:
            level = alpha * val + (1 - alpha) * level
        return max(0.0, level)

    def _baseline_predict_for_df(
        self, df: pd.DataFrame, pred_fn
    ) -> np.ndarray:
        """Apply a baseline predictor to every row of a sorted DataFrame."""
        preds = []
        for _, row in df.iterrows():
            p = pred_fn(str(row["store_id"]), str(row["sku_id"]), pd.Timestamp(row["date"]))
            preds.append(max(0.0, p))
        return np.array(preds, dtype=float)

    # ──────────────────────────────────────────────────────────────────────────
    # Predict
    # ──────────────────────────────────────────────────────────────────────────

    def predict(
        self,
        store_id: str,
        sku_id: str,
        horizon_days: int = 7,
        reference_date: Optional[str] = None,
    ) -> List[dict]:
        """Return horizon-day ahead forecasts for a single store-SKU pair.

        Each element of the returned list is::

            {
                "forecast_date": "YYYY-MM-DD",
                "predicted_demand": float,
                "lower_bound": float,
                "upper_bound": float,
                "confidence": float,
            }
        """
        if reference_date is None:
            ref = pd.Timestamp.today().normalize()
        else:
            ref = pd.Timestamp(reference_date)

        results = []
        hist = self._get_history(store_id, sku_id)

        for h in range(1, horizon_days + 1):
            fdate = ref + timedelta(days=h)
            fdate_str = fdate.strftime("%Y-%m-%d")

            if self.best_model_name in ("random_forest", "lightgbm") and self.best_model is not None:
                point = self._predict_ml_single(store_id, sku_id, fdate)
            elif self.best_model_name == "seasonal_naive":
                point = self._predict_seasonal_naive(store_id, sku_id, fdate)
            elif self.best_model_name == "moving_average":
                point = self._predict_moving_average(store_id, sku_id, fdate)
            elif self.best_model_name == "exponential_smoothing":
                point = self._predict_exp_smoothing(store_id, sku_id, fdate)
            else:
                point = self._predict_moving_average(store_id, sku_id, fdate)

            point = max(0.0, point)

            # Simple uncertainty: ±20 % of prediction or historic std
            if not hist.empty:
                std = float(hist.tail(28).std())
            else:
                std = point * 0.2
            lower = max(0.0, point - 1.96 * std)
            upper = point + 1.96 * std
            confidence = min(0.95, max(0.5, 1.0 - (std / (point + 1e-6)) * 0.5))

            results.append({
                "forecast_date": fdate_str,
                "predicted_demand": round(point, 2),
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
                "confidence": round(confidence, 4),
            })

        return results

    def _predict_ml_single(
        self, store_id: str, sku_id: str, forecast_date: pd.Timestamp
    ) -> float:
        """Build a single-row feature vector for ML prediction."""
        if self._feature_engineer is None or not self._feature_cols:
            return self._predict_moving_average(store_id, sku_id, forecast_date)

        hist = self._get_history(store_id, sku_id)
        past = hist[hist.index < forecast_date]
        last_qty = float(past.iloc[-1]) if not past.empty else 0.0

        # Build a synthetic single row
        row = {
            "date": forecast_date,
            "store_id": store_id,
            "sku_id": sku_id,
            "quantity": last_qty,
            "unit_price": 1.0,
            "discount_pct": 0.0,
            "competitor_price": 1.0,
            "temperature_c": 25.0,
            "rainfall_mm": 0.0,
            "promotion_active": False,
            "news_signal_present": False,
        }

        # Populate lag features from history
        for lag in [1, 7, 14, 28]:
            t = forecast_date - timedelta(days=lag)
            row[f"lag_{lag}"] = float(hist.get(t, last_qty)) if not hist.empty else 0.0

        for window in [7, 14, 28]:
            past_w = past.tail(window)
            row[f"roll_{window}"] = float(past_w.mean()) if not past_w.empty else 0.0
        for window in [7, 14]:
            past_w = past.tail(window)
            row[f"roll_{window}_std"] = float(past_w.std()) if len(past_w) > 1 else 0.0

        row["day_of_week"] = forecast_date.dayofweek
        row["day_of_month"] = forecast_date.day
        row["month"] = forecast_date.month
        row["week_of_year"] = int(forecast_date.isocalendar()[1])
        row["is_weekend"] = int(forecast_date.dayofweek >= 5)
        row["quarter"] = forecast_date.quarter
        row["competitor_price_ratio"] = 1.0
        row["is_event_day"] = 0

        # Fill remaining feature columns with 0
        for col in self._feature_cols:
            if col not in row:
                row[col] = 0

        X = np.array([[row.get(c, 0) for c in self._feature_cols]])
        pred = float(self.best_model.predict(X)[0])
        return max(0.0, pred)

    # ──────────────────────────────────────────────────────────────────────────
    # Evaluate
    # ──────────────────────────────────────────────────────────────────────────

    def evaluate(self, test_df: pd.DataFrame) -> dict:
        """Compute WAPE, MAE, RMSE, Bias on the test set.

        Returns
        -------
        dict with keys wape, mae, rmse, bias, and model_name.
        """
        test_sorted = test_df.sort_values(["store_id", "sku_id", "date"]).copy()
        test_sorted["date"] = pd.to_datetime(test_sorted["date"])
        y_true = test_sorted["demand_units"].values

        if self.best_model_name in ("random_forest", "lightgbm") and self.best_model is not None:
            if self._feature_engineer is not None:
                from app.data.repository import get_stores, get_products, get_events, get_promotions
                stores = get_stores()
                products = get_products()
                events = get_events()
                promotions = get_promotions()

                test_feat = self._feature_engineer.build_features(
                    test_df, stores, products, events, promotions, fit=False
                )
                y_pred = self.best_model.predict(
                    test_feat[self._feature_cols].values
                ).clip(min=0)
            else:
                y_pred = np.array([
                    self._predict_ml_single(str(r["store_id"]), str(r["sku_id"]),
                                            pd.Timestamp(r["date"]))
                    for _, r in test_sorted.iterrows()
                ])
        else:
            pred_fns = {
                "seasonal_naive": self._predict_seasonal_naive,
                "moving_average": self._predict_moving_average,
                "exponential_smoothing": self._predict_exp_smoothing,
            }
            fn = pred_fns.get(self.best_model_name, self._predict_moving_average)
            y_pred = self._baseline_predict_for_df(test_sorted, fn)

        metrics = compute_metrics(y_true, y_pred)
        metrics["model_name"] = self.best_model_name
        log.info("Test evaluation: %s", metrics)
        return metrics

    # ──────────────────────────────────────────────────────────────────────────
    # Load from disk
    # ──────────────────────────────────────────────────────────────────────────

    @classmethod
    def load(cls, path: Path = BEST_MODEL_PATH) -> "ForecastingPipeline":
        """Reconstruct a ForecastingPipeline from a saved artifact."""
        with open(path, "rb") as f:
            artifact = pickle.load(f)
        pipeline = cls()
        pipeline.best_model_name = artifact["best_model_name"]
        pipeline.best_model = artifact["best_model"]
        pipeline._feature_cols = artifact["feature_cols"]
        pipeline._history = artifact["history"]
        log.info("Loaded model artifact: best=%s  from %s",
                 pipeline.best_model_name, path)
        return pipeline


# ─── Quick smoke-test ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

    from app.features.demand_features import DemandFeatureEngineer
    from app.data.repository import (
        get_sales_train, get_sales_validation, get_sales_test,
        get_stores, get_products, get_events, get_promotions,
    )

    log.info("Loading datasets…")
    train_df = get_sales_train()
    val_df = get_sales_validation()
    test_df = get_sales_test()

    fe = DemandFeatureEngineer()
    pipeline = ForecastingPipeline(model_name="lightgbm")

    log.info("Fitting pipeline…")
    val_metrics = pipeline.fit(train_df, val_df, fe)
    log.info("Validation metrics by model:")
    for model, m in val_metrics.items():
        log.info("  %-25s  WAPE=%.4f  MAE=%.2f  RMSE=%.2f  Bias=%.2f",
                 model, m["wape"], m["mae"], m["rmse"], m["bias"])

    log.info("Generating 7-day forecast for ST001 / SKU0001…")
    forecasts = pipeline.predict("ST001", "SKU0001", horizon_days=7)
    for f in forecasts:
        log.info("  %s", f)

    log.info("Evaluating on test set…")
    test_metrics = pipeline.evaluate(test_df)
    log.info("Test metrics: %s", test_metrics)

    log.info("✅ train.py smoke-test PASSED")
