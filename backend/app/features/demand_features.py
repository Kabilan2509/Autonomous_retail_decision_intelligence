"""Feature engineering for demand forecasting.

Builds a rich feature matrix from the merged sales + master + external
data while strictly preventing data leakage (all lags/rolls use only
past observations, computed per store-SKU group).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from typing import List, Dict, Any

from app.core.logging_cfg import get_logger

log = get_logger(__name__)

# ─── Columns that are NEVER allowed as model features ─────────────────────────
_FORBIDDEN_FEATURES = {
    "demand_units",
    "lost_sales_units",
    "closing_stock_units",
    "receipts_units",
    "opening_stock_units",
    "expired_units",
}


class DemandFeatureEngineer:
    """Transforms raw sales rows into an ML-ready feature matrix.

    Usage::

        fe = DemandFeatureEngineer()
        features_df = fe.build_features(df, stores, products, events, promotions)
        feature_cols = fe.get_feature_columns()
    """

    def __init__(self) -> None:
        self._store_type_map: Dict[str, int] = {}
        self._category_map: Dict[str, int] = {}
        self._store_id_map: Dict[str, int] = {}
        self._sku_id_map: Dict[str, int] = {}
        self._feature_columns: List[str] = []
        self._fitted = False

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def build_features(
        self,
        df: pd.DataFrame,
        stores: pd.DataFrame,
        products: pd.DataFrame,
        events: pd.DataFrame,
        promotions: pd.DataFrame,
        fit: bool = True,
    ) -> pd.DataFrame:
        """Build the full feature matrix.

        Parameters
        ----------
        df : pd.DataFrame
            Sales data with columns matching the ARDI schema.
        stores : pd.DataFrame
            Master store table.
        products : pd.DataFrame
            Master product/SKU table.
        events : pd.DataFrame
            Events table (event_date, location).
        promotions : pd.DataFrame
            Promotions table (store_id, sku_id, start_date, end_date).
        fit : bool
            If True, fit the label encoders on this data (training mode).
            If False, apply previously fitted encoders (inference mode).

        Returns
        -------
        pd.DataFrame
            Feature matrix – original index preserved, target column(s)
            and forbidden columns removed.
        """
        log.info("Building demand features (fit=%s, rows=%d)…", fit, len(df))

        # 1. Defensive copy & type coercion
        out = df.copy()
        out["date"] = pd.to_datetime(out["date"])
        out["store_id"] = out["store_id"].astype(str)
        out["sku_id"] = out["sku_id"].astype(str)

        # 2. Sort – critical for correct lag/roll computation
        out = out.sort_values(["store_id", "sku_id", "date"]).reset_index(drop=True)

        # 3. Calendar features
        out = self._add_calendar_features(out)

        # 4. Lag & rolling features on `quantity` (past-only, per group)
        out = self._add_lag_features(out)
        out = self._add_rolling_features(out)

        # 5. Merge store attributes
        out = self._merge_store_features(out, stores, fit=fit)

        # 6. Merge product attributes
        out = self._merge_product_features(out, products, fit=fit)

        # 7. External & contextual features
        out = self._add_external_features(out)

        # 8. Event flag
        out = self._add_event_flag(out, events, stores)

        # 9. Encode store_id and sku_id as integer codes
        out = self._encode_ids(out, fit=fit)

        # 10. Drop forbidden columns
        out = self._drop_forbidden(out)

        # 11. Fill NaN (from lags on early rows) and clip negatives
        lag_roll_cols = [c for c in out.columns if c.startswith(("lag_", "roll_"))]
        if lag_roll_cols:
            out[lag_roll_cols] = out[lag_roll_cols].fillna(0.0)
        out = out.fillna(0.0)

        # 12. Record final feature columns (on first fit)
        if fit:
            # Columns to always exclude from the feature matrix
            _non_features = {
                "date",
                "demand_units",          # TARGET – never a feature
                "store_id",              # raw string – use store_id_enc instead
                "sku_id",                # raw string – use sku_id_enc instead
                "store_id_raw",
                "sku_id_raw",
                "channel",               # string categorical – not yet encoded
                "revenue",               # post-sale outcome
                "cogs",                  # post-sale outcome
                "gross_profit",          # post-sale outcome
            } | _FORBIDDEN_FEATURES

            self._feature_columns = [
                c for c in out.columns
                if c not in _non_features
            ]
            self._fitted = True

        log.info("Feature engineering done – %d columns, %d rows",
                 len(self._feature_columns), len(out))
        return out

    def get_feature_columns(self) -> List[str]:
        """Return the list of final feature column names (after last fit)."""
        if not self._fitted:
            raise RuntimeError("Call build_features(fit=True) before get_feature_columns().")
        return list(self._feature_columns)

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
        """Adds day_of_week, day_of_month, month, week_of_year, is_weekend, quarter."""
        d = df["date"]
        df["day_of_week"] = d.dt.day_of_week          # 0 = Monday ... 6 = Sunday
        df["day_of_month"] = d.dt.day
        df["month"] = d.dt.month
        df["week_of_year"] = d.dt.isocalendar().week.astype(int)
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["quarter"] = d.dt.quarter
        return df

    @staticmethod
    def _add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
        """Lag 1, 7, 14, 28 on `quantity` – strictly past values per store-SKU."""
        for lag in [1, 7, 14, 28]:
            df[f"lag_{lag}"] = (
                df.groupby(["store_id", "sku_id"])["quantity"]
                .shift(lag)
            )
        return df

    @staticmethod
    def _add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
        """Rolling mean (7, 14, 28) and std (7, 14) on `quantity` per store-SKU.
        The window ends *before* the current row (shift=1) to avoid leakage."""
        for window in [7, 14, 28]:
            df[f"roll_{window}"] = (
                df.groupby(["store_id", "sku_id"])["quantity"]
                .transform(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
            )
        for window in [7, 14]:
            df[f"roll_{window}_std"] = (
                df.groupby(["store_id", "sku_id"])["quantity"]
                .transform(lambda s: s.shift(1).rolling(window, min_periods=2).std().fillna(0))
            )
        return df

    def _merge_store_features(
        self, df: pd.DataFrame, stores: pd.DataFrame, fit: bool
    ) -> pd.DataFrame:
        """Merge store_type (encoded), capacity_units, shelf_capacity_units."""
        store_cols = ["store_id", "store_type", "capacity_units", "shelf_capacity_units"]
        available = [c for c in store_cols if c in stores.columns]
        s = stores[available].drop_duplicates("store_id").copy()

        if fit:
            self._store_type_map = {
                v: i for i, v in enumerate(sorted(s["store_type"].dropna().unique()))
            }
        s["store_type_enc"] = s["store_type"].map(self._store_type_map).fillna(-1).astype(int)

        merge_cols = ["store_id", "store_type_enc"] + [
            c for c in ["capacity_units", "shelf_capacity_units"] if c in s.columns
        ]
        df = df.merge(s[merge_cols], on="store_id", how="left")
        return df

    def _merge_product_features(
        self, df: pd.DataFrame, products: pd.DataFrame, fit: bool
    ) -> pd.DataFrame:
        """Merge category (encoded), is_perishable, shelf_life_days, base_daily_demand_units."""
        prod_cols = [
            "sku_id", "category", "is_perishable",
            "shelf_life_days", "base_daily_demand_units",
        ]
        available = [c for c in prod_cols if c in products.columns]
        p = products[available].drop_duplicates("sku_id").copy()

        if fit:
            self._category_map = {
                v: i for i, v in enumerate(sorted(p["category"].dropna().unique()))
            }
        p["category_enc"] = p["category"].map(self._category_map).fillna(-1).astype(int)
        p["is_perishable"] = p["is_perishable"].astype(int)

        merge_cols = ["sku_id", "category_enc", "is_perishable"] + [
            c for c in ["shelf_life_days", "base_daily_demand_units"] if c in p.columns
        ]
        df = df.merge(p[merge_cols], on="sku_id", how="left")
        return df

    @staticmethod
    def _add_external_features(df: pd.DataFrame) -> pd.DataFrame:
        """temperature_c, rainfall_mm, discount_pct, competitor_price_ratio,
        promotion_active, news_signal_present."""
        # competitor_price_ratio – safe division
        if "competitor_price" in df.columns and "unit_price" in df.columns:
            df["competitor_price_ratio"] = np.where(
                df["unit_price"] > 0,
                df["competitor_price"] / df["unit_price"],
                1.0,
            )
        else:
            df["competitor_price_ratio"] = 1.0

        # Boolean columns → int
        for col in ["promotion_active", "news_signal_present"]:
            if col in df.columns:
                df[col] = df[col].astype(int)

        return df

    @staticmethod
    def _add_event_flag(
        df: pd.DataFrame, events: pd.DataFrame, stores: pd.DataFrame
    ) -> pd.DataFrame:
        """is_event_day = 1 if there is an event in the store's location on that date."""
        if events is None or events.empty:
            df["is_event_day"] = 0
            return df

        # Normalise event date column name
        if "event_date" in events.columns:
            ev = events[["event_date", "location"]].copy()
            ev = ev.rename(columns={"event_date": "date"})
        elif "date" in events.columns:
            ev = events[["date", "location"]].copy()
        else:
            df["is_event_day"] = 0
            return df

        ev["date"] = pd.to_datetime(ev["date"])
        ev["is_event_day"] = 1
        ev = ev.drop_duplicates(["date", "location"])

        # Map store → location
        if "location" in stores.columns:
            loc_map = stores[["store_id", "location"]].drop_duplicates()
            df = df.merge(loc_map, on="store_id", how="left")
            df = df.merge(ev, on=["date", "location"], how="left")
            df["is_event_day"] = df["is_event_day"].fillna(0).astype(int)
            df = df.drop(columns=["location"], errors="ignore")
        else:
            df["is_event_day"] = 0

        return df

    def _encode_ids(self, df: pd.DataFrame, fit: bool) -> pd.DataFrame:
        """Integer-encode store_id and sku_id."""
        if fit:
            self._store_id_map = {
                v: i for i, v in enumerate(sorted(df["store_id"].unique()))
            }
            self._sku_id_map = {
                v: i for i, v in enumerate(sorted(df["sku_id"].unique()))
            }

        df["store_id_enc"] = df["store_id"].map(self._store_id_map).fillna(-1).astype(int)
        df["sku_id_enc"] = df["sku_id"].map(self._sku_id_map).fillna(-1).astype(int)
        return df

    @staticmethod
    def _drop_forbidden(df: pd.DataFrame) -> pd.DataFrame:
        """Remove all forbidden outcome columns that happen to be in df."""
        to_drop = [c for c in _FORBIDDEN_FEATURES if c in df.columns]
        if to_drop:
            df = df.drop(columns=to_drop)
        return df


# ─── Quick smoke-test ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    import os

    # Allow running from repo root: python app/features/demand_features.py
    sys.path.insert(0, str(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

    from app.data.repository import (
        get_sales_train, get_stores, get_products, get_events, get_promotions,
    )

    log.info("Loading data for smoke-test…")
    train_df = get_sales_train()
    stores = get_stores()
    products = get_products()
    events = get_events()
    promotions = get_promotions()

    fe = DemandFeatureEngineer()
    features = fe.build_features(train_df, stores, products, events, promotions, fit=True)

    feat_cols = fe.get_feature_columns()
    log.info("Feature columns (%d): %s", len(feat_cols), feat_cols)
    log.info("Sample output:\n%s", features[feat_cols].head(3).to_string())

    # Verify forbidden columns are absent
    for col in _FORBIDDEN_FEATURES:
        assert col not in features.columns, f"FORBIDDEN column still present: {col}"
    log.info("PASSED: All forbidden columns successfully excluded.")
    log.info("PASSED: demand_features.py smoke-test OK")
