"""Per-agent execution endpoints (API v1).

Each specialist agent can be invoked directly via:
POST /api/v1/agent/{agent_name}/run

The request body mirrors the existing ``ClaimIn`` schema.  The endpoint
returns the serialized message list from that single agent.
"""
from __future__ import annotations

import logging
import re
from typing import Any, List

from fastapi import APIRouter, HTTPException

from app.models.claim import ClaimIn, AgentOutputOut
from app.models.agent import AgentRunOut
from app.services.single_agent import run as run_single_agent, UnknownAgentError
from app.api.v1.endpoints.workflow import (
    get_sample_claim_by_id,
    _serialize_msg,  # reuse existing serializer
)

# Feature 005: Import vehicle/policy repos for generated scenario support
from app.db.vehicle_repo import create_vehicle, get_vehicle_by_vin, VehicleCreate
from app.db.policy_repo import create_policy, get_policy_by_policy_number, PolicyCreate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["agent"])

# Re-use decision pattern from workflow endpoint if needed externally
DECISION_PATTERN = re.compile(
    r"\b(APPROVED|DENIED|REQUIRES_INVESTIGATION)\b", re.IGNORECASE
)


async def _ensure_vehicle_exists(claim_data: dict) -> None:
    """Ensure vehicle info from claim is available in vehicle_repo for tool lookup.
    
    Feature 005 (T028 fix): For generated but unsaved scenarios, the vehicle info
    is in the claim data but not in the database. This ensures the Claim Assessor's
    get_vehicle_details tool can find the vehicle.
    """
    vehicle_info = claim_data.get("vehicle_info")
    if not vehicle_info:
        return
    
    vin = vehicle_info.get("vin")
    if not vin:
        return
    
    # Check if vehicle already exists
    existing = await get_vehicle_by_vin(vin)
    if existing:
        logger.debug(f"Vehicle {vin} already exists in repo")
        return
    
    # Create the vehicle record from claim data
    # Use claim_id as scenario_id for temporary records
    try:
        vehicle_create = VehicleCreate(
            vin=vin,
            scenario_id=claim_data.get("claim_id", "temp"),
            policy_number=claim_data.get("policy_number", "unknown"),
            make=vehicle_info.get("make", "Unknown"),
            model=vehicle_info.get("model", "Unknown"),
            year=vehicle_info.get("year", 2020),
            license_plate=vehicle_info.get("license_plate", ""),
            color=vehicle_info.get("color"),
            vehicle_type=vehicle_info.get("vehicle_type"),
        )
        await create_vehicle(vehicle_create)
        logger.info(f"Created vehicle record for generated scenario: {vin}")
    except Exception as e:
        logger.warning(f"Could not create vehicle record: {e}")


async def _ensure_policy_exists(claim_data: dict) -> None:
    """Ensure policy from claim is available in policy_repo for tool lookup.
    
    Feature 005: For generated but unsaved scenarios, the policy data
    may need to be available for the Policy Checker agent.
    """
    policy_number = claim_data.get("policy_number")
    if not policy_number:
        return
    
    # Check if policy already exists
    existing = await get_policy_by_policy_number(policy_number)
    if existing:
        logger.debug(f"Policy {policy_number} already exists in repo")
        return
    
    # For single agent demos, we create a policy record from claim data
    # Use claim_id as scenario_id for temporary records
    try:
        # Extract customer info if available
        customer_info = claim_data.get("customer_info", {})
        vehicle_info = claim_data.get("vehicle_info", {})
        
        policy_create = PolicyCreate(
            policy_number=policy_number,
            scenario_id=claim_data.get("claim_id", "temp"),
            policy_type="Auto",
            coverage_types=["collision", "comprehensive", "liability"],
            coverage_limits={
                "collision": 50000.0,
                "comprehensive": 50000.0,
                "liability": 100000.0,
            },
            deductible=500.0,
            premium=1200.0,
            effective_date=claim_data.get("incident_date", "2024-01-01"),
            expiration_date="2025-12-31",
            customer_name=claim_data.get("claimant_name", customer_info.get("name", "Unknown")),
            customer_email=customer_info.get("email"),
            customer_phone=customer_info.get("phone"),
            vin=vehicle_info.get("vin"),
        )
        await create_policy(policy_create)
        logger.info(f"Created policy record for generated scenario: {policy_number}")
    except Exception as e:
        logger.warning(f"Could not create policy record: {e}")


@router.post("/agent/{agent_name}/run", response_model=AgentRunOut)
async def agent_run(agent_name: str, claim: ClaimIn):  # noqa: D401
    """Run a single specialist agent and return its conversation trace."""

    try:
        # ------------------------------------------------------------------
        # 1. Load sample claim or use provided data (same logic as supervisor)
        # ------------------------------------------------------------------
        # Check if this is a sample claim request (only claim_id provided)
        # or a full claim data request (other fields provided)
        if claim.is_sample_claim_request():
            # Only claim_id provided - look up in sample claims
            claim_data = get_sample_claim_by_id(claim.claim_id)
        elif claim.claim_id and claim.policy_number:
            # Full claim data provided (e.g., from generated scenarios)
            claim_data = claim.to_dict()
        elif claim.claim_id:
            # claim_id with some overrides - try to load sample and merge
            try:
                claim_data = get_sample_claim_by_id(claim.claim_id)
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
        # For generated but unsaved scenarios, create temporary records
        # so agent tools can find them during processing
        await _ensure_vehicle_exists(claim_data)
        await _ensure_policy_exists(claim_data)

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
        raise HTTPException(status_code=500, detail=str(exc))
