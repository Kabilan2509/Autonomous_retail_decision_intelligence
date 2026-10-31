"""FastAPI route: Surprise Scenario Simulation Lab."""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from app.api.routes.decisions import orchestrator
from app.simulation.scenario_engine import SurpriseScenarioEngine
from app.data.schemas import ScenarioRunIn

router = APIRouter(prefix="/scenarios", tags=["Surprise Scenarios"])
scenario_engine = SurpriseScenarioEngine(orchestrator)


@router.get("/")
def list_scenarios() -> List[Dict[str, Any]]:
    return scenario_engine.get_available_scenarios()


@router.post("/run")
def execute_scenario(payload: ScenarioRunIn) -> Dict[str, Any]:
    try:
        return scenario_engine.run_scenario(payload.scenario_id, payload.override_params)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
