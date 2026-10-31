"""Chronos-Bolt foundation time-series forecaster.

Uses the amazon/chronos-bolt-base model from HuggingFace for zero-shot
or fine-tuned demand forecasting.  If the ``chronos`` library or ``torch``
is not installed, the class transparently falls back to a LightGBM /
RandomForest point forecast so the rest of the pipeline is unaffected.
"""
from __future__ import annotations

import warnings
from typing import Optional

import numpy as np
import pandas as pd

from app.core.logging_cfg import get_logger

log = get_logger(__name__)

# ── optional heavy imports ─────────────────────────────────────────────────────
try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False
    warnings.warn("torch not installed – ChronosBoltForecaster will use fallback.", stacklevel=2)

try:
    from chronos import BaseChronosPipeline  # chronos-forecasting package
    _CHRONOS_AVAILABLE = True
except ImportError:
    _CHRONOS_AVAILABLE = False
    if _TORCH_AVAILABLE:
        warnings.warn(
            "chronos-forecasting package not installed – ChronosBoltForecaster will use fallback.",
            stacklevel=2,
        )

try:
    from lightgbm import LGBMRegressor as _LGBMRegressor
    _LGBM_AVAILABLE = True
except ImportError:
    _LGBM_AVAILABLE = False

from sklearn.ensemble import RandomForestRegressor as _RFRegressor


class ChronosBoltForecaster:
    """Demand forecaster backed by Amazon Chronos-Bolt-Base.

    Falls back to LightGBM (or RandomForest) if the Chronos library /
    PyTorch is not available in the environment.

    Parameters
    ----------
    device : str
        "cpu", "cuda", or "mps".  Ignored when running in fallback mode.
    context_length : int
        Number of past time-steps fed to Chronos as context (max 512).
    num_samples : int
        Monte-Carlo samples drawn by Chronos for probabilistic output.
    """

    MODEL_ID = "amazon/chronos-bolt-base"

    def __init__(
        self,
        device: str = "cpu",
        context_length: int = 512,
        num_samples: int = 20,
    ) -> None:
        self.device = device
        self.context_length = min(context_length, 512)
        self.num_samples = num_samples

        self._pipeline = None      # chronos pipeline (lazy-loaded)
        self._fallback_model = None
        self._fallback_fitted = False

        if not (_TORCH_AVAILABLE and _CHRONOS_AVAILABLE):
            log.warning(
                "Chronos dependencies not found – running in FALLBACK mode "
                "(LightGBM/RandomForest)."
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def is_available(self) -> bool:
        """Return True if the Chronos library and PyTorch are importable."""
        return _TORCH_AVAILABLE and _CHRONOS_AVAILABLE

    def predict(
        self,
        history_series: pd.Series,
        horizon: int = 7,
    ) -> dict:
        """Forecast *horizon* steps ahead from *history_series*.

        Parameters
        ----------
        history_series : pd.Series
            Past demand values with a DatetimeIndex, sorted ascending.
            Missing values are forward-filled then zero-filled.
        horizon : int
            Number of future steps to forecast.

        Returns
        -------
        dict with keys:
            mean       – np.ndarray shape (horizon,)
            lower_q10  – np.ndarray shape (horizon,)  10th-percentile lower bound
            upper_q90  – np.ndarray shape (horizon,)  90th-percentile upper bound
            confidence – float  (average interval width-based confidence score)
            mode       – "chronos" | "fallback"
        """
        history_series = self._clean_series(history_series)

        if self.is_available():
            return self._predict_chronos(history_series, horizon)
        else:
            return self._predict_fallback(history_series, horizon)

    # ──────────────────────────────────────────────────────────────────────────
    # Chronos path
    # ──────────────────────────────────────────────────────────────────────────

    def _load_chronos(self) -> None:
        """Lazy-load the Chronos pipeline (downloads model on first call)."""
        if self._pipeline is not None:
            return
        log.info("Loading Chronos model: %s  device=%s", self.MODEL_ID, self.device)
        try:
            self._pipeline = BaseChronosPipeline.from_pretrained(
                self.MODEL_ID,
                device_map=self.device,
                torch_dtype=torch.bfloat16 if self.device != "cpu" else torch.float32,
            )
            log.info("Chronos model loaded successfully.")
        except Exception as exc:
            log.error("Failed to load Chronos model: %s – switching to fallback.", exc)
            self._pipeline = None
            raise

    def _predict_chronos(self, series: pd.Series, horizon: int) -> dict:
        """Run inference through the Chronos pipeline."""
        try:
            self._load_chronos()
        except Exception:
            log.warning("Chronos load failed – using fallback for this prediction.")
            return self._predict_fallback(series, horizon)

        # Truncate / pad context
        values = series.values[-self.context_length :]
        context = torch.tensor(values, dtype=torch.float32).unsqueeze(0)

        try:
            quantile_levels = [0.1, 0.5, 0.9]
            forecast = self._pipeline.predict_quantiles(
                context=context,
                prediction_length=horizon,
                quantile_levels=quantile_levels,
            )
            # forecast shape: (1, num_quantiles, horizon)
            q10 = forecast[0, 0, :].numpy().clip(min=0)
            q50 = forecast[0, 1, :].numpy().clip(min=0)
            q90 = forecast[0, 2, :].numpy().clip(min=0)
        except AttributeError:
            # Older chronos API: predict() returns samples
            try:
                samples = self._pipeline.predict(
                    context=context,
                    prediction_length=horizon,
                    num_samples=self.num_samples,
                )  # shape: (1, num_samples, horizon)
                samples_np = samples[0].numpy().clip(min=0)
                q10 = np.percentile(samples_np, 10, axis=0)
                q50 = np.percentile(samples_np, 50, axis=0)
                q90 = np.percentile(samples_np, 90, axis=0)
            except Exception as exc:
                log.error("Chronos predict failed: %s – using fallback.", exc)
                return self._predict_fallback(series, horizon)

        confidence = self._interval_confidence(q10, q50, q90)
        return {
            "mean": q50,
            "lower_q10": q10,
            "upper_q90": q90,
            "confidence": confidence,
            "mode": "chronos",
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Fallback path (LightGBM / RandomForest on lag features)
    # ──────────────────────────────────────────────────────────────────────────

    def _predict_fallback(self, series: pd.Series, horizon: int) -> dict:
        """Simple lag-feature regressor fallback."""
        if not self._fallback_fitted:
            self._fit_fallback(series)

        values = series.values.astype(float)
        preds, lower, upper = [], [], []

        for h in range(horizon):
            x = self._make_lag_features(values)
            if self._fallback_model is not None:
                p = float(self._fallback_model.predict([x])[0])
            else:
                p = float(values[-7:].mean()) if len(values) >= 7 else float(values.mean())
            p = max(0.0, p)
            std = float(np.std(values[-28:])) if len(values) >= 28 else p * 0.2
            preds.append(p)
            lower.append(max(0.0, p - 1.282 * std))  # ~P10
            upper.append(p + 1.282 * std)             # ~P90
            values = np.append(values, p)

        preds_arr = np.array(preds)
        lower_arr = np.array(lower)
        upper_arr = np.array(upper)
        confidence = self._interval_confidence(lower_arr, preds_arr, upper_arr)

        return {
            "mean": preds_arr,
            "lower_q10": lower_arr,
            "upper_q90": upper_arr,
            "confidence": confidence,
            "mode": "fallback",
        }

    def _fit_fallback(self, series: pd.Series) -> None:
        """Train the fallback regressor on the history series."""
        values = series.values.astype(float)
        if len(values) < 30:
            self._fallback_model = None
            self._fallback_fitted = True
            return

        max_lag = 28
        X, y = [], []
        for i in range(max_lag, len(values)):
            X.append(self._make_lag_features(values[:i]))
            y.append(values[i])

        if len(X) < 10:
            self._fallback_model = None
        else:
            if _LGBM_AVAILABLE:
                model = _LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)
            else:
                model = _RFRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            model.fit(X, y)
            self._fallback_model = model

        self._fallback_fitted = True

    @staticmethod
    def _make_lag_features(values: np.ndarray) -> list:
        """Build a simple lag feature vector from the tail of *values*."""
        lags = [1, 2, 3, 7, 14, 21, 28]
        n = len(values)
        feats = []
        for lag in lags:
            feats.append(float(values[-lag]) if n >= lag else 0.0)
        feats.append(float(values[-7:].mean()) if n >= 7 else float(values.mean()))
        feats.append(float(values[-28:].mean()) if n >= 28 else float(values.mean()))
        return feats

    # ──────────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _clean_series(series: pd.Series) -> pd.Series:
        """Fill NaN, clip negatives, ensure float dtype."""
        series = series.ffill().fillna(0.0).clip(lower=0.0)
        return series.astype(float)

    @staticmethod
    def _interval_confidence(lower: np.ndarray, mean: np.ndarray, upper: np.ndarray) -> float:
        """Return a [0.5, 0.95] confidence score based on interval width / mean."""
        width = upper - lower
        rel_width = np.mean(width / (mean + 1e-6))
        return float(np.clip(1.0 - 0.5 * rel_width, 0.5, 0.95))


# ─── Smoke-test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

    from app.core.logging_cfg import get_logger as _gl
    _log = _gl(__name__)

    # Build a synthetic series
    rng = np.random.default_rng(42)
    idx = pd.date_range("2025-11-01", periods=200, freq="D")
    series = pd.Series(rng.poisson(lam=10, size=200).astype(float), index=idx)

    forecaster = ChronosBoltForecaster(device="cpu")
    _log.info("is_available: %s", forecaster.is_available())

    result = forecaster.predict(series, horizon=7)
    _log.info("mode: %s", result["mode"])
    _log.info("mean forecasts: %s", result["mean"].tolist())
    _log.info("confidence: %.4f", result["confidence"])
    assert result["mean"].shape == (7,), "Expected 7 forecast steps"
    _log.info("PASSED: chronos_model.py smoke-test OK")
