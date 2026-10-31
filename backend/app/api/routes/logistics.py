"""FastAPI route: Logistics & Store-to-Store Transshipment."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.agents.logistics_agent import TransferLogisticsAgent

router = APIRouter(prefix="/logistics", tags=["Logistics & Transshipment"])
logistics_agent = TransferLogisticsAgent()


@router.get("/transfers")
def get_transfer_recommendations(sku_id: Optional[str] = None) -> Dict[str, Any]:
    return logistics_agent.run({"sku_id": sku_id})
