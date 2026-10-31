"""Supplier metrics, reliability scoring, and procurement risk features."""
import pandas as pd
import numpy as np
from typing import Dict, Any


def compute_supplier_performance(
    purchase_orders: pd.DataFrame,
    suppliers: pd.DataFrame
) -> pd.DataFrame:
    """Computes comprehensive supplier reliability, delay rates, and fill rates from PO history."""
    df_po = purchase_orders.copy()

    # Metrics aggregation
    agg = df_po.groupby("supplier_id").agg(
        total_orders=("po_id", "count"),
        delayed_orders=("delay_days", lambda x: (x > 0).sum()),
        avg_delay_days=("delay_days", "mean"),
        max_delay_days=("delay_days", "max"),
        total_ordered_units=("ordered_quantity", "sum"),
        total_received_units=("received_quantity", "sum"),
        total_rejected_units=("quality_rejected_units", "sum"),
    ).reset_index()

    # Derived rates
    agg["delay_rate"] = np.where(agg["total_orders"] > 0, agg["delayed_orders"] / agg["total_orders"], 0.0)
    agg["fill_rate"] = np.where(agg["total_ordered_units"] > 0, agg["total_received_units"] / agg["total_ordered_units"], 1.0)
    agg["rejection_rate"] = np.where(agg["total_received_units"] > 0, agg["total_rejected_units"] / agg["total_received_units"], 0.0)

    # Risk score [0.0 - 1.0], higher = riskier
    # Risk = 0.45 * delay_rate + 0.35 * (1 - fill_rate) + 0.20 * rejection_rate
    agg["supplier_risk_score"] = (
        0.45 * agg["delay_rate"] +
        0.35 * np.maximum(1.0 - agg["fill_rate"], 0.0) +
        0.20 * np.minimum(agg["rejection_rate"] * 10, 1.0)
    ).clip(0.0, 1.0)

    # Merge with master supplier attributes
    merged = pd.merge(suppliers, agg, on="supplier_id", how="left")
    merged["delay_rate"] = merged["delay_rate"].fillna(1.0 - merged["on_time_rate"])
    merged["fill_rate"] = merged["fill_rate"].fillna(0.95)
    merged["rejection_rate"] = merged["rejection_rate"].fillna(merged["quality_rejection_rate"])
    merged["supplier_risk_score"] = merged["supplier_risk_score"].fillna(1.0 - merged["reliability_score"])

    return merged
