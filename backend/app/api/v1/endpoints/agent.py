"""Per-agent execution endpoints (API v1).

Each specialist agent can be invoked directly via:
POST /api/v1/agent/{agent_name}/run

The request body mirrors the existing ``ClaimIn`` schema.  The endpoint
returns the serialized message list from that single agent.
"""
from __future__ import annotations

import re
from typing import Any, List

from fastapi import APIRouter, HTTPException

from app.models.claim import ClaimIn
from app.models.agent import AgentRunOut
from app.services.single_agent import run as run_single_agent, UnknownAgentError
from app.api.v1.endpoints.workflow import (
    get_sample_claim_by_id,
    _serialize_msg,  # reuse existing serializer
)

router = APIRouter(tags=["agent"])

# Re-use decision pattern from workflow endpoint if needed externally
DECISION_PATTERN = re.compile(
    r"\b(APPROVED|DENIED|REQUIRES_INVESTIGATION)\b", re.IGNORECASE
)


@router.post("/agent/{agent_name}/run", response_model=AgentRunOut)
async def agent_run(agent_name: str, claim: ClaimIn):  # noqa: D401
    """Run a single specialist agent and return its conversation trace."""

    try:
        # ------------------------------------------------------------------
        # 1. Load sample claim or use provided data (same logic as supervisor)
        # ------------------------------------------------------------------
        if claim.claim_id:
            claim_data = get_sample_claim_by_id(claim.claim_id)

            # Merge/override with any additional fields supplied in request
            override_data = {
                k: v
                for k, v in claim.model_dump(by_alias=True, exclude_none=True).items()
                if k != "claim_id"
            }
            claim_data.update(override_data)
        else:
            claim_data = claim.to_dict()

        # ------------------------------------------------------------------
        # 2. Run the agent graph
        # ------------------------------------------------------------------
        raw_msgs: List[Any] = run_single_agent(agent_name, claim_data)

        # ------------------------------------------------------------------
        # 3. Serialize messages for JSON response
        # ------------------------------------------------------------------
        chronological = [_serialize_msg(agent_name, m, include_node=False) for m in raw_msgs]

        return AgentRunOut(
            success=True,
            agent_name=agent_name,
            claim_body=claim_data,
            conversation_chronological=chronological,
        )

    except UnknownAgentError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc))
