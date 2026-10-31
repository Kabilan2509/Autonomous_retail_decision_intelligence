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


@router.get("/stores")
def get_stores_geospatial() -> Dict[str, Any]:
    stores = get_stores()
    snapshot = get_inventory_snapshot()

    # Pre-calculate store level risks from snapshot
    store_risks = snapshot.groupby("store_id").agg(
        stockout_count=("on_hand_units", lambda s: 0),
        total_on_hand=("on_hand_units", "sum")
    ).to_dict(orient="index")

    # Accurate stockout and expiry counts per store
    stockouts_by_store = snapshot[snapshot["on_hand_units"] <= snapshot["reorder_point_units"]].groupby("store_id").size().to_dict()
    expiries_by_store = snapshot[snapshot["expiry_risk_flag"] == True].groupby("store_id").size().to_dict()
    total_on_hand_by_store = snapshot.groupby("store_id")["on_hand_units"].sum().to_dict()

    store_list = []
    for _, s in stores.iterrows():
        sid = s["store_id"]
        so = stockouts_by_store.get(sid, 0)
        ex = expiries_by_store.get(sid, 0)
        on_hand = int(total_on_hand_by_store.get(sid, 0))

        if so > 25 or ex > 10:
            status = "CRITICAL_RISK"
        elif so > 10:
            status = "MODERATE_RISK"
        else:
            status = "HEALTHY"

        store_list.append({
            "store_id": sid,
            "store_name": s["store_name"],
            "location": s["location"],
            "neighborhood": s["neighborhood"],
            "store_type": s["store_type"],
            "latitude": float(s["latitude"]),
            "longitude": float(s["longitude"]),
            "capacity_units": int(s["capacity_units"]),
            "shelf_capacity_units": int(s["shelf_capacity_units"]),
            "operating_cost_per_day": float(s["operating_cost_per_day"]),
            "stockout_skus": so,
            "expiry_skus": ex,
            "total_on_hand": on_hand,
            "status": status
        })

    return {
        "total_stores": len(store_list),
        "stores": store_list
    }


@router.get("/agents/status")
def get_agents_status() -> Dict[str, Any]:
    return {
        "agents": [
            {
                "id": "A1",
                "name": "Demand Forecasting Agent",
                "model": "Amazon Chronos-Bolt + MAPIE",
                "role": "Foundation time-series demand shock predictor",
                "status": "OPERATIONAL",
                "latency_ms": 45,
                "coverage": "90% Conformal"
            },
            {
                "id": "A2",
                "name": "Inventory Optimization Agent",
                "model": "HiGHS Mixed-Integer Solver",
                "role": "Optimal discrete action & quantity selector",
                "status": "OPERATIONAL",
                "latency_ms": 12,
                "coverage": "100% Feasible"
            },
            {
                "id": "A3",
                "name": "Supplier Intelligence Agent",
                "model": "PO Reliability & Fill Rate Engine",
                "role": "Procurement risk & certified backup supplier routing",
                "status": "OPERATIONAL",
                "latency_ms": 8,
                "coverage": "20 Suppliers"
            },
            {
                "id": "A4",
                "name": "Pricing Intelligence Agent",
                "model": "Microsoft EconML (DRLearner)",
                "role": "Causal lift optimization with non-negotiable 10% margin floor",
                "status": "OPERATIONAL",
                "latency_ms": 18,
                "coverage": "100 SKUs"
            },
            {
                "id": "A5",
                "name": "News Intelligence Agent",
                "model": "DeBERTa-v3 NLP Pipeline",
                "role": "Disruption event extraction & confidence calibration",
                "status": "OPERATIONAL",
                "latency_ms": 32,
                "coverage": "Zero-shot NLI"
            },
            {
                "id": "A6",
                "name": "Weather Intelligence Agent",
                "model": "Meteorological Anomaly Detector",
                "role": "Precipitation & heatwave demand shock classifier",
                "status": "OPERATIONAL",
                "latency_ms": 6,
                "coverage": "3 Clusters"
            },
            {
                "id": "A7",
                "name": "Transfer & Logistics Agent",
                "model": "Google OR-Tools",
                "role": "Multi-store vehicle routing & cold-chain balancing",
                "status": "OPERATIONAL",
                "latency_ms": 24,
                "coverage": "60km Radius"
            },
            {
                "id": "A8",
                "name": "Central Decision Orchestrator",
                "model": "Qwen-2.5-7B-Instruct Explanations",
                "role": "Conflict resolver & natural-language 'The Why' generator",
                "status": "OPERATIONAL",
                "latency_ms": 55,
                "coverage": "Human Gate"
            },
            {
                "id": "A9",
                "name": "KPI Monitoring & Adaptation Agent",
                "model": "Empirical Baseline Benchmark Engine",
                "role": "Continuous holdout audit & policy drift tracking",
                "status": "OPERATIONAL",
                "latency_ms": 15,
                "coverage": "B0-B4 Baseline"
            }
        ]
    }
