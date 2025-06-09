"""
Enhanced Orchestrator Agent with LLM-Driven Complexity Assessment

This module provides an enhanced orchestrator that can use either rule-based
or LLM-driven complexity assessment, showcasing the evolution from traditional
rule-based systems to modern AI-driven decision making.
"""

import asyncio
from typing import Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass
import logging

from .base import BaseInsuranceAgent
from .llm_complexity_assessor import LLMComplexityAssessor, ComplexityAssessment
from .orchestrator import (
    OrchestratorAgent,
    ClaimComplexity,
    WorkflowStage,
    ClaimWorkflowState,
    AgentDecision,
)


class AssessmentMode(Enum):
    """Assessment mode options."""

    RULE_BASED = "rule_based"
    LLM_DRIVEN = "llm_driven"
    HYBRID = "hybrid"


@dataclass
class EnhancedComplexityResult:
    """Enhanced complexity assessment result with comparison data."""

    final_complexity: ClaimComplexity
    confidence_score: float
    reasoning: str
    assessment_mode: AssessmentMode
    rule_based_result: Optional[ClaimComplexity] = None
    llm_result: Optional[ComplexityAssessment] = None
    comparison_notes: Optional[str] = None


class EnhancedOrchestratorAgent(OrchestratorAgent):
    """
    Enhanced orchestrator agent that supports both rule-based and LLM-driven
    complexity assessment approaches.
    """

    def __init__(self, default_mode: AssessmentMode = AssessmentMode.LLM_DRIVEN):
        """
        Initialize the enhanced orchestrator.

        Args:
            default_mode: Default assessment mode to use
        """
        super().__init__()
        self.default_mode = default_mode
        self.llm_assessor = LLMComplexityAssessor()
        self.logger = logging.getLogger(__name__)

    async def assess_claim_complexity_enhanced(
        self, claim_data: Dict[str, Any], mode: Optional[AssessmentMode] = None
    ) -> EnhancedComplexityResult:
        """
        Assess claim complexity using the specified mode.

        Args:
            claim_data: Dictionary containing claim information
            mode: Assessment mode to use (defaults to instance default)

        Returns:
            EnhancedComplexityResult with detailed assessment information
        """

        assessment_mode = mode or self.default_mode

        if assessment_mode == AssessmentMode.RULE_BASED:
            return await self._rule_based_assessment(claim_data)
        elif assessment_mode == AssessmentMode.LLM_DRIVEN:
            return await self._llm_driven_assessment(claim_data)
        elif assessment_mode == AssessmentMode.HYBRID:
            return await self._hybrid_assessment(claim_data)
        else:
            raise ValueError(f"Unknown assessment mode: {assessment_mode}")

    async def _rule_based_assessment(
        self, claim_data: Dict[str, Any]
    ) -> EnhancedComplexityResult:
        """Perform rule-based complexity assessment."""

        rule_result = self.assess_claim_complexity(claim_data)

        return EnhancedComplexityResult(
            final_complexity=rule_result,
            confidence_score=0.7,  # Fixed confidence for rule-based
            reasoning="Assessment based on predefined rules: amount thresholds, keyword matching, and documentation requirements.",
            assessment_mode=AssessmentMode.RULE_BASED,
            rule_based_result=rule_result,
        )

    async def _llm_driven_assessment(
        self, claim_data: Dict[str, Any]
    ) -> EnhancedComplexityResult:
        """Perform LLM-driven complexity assessment."""

        try:
            llm_result = await self.llm_assessor.assess_claim_complexity(claim_data)

            return EnhancedComplexityResult(
                final_complexity=llm_result.complexity,
                confidence_score=llm_result.confidence_score,
                reasoning=llm_result.reasoning,
                assessment_mode=AssessmentMode.LLM_DRIVEN,
                llm_result=llm_result,
            )

        except Exception as e:
            self.logger.error(f"LLM assessment failed: {str(e)}")
            # Return error instead of fallback
            raise Exception(f"LLM complexity assessment failed: {str(e)}")

    async def _hybrid_assessment(
        self, claim_data: Dict[str, Any]
    ) -> EnhancedComplexityResult:
        """Perform hybrid assessment using both approaches."""

        # Get both assessments
        rule_result = self.assess_claim_complexity(claim_data)

        try:
            llm_result = await self.llm_assessor.assess_claim_complexity(claim_data)

            # Compare results and determine final assessment
            final_complexity, comparison_notes = self._reconcile_assessments(
                rule_result, llm_result
            )

            return EnhancedComplexityResult(
                final_complexity=final_complexity,
                confidence_score=llm_result.confidence_score,
                reasoning=f"Hybrid assessment: {llm_result.reasoning}",
                assessment_mode=AssessmentMode.HYBRID,
                rule_based_result=rule_result,
                llm_result=llm_result,
                comparison_notes=comparison_notes,
            )

        except Exception as e:
            self.logger.error(f"LLM assessment failed in hybrid mode: {str(e)}")
            # Return error instead of fallback
            raise Exception(f"Hybrid complexity assessment failed: {str(e)}")

    def _reconcile_assessments(
        self, rule_result: ClaimComplexity, llm_result: ComplexityAssessment
    ) -> tuple[ClaimComplexity, str]:
        """
        Reconcile differences between rule-based and LLM assessments.

        Args:
            rule_result: Result from rule-based assessment
            llm_result: Result from LLM assessment

        Returns:
            Tuple of (final_complexity, comparison_notes)
        """

        if rule_result == llm_result.complexity:
            return rule_result, "Both assessments agree"

        # Handle disagreements
        rule_score = self._complexity_to_score(rule_result)
        llm_score = self._complexity_to_score(llm_result.complexity)

        # If LLM has high confidence and disagrees, prefer LLM
        if llm_result.confidence_score > 0.8:
            return (
                llm_result.complexity,
                f"LLM assessment preferred (high confidence: {llm_result.confidence_score:.1%})",
            )

        # If assessments are close, prefer the more conservative (higher complexity)
        if abs(rule_score - llm_score) <= 1:
            final = rule_result if rule_score > llm_score else llm_result.complexity
            return final, "Conservative assessment chosen due to close results"

        # For significant disagreements with lower LLM confidence, use rule-based
        return (
            rule_result,
            f"Rule-based preferred due to significant disagreement and lower LLM confidence ({llm_result.confidence_score:.1%})",
        )

    def _complexity_to_score(self, complexity: ClaimComplexity) -> int:
        """Convert complexity enum to numeric score for comparison."""
        mapping = {
            ClaimComplexity.LOW: 1,
            ClaimComplexity.MEDIUM: 2,
            ClaimComplexity.HIGH: 3,
        }
        return mapping[complexity]

    async def process_claim_workflow_enhanced(
        self,
        claim_data: Dict[str, Any],
        assessment_mode: Optional[AssessmentMode] = None,
    ) -> Dict[str, Any]:
        """
        Process a claim workflow using enhanced complexity assessment.

        Args:
            claim_data: Dictionary containing claim information
            assessment_mode: Assessment mode to use

        Returns:
            Dictionary containing workflow results with enhanced assessment data
        """

        # Enhanced complexity assessment
        complexity_result = await self.assess_claim_complexity_enhanced(
            claim_data, assessment_mode
        )

        # Use the existing workflow processing with the final complexity
        workflow_state = ClaimWorkflowState(
            claim_id=claim_data.get("claim_id", "unknown"),
            stage=WorkflowStage.INTAKE,
            complexity=complexity_result.final_complexity,
            agent_decisions=[],
            escalated=False,
            completed=False,
        )

        # Process the workflow using parent class method
        result = await self.process_claim_workflow(claim_data)

        # Enhance the result with assessment details
        result["enhanced_assessment"] = {
            "mode": complexity_result.assessment_mode.value,
            "final_complexity": complexity_result.final_complexity.value,
            "confidence_score": complexity_result.confidence_score,
            "reasoning": complexity_result.reasoning,
            "rule_based_result": complexity_result.rule_based_result.value
            if complexity_result.rule_based_result
            else None,
            "llm_assessment": {
                "complexity": complexity_result.llm_result.complexity.value
                if complexity_result.llm_result
                else None,
                "risk_factors": complexity_result.llm_result.risk_factors
                if complexity_result.llm_result
                else None,
                "estimated_processing_time": complexity_result.llm_result.estimated_processing_time
                if complexity_result.llm_result
                else None,
                "required_expertise": complexity_result.llm_result.required_expertise
                if complexity_result.llm_result
                else None,
            }
            if complexity_result.llm_result
            else None,
            "comparison_notes": complexity_result.comparison_notes,
        }

        return result

    async def get_assessment_comparison(
        self, claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get a detailed comparison of all assessment approaches for a claim.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            Dictionary with comparison results
        """

        # Get all three assessments
        rule_result = await self._rule_based_assessment(claim_data)
        llm_result = await self._llm_driven_assessment(claim_data)
        hybrid_result = await self._hybrid_assessment(claim_data)

        return {
            "claim_id": claim_data.get("claim_id", "unknown"),
            "assessments": {
                "rule_based": {
                    "complexity": rule_result.final_complexity.value,
                    "confidence": rule_result.confidence_score,
                    "reasoning": rule_result.reasoning,
                },
                "llm_driven": {
                    "complexity": llm_result.final_complexity.value,
                    "confidence": llm_result.confidence_score,
                    "reasoning": llm_result.reasoning[:200] + "..."
                    if len(llm_result.reasoning) > 200
                    else llm_result.reasoning,
                    "risk_factors": llm_result.llm_result.risk_factors
                    if llm_result.llm_result
                    else [],
                    "escalation_recommended": llm_result.llm_result.escalation_recommended
                    if llm_result.llm_result
                    else False,
                },
                "hybrid": {
                    "complexity": hybrid_result.final_complexity.value,
                    "confidence": hybrid_result.confidence_score,
                    "reasoning": hybrid_result.reasoning,
                    "comparison_notes": hybrid_result.comparison_notes,
                },
            },
            "agreement": {
                "rule_vs_llm": rule_result.final_complexity
                == llm_result.final_complexity,
                "rule_vs_hybrid": rule_result.final_complexity
                == hybrid_result.final_complexity,
                "llm_vs_hybrid": llm_result.final_complexity
                == hybrid_result.final_complexity,
                "all_agree": (
                    rule_result.final_complexity
                    == llm_result.final_complexity
                    == hybrid_result.final_complexity
                ),
            },
        }
