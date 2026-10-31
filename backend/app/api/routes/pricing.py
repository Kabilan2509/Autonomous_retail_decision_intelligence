"""FastAPI route: Pricing intelligence and competitor analysis."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.agents.pricing_agent import PricingIntelligenceAgent

router = APIRouter(prefix="/pricing", tags=["Pricing Intelligence"])
pricing_agent = PricingIntelligenceAgent()


@router.get("/analysis")
def get_pricing_analysis(sku_id: Optional[str] = None) -> Dict[str, Any]:
    return pricing_agent.run({"sku_id": sku_id})
