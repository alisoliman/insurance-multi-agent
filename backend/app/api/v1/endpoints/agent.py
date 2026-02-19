"""Per-agent execution endpoints (API v1).

Each specialist agent can be invoked directly via:
POST /api/v1/agent/{agent_name}/run

The request body mirrors the existing ``ClaimIn`` schema.  The endpoint
returns the serialized message list from that single agent.
"""
from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException

from app.models.claim import ClaimIn, AgentOutputOut
from app.models.agent import AgentRunOut
from app.services.claim_data_helpers import ensure_vehicle_exists, ensure_policy_exists
from app.services.single_agent import run as run_single_agent, UnknownAgentError
from app.api.v1.endpoints.workflow import get_sample_claim_by_id, _serialize_msg, _extract_tool_calls_from_messages

logger = logging.getLogger(__name__)

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
        claim_id = claim.claim_id
        
        if claim.is_sample_claim_request() and claim_id:
            # Only claim_id provided - look up in sample claims
            claim_data = get_sample_claim_by_id(claim_id)
        elif claim_id and claim.policy_number:
            # Full claim data provided (e.g., from generated scenarios)
            claim_data = claim.to_dict()
        elif claim_id:
            # claim_id with some overrides - try to load sample and merge
            try:
                claim_data = get_sample_claim_by_id(claim_id)
                # Merge/override with any additional fields
                override_data = {
                    k: v
                    for k, v in claim.model_dump(by_alias=True, exclude_none=True).items()
                    if k != "claim_id"
                }
                claim_data.update(override_data)
            except HTTPException:
                # claim_id not found in samples - use provided data as-is
                claim_data = claim.to_dict()
        else:
            claim_data = claim.to_dict()

        # ------------------------------------------------------------------
        # 1.5 Feature 005: Ensure vehicle/policy exist for generated scenarios
        # ------------------------------------------------------------------
        await ensure_vehicle_exists(claim_data)
        await ensure_policy_exists(claim_data)

        # ------------------------------------------------------------------
        # 2. Run the agent graph
        # ------------------------------------------------------------------
        raw_msgs, structured_output = await run_single_agent(agent_name, claim_data)

        # ------------------------------------------------------------------
        # 3. Serialize messages for JSON response
        # ------------------------------------------------------------------
        chronological = [_serialize_msg(agent_name, m, include_node=False) for m in raw_msgs]

        # ------------------------------------------------------------------
        # 4. Build structured output response if available
        # ------------------------------------------------------------------
        agent_output = None
        if structured_output is not None:
            agent_output = AgentOutputOut(
                agent_name=agent_name,
                structured_output=structured_output,
                tool_calls=_extract_tool_calls_from_messages(raw_msgs) or None,
            )

        return AgentRunOut(
            success=True,
            agent_name=agent_name,
            claim_body=claim_data,
            conversation_chronological=chronological,
            structured_output=agent_output,
        )

    except UnknownAgentError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as exc:  # pragma: no cover
        logger.exception(f"Error in agent_run for {agent_name}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
