"""FastAPI route: Supplier metrics and procurement risks."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.agents.supplier_agent import SupplierIntelligenceAgent

router = APIRouter(prefix="/suppliers", tags=["Supplier Intelligence"])
sup_agent = SupplierIntelligenceAgent()


@router.get("/metrics")
def get_supplier_metrics(supplier_id: Optional[str] = None) -> Dict[str, Any]:
    return sup_agent.run({"supplier_id": supplier_id})


@router.get("/alternative-sources/{sku_id}")
def get_alternative_suppliers(sku_id: str) -> Dict[str, Any]:
    return sup_agent.run({"sku_id": sku_id})
