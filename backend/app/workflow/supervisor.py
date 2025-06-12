"""Supervisor orchestration for the insurance claim workflow.

This module creates the specialized agents, compiles the LangGraph supervisor,
and exposes a `process_claim_with_supervisor` helper used by the service layer.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langgraph_supervisor import create_supervisor

from app.core.logging_config import configure_logging

from .agents.claim_assessor import create_claim_assessor_agent
from .agents.policy_checker import create_policy_checker_agent
from .agents.risk_analyst import create_risk_analyst_agent
from .agents.communication_agent import create_communication_agent

load_dotenv()

# ---------------------------------------------------------------------------
# Configure logging (pretty icons + single-line formatter)
# ---------------------------------------------------------------------------

configure_logging()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared LLM configuration (Azure OpenAI)
# ---------------------------------------------------------------------------

def _build_llm() -> AzureChatOpenAI:  # noqa: D401
    """Instantiate AzureChatOpenAI with env vars; fall back to dummy config."""

    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")

    logger.info("✅ Configuration loaded successfully")
    logger.info("Azure OpenAI Endpoint: %s", endpoint or "Not set")
    logger.info("Deployment Name: %s", deployment)
    logger.info("API Key configured: %s", "Yes" if api_key else "No")

    try:
        return AzureChatOpenAI(
            azure_deployment=deployment,
            api_key=api_key,
            azure_endpoint=endpoint,
            api_version="2024-02-15-preview",
            temperature=0.1,
        )
    except Exception as err:  # pragma: no cover – easier local dev without keys
        logger.warning("Falling back to AzureChatOpenAI stub (%s)", err)
        # Minimal stub implementing `.generate` interface to avoid crashes
        from langchain_core.language_models.fake import FakeListLLM

        return FakeListLLM(responses=["stub"])


LLM = _build_llm()

# ---------------------------------------------------------------------------
# Create specialized agents
# ---------------------------------------------------------------------------

claim_assessor = create_claim_assessor_agent(LLM)
policy_checker = create_policy_checker_agent(LLM)
risk_analyst = create_risk_analyst_agent(LLM)
communication_agent = create_communication_agent(LLM)

logger.info("✅ Specialized agents created successfully:")
logger.info("- 🔍 Claim Assessor: Damage evaluation and cost assessment")
logger.info("- 📋 Policy Checker: Coverage verification and policy validation")
logger.info("- ⚠️ Risk Analyst: Fraud detection and risk scoring")
logger.info("- 📧 Communication Agent: Customer outreach for missing information")

# ---------------------------------------------------------------------------
# Compile supervisor
# ---------------------------------------------------------------------------

def create_insurance_supervisor():  # noqa: D401
    """Create and compile the supervisor coordinating all agents."""

    supervisor = create_supervisor(
        agents=[claim_assessor, policy_checker, risk_analyst, communication_agent],
        model=LLM,
        prompt="""You are a senior claims manager supervising a team of insurance claim processing specialists.

Your team consists of:
1. Claim Assessor – Evaluates damage validity and cost assessment
2. Policy Checker – Verifies coverage and policy terms
3. Risk Analyst – Analyses fraud risk and claimant history
4. Communication Agent – Drafts customer emails for missing information

Your responsibilities:
- Coordinate the claim-processing workflow in the optimal order
- Ensure each specialist completes their assessment before moving on
- Delegate to the Communication Agent whenever information is missing
- Make a final decision based on all assessments
- Provide clear reasoning for each decision

Process each claim by:
1. First assign the Claim Assessor to evaluate damage and documentation
2. Then assign the Policy Checker to verify coverage
3. Then assign the Risk Analyst to evaluate fraud potential
4. If any specialist reports missing information, assign the Communication Agent to draft a customer email
5. Make a final decision based on team inputs

End with a clear final decision: APPROVED, DENIED, or REQUIRES_INVESTIGATION.""",
    ).compile()

    return supervisor


insurance_supervisor = create_insurance_supervisor()

logger.info("✅ Insurance supervisor created successfully")
logger.info("📊 Workflow: Supervisor → Specialists → Coordinated Decision")
logger.info("%s", "=" * 80)
logger.info("🚀 MULTI-AGENT INSURANCE CLAIM PROCESSING SYSTEM")
logger.info("%s", "=" * 80)

# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------

def process_claim_with_supervisor(claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:  # noqa: D401,E501
    """Run the claim through the supervisor and return the raw stream chunks.

    Each streamed chunk is logged at INFO level summarising the agent involved
    and the last message content (truncated for readability).
    """

    logger.info("")
    logger.info("🚀 Starting supervisor-based claim processing…")
    logger.info("📋 Processing Claim ID: %s", claim_data.get("claim_id", "Unknown"))
    logger.info("%s", "=" * 60)

    messages = [
        {
            "role": "user",
            "content": (
                "Please process this insurance claim through your team of specialists:"\
                f"\n\n{json.dumps(claim_data, indent=2)}"
            ),
        }
    ]

    chunks: List[Dict[str, Any]] = []
    for chunk in insurance_supervisor.stream({"messages": messages}):
        # Log a concise summary of each agent step to aid debugging
        for node_name, node_data in chunk.items():
            if node_name == "__end__" or "messages" not in node_data:
                continue
            last_msg = node_data["messages"][-1]

            # Determine sender role/type safely
            role = getattr(last_msg, "role", getattr(last_msg, "type", last_msg.__class__.__name__))

            # Extract content for preview – fall back to str(message) if unavailable
            if hasattr(last_msg, "content") and isinstance(last_msg.content, str):  # type: ignore[attr-defined]
                full_content = last_msg.content  # type: ignore[attr-defined]
            else:
                full_content = str(last_msg)

            preview = full_content[:120].replace("\n", " ") + ("…" if len(full_content) > 120 else "")

            logger.info("%s → %s: %s", node_name, role, preview)

        chunks.append(chunk)
    return chunks
