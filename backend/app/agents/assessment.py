"""
Enhanced Assessment Agent for insurance claim analysis and decision-making.

This module implements a sophisticated Assessment Agent that leverages LLM capabilities
for nuanced claim analysis while maintaining production reliability through fallback
mechanisms and structured decision-making.
"""

import asyncio
import json
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict

# AutoGen imports
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinGroupChat
    from autogen_agentchat.conditions import MaxMessageTermination

    AUTOGEN_AVAILABLE = True
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    AUTOGEN_IMPORT_ERROR = str(e)

from app.agents.base import BaseInsuranceAgent
from app.core.config import settings


class AssessmentDecision(Enum):
    """Enumeration of assessment decisions."""

    APPROVE = "approve"
    REJECT = "reject"
    HUMAN_REVIEW = "human_review"
    INVESTIGATE = "investigate"


class ConfidenceLevel(Enum):
    """Enumeration of confidence levels."""

    VERY_HIGH = "very_high"  # 0.9-1.0
    HIGH = "high"  # 0.8-0.89
    MEDIUM = "medium"  # 0.7-0.79
    LOW = "low"  # 0.6-0.69
    VERY_LOW = "very_low"  # <0.6


@dataclass
class RiskFactor:
    """Structure for risk factor identification."""

    factor_type: str
    severity: str  # low, medium, high
    description: str
    confidence: float


@dataclass
class AssessmentResult:
    """Comprehensive assessment result structure."""

    decision: AssessmentDecision
    confidence_score: float
    confidence_level: ConfidenceLevel
    reasoning: str
    risk_factors: List[RiskFactor]
    policy_coverage_analysis: Dict[str, Any]
    fraud_risk_score: float
    documentation_completeness: float
    regulatory_compliance: Dict[str, Any]
    recommended_actions: List[str]
    processing_time_seconds: float
    assessment_id: str
    timestamp: datetime

    def __post_init__(self):
        if not hasattr(self, "assessment_id") or self.assessment_id is None:
            self.assessment_id = str(uuid.uuid4())
        if not hasattr(self, "timestamp") or self.timestamp is None:
            self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["decision"] = self.decision.value
        data["confidence_level"] = self.confidence_level.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


class EnhancedAssessmentAgent(BaseInsuranceAgent):
    """
    Enhanced Assessment Agent with LLM-driven decision making.

    This agent provides sophisticated claim analysis using Azure OpenAI GPT-4o
    with structured output, comprehensive risk assessment, and fallback mechanisms
    for production reliability.
    """

    def __init__(self):
        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        system_message = """You are an expert insurance claim assessment agent with deep knowledge of:

        1. Insurance policy coverage analysis
        2. Fraud detection and risk assessment
        3. Regulatory compliance requirements
        4. Documentation evaluation
        5. Incident plausibility assessment

        Your responsibilities:
        - Analyze claims with nuanced understanding of context and circumstances
        - Provide structured decisions with clear reasoning
        - Identify risk factors and fraud indicators
        - Assess policy coverage and compliance requirements
        - Generate confidence scores based on available evidence
        - Recommend appropriate actions for each claim

        Decision Framework:
        - APPROVE: Valid claims with high confidence and low risk
        - REJECT: Invalid claims or clear policy violations
        - HUMAN_REVIEW: Complex cases requiring human expertise
        - INVESTIGATE: Claims needing additional information or investigation

        Always provide detailed reasoning, identify specific risk factors, and ensure decisions are explainable and auditable for regulatory compliance."""

        super().__init__(
            name="enhanced_assessment_agent", system_message=system_message
        )

        # Assessment thresholds
        self.confidence_thresholds = {
            "auto_approve": 0.8,
            "human_review": 0.7,
            "auto_reject": 0.9,  # High confidence required for auto-rejection
        }

        # Risk scoring weights
        self.risk_weights = {
            "fraud_indicators": 0.3,
            "documentation_quality": 0.2,
            "policy_compliance": 0.25,
            "incident_plausibility": 0.15,
            "regulatory_factors": 0.1,
        }

    async def assess_claim(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]] = None
    ) -> AssessmentResult:
        """
        Perform comprehensive claim assessment using LLM-driven analysis.

        Args:
            claim_data: Dictionary containing claim information
            policy_data: Optional policy information for coverage verification

        Returns:
            AssessmentResult with detailed analysis and decision
        """
        start_time = datetime.now()

        try:
            # Validate input data
            validation_result = self._validate_claim_data(claim_data)
            if not validation_result["valid"]:
                return self._create_error_result(validation_result["error"], start_time)

            # Perform LLM-driven assessment
            llm_result = await self._perform_llm_assessment(claim_data, policy_data)

            # Apply business rules and validation
            final_result = self._apply_business_rules(llm_result, claim_data)

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            final_result.processing_time_seconds = processing_time

            return final_result

        except Exception as e:
            # Return error instead of fallback
            return self._create_error_result(str(e), start_time)

    async def _perform_llm_assessment(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform LLM-driven claim assessment with structured output."""

        # Prepare comprehensive prompt
        assessment_prompt = self._build_assessment_prompt(
            claim_data, policy_data)

        try:
            # Use AutoGen agent for structured assessment
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2),
            )

            result = await team.run(task=assessment_prompt)

            if result.messages and len(result.messages) > 0:
                response_content = result.messages[-1].content
                return self._parse_llm_response(response_content)
            else:
                raise Exception("No response from LLM")

        except Exception as e:
            raise Exception(f"LLM assessment failed: {str(e)}")

    def _build_assessment_prompt(
        self, claim_data: Dict[str, Any], policy_data: Optional[Dict[str, Any]]
    ) -> str:
        """Build comprehensive assessment prompt for LLM."""

        prompt = f"""
            Analyze this insurance claim and provide a structured assessment:

            CLAIM INFORMATION:
            - Claim ID: {claim_data.get("claim_id", "Not provided")}
            - Policy Number: {claim_data.get("policy_number", "Not provided")}
            - Incident Date: {claim_data.get("incident_date", "Not provided")}
            - Reported Date: {claim_data.get("reported_date", "Not provided")}
            - Description: {claim_data.get("description", "Not provided")}
            - Estimated Amount: {claim_data.get("amount", "Not provided")}
            - Location: {claim_data.get("location", "Not provided")}
            - Claimant: {claim_data.get("claimant_name", "Not provided")}

            DOCUMENTATION PROVIDED:
            - Incident Report: {"Yes" if claim_data.get("incident_report") else "No"}
            - Photos: {"Yes" if claim_data.get("photos") else "No"}
            - Police Report: {"Yes" if claim_data.get("police_report") else "No"}
            - Medical Records: {"Yes" if claim_data.get("medical_records") else "No"}
            - Repair Estimates: {"Yes" if claim_data.get("repair_estimates") else "No"}

            POLICY INFORMATION:
            {self._format_policy_data(policy_data) if policy_data else "Policy data not provided"}

            ASSESSMENT REQUIREMENTS:
            Provide your analysis in the following JSON format:

            {{
                "decision": "approve|reject|human_review|investigate",
                "confidence_score": 0.0-1.0,
                "reasoning": "Detailed explanation of your decision",
                "risk_factors": [
                    {{
                        "factor_type": "fraud|documentation|policy|regulatory|other",
                        "severity": "low|medium|high",
                        "description": "Specific risk description",
                        "confidence": 0.0-1.0
                    }}
                ],
                "policy_coverage_analysis": {{
                    "covered": true|false,
                    "coverage_type": "comprehensive|collision|liability|other",
                    "policy_limits": "analysis of limits",
                    "deductible_applicable": true|false,
                    "exclusions_apply": true|false,
                    "exclusion_details": "if applicable"
                }},
                "fraud_risk_score": 0.0-1.0,
                "documentation_completeness": 0.0-1.0,
                "regulatory_compliance": {{
                    "compliant": true|false,
                    "requirements": ["list of requirements"],
                    "missing_items": ["list of missing items"]
                }},
                "recommended_actions": ["list of recommended next steps"]
            }}

            ANALYSIS FOCUS AREAS:
            1. Policy Coverage: Does the incident fall under policy coverage?
            2. Incident Plausibility: Is the described incident reasonable and consistent?
            3. Documentation Quality: Are required documents present and authentic?
            4. Fraud Indicators: Any suspicious patterns or inconsistencies?
            5. Regulatory Compliance: Does the claim meet regulatory requirements?
            6. Timeline Analysis: Are reporting timelines appropriate?
            7. Amount Reasonableness: Is the claimed amount consistent with described damage?

            Provide thorough analysis with specific reasoning for your decision.
        """
        return prompt

    def _format_policy_data(self, policy_data: Dict[str, Any]) -> str:
        """Format policy data for prompt inclusion."""
        if not policy_data:
            return "No policy data provided"

        return f"""
            - Policy Type: {policy_data.get("policy_type", "Not specified")}
            - Coverage Limits: {policy_data.get("coverage_limits", "Not specified")}
            - Deductible: {policy_data.get("deductible", "Not specified")}
            - Policy Status: {policy_data.get("status", "Not specified")}
            - Effective Date: {policy_data.get("effective_date", "Not specified")}
            - Expiration Date: {policy_data.get("expiration_date", "Not specified")}
        """

    def _parse_llm_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response and extract structured data."""
        try:
            # Try to extract JSON from the response
            start_idx = response_content.find("{")
            end_idx = response_content.rfind("}") + 1

            if start_idx != -1 and end_idx != -1:
                json_str = response_content[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback: create structured response from text
                return self._extract_structured_data_from_text(response_content)

        except json.JSONDecodeError:
            # Fallback to text parsing
            return self._extract_structured_data_from_text(response_content)

    def _extract_structured_data_from_text(self, text: str) -> Dict[str, Any]:
        """Extract structured data from unstructured text response."""
        # Basic text parsing fallback
        text_lower = text.lower()

        # Determine decision
        if "approve" in text_lower and "reject" not in text_lower:
            decision = "approve"
        elif "reject" in text_lower:
            decision = "reject"
        elif "human review" in text_lower or "escalate" in text_lower:
            decision = "human_review"
        else:
            decision = "investigate"

        # Extract confidence (basic pattern matching)
        confidence = 0.5  # Default
        if "high confidence" in text_lower:
            confidence = 0.85
        elif "low confidence" in text_lower:
            confidence = 0.6
        elif "medium confidence" in text_lower:
            confidence = 0.75

        return {
            "decision": decision,
            "confidence_score": confidence,
            "reasoning": text,
            "risk_factors": [],
            "policy_coverage_analysis": {"covered": True},
            "fraud_risk_score": 0.3,
            "documentation_completeness": 0.7,
            "regulatory_compliance": {
                "compliant": True,
                "requirements": [],
                "missing_items": [],
            },
            "recommended_actions": [
                "Review assessment",
                "Proceed with standard processing",
            ],
        }

    def _apply_business_rules(
        self, llm_result: Dict[str, Any], claim_data: Dict[str, Any]
    ) -> AssessmentResult:
        """Apply business rules and create final assessment result."""

        # Extract LLM results
        decision_str = llm_result.get("decision", "investigate").lower()
        confidence_score = float(llm_result.get("confidence_score", 0.5))

        # Map decision string to enum
        decision_mapping = {
            "approve": AssessmentDecision.APPROVE,
            "reject": AssessmentDecision.REJECT,
            "human_review": AssessmentDecision.HUMAN_REVIEW,
            "investigate": AssessmentDecision.INVESTIGATE,
        }
        decision = decision_mapping.get(
            decision_str, AssessmentDecision.INVESTIGATE)

        # Apply confidence-based overrides
        if confidence_score < self.confidence_thresholds["human_review"]:
            decision = AssessmentDecision.HUMAN_REVIEW

        # High-value claims require human review
        amount = self._parse_amount(claim_data.get("amount", 0))
        if amount > 50000:
            decision = AssessmentDecision.HUMAN_REVIEW

        # Determine confidence level
        confidence_level = self._determine_confidence_level(confidence_score)

        # Parse risk factors
        risk_factors = []
        for rf_data in llm_result.get("risk_factors", []):
            risk_factors.append(
                RiskFactor(
                    factor_type=rf_data.get("factor_type", "other"),
                    severity=rf_data.get("severity", "medium"),
                    description=rf_data.get(
                        "description", "Risk factor identified"),
                    confidence=float(rf_data.get("confidence", 0.5)),
                )
            )

        # Build recommended actions
        recommended_actions = llm_result.get("recommended_actions", [])
        if decision == AssessmentDecision.HUMAN_REVIEW:
            recommended_actions.append("Escalate to human reviewer")
        elif decision == AssessmentDecision.INVESTIGATE:
            recommended_actions.append("Initiate investigation process")

        return AssessmentResult(
            decision=decision,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            reasoning=llm_result.get("reasoning", "Assessment completed"),
            risk_factors=risk_factors,
            policy_coverage_analysis=llm_result.get(
                "policy_coverage_analysis", {}),
            fraud_risk_score=float(llm_result.get("fraud_risk_score", 0.3)),
            documentation_completeness=float(
                llm_result.get("documentation_completeness", 0.7)
            ),
            regulatory_compliance=llm_result.get("regulatory_compliance", {}),
            recommended_actions=recommended_actions,
            processing_time_seconds=0.0,  # Will be set by caller
            assessment_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
        )

    def _determine_confidence_level(self, confidence_score: float) -> ConfidenceLevel:
        """Determine confidence level from score."""
        if confidence_score >= 0.9:
            return ConfidenceLevel.VERY_HIGH
        elif confidence_score >= 0.8:
            return ConfidenceLevel.HIGH
        elif confidence_score >= 0.7:
            return ConfidenceLevel.MEDIUM
        elif confidence_score >= 0.6:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW

    def _validate_claim_data(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate claim data completeness and format."""
        required_fields = ["policy_number", "incident_date", "description"]
        missing_fields = [
            field for field in required_fields if not claim_data.get(field)
        ]

        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}",
            }

        # Validate amount format if provided
        if "amount" in claim_data and claim_data["amount"] is not None:
            try:
                self._parse_amount(claim_data["amount"])
            except (ValueError, TypeError):
                return {
                    "valid": False,
                    "error": f"Invalid amount format: {claim_data['amount']}",
                }

        return {"valid": True}

    def _parse_amount(self, amount: Union[str, int, float]) -> float:
        """Parse amount from various formats."""
        if isinstance(amount, (int, float)):
            return float(amount)
        elif isinstance(amount, str):
            try:
                return float(amount.replace("$", "").replace(",", ""))
            except ValueError:
                raise ValueError(f"Cannot parse amount: {amount}")
        else:
            raise TypeError(f"Invalid amount type: {type(amount)}")

    def _create_error_result(
        self, error_message: str, start_time: datetime
    ) -> AssessmentResult:
        """Create error assessment result."""
        processing_time = (datetime.now() - start_time).total_seconds()

        return AssessmentResult(
            decision=AssessmentDecision.HUMAN_REVIEW,
            confidence_score=0.0,
            confidence_level=ConfidenceLevel.VERY_LOW,
            reasoning=f"Assessment failed due to error: {error_message}",
            risk_factors=[
                RiskFactor(
                    factor_type="other",
                    severity="high",
                    description=f"Assessment error: {error_message}",
                    confidence=1.0,
                )
            ],
            policy_coverage_analysis={"error": error_message},
            fraud_risk_score=0.0,
            documentation_completeness=0.0,
            regulatory_compliance={
                "compliant": False,
                "requirements": [],
                "missing_items": [],
            },
            recommended_actions=[
                "Manual review required due to assessment error"],
            processing_time_seconds=processing_time,
            assessment_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
        )

    async def assess_claim_validity(
        self, claim_data: Dict[str, Any], policy_terms: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Legacy compatibility method for existing orchestrator integration.

        This method maintains compatibility with the existing ClaimAssessmentAgent
        interface while providing enhanced functionality.
        """
        try:
            result = await self.assess_claim(claim_data, policy_terms)

            # Convert to legacy format
            return {
                "decision": result.decision.value,
                "confidence_score": result.confidence_score,
                "reasoning": result.reasoning,
                "assessment_id": result.assessment_id,
                "risk_factors": [rf.description for rf in result.risk_factors],
                "fraud_risk_score": result.fraud_risk_score,
                "documentation_completeness": result.documentation_completeness,
                "recommended_actions": result.recommended_actions,
                "processing_time": result.processing_time_seconds,
                "enhanced_assessment": True,
            }

        except Exception as e:
            return {
                "decision": "human_review",
                "confidence_score": 0.0,
                "reasoning": f"Assessment failed: {str(e)}",
                "error": str(e),
                "enhanced_assessment": False,
            }

    def get_assessment_capabilities(self) -> Dict[str, Any]:
        """Get information about assessment capabilities."""
        return {
            "agent_type": "enhanced_assessment_agent",
            "llm_driven": True,
            "decision_types": [d.value for d in AssessmentDecision],
            "confidence_levels": [c.value for c in ConfidenceLevel],
            "assessment_factors": [
                "policy_coverage",
                "incident_plausibility",
                "documentation_quality",
                "fraud_risk",
                "regulatory_compliance",
            ],
            "fallback_available": False,
            "structured_output": True,
            "risk_assessment": True,
        }
