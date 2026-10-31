"""FastAPI route: Inventory status and risk items."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.data.repository import get_inventory_snapshot, get_products, get_stores
from app.agents.inventory_agent import InventoryOptimizationAgent

router = APIRouter(prefix="/inventory", tags=["Inventory Intelligence"])
inv_agent = InventoryOptimizationAgent()


@router.get("/snapshot")
def get_inventory(
    store_id: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
) -> Dict[str, Any]:
    snapshot = get_inventory_snapshot()
    products = get_products().set_index("sku_id").to_dict(orient="index")
    stores = get_stores().set_index("store_id").to_dict(orient="index")

    df = snapshot.copy()
    if store_id:
        df = df[df["store_id"] == store_id]

    items = []
    for _, row in df.head(limit).iterrows():
        p_info = products.get(row["sku_id"], {})
        s_info = stores.get(row["store_id"], {})
        if category and p_info.get("category") != category:
            continue

        items.append({
            "store_id": row["store_id"],
            "store_name": s_info.get("store_name"),
            "location": s_info.get("location"),
            "sku_id": row["sku_id"],
            "product_name": p_info.get("product_name"),
            "category": p_info.get("category"),
            "on_hand_units": int(row["on_hand_units"]),
            "reserved_units": int(row["reserved_units"]),
            "in_transit_units": int(row["in_transit_units"]),
            "reorder_point_units": int(row["reorder_point_units"]),
            "target_stock_units": int(row["target_stock_units"]),
            "max_stock_units": int(row["max_stock_units"]),
            "days_of_cover": float(row["days_of_cover_estimate"]),
            "expiry_risk_flag": bool(row["expiry_risk_flag"]),
            "is_perishable": bool(p_info.get("is_perishable", False)),
            "snapshot_date": str(row["snapshot_date"].date())
        })

    return {
        "total_items": len(items),
        "items": items
    }


@router.get("/risks")
def get_inventory_risks() -> Dict[str, Any]:
    res = inv_agent.run({})
    recs = res.get("recommendations", [])
    high_priority = [r for r in recs if r["priority"] == "HIGH"]

    return {
        "total_evaluated": len(recs),
        "high_priority_risk_count": len(high_priority),
        "critical_risks": high_priority[:30]
    }
