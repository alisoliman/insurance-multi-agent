"""Service helper to run a single compiled LangGraph agent.

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


def run(agent_name: str, claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:  # noqa: D401
    """Run *one* agent on the claim data and return its message list.

    Args:
        agent_name: Key in ``app.workflow.registry.AGENTS``.
        claim_data: Claim dict already merged/cleaned by the endpoint.

    Returns:
        The message list returned by ``agent.invoke``.
    """

    logger.info("🚀 Starting single-agent run: %s", agent_name)

    if agent_name not in AGENTS:
        raise UnknownAgentError(f"Unknown agent '{agent_name}'. Available: {list(AGENTS)}")

    agent = AGENTS[agent_name]

    # Wrap claim data in a user message (same pattern supervisor uses)
    messages = [
        {
            "role": "user",
            "content": (
                "Please process this insurance claim:\n\n" + json.dumps(claim_data, indent=2)
            ),
        }
    ]

    result = agent.invoke({"messages": messages})
    # LangGraph convention: result is {"messages": [...]}
    msgs = result.get("messages", []) if isinstance(result, dict) else result

    logger.info("✅ Single-agent run finished: %s messages", len(msgs))
    return msgs
