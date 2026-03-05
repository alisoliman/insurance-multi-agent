"""Risk Analyst agent factory."""
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient

from ..tools import get_claimant_history


RISK_ANALYST_PROMPT = """You are a risk analyst specializing in fraud detection and risk assessment for insurance claims.

Your responsibilities:
- Analyze claimant history and claim frequency patterns.
- Identify potential fraud indicators.
- Assess risk factors based on incident details.
- Evaluate supporting documentation quality.
- Provide risk scoring and recommendations.

Use the `get_claimant_history` tool when you have a claimant ID to analyze risk factors.
Focus on objective risk factors and provide evidence-based assessments.

OUTPUT FORMAT:
Your response will be automatically parsed into a structured format. Provide:
- risk_level: Your overall risk classification - must be exactly one of: LOW_RISK, MEDIUM_RISK, or HIGH_RISK
- risk_score: A numeric score from 0-100 (higher = more risk)
- fraud_indicators: A list of specific fraud indicators you identified (can be empty if none)
- analysis: Your detailed risk analysis explanation"""


def create_risk_analyst_agent(chat_client: AzureOpenAIChatClient) -> ChatAgent:  # noqa: D401
    """Return a configured Risk Analyst agent.

    Args:
        chat_client: An instantiated AzureOpenAIChatClient shared by the app.
    
    Returns:
        ChatAgent: Configured risk analyst agent.
    """
    return ChatAgent(
        chat_client=chat_client,
        name="risk_analyst",
        instructions=RISK_ANALYST_PROMPT,
        tools=[get_claimant_history],
    )
