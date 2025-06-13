"""Registry of compiled single agents for per-agent execution.

This centralizes access to each specialist agent compiled as an individual
LangGraph graph.  Per-agent API endpoints and services import from here to
avoid rebuilding graphs on every request.
"""
from __future__ import annotations

from typing import Dict

from .supervisor import LLM
from .agents.claim_assessor import create_claim_assessor_agent
from .agents.policy_checker import create_policy_checker_agent
from .agents.risk_analyst import create_risk_analyst_agent
from .agents.communication_agent import create_communication_agent


def _compile_agents() -> Dict[str, object]:  # noqa: D401
    """Instantiate and compile each specialist agent once."""

    return {
        "claim_assessor": create_claim_assessor_agent(LLM),
        "policy_checker": create_policy_checker_agent(LLM),
        "risk_analyst": create_risk_analyst_agent(LLM),
        "communication_agent": create_communication_agent(LLM),
    }


# Public mapping of agent name → compiled agent graph
AGENTS: Dict[str, object] = _compile_agents()
