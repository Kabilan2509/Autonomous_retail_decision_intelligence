"""FastAPI route: Dashboard executive overview."""
from fastapi import APIRouter
from typing import Dict, Any
from datetime import date
from app.data.repository import get_stores, get_products, get_sales, get_inventory_snapshot, get_wastage
from app.agents.kpi_agent import KPIMonitoringAgent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
kpi_agent = KPIMonitoringAgent()


@router.get("/summary")
def get_dashboard_summary() -> Dict[str, Any]:
    stores = get_stores()
    products = get_products()
    snapshot = get_inventory_snapshot()
    kpi_res = kpi_agent.run({})
    kpis = kpi_res["macro_kpis"]
    city_perf = kpi_res["city_breakdown"]

    stockout_count = int((snapshot["on_hand_units"] <= snapshot["reorder_point_units"]).sum())
    expiry_count = int(snapshot["expiry_risk_flag"].sum())

    return {
        "total_stores": len(stores),
        "total_skus": len(products),
        "total_demand_units": kpis["total_demand_units"],
        "total_revenue_inr": kpis["total_revenue_inr"],
        "total_gross_profit_inr": kpis["total_gross_profit_inr"],
        "gross_margin_pct": kpis["gross_margin_pct"],
        "total_lost_sales_units": kpis["total_lost_sales_units"],
        "stockout_risk_skus": stockout_count,
        "expiry_risk_skus": expiry_count,
        "wastage_cost_inr": kpis["total_wastage_cost_inr"],
        "active_recommendations": 42,
        "high_priority_alerts": stockout_count + expiry_count,
        "city_performance": city_perf,
        "snapshot_date": str(snapshot["snapshot_date"].iloc[0].date())
    }
