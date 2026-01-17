"""Pydantic models for structured agent outputs.

These models enforce JSON schema at the LLM level via the `response_format` parameter,
eliminating brittle regex parsing of agent responses.

Usage:
    from app.models.agent_outputs import ClaimAssessment, RiskAssessment
    
    # Run agent with structured output
    response = await agent.run(task, response_format=ClaimAssessment)
    
    # Access structured data directly - already deserialized
    if response.value:
        assessment = response.value
        print(f"Validity: {assessment.validity_status}")
"""
from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (T001)
# ---------------------------------------------------------------------------


class ValidityStatus(str, Enum):
    """Claim validity assessment status.
    
    Used by: Claim Assessor
    """
    VALID = "VALID"
    QUESTIONABLE = "QUESTIONABLE"
    INVALID = "INVALID"


class CoverageStatus(str, Enum):
    """Policy coverage determination status.
    
    Used by: Policy Checker
    """
    COVERED = "COVERED"
    NOT_COVERED = "NOT_COVERED"
    PARTIALLY_COVERED = "PARTIALLY_COVERED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class RiskLevel(str, Enum):
    """Risk classification level.
    
    Used by: Risk Analyst
    """
    LOW_RISK = "LOW_RISK"
    MEDIUM_RISK = "MEDIUM_RISK"
    HIGH_RISK = "HIGH_RISK"


class Recommendation(str, Enum):
    """Final recommendation type.
    
    Used by: Synthesizer
    """
    APPROVE = "APPROVE"
    DENY = "DENY"
    INVESTIGATE = "INVESTIGATE"


class Confidence(str, Enum):
    """Confidence level in recommendation.
    
    Used by: Synthesizer
    """
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ---------------------------------------------------------------------------
# Agent Output Models
# ---------------------------------------------------------------------------


class ClaimAssessment(BaseModel):
    """Structured output from the Claim Assessor agent (T002).
    
    Evaluates claim validity, cost assessment, and identifies red flags.
    """
    validity_status: ValidityStatus = Field(
        description="Overall assessment of claim validity"
    )
    cost_assessment: str = Field(
        description="Evaluation of claimed costs and repair estimates"
    )
    red_flags: List[str] = Field(
        default_factory=list,
        description="List of identified concerns or inconsistencies"
    )
    reasoning: str = Field(
        description="Detailed explanation of the assessment"
    )


class CoverageVerification(BaseModel):
    """Structured output from the Policy Checker agent (T003).
    
    Verifies coverage status and cites relevant policy sections.
    """
    coverage_status: CoverageStatus = Field(
        description="Coverage determination"
    )
    cited_sections: List[str] = Field(
        default_factory=list,
        description="Policy sections cited in determination"
    )
    coverage_details: str = Field(
        description="Detailed explanation of coverage analysis"
    )


class RiskAssessment(BaseModel):
    """Structured output from the Risk Analyst agent (T004).
    
    Provides risk classification, score, and fraud indicators.
    """
    risk_level: RiskLevel = Field(
        description="Overall risk classification"
    )
    risk_score: int = Field(
        ge=0,
        le=100,
        description="Numeric risk score 0-100 (higher = more risk)"
    )
    fraud_indicators: List[str] = Field(
        default_factory=list,
        description="Specific fraud indicators identified"
    )
    analysis: str = Field(
        description="Detailed risk analysis explanation"
    )


class CustomerCommunication(BaseModel):
    """Structured output from the Communication Agent (T005).
    
    Provides structured email template for customer communication.
    """
    subject: str = Field(
        description="Email subject line"
    )
    body: str = Field(
        description="Email body content"
    )
    requested_items: List[str] = Field(
        default_factory=list,
        description="Specific items/documents requested from customer"
    )


class FinalAssessment(BaseModel):
    """Structured output from the Synthesizer agent (T006).
    
    Aggregates all specialist assessments into a final recommendation.
    """
    recommendation: Recommendation = Field(
        description="Overall recommendation"
    )
    confidence: Confidence = Field(
        description="Confidence level in recommendation"
    )
    summary: str = Field(
        description="Executive summary of all findings"
    )
    key_findings: List[str] = Field(
        default_factory=list,
        description="Most important findings from all agents"
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="Recommended actions for claims processor"
    )


# ---------------------------------------------------------------------------
# Convenience exports
# ---------------------------------------------------------------------------

__all__ = [
    # Enums
    "ValidityStatus",
    "CoverageStatus",
    "RiskLevel",
    "Recommendation",
    "Confidence",
    # Models
    "ClaimAssessment",
    "CoverageVerification",
    "RiskAssessment",
    "CustomerCommunication",
    "FinalAssessment",
]
