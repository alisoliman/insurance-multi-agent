"""
LLM-Driven Complexity Assessment Module

This module replaces rule-based complexity assessment with modern LLM reasoning
capabilities, providing contextual analysis and explainable decisions.
"""

import json
from typing import Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass
from openai import AsyncAzureOpenAI
from app.core.config import settings

# Import ClaimComplexity from orchestrator to maintain consistency
from .orchestrator import ClaimComplexity


@dataclass
class ComplexityAssessment:
    """Structured complexity assessment result."""

    complexity: ClaimComplexity
    confidence_score: float  # 0.0 to 1.0
    reasoning: str
    risk_factors: list[str]
    escalation_recommended: bool
    estimated_processing_time: str
    required_expertise: list[str]


class LLMComplexityAssessor:
    """
    LLM-driven complexity assessor that provides contextual analysis
    and reasoning-based decisions for insurance claims using Azure OpenAI.
    """

    def __init__(self):
        """Initialize the LLM complexity assessor with Azure OpenAI."""
        # Validate Azure OpenAI configuration
        if (
            not settings.AZURE_OPENAI_ENDPOINT
            or not settings.AZURE_OPENAI_DEPLOYMENT_NAME
            or not settings.AZURE_OPENAI_API_KEY
        ):
            raise ValueError(
                "Azure OpenAI configuration missing. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, and AZURE_OPENAI_API_KEY"
            )

        self.client = AsyncAzureOpenAI(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION or "2024-06-01",
        )
        self.model = settings.AZURE_OPENAI_DEPLOYMENT_NAME

    async def assess_claim_complexity(
        self, claim_data: Dict[str, Any]
    ) -> ComplexityAssessment:
        """
        Assess claim complexity using LLM reasoning with Azure OpenAI.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            ComplexityAssessment with detailed analysis and reasoning
        """

        # Prepare the assessment prompt
        prompt = self._build_assessment_prompt(claim_data)

        # Define the expected JSON schema for structured output
        response_schema = {
            "type": "object",
            "properties": {
                "complexity": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Overall complexity level of the claim",
                },
                "confidence_score": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Confidence in the assessment (0.0 to 1.0)",
                },
                "reasoning": {
                    "type": "string",
                    "description": "Detailed explanation of the complexity assessment",
                },
                "risk_factors": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of identified risk factors",
                },
                "escalation_recommended": {
                    "type": "boolean",
                    "description": "Whether human escalation is recommended",
                },
                "estimated_processing_time": {
                    "type": "string",
                    "description": "Estimated time to process this claim",
                },
                "required_expertise": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Types of expertise needed for this claim",
                },
            },
            "required": [
                "complexity",
                "confidence_score",
                "reasoning",
                "risk_factors",
                "escalation_recommended",
                "estimated_processing_time",
                "required_expertise",
            ],
        }

        try:
            # Make the Azure OpenAI call with structured output
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert insurance claims complexity assessor. Analyze claims thoroughly and provide structured assessments with clear reasoning.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "complexity_assessment",
                        "schema": response_schema,
                    },
                },
                temperature=0.1,  # Low temperature for consistent assessments
            )

            # Parse the structured response
            assessment_data = json.loads(response.choices[0].message.content)

            return ComplexityAssessment(
                complexity=ClaimComplexity(assessment_data["complexity"]),
                confidence_score=assessment_data["confidence_score"],
                reasoning=assessment_data["reasoning"],
                risk_factors=assessment_data["risk_factors"],
                escalation_recommended=assessment_data["escalation_recommended"],
                estimated_processing_time=assessment_data["estimated_processing_time"],
                required_expertise=assessment_data["required_expertise"],
            )

        except Exception as e:
            # Return error instead of fallback
            raise Exception(f"LLM complexity assessment failed: {str(e)}")

    def _build_assessment_prompt(self, claim_data: Dict[str, Any]) -> str:
        """
        Build a comprehensive prompt for LLM complexity assessment.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            Formatted prompt string
        """

        # Extract key information
        amount = claim_data.get("amount", "Not specified")
        description = claim_data.get("description", "No description provided")
        incident_date = claim_data.get("incident_date", "Not specified")
        policy_number = claim_data.get("policy_number", "Not specified")

        # Check for available documentation
        docs_available = []
        if claim_data.get("incident_report"):
            docs_available.append("incident report")
        if claim_data.get("photos"):
            docs_available.append("photos")
        if claim_data.get("police_report"):
            docs_available.append("police report")

        docs_status = (
            f"Available: {', '.join(docs_available)}"
            if docs_available
            else "No documentation provided"
        )

        prompt = f"""
Please assess the complexity of this insurance claim based on all available information:

**CLAIM DETAILS:**
- Policy Number: {policy_number}
- Incident Date: {incident_date}
- Claim Amount: {amount}
- Description: {description}
- Documentation: {docs_status}

**ASSESSMENT CRITERIA:**
Consider these factors in your analysis:

1. **Financial Impact**: 
   - Claim amount and potential total exposure
   - Cost of investigation vs. claim value

2. **Narrative Complexity**:
   - Clarity and consistency of the incident description
   - Presence of multiple parties or vehicles
   - Unusual circumstances or contributing factors

3. **Documentation Quality**:
   - Availability and completeness of supporting documents
   - Need for additional investigation or expert assessment

4. **Risk Indicators**:
   - Potential for fraud or misrepresentation
   - Legal complexity or liability disputes
   - Medical or technical expertise requirements

5. **Processing Requirements**:
   - Specialized knowledge or skills needed
   - Estimated investigation time and resources
   - Likelihood of disputes or appeals

**COMPLEXITY LEVELS:**
- **LOW**: Straightforward claims with clear liability, adequate documentation, and minimal investigation needs
- **MEDIUM**: Claims requiring moderate investigation, some specialized knowledge, or additional documentation
- **HIGH**: Complex claims requiring extensive investigation, expert analysis, legal review, or significant resources

**ESCALATION TRIGGERS:**
Recommend escalation for:
- High-value claims (typically >$50,000)
- Potential fraud indicators
- Legal complexity or liability disputes
- Medical claims requiring expert review
- Claims with insufficient documentation for automated processing

Please provide a thorough analysis with specific reasoning for your assessment.
"""

        return prompt

    async def explain_decision(
        self, claim_data: Dict[str, Any], assessment: ComplexityAssessment
    ) -> str:
        """
        Generate a detailed explanation of the complexity decision for transparency.

        Args:
            claim_data: Original claim data
            assessment: The complexity assessment result

        Returns:
            Detailed explanation string
        """

        explanation = f"""
**COMPLEXITY ASSESSMENT EXPLANATION**

**Decision**: {assessment.complexity.value.upper()} complexity
**Confidence**: {assessment.confidence_score:.1%}

**Reasoning**: {assessment.reasoning}

**Risk Factors Identified**:
{chr(10).join(f"• {factor}" for factor in assessment.risk_factors)}

**Required Expertise**:
{chr(10).join(f"• {expertise}" for expertise in assessment.required_expertise)}

**Estimated Processing Time**: {assessment.estimated_processing_time}

**Escalation Recommended**: {"Yes" if assessment.escalation_recommended else "No"}
"""

        return explanation
