"""Feature engineering and risk indicators for inventory management."""
import pandas as pd
import numpy as np
from typing import Dict, Any


def compute_inventory_metrics(
    snapshot: pd.DataFrame,
    products: pd.DataFrame,
    forecast_avg_daily_demand: Dict[tuple, float]
) -> pd.DataFrame:
    """Enrich the inventory snapshot with real-time stock cover, stockout risk, and expiry risk."""
    df = snapshot.copy()
    prod_map = products.set_index("sku_id").to_dict(orient="index")

    df["shelf_life_days"] = df["sku_id"].map(lambda x: prod_map.get(x, {}).get("shelf_life_days", 30))
    df["is_perishable"] = df["sku_id"].map(lambda x: prod_map.get(x, {}).get("is_perishable", False))
    df["cost"] = df["sku_id"].map(lambda x: prod_map.get(x, {}).get("cost", 10.0))
    df["selling_price"] = df["sku_id"].map(lambda x: prod_map.get(x, {}).get("selling_price", 15.0))
    df["category"] = df["sku_id"].map(lambda x: prod_map.get(x, {}).get("category", "General"))

    # Map forecast demand (store_id, sku_id) -> daily demand
    df["avg_daily_demand"] = df.apply(
        lambda r: forecast_avg_daily_demand.get(
            (r["store_id"], r["sku_id"]),
            prod_map.get(r["sku_id"], {}).get("base_daily_demand_units", 3.0)
        ),
        axis=1
    )
    df["avg_daily_demand"] = df["avg_daily_demand"].replace(0, 0.1)

    # Effective available inventory = on_hand - reserved + in_transit
    df["available_inventory"] = np.maximum(df["on_hand_units"] - df["reserved_units"], 0)
    df["projected_inventory"] = df["available_inventory"] + df["in_transit_units"]

    # Days of cover
    df["days_of_cover"] = df["available_inventory"] / df["avg_daily_demand"]
    df["projected_days_of_cover"] = df["projected_inventory"] / df["avg_daily_demand"]

    # Risk Flags
    df["is_stockout_risk"] = df["available_inventory"] <= df["reorder_point_units"]
    df["is_critical_stockout"] = df["days_of_cover"] < 2.0
    df["is_excess_stock"] = df["on_hand_units"] > df["target_stock_units"] * 1.5

    # Expiry Risk: If perishable and days of cover exceeds remaining shelf life
    df["is_expiry_risk"] = df["is_perishable"] & (df["days_of_cover"] > df["shelf_life_days"] * 0.7)

    return df
