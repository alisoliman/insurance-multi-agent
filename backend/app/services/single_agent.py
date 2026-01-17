"""Service helper to run a single ChatAgent from the Microsoft Agent Framework.

This mirrors the existing ``services.claim_processing`` layer but targets
one specialist agent instead of the supervisor.  The compiled agents are
imported from ``app.workflow.registry`` so they are instantiated only once
at startup.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from app.workflow.registry import AGENTS

logger = logging.getLogger(__name__)


class UnknownAgentError(ValueError):
    """Raised when a requested agent name does not exist in the registry."""


async def run(agent_name: str, claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:  # noqa: D401
    """Run *one* agent on the claim data and return its message list.

    Args:
        agent_name: Key in ``app.workflow.registry.AGENTS``.
        claim_data: Claim dict already merged/cleaned by the endpoint.

    Returns:
        The full message list including tool calls and responses.
    """

    logger.info("🚀 Starting single-agent run: %s", agent_name)

    if agent_name not in AGENTS:
        raise UnknownAgentError(f"Unknown agent '{agent_name}'. Available: {list(AGENTS)}")

    agent = AGENTS[agent_name]

    # Build the task string (same pattern supervisor uses)
    task = "Please process this insurance claim:\n\n" + json.dumps(claim_data, indent=2)

    # Run the agent asynchronously
    result = await agent.run(task)
    
    # Extract full message history from the AgentResponse
    messages: List[Dict[str, Any]] = []
    
    # Add the initial user message
    messages.append({"role": "user", "content": task})
    
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
    return messages
