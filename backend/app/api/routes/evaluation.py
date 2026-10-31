"""FastAPI route: KPI and Model Evaluation & Baseline Benchmark."""
from fastapi import APIRouter
from typing import Dict, Any
from app.agents.kpi_agent import KPIMonitoringAgent

router = APIRouter(prefix="/evaluation", tags=["KPIs & Evaluation"])
kpi_agent = KPIMonitoringAgent()


@router.get("/kpis")
def get_kpis() -> Dict[str, Any]:
    return kpi_agent.run({})


@router.get("/baseline-comparison")
def get_baseline_comparison() -> Dict[str, Any]:
    return kpi_agent.run({})["policy_comparison"]
