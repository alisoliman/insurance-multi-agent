"""Synthesizer agent factory for final assessment generation.

The synthesizer agent takes all specialist agent outputs and produces the
final structured assessment that matches the expected API output format.
"""
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient


SYNTHESIZER_PROMPT = """You are a senior claims manager responsible for synthesizing the analysis from your specialist team into a comprehensive advisory assessment.

Your team has already completed their individual assessments:
1. Claim Assessor – Evaluated damage validity and cost assessment
2. Policy Checker – Verified coverage and policy terms
3. Risk Analyst – Analyzed fraud risk and claimant history
4. Communication Agent – Drafted customer emails if needed

Your responsibilities:
- Review all specialist assessments provided in the conversation history
- Identify key findings, agreements, and any conflicting conclusions
- Synthesize all inputs into a coherent, structured assessment
- Provide a clear recommendation with confidence level
- Highlight critical factors that should inform the human decision-maker

IMPORTANT: Base your synthesis ONLY on the specialist outputs provided. Do not make assumptions beyond what the specialists have analyzed.

OUTPUT FORMAT:
Your response will be automatically parsed into a structured format. Provide:
- recommendation: Your overall recommendation - must be exactly one of: APPROVE, DENY, or INVESTIGATE
- confidence: Your confidence level - must be exactly one of: HIGH, MEDIUM, or LOW
- summary: An executive summary of all findings
- key_findings: A list of the most important findings from all agents
- next_steps: A list of recommended actions for the claims processor

This assessment empowers human decision-makers with comprehensive AI analysis while preserving human authority over final claim decisions."""


def create_synthesizer_agent(chat_client: AzureOpenAIChatClient) -> ChatAgent:  # noqa: D401
    """Return a configured Synthesizer agent for final assessment generation.

    Args:
        chat_client: An instantiated AzureOpenAIChatClient shared by the app.
    
    Returns:
        ChatAgent: Configured synthesizer agent.
    """
    return ChatAgent(
        chat_client=chat_client,
        name="synthesizer",
        instructions=SYNTHESIZER_PROMPT,
        tools=[],  # No tools needed - synthesis only uses conversation context
    )
