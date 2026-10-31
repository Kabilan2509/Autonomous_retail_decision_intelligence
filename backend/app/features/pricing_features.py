"""Pricing, margin elasticity, and competitor price ratio features."""
import pandas as pd
import numpy as np


def compute_pricing_signals(
    products: pd.DataFrame,
    competitor_prices: pd.DataFrame,
    recent_sales: pd.DataFrame
) -> pd.DataFrame:
    """Calculates gross margins, competitor price gaps, and markdown limits."""
    df = products.copy()

    # Get latest competitor prices
    latest_comp = competitor_prices.sort_values("date").groupby("sku_id").last().reset_index()

    df = pd.merge(df, latest_comp[["sku_id", "competitor_price"]], on="sku_id", how="left")
    df["competitor_price"] = df["competitor_price"].fillna(df["selling_price"])

    # Price gap
    df["competitor_price_ratio"] = df["competitor_price"] / df["selling_price"]
    df["is_undercut_by_competitor"] = df["competitor_price"] < df["selling_price"]
    df["price_premium_pct"] = (df["selling_price"] - df["competitor_price"]) / df["competitor_price"]

    # Minimum price allowed based on approved cost + 10% floor margin
    df["min_allowed_selling_price"] = df["cost"] * 1.10
    df["max_allowable_markdown_pct"] = np.maximum(
        (df["selling_price"] - df["min_allowed_selling_price"]) / df["selling_price"],
        0.0
    ).clip(0.0, 0.40)  # Max 40% markdown cap

    return df
