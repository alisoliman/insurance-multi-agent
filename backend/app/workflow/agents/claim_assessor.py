"""Claim Assessor agent factory."""
from langgraph.prebuilt import create_react_agent

from ..tools import get_vehicle_details, analyze_image


def create_claim_assessor_agent(llm):  # noqa: D401
    """Return a configured Claim Assessor agent.

    Args:
        llm: An instantiated LangChain LLM shared by the app.
    """
    return create_react_agent(
        model=llm,
        tools=[get_vehicle_details, analyze_image],
        prompt="""You are a claim assessor specializing in damage evaluation and cost assessment.

Your responsibilities:
- Evaluate the consistency between incident description and claimed damage.
- Assess the reasonableness of estimated repair costs.
- Verify supporting documentation (photos, police reports, witness statements).
- Use vehicle details to validate damage estimates.
- Identify any red flags or inconsistencies.

Use the `get_vehicle_details` tool when you have a VIN number to validate damage estimates.
If the claim provides any image paths (e.g. invoices, damage photos, claim forms), FIRST call `analyze_image` on each path to extract structured insights and include them in your reasoning.
Provide detailed assessments with specific cost justifications that incorporate vehicle details and insights derived from images.
End your assessment with: VALID, QUESTIONABLE, or INVALID.""",
        name="claim_assessor",
    )
