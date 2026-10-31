"""FastAPI route: Demand forecasting."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.agents.demand_agent import DemandForecastingAgent
from app.data.repository import get_stores, get_products

router = APIRouter(prefix="/forecasts", tags=["Demand Forecasting"])
demand_agent = DemandForecastingAgent()


@router.get("/predict/{store_id}/{sku_id}")
def get_single_forecast(
    store_id: str,
    sku_id: str,
    horizon_days: int = Query(7, ge=1, le=28)
) -> Dict[str, Any]:
    return demand_agent.run({
        "store_id": store_id,
        "sku_id": sku_id,
        "horizon_days": horizon_days
    })


@router.get("/batch")
def get_batch_forecast(
    store_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
) -> Dict[str, Any]:
    stores = get_stores()
    products = get_products()
    st_id = store_id or stores.iloc[0]["store_id"]
    skus = products.head(limit)["sku_id"].tolist()

    forecasts = []
    for sk in skus:
        res = demand_agent.run({"store_id": st_id, "sku_id": sk, "horizon_days": 7})
        forecasts.append(res)

    return {
        "store_id": st_id,
        "total_forecasts": len(forecasts),
        "forecasts": forecasts
    }
