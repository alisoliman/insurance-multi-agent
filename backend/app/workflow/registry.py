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


# Public mapping of agent name → ChatAgent instance
AGENTS: Dict[str, ChatAgent] = _compile_agents()
