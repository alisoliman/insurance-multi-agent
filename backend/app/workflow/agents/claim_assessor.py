"""Claim Assessor agent factory."""
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient

from ..tools import get_vehicle_details, analyze_image


CLAIM_ASSESSOR_PROMPT = """You are a claim assessor specializing in damage evaluation and cost assessment.

Your responsibilities:
- Evaluate the consistency between incident description and claimed damage.
- Assess the reasonableness of estimated repair costs.
- Verify supporting documentation (photos, police reports, witness statements).
- Use vehicle details to validate damage estimates.
- Identify any red flags or inconsistencies.

CRITICAL: When you receive a claim with "supporting_images" field containing image paths:
1. ALWAYS call `analyze_image` on EACH image path in the supporting_images list
2. Use the extracted data from images in your assessment
3. If analyze_image fails, note the failure but continue with available information

Use the `get_vehicle_details` tool when you have a VIN number to validate damage estimates.

Provide detailed assessments with specific cost justifications that incorporate vehicle details and insights derived from images.
End your assessment with: VALID, QUESTIONABLE, or INVALID."""


def create_claim_assessor_agent(chat_client: AzureOpenAIChatClient) -> ChatAgent:  # noqa: D401
    """Return a configured Claim Assessor agent.

    Args:
        chat_client: An instantiated AzureOpenAIChatClient shared by the app.
    
    Returns:
        ChatAgent: Configured claim assessor agent.
    """
    return ChatAgent(
        chat_client=chat_client,
        name="claim_assessor",
        instructions=CLAIM_ASSESSOR_PROMPT,
        tools=[get_vehicle_details, analyze_image],
    )
