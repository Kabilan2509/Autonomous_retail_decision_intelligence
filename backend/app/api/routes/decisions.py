"""FastAPI route: AI Decision Center and Human Approval Gateway."""
from fastapi import APIRouter, Query, HTTPException, Body
from typing import Dict, Any, Optional, List
from app.agents.decision_orchestrator import DecisionOrchestrator
from app.data.schemas import DecisionUpdateIn

router = APIRouter(prefix="/decisions", tags=["Decision Intelligence"])
# Shared orchestrator instance
orchestrator = DecisionOrchestrator()


@router.get("/")
def get_decisions(
    store_id: Optional[str] = None,
    action: Optional[str] = None,
    approval_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200)
) -> Dict[str, Any]:
    if not orchestrator.active_decisions:
        orchestrator.run({"limit": 50})
    elif store_id and not any(d["store_id"] == store_id for d in orchestrator.active_decisions.values()):
        orchestrator.run({"store_id": store_id, "limit": 20})

    results = list(orchestrator.active_decisions.values())

    if store_id:
        results = [d for d in results if d["store_id"] == store_id]
    if action:
        results = [d for d in results if d["action"] == action]
    if approval_status:
        results = [d for d in results if d["approval_status"] == approval_status]

    return {
        "total_count": len(results),
        "decisions": results[:limit]
    }


@router.post("/generate")
def trigger_orchestration(
    store_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
) -> Dict[str, Any]:
    return orchestrator.run({"store_id": store_id, "limit": limit})


@router.patch("/{decision_id}/approve")
def approve_decision(decision_id: str, payload: Optional[DecisionUpdateIn] = None) -> Dict[str, Any]:
    note = payload.reviewer_note if payload else "Approved by user"
    res = orchestrator.update_decision_status(decision_id, "APPROVED", note)
    if not res:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")
    return {"message": "Decision approved successfully", "decision": res}


@router.patch("/{decision_id}/reject")
def reject_decision(decision_id: str, payload: Optional[DecisionUpdateIn] = None) -> Dict[str, Any]:
    note = payload.reviewer_note if payload else "Rejected by user"
    res = orchestrator.update_decision_status(decision_id, "REJECTED", note)
    if not res:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")
    return {"message": "Decision rejected", "decision": res}


@router.patch("/{decision_id}/request-review")
def request_review(decision_id: str, payload: Optional[DecisionUpdateIn] = None) -> Dict[str, Any]:
    note = payload.reviewer_note if payload else "Review requested"
    res = orchestrator.update_decision_status(decision_id, "HUMAN_REVIEW", note)
    if not res:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")
    return {"message": "Flagged for supervisor review", "decision": res}
