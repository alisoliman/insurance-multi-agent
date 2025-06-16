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
    """Instantiate AzureChatOpenAI with centralized config; fall back to dummy config."""
    from app.core.config import get_settings

    settings = get_settings()
    endpoint = settings.azure_openai_endpoint
    deployment = settings.azure_openai_deployment_name or "gpt-4o"
    api_key = settings.azure_openai_api_key

    logger.info("✅ Configuration loaded successfully")
    logger.info("Azure OpenAI Endpoint: %s", endpoint or "Not set")
    logger.info("Deployment Name: %s", deployment)
    logger.info("API Key configured: %s", "Yes" if api_key else "No")

    return AzureChatOpenAI(
            azure_deployment=deployment,
            api_key=api_key,
            azure_endpoint=endpoint,
            api_version="2024-08-01-preview",
            temperature=0.1,
        )
    


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
        agents=[claim_assessor, policy_checker,
                risk_analyst, communication_agent],
        model=LLM,
        prompt="""You are a senior claims manager supervising a team of insurance claim processing specialists. Your role is to coordinate your team's analysis and provide comprehensive advisory recommendations to support human decision-makers.

Your team consists of:
1. Claim Assessor – Evaluates damage validity and cost assessment
2. Policy Checker – Verifies coverage and policy terms
3. Risk Analyst – Analyses fraud risk and claimant history
4. Communication Agent – Drafts customer emails for missing information

Your responsibilities:
- Coordinate the claim-processing workflow in the optimal order
- Ensure each specialist completes their assessment before moving on
- Delegate to the Communication Agent whenever information is missing
- Synthesize all team inputs into a structured advisory assessment
- Provide clear reasoning and recommendations to empower human decision-making

Process each claim by:
1. First assign the Claim Assessor to evaluate damage and documentation
2. Then assign the Policy Checker to verify coverage
3. Then assign the Risk Analyst to evaluate fraud potential
4. If any specialist reports missing information, assign the Communication Agent to draft a customer email
5. Compile a comprehensive assessment summary for human review

End with a structured assessment in this format:

ASSESSMENT_COMPLETE

PRIMARY RECOMMENDATION: [APPROVE/DENY/INVESTIGATE] (Confidence: HIGH/MEDIUM/LOW)
- Brief rationale for the recommendation

SUPPORTING FACTORS:
- Key evidence that supports the recommendation
- Positive indicators identified by the team
- Policy compliance confirmations

RISK FACTORS:
- Concerns or red flags identified
- Potential fraud indicators
- Policy coverage limitations or exclusions

INFORMATION GAPS:
- Missing documentation or data
- Areas requiring clarification
- Additional verification needed

RECOMMENDED NEXT STEPS:
- Specific actions for the human reviewer
- Priority areas for further investigation
- Suggested timeline for decision

This assessment empowers human decision-makers with comprehensive AI analysis while preserving human authority over final claim decisions.""",
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
    """Run the claim through the supervisor and return detailed trace information.

    Returns comprehensive trace data including:
    - Agent interactions and handoffs
    - Tool calls and results
    - Message history per agent
    - Workflow state transitions
    - Timing information
    """

    logger.info("")
    logger.info("🚀 Starting supervisor-based claim processing…")
    logger.info("📋 Processing Claim ID: %s",
                claim_data.get("claim_id", "Unknown"))
    logger.info("%s", "=" * 60)

    messages = [
        {
            "role": "user",
            "content": (
                "Please process this insurance claim through your team of specialists:"
                f"\n\n{json.dumps(claim_data, indent=2)}"
            ),
        }
    ]

    chunks: List[Dict[str, Any]] = []
    step_count = 0

    # Enhanced streaming with detailed trace capture
    try:
        for chunk in insurance_supervisor.stream(
            {"messages": messages},
            stream_mode="updates",  # Get individual node updates instead of full state
            debug=False  # Disable debug information temporarily
        ):
            step_count += 1
            chunks.append(chunk)

        logger.info("✅ Workflow completed in %d steps", step_count)
        return chunks
    except Exception as e:
        logger.error("Error in workflow processing: %s", e, exc_info=True)
        raise
