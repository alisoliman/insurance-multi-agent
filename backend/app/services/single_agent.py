"""Service helper to run a single ChatAgent from the Microsoft Agent Framework.

This mirrors the existing ``services.claim_processing`` layer but targets
one specialist agent instead of the supervisor.  The compiled agents are
imported from ``app.workflow.registry`` so they are instantiated only once
at startup.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple, Type

from pydantic import BaseModel

from app.workflow.registry import AGENTS
from app.models.agent_outputs import (
    ClaimAssessment,
    CoverageVerification,
    RiskAssessment,
    CustomerCommunication,
)

logger = logging.getLogger(__name__)

# Mapping from agent name to their structured output Pydantic model
AGENT_RESPONSE_FORMATS: Dict[str, Type[BaseModel]] = {
    "claim_assessor": ClaimAssessment,
    "policy_checker": CoverageVerification,
    "risk_analyst": RiskAssessment,
    "communication_agent": CustomerCommunication,
}


class UnknownAgentError(ValueError):
    """Raised when a requested agent name does not exist in the registry."""


async def run(agent_name: str, claim_data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:  # noqa: D401
    """Run *one* agent on the claim data and return its message list and structured output.

    Args:
        agent_name: Key in ``app.workflow.registry.AGENTS``.
        claim_data: Claim dict already merged/cleaned by the endpoint.

    Returns:
        Tuple of (message list, structured_output dict or None).
    """

    logger.info("🚀 Starting single-agent run: %s", agent_name)

    if agent_name not in AGENTS:
        raise UnknownAgentError(f"Unknown agent '{agent_name}'. Available: {list(AGENTS)}")

    agent = AGENTS[agent_name]

    # Build the task string (same pattern supervisor uses)
    task = "Please process this insurance claim:\n\n" + json.dumps(claim_data, indent=2)

    # Get the response format for structured output (if available for this agent)
    response_format = AGENT_RESPONSE_FORMATS.get(agent_name)
    
    # Run the agent with optional structured output format
    if response_format:
        options = {"response_format": response_format}
        result = await agent.run(task, options=options)
    else:
        result = await agent.run(task)
    
    # Extract full message history from the AgentResponse
    messages: List[Dict[str, Any]] = []
    structured_output: Optional[Dict[str, Any]] = None
    
    # Add the initial user message
    messages.append({"role": "user", "content": task})
    
    # Check for structured output (Pydantic model) in result.value
    if response_format and hasattr(result, 'value') and result.value is not None:
        structured_output = result.value.model_dump()
        logger.info("✅ Agent %s returned structured output: %s", agent_name, type(result.value).__name__)
    elif hasattr(result, 'value') and isinstance(result.value, BaseModel):
        structured_output = result.value.model_dump()
        logger.info("✅ Agent %s returned structured output: %s", agent_name, type(result.value).__name__)
    
    # Get messages from the AgentResponse
    if hasattr(result, 'to_dict'):
        result_dict = result.to_dict()
        if 'messages' in result_dict and result_dict['messages']:
            # Build call_id → function_name mapping from function_calls
            call_id_to_name: Dict[str, str] = {}
            for msg in result_dict['messages']:
                for item in msg.get('contents', []):
                    if item.get('type') == 'function_call':
                        call_id = item.get('call_id', '')
                        name = item.get('name', '')
                        if call_id and name:
                            call_id_to_name[call_id] = name
            
            # Now process messages and enrich function_results with names
            for msg in result_dict['messages']:
                enriched_msg = dict(msg)
                enriched_contents = []
                for item in msg.get('contents', []):
                    enriched_item = dict(item)
                    if item.get('type') == 'function_result':
                        call_id = item.get('call_id', '')
                        if call_id in call_id_to_name:
                            enriched_item['name'] = call_id_to_name[call_id]
                    enriched_contents.append(enriched_item)
                enriched_msg['contents'] = enriched_contents
                messages.append(enriched_msg)
        else:
            # Fallback: use the response string
            response_text = str(result) if result else ""
            messages.append({"role": "assistant", "content": response_text})
    else:
        # Fallback: use the response string
        response_text = str(result) if result else ""
        messages.append({"role": "assistant", "content": response_text})

    logger.info("✅ Single-agent run finished: %s messages", len(messages))
    return messages, structured_output
