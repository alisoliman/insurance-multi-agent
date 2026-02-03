"""Workflow endpoint definitions (API v1)."""
from __future__ import annotations

import logging
import re
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.models.claim import ClaimIn, ClaimOut, AgentOutputOut
from app.sample_data import ALL_SAMPLE_CLAIMS
from app.services.claim_data_helpers import ensure_vehicle_exists, ensure_policy_exists
from app.services.claim_processing import run as run_workflow

logger = logging.getLogger(__name__)

router = APIRouter(tags=["workflow"])

# Regex to capture decision outcomes from the synthesizer
DECISION_PATTERN = re.compile(
    r"\b(APPROVED|DENIED|REQUIRES_INVESTIGATION|INVESTIGATE|COVERED|NOT_COVERED|PARTIALLY_COVERED)\b",
    re.IGNORECASE,
)


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
            "description": claim.get("description", "")
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
        # ------------------------------------------------------------------
        # 1. Decide whether to load sample claim or use provided data
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
                # Merge/override with any additional fields supplied in request
                override_data = {
                    k: v for k, v in claim.model_dump(by_alias=True, exclude_none=True).items()
                    if k != "claim_id"
                }
                claim_data.update(override_data)
            except HTTPException:
                # claim_id not found in samples - use provided data as-is
                claim_data = claim.to_dict()
        else:
            # Full claim provided without claim_id
            claim_data = claim.to_dict()

        # ------------------------------------------------------------------
        # 1.5 Feature 005: Ensure vehicle/policy exist for generated scenarios
        # ------------------------------------------------------------------
        # For generated but unsaved scenarios, create temporary records
        # so agent tools can find them during processing
        await ensure_vehicle_exists(claim_data)
        await ensure_policy_exists(claim_data)

        # ------------------------------------------------------------------
        # 2. Execute workflow; capture both grouped & chronological
        # ------------------------------------------------------------------
        chronological: list[dict[str, str]] = []
        seen_lengths: dict[str, int] = {}
        agent_outputs: Dict[str, AgentOutputOut] = {}  # NEW: collect structured outputs

        # Extract summary_language preference (default to "english")
        summary_language = claim.summary_language or "english"

        # Run the async workflow and get all chunks
        chunks = await run_workflow(claim_data, summary_language=summary_language)

        # Process each chunk (agent output)
        for chunk in chunks:
            # Process each node in the chunk (now we get individual agent updates)
            for node_name, node_data in chunk.items():
                if node_name == "__end__":
                    continue

                # Extract structured_output if present (T006)
                structured_output = None
                if isinstance(node_data, dict):
                    structured_output = node_data.get("structured_output")

                # Handle different data structures
                if isinstance(node_data, list):
                    msgs = node_data
                elif isinstance(node_data, dict) and "messages" in node_data:
                    msgs = node_data["messages"]
                elif isinstance(node_data, dict) and set(node_data.keys()) == {"messages"}:
                    # Handle supervisor-style single messages key
                    msgs = node_data["messages"]
                else:
                    continue

                prev_len = seen_lengths.get(node_name, 0)
                new_msgs = msgs[prev_len:]

                for msg in new_msgs:
                    chronological.append(_serialize_msg(node_name, msg))

                seen_lengths[node_name] = len(msgs)
                
                # Collect structured output for this agent (T006)
                if structured_output is not None:
                    # Get raw text from last assistant message as fallback
                    raw_text = None
                    for msg in reversed(msgs):
                        msg_role = msg.get("role", "") if isinstance(msg, dict) else getattr(msg, "role", "")
                        if isinstance(msg_role, dict):
                            msg_role = msg_role.get("value", "")
                        if msg_role == "assistant":
                            msg_content = msg.get("content", "") if isinstance(msg, dict) else getattr(msg, "content", "")
                            raw_text = str(msg_content)[:500] if msg_content else None
                            break
                    
                    agent_outputs[node_name] = AgentOutputOut(
                        agent_name=node_name,
                        structured_output=structured_output,
                        tool_calls=None,  # TODO: extract tool calls in future
                        raw_text=raw_text
                    )

        # ------------------------------------------------------------------
        # 3. Extract final decision from chronological messages
        # ------------------------------------------------------------------
        final_decision: str | None = None

        # Extract final decision scanning chronological reverse order
        for entry in reversed(chronological):
            match = DECISION_PATTERN.search(entry["content"])
            if match:
                final_decision = match.group(1).upper()
                break

        # ------------------------------------------------------------------
        # 4. Return response with chronological stream and agent_outputs
        # ------------------------------------------------------------------
        return ClaimOut(
            success=True,
            final_decision=final_decision,
            conversation_chronological=chronological,
            agent_outputs=agent_outputs if agent_outputs else None,  # NEW: include structured outputs
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ------------------------------------------------------------------
# Helper serialization
# ------------------------------------------------------------------


def _serialize_msg(node: str, msg: Any, *, include_node: bool = True) -> dict:  # noqa: D401
    """Return a serializable dict for a message (supports both LangChain objects and plain dicts)."""
    import json as json_mod
    import numpy as np
    
    def json_safe(obj):
        """Convert numpy types to Python native types for JSON serialization."""
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return str(obj)
    
    # Handle plain dict messages (from Microsoft Agent Framework)
    if isinstance(msg, dict):
        role = msg.get("role", "assistant")
        # Handle nested role format from Agent Framework: {'type': 'role', 'value': 'assistant'}
        if isinstance(role, dict):
            role = role.get("value", "assistant")
        
        # Handle Microsoft Agent Framework format with 'contents' array
        contents = msg.get("contents", [])
        content_repr = msg.get("content", "")
        
        if contents and not content_repr:
            content_parts = []
            for item in contents:
                item_type = item.get("type", "")
                
                if item_type == "function_call":
                    # Tool call
                    func_name = item.get("name", "unknown")
                    func_args = item.get("arguments", "{}")
                    content_parts.append(f"🔧 Calling tool: {func_name}")
                    try:
                        args = json_mod.loads(func_args) if isinstance(func_args, str) else func_args
                        if args:
                            content_parts.append(f"   Arguments: {json_mod.dumps(args, indent=2, default=json_safe)}")
                    except:
                        pass
                        
                elif item_type == "function_result":
                    # Tool response
                    func_name = item.get("name", "tool")
                    result = item.get("result", "")
                    if isinstance(result, dict):
                        result_str = json_mod.dumps(result, indent=2, default=json_safe)
                    else:
                        result_str = str(result)
                    # Truncate very long tool responses
                    if len(result_str) > 500:
                        result_str = result_str[:500] + "... [truncated]"
                    content_parts.append(f"🔧 Tool Response ({func_name}):\n{result_str}")
                    role = "tool"
                    
                elif item_type == "text":
                    # Regular text content
                    text = item.get("text", "")
                    if text:
                        content_parts.append(text)
                        
                else:
                    # Unknown content type - try to extract text
                    text = item.get("text", "") or item.get("content", "")
                    if text:
                        content_parts.append(str(text))
            
            content_repr = "\n".join(content_parts)
        
        # Handle old-style tool calls (OpenAI format)
        tool_calls = msg.get("tool_calls", [])
        if tool_calls and not content_repr:
            tool_info = []
            for tc in tool_calls:
                func = tc.get("function", {})
                func_name = func.get("name", "unknown")
                func_args = func.get("arguments", "{}")
                tool_info.append(f"🔧 Calling tool: {func_name}")
                try:
                    args = json_mod.loads(func_args) if isinstance(func_args, str) else func_args
                    if args:
                        tool_info.append(f"   Arguments: {json_mod.dumps(args, indent=2, default=json_safe)}")
                except:
                    pass
            content_repr = "\n".join(tool_info)
        
        # Handle old-style tool response messages
        if msg.get("tool_call_id") or (role == "tool" and not content_repr):
            tool_name = msg.get("name", "tool")
            if isinstance(tool_name, dict):
                tool_name = tool_name.get("value", "tool")
            if content_repr and not content_repr.startswith("🔧"):
                if len(content_repr) > 500:
                    content_repr = content_repr[:500] + "... [truncated]"
                content_repr = f"🔧 Tool Response ({tool_name}):\n{content_repr}"
            role = "tool"
    else:
        # Handle LangChain message objects
        role = getattr(msg, "role", getattr(msg, "type", "assistant"))
        
        # Handle tool call messages (AIMessage with tool_calls attr)
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            content_repr = f"TOOL_CALL: {msg.tool_calls}"
        else:
            content_repr = getattr(msg, "content", str(msg)) or ""

    data = {
        "role": role,
        "content": content_repr.strip() if isinstance(content_repr, str) else str(content_repr),
    }
    if include_node:
        data["node"] = node
    return data
