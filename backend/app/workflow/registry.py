"""Registry of specialist agents for per-agent execution.

This centralizes access to each specialist agent using Microsoft Agent Framework.
Per-agent API endpoints and services import from here to avoid rebuilding agents
on every request.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List

from agent_framework import ChatAgent

from .client import get_chat_client
from .agents.claim_assessor import create_claim_assessor_agent, CLAIM_ASSESSOR_PROMPT
from .agents.policy_checker import create_policy_checker_agent, POLICY_CHECKER_PROMPT
from .agents.risk_analyst import create_risk_analyst_agent, RISK_ANALYST_PROMPT
from .agents.communication_agent import create_communication_agent, COMMUNICATION_AGENT_PROMPT
from .agents.synthesizer import create_synthesizer_agent, SYNTHESIZER_PROMPT
from .tools import (
    get_vehicle_details,
    analyze_image,
    get_policy_details,
    search_policy_documents,
    get_claimant_history,
)


@dataclass
class AgentConfig:
    """Configuration for a specialist agent."""
    name: str
    instructions: str
    tools: List[Callable]
    description: str | None = None


# Agent configuration registry
AGENT_CONFIGS: Dict[str, AgentConfig] = {
    "claim_assessor": AgentConfig(
        name="claim_assessor",
        instructions=CLAIM_ASSESSOR_PROMPT,
        tools=[get_vehicle_details, analyze_image],
        description="Evaluates damage validity and cost assessment"
    ),
    "policy_checker": AgentConfig(
        name="policy_checker",
        instructions=POLICY_CHECKER_PROMPT,
        tools=[get_policy_details, search_policy_documents],
        description="Verifies coverage and policy terms"
    ),
    "risk_analyst": AgentConfig(
        name="risk_analyst",
        instructions=RISK_ANALYST_PROMPT,
        tools=[get_claimant_history],
        description="Analyzes fraud risk and claimant history"
    ),
    "communication_agent": AgentConfig(
        name="communication_agent",
        instructions=COMMUNICATION_AGENT_PROMPT,
        tools=[],
        description="Drafts customer communications for missing info"
    ),
    "synthesizer": AgentConfig(
        name="synthesizer",
        instructions=SYNTHESIZER_PROMPT,
        tools=[],
        description="Synthesizes final assessment from specialist outputs"
    ),
}


def _compile_agents() -> Dict[str, ChatAgent]:
    """Instantiate each specialist agent once using the shared chat client."""
    chat_client = get_chat_client()
    
    return {
        "claim_assessor": create_claim_assessor_agent(chat_client),
        "policy_checker": create_policy_checker_agent(chat_client),
        "risk_analyst": create_risk_analyst_agent(chat_client),
        "communication_agent": create_communication_agent(chat_client),
        "synthesizer": create_synthesizer_agent(chat_client),
    }


# Lazy initialization of agents - only compiled when first accessed
_AGENTS: Dict[str, ChatAgent] | None = None


def get_agents() -> Dict[str, ChatAgent]:
    """Get the compiled agents dict (lazy initialization).
    
    This function provides lazy initialization of agents,
    allowing the module to be imported without requiring Azure credentials.
    The agents are only compiled when first requested.
    """
    global _AGENTS
    if _AGENTS is None:
        _AGENTS = _compile_agents()
    return _AGENTS


# For backward compatibility, AGENTS is now a property-like access
# Code that imports AGENTS directly will still work but triggers lazy init
class _AgentsProxy(Dict[str, ChatAgent]):
    """Proxy dict that lazily initializes agents on first access."""
    
    def __getitem__(self, key: str) -> ChatAgent:
        return get_agents()[key]
    
    def __contains__(self, key: object) -> bool:
        return key in get_agents()
    
    def __iter__(self):
        return iter(get_agents())
    
    def keys(self):
        return get_agents().keys()
    
    def values(self):
        return get_agents().values()
    
    def items(self):
        return get_agents().items()
    
    def get(self, key: str, default=None):
        return get_agents().get(key, default)


AGENTS: Dict[str, ChatAgent] = _AgentsProxy()  # type: ignore
