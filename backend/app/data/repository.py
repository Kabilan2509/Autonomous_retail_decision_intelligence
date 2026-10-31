"""Data ingestion and repository layer.

Reads CSV files once and caches them.  All callers should use these functions
rather than reading CSVs directly.
"""
import pandas as pd
from functools import lru_cache
from app.core.config import (
    MASTER_DIR, HISTORICAL_DIR, OPERATIONAL_DIR,
    EXTERNAL_DIR, SIMULATION_DIR, EVALUATION_DIR,
)
from app.core.logging_cfg import get_logger

log = get_logger(__name__)


# ─── Master data ──────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_stores() -> pd.DataFrame:
    df = pd.read_csv(MASTER_DIR / "stores.csv")
    log.info(f"Loaded {len(df)} stores")
    return df


@lru_cache(maxsize=1)
def get_products() -> pd.DataFrame:
    df = pd.read_csv(MASTER_DIR / "products.csv")
    log.info(f"Loaded {len(df)} products")
    return df


@lru_cache(maxsize=1)
def get_suppliers() -> pd.DataFrame:
    df = pd.read_csv(MASTER_DIR / "suppliers.csv")
    log.info(f"Loaded {len(df)} suppliers")
    return df


@lru_cache(maxsize=1)
def get_supplier_product_map() -> pd.DataFrame:
    return pd.read_csv(MASTER_DIR / "supplier_product_map.csv")


@lru_cache(maxsize=1)
def get_store_assortment() -> pd.DataFrame:
    df = pd.read_csv(MASTER_DIR / "store_assortment.csv", parse_dates=["assortment_start_date"])
    return df[df["is_ranged"] == True].copy()


# ─── Historical data ──────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_sales() -> pd.DataFrame:
    log.info("Loading sales_daily.csv …")
    df = pd.read_csv(HISTORICAL_DIR / "sales_daily.csv", parse_dates=["date"])
    log.info(f"Loaded {len(df):,} sales rows")
    return df


@lru_cache(maxsize=1)
def get_weather() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "weather_daily.csv", parse_dates=["date"])


@lru_cache(maxsize=1)
def get_events() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "events.csv", parse_dates=["event_date"])


@lru_cache(maxsize=1)
def get_promotions() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "promotions.csv",
                       parse_dates=["start_date", "end_date"])


@lru_cache(maxsize=1)
def get_competitor_prices() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "competitor_prices_daily.csv", parse_dates=["date"])


@lru_cache(maxsize=1)
def get_purchase_orders() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "purchase_orders.csv",
                       parse_dates=["order_date", "expected_arrival_date", "actual_arrival_date"])


@lru_cache(maxsize=1)
def get_goods_receipts() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "goods_receipts.csv", parse_dates=["receipt_date"])


@lru_cache(maxsize=1)
def get_wastage() -> pd.DataFrame:
    return pd.read_csv(HISTORICAL_DIR / "wastage.csv", parse_dates=["date"])


# ─── Operational data ─────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_inventory_snapshot() -> pd.DataFrame:
    return pd.read_csv(OPERATIONAL_DIR / "inventory_snapshot.csv", parse_dates=["snapshot_date"])


@lru_cache(maxsize=1)
def get_inventory_transfers() -> pd.DataFrame:
    return pd.read_csv(OPERATIONAL_DIR / "inventory_transfers.csv", parse_dates=["transfer_date"])


@lru_cache(maxsize=1)
def get_price_history() -> pd.DataFrame:
    return pd.read_csv(OPERATIONAL_DIR / "price_history_weekly.csv", parse_dates=["date"])


@lru_cache(maxsize=1)
def get_decision_logs_seed() -> pd.DataFrame:
    return pd.read_csv(OPERATIONAL_DIR / "decision_logs_seed.csv", parse_dates=["decision_date"])


# ─── External signals ─────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_news_signals() -> pd.DataFrame:
    df = pd.read_csv(EXTERNAL_DIR / "news_signals_synthetic.csv", parse_dates=["published_at"])
    return df


@lru_cache(maxsize=1)
def get_news_demand_mapping() -> pd.DataFrame:
    return pd.read_csv(EXTERNAL_DIR / "news_to_demand_mapping.csv")


# ─── Simulation ───────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_surprise_scenarios() -> pd.DataFrame:
    return pd.read_csv(SIMULATION_DIR / "surprise_scenarios.csv")


# ─── Evaluation ───────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_chronological_splits() -> pd.DataFrame:
    return pd.read_csv(EVALUATION_DIR / "chronological_split_manifest.csv",
                       parse_dates=["start_date", "end_date"])


@lru_cache(maxsize=1)
def get_baseline_policies() -> pd.DataFrame:
    return pd.read_csv(EVALUATION_DIR / "baseline_policies.csv")


@lru_cache(maxsize=1)
def get_sales_train() -> pd.DataFrame:
    log.info("Loading sales_train.csv …")
    return pd.read_csv(EVALUATION_DIR / "sales_train.csv", parse_dates=["date"])


@lru_cache(maxsize=1)
def get_sales_validation() -> pd.DataFrame:
    log.info("Loading sales_validation.csv …")
    return pd.read_csv(EVALUATION_DIR / "sales_validation.csv", parse_dates=["date"])


@lru_cache(maxsize=1)
def get_sales_test() -> pd.DataFrame:
    log.info("Loading sales_test.csv …")
    return pd.read_csv(EVALUATION_DIR / "sales_test.csv", parse_dates=["date"])


def clear_cache():
    """Force-reload all datasets (e.g. after simulation updates)."""
    for fn in [
        get_stores, get_products, get_suppliers, get_supplier_product_map,
        get_store_assortment, get_sales, get_weather, get_events, get_promotions,
        get_competitor_prices, get_purchase_orders, get_goods_receipts, get_wastage,
        get_inventory_snapshot, get_inventory_transfers, get_price_history,
        get_decision_logs_seed, get_news_signals, get_news_demand_mapping,
        get_surprise_scenarios, get_chronological_splits, get_baseline_policies,
        get_sales_train, get_sales_validation, get_sales_test,
    ]:
        fn.cache_clear()
    log.info("Data cache cleared.")
