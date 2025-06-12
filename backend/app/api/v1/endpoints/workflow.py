"""Workflow endpoint definitions (API v1)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.claim import ClaimIn, ClaimOut, ClaimByIdIn, ClaimDataIn
from app.services.claim_processing import run as run_workflow
from app.sample_data import ALL_SAMPLE_CLAIMS

router = APIRouter(tags=["workflow"])


def get_sample_claim_by_id(claim_id: str) -> dict:
    """Retrieve sample claim data by claim_id."""
    for claim in ALL_SAMPLE_CLAIMS:
        if claim.get("claim_id") == claim_id:
            return claim

    # If not found, list available claim IDs
    available_ids = [claim.get("claim_id") for claim in ALL_SAMPLE_CLAIMS]
    raise HTTPException(
        status_code=404,
        detail=f"Claim ID '{claim_id}' not found. Available sample claim IDs: {available_ids}"
    )


@router.get("/workflow/sample-claims")
async def list_sample_claims():
    """List all available sample claims for testing."""
    claims_summary = []
    for claim in ALL_SAMPLE_CLAIMS:
        claims_summary.append({
            "claim_id": claim.get("claim_id"),
            "claimant_name": claim.get("claimant_name"),
            "claim_type": claim.get("claim_type"),
            "estimated_damage": claim.get("estimated_damage"),
            "description": claim.get("description", "")[:100] + "..." if len(claim.get("description", "")) > 100 else claim.get("description", "")
        })

    return {
        "available_claims": claims_summary,
        "usage": "Use POST /api/v1/workflow/run with {'claim_id': 'CLM-2024-001'} to process a sample claim"
    }


@router.post("/workflow/run", response_model=ClaimOut)
async def workflow_run(claim: ClaimIn):  # noqa: D401
    """Run the claim through the multi-agent workflow and return full trace.

    Accepts either:
    - A claim_id to load sample data: {"claim_id": "CLM-2024-001"}
    - Full claim data: {"claim_id": "...", "policy_number": "...", ...}
    """

    try:
        # Determine if this is a sample claim request or full claim data
        if claim.is_sample_claim_request():
            # Load sample data by claim_id
            claim_data = get_sample_claim_by_id(claim.claim_id)
        else:
            # Use provided claim data directly
            claim_data = claim.to_dict()

        chunks = run_workflow(claim_data)

        # Aggregate conversation per agent
        conversation: dict[str, list[dict[str, str]]] = {}
        msg_counters: dict[str, int] = {}
        final_decision: str | None = None

        for chunk in chunks:
            for node_name, node_data in chunk.items():
                if node_name == "__end__" or "messages" not in node_data:
                    continue

                msgs = node_data["messages"]
                start = msg_counters.get(node_name, 0)
                new = msgs[start:]
                if not new:
                    continue
                conversation.setdefault(node_name, [])
                for m in new:
                    conversation[node_name].append({
                        "role": getattr(m, "role", "assistant"),
                        "content": getattr(m, "content", str(m)),
                    })
                msg_counters[node_name] = len(msgs)

        sup_msgs = conversation.get("supervisor", [])
        if sup_msgs:
            final_decision = sup_msgs[-1]["content"]

        return ClaimOut(success=True, final_decision=final_decision, conversation=conversation)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/workflow/run-by-id", response_model=ClaimOut)
async def workflow_run_by_id(request: ClaimIdRequest):  # noqa: D401
    """Run a sample claim by ID through the multi-agent workflow."""

    # Find the claim in sample data
    claim_data = None
    for sample_claim in ALL_SAMPLE_CLAIMS:
        if sample_claim["claim_id"] == request.claim_id:
            claim_data = sample_claim
            break

    if not claim_data:
        available_ids = [claim["claim_id"] for claim in ALL_SAMPLE_CLAIMS]
        raise HTTPException(
            status_code=404,
            detail=f"Claim ID '{request.claim_id}' not found. Available IDs: {available_ids}"
        )

    try:
        chunks = run_workflow(claim_data)

        # Aggregate conversation per agent
        conversation: dict[str, list[dict[str, str]]] = {}
        msg_counters: dict[str, int] = {}
        final_decision: str | None = None

        for chunk in chunks:
            for node_name, node_data in chunk.items():
                if node_name == "__end__" or "messages" not in node_data:
                    continue

                msgs = node_data["messages"]
                start = msg_counters.get(node_name, 0)
                new = msgs[start:]
                if not new:
                    continue
                conversation.setdefault(node_name, [])
                for m in new:
                    conversation[node_name].append({
                        "role": getattr(m, "role", "assistant"),
                        "content": getattr(m, "content", str(m)),
                    })
                msg_counters[node_name] = len(msgs)

        sup_msgs = conversation.get("supervisor", [])
        if sup_msgs:
            final_decision = sup_msgs[-1]["content"]

        return ClaimOut(success=True, final_decision=final_decision, conversation=conversation)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
