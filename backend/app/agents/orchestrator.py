"""
Orchestrator Agent for coordinating multi-agent insurance claim processing workflows.

This module implements the central orchestrator that manages the workflow between
specialized agents (Assessment, Communication, etc.) using AutoGen's GraphFlow
for structured claim processing.
"""

import uuid
import logging
from datetime import datetime
from enum import Enum
from typing import Any

from dataclasses import dataclass, asdict

# AutoGen imports
try:
    from autogen_agentchat.teams import GraphFlow, DiGraphBuilder

    AUTOGEN_AVAILABLE = True
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    AUTOGEN_IMPORT_ERROR = str(e)

from app.agents.base import (
    BaseInsuranceAgent,
    ClaimAssessmentAgent,
    CustomerCommunicationAgent,
)
from app.agents.assessment import EnhancedAssessmentAgent
from app.agents.llm_complexity_assessor import LLMComplexityAssessor, ComplexityAssessment
from app.utils.validation import parse_amount

# Import enums from shared module to avoid circular imports
from app.agents.enums import ClaimComplexity, WorkflowStage


class AssessmentMode(Enum):
    """Assessment mode options for complexity assessment."""

    RULE_BASED = "rule_based"
    LLM_DRIVEN = "llm_driven"
    HYBRID = "hybrid"


@dataclass
class ClaimWorkflowState:
    """State tracking for claim workflow processing."""

    claim_id: str
    current_stage: WorkflowStage
    complexity: ClaimComplexity
    started_at: datetime
    updated_at: datetime
    agent_decisions: list[dict[str, Any]]
    requires_human_review: bool = False
    error_message: str | None = None
    workflow_id: str = None
    has_images: bool = False  # New field to track if workflow includes images
    # Store image analysis results
    image_analysis_result: dict[str, Any] | None = None

    def __post_init__(self) -> None:
        if self.workflow_id is None:
            self.workflow_id = str(uuid.uuid4())

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["current_stage"] = self.current_stage.value
        data["complexity"] = self.complexity.value
        data["started_at"] = self.started_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data


@dataclass
class EnhancedComplexityResult:
    """Enhanced complexity assessment result with comparison data."""

    final_complexity: ClaimComplexity
    confidence_score: float
    reasoning: str
    assessment_mode: AssessmentMode
    rule_based_result: ClaimComplexity | None = None
    llm_result: ComplexityAssessment | None = None
    comparison_notes: str | None = None


@dataclass
class AgentDecision:
    """Structure for storing agent decisions."""

    agent_name: str
    decision: str
    confidence_score: float
    reasoning: str
    timestamp: datetime
    metadata: dict[str, Any] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data


class OrchestratorAgent(BaseInsuranceAgent):
    """
    Orchestrator Agent that coordinates workflow between specialized agents.

    This agent manages the overall claim processing workflow using AutoGen's
    GraphFlow capabilities, coordinating between Assessment, Communication,
    and other specialized agents. Now supports image processing workflows.
    """

    def __init__(self) -> None:
        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        system_message = """You are the Orchestrator Agent for an insurance claims processing system.

Your responsibilities:
1. Coordinate workflow between specialized agents (Assessment, Communication, etc.)
2. Route claims based on complexity and risk assessment
3. Manage handoffs between agents and ensure proper workflow execution
4. Handle image processing workflows for claims with supporting documents
5. Identify when human intervention is required
6. Maintain workflow state and provide status updates
7. Ensure all decisions are explainable and auditable

You should:
- Analyze claim data to determine processing complexity
- Route claims through appropriate workflow paths (with or without image processing)
- Coordinate agent handoffs with clear instructions
- Process image analysis results and integrate them into assessments
- Escalate to human review when necessary
- Provide clear status updates and reasoning for all decisions
- Maintain audit trails for compliance

Always provide structured responses with clear reasoning and next steps."""

        super().__init__(name="orchestrator", system_message=system_message)

        # Initialize specialized agents
        self.assessment_agent = None
        # New enhanced agent with image capabilities
        self.enhanced_assessment_agent = None
        self.communication_agent = None

        # Enhanced assessment capabilities
        self.default_assessment_mode = AssessmentMode.LLM_DRIVEN
        self.llm_assessor = LLMComplexityAssessor()
        self.logger = logging.getLogger(__name__)

        # Workflow state tracking
        self.active_workflows: dict[str, ClaimWorkflowState] = {}

        # Escalation criteria (updated for image processing)
        # These thresholds determine when claims require human review
        self.escalation_criteria = {
            # Claims over $50k require human review due to financial impact
            "high_amount_threshold": 50000,
            # Keywords indicating complex legal/investigative needs
            "complex_keywords": ["fraud", "litigation", "death", "catastrophic"],
            # Confidence below 70% indicates uncertainty requiring human judgment
            "low_confidence_threshold": 0.7,
            # Image relevance below 60% suggests poor quality or irrelevant images
            "image_analysis_threshold": 0.6,
            # Damage levels requiring review
            # Severe damage requires expert assessment
            "damage_severity_escalation": ["severe", "total_loss"],
        }

    async def initialize_agents(self) -> bool:
        """Initialize specialized agents for workflow coordination."""
        try:
            self.assessment_agent = ClaimAssessmentAgent()
            # Initialize enhanced agent
            self.enhanced_assessment_agent = EnhancedAssessmentAgent()
            self.communication_agent = CustomerCommunicationAgent()
            return True
        except Exception as e:
            print(f"Error initializing agents: {str(e)}")
            return False

    def assess_claim_complexity(self, claim_data: dict[str, Any], has_images: bool = False) -> ClaimComplexity:
        """
        Assess the complexity of a claim to determine processing path.

        This method uses a scoring system to evaluate multiple factors that contribute
        to claim complexity. Higher scores indicate more complex claims requiring
        additional resources or human oversight.

        Args:
            claim_data: Dictionary containing claim information
            has_images: Whether the claim includes image files

        Returns:
            ClaimComplexity enum value
        """
        # Initialize complexity scoring system
        # Score ranges: 0-1 = LOW, 2-3 = MEDIUM, 4+ = HIGH
        complexity_score = 0

        # Check claim amount - higher amounts increase complexity
        amount = parse_amount(claim_data.get("amount", 0))

        # Amount-based complexity scoring
        # Financial thresholds based on typical claim processing costs vs. claim value
        if amount > 50000:
            complexity_score += 2  # High-value claims require detailed investigation
        elif amount > 10000:
            complexity_score += 1  # Medium-value claims need moderate oversight

        # Check for complex keywords that indicate special handling needs
        description = claim_data.get("description", "").lower()
        for keyword in self.escalation_criteria["complex_keywords"]:
            if keyword in description:
                complexity_score += 2  # Any complex keyword significantly increases complexity
                break  # Only count once even if multiple keywords present

        # Image processing adds complexity due to analysis requirements
        if has_images:
            complexity_score += 1  # Images require additional processing time and expertise

        # Documentation completeness assessment
        # Missing documentation increases investigation time and complexity
        required_docs = ["incident_report", "photos", "police_report"]
        missing_docs = [
            doc for doc in required_docs if not claim_data.get(doc)]

        # Graduated penalty system based on claim amount
        # Lower-value claims are more tolerant of missing documentation
        # Higher-value claims require complete documentation for proper assessment
        if amount > 5000 and len(missing_docs) > 1:
            complexity_score += 1  # Significant claims with multiple missing docs
        elif amount > 1000 and len(missing_docs) == len(required_docs):
            complexity_score += 1  # Moderate claims with no documentation

        # Determine final complexity level based on total score
        # Thresholds calibrated based on processing capacity and resource allocation
        if complexity_score >= 3:
            return ClaimComplexity.HIGH    # Requires specialized handling
        elif complexity_score >= 1:
            return ClaimComplexity.MEDIUM  # Standard processing with oversight
        else:
            return ClaimComplexity.LOW     # Automated processing suitable

    def should_escalate_to_human(
        self, claim_data: dict[str, Any], agent_decisions: list[AgentDecision], image_analysis: dict[str, Any] | None = None
    ) -> bool:
        """
        Determine if a claim should be escalated to human review.

        This method implements a multi-factor escalation decision system that considers
        financial impact, complexity indicators, agent confidence, and image analysis
        results to determine if human expertise is required.

        Args:
            claim_data: Dictionary containing claim information
            agent_decisions: List of decisions made by agents
            image_analysis: Optional image analysis results

        Returns:
            Boolean indicating if escalation is needed
        """
        # Financial threshold check - high-value claims always require human review
        # $50k threshold based on regulatory requirements and risk management policies
        amount = parse_amount(claim_data.get("amount", 0))
        if amount > self.escalation_criteria["high_amount_threshold"]:
            return True  # Mandatory escalation for financial risk management

        # Keyword-based escalation for complex legal/investigative scenarios
        # These keywords indicate situations requiring specialized expertise
        description = claim_data.get("description", "").lower()
        for keyword in self.escalation_criteria["complex_keywords"]:
            if keyword in description:
                return True  # Immediate escalation for complex scenarios

        # Agent confidence assessment - low confidence indicates uncertainty
        # Multiple agents with low confidence suggests the claim is beyond automated processing
        for decision in agent_decisions:
            if decision.confidence_score < self.escalation_criteria["low_confidence_threshold"]:
                return True  # Escalate when agents are uncertain

        # Image analysis quality assessment (if images are present)
        if image_analysis:
            # Overall relevance score indicates image quality and usefulness
            # Low relevance suggests images don't support the claim narrative
            overall_relevance = image_analysis.get(
                "overall_relevance_score", 1.0)
            if overall_relevance < self.escalation_criteria["image_analysis_threshold"]:
                return True  # Poor image quality requires human verification

            # Damage severity assessment from image analysis
            # Severe damage requires expert evaluation for accurate assessment
            for analysis in image_analysis.get("image_analyses", []):
                damage_assessment = analysis.get("damage_assessment", {})
                if damage_assessment.get("severity") in self.escalation_criteria["damage_severity_escalation"]:
                    return True  # Severe damage needs expert assessment

        # No escalation triggers found - proceed with automated processing
        return False

    async def process_claim_workflow(
        self, claim_data: dict[str, Any], image_files: list | None = None
    ) -> ClaimWorkflowState:
        """
        Main orchestration method for processing a claim through the workflow.

        Args:
            claim_data: Dictionary containing claim information
            image_files: Optional list of image files for processing

        Returns:
            ClaimWorkflowState with final workflow status
        """
        claim_id = claim_data.get("claim_id", str(uuid.uuid4()))
        has_images = image_files is not None and len(image_files) > 0

        # Initialize workflow state
        workflow_state = ClaimWorkflowState(
            claim_id=claim_id,
            current_stage=WorkflowStage.INTAKE,
            complexity=self.assess_claim_complexity(claim_data, has_images),
            started_at=datetime.now(),
            updated_at=datetime.now(),
            agent_decisions=[],
            has_images=has_images,
        )

        self.active_workflows[claim_id] = workflow_state

        try:
            # Stage 1: Intake validation
            workflow_state.current_stage = WorkflowStage.INTAKE
            workflow_state.updated_at = datetime.now()

            intake_result = await self._validate_claim_intake(claim_data)
            if not intake_result["valid"]:
                workflow_state.current_stage = WorkflowStage.FAILED
                workflow_state.error_message = intake_result["error"]
                return workflow_state

            # Stage 2: Assessment (with or without images)
            if has_images:
                workflow_state.current_stage = WorkflowStage.IMAGE_PROCESSING
                workflow_state.updated_at = datetime.now()

                assessment_result = await self._process_assessment_with_images(claim_data, image_files)
            else:
                workflow_state.current_stage = WorkflowStage.ASSESSMENT
                workflow_state.updated_at = datetime.now()

                assessment_result = await self._process_assessment(claim_data)

            workflow_state.agent_decisions.append(assessment_result)

            # Check if human review is needed (including image analysis)
            if self.should_escalate_to_human(
                claim_data, workflow_state.agent_decisions, workflow_state.image_analysis_result
            ):
                workflow_state.current_stage = WorkflowStage.HUMAN_REVIEW
                workflow_state.requires_human_review = True
                workflow_state.updated_at = datetime.now()
                return workflow_state

            # Stage 3: Communication
            workflow_state.current_stage = WorkflowStage.COMMUNICATION
            workflow_state.updated_at = datetime.now()

            communication_result = await self._process_communication(
                claim_data, assessment_result
            )
            workflow_state.agent_decisions.append(communication_result)

            # Complete workflow
            workflow_state.current_stage = WorkflowStage.COMPLETED
            workflow_state.updated_at = datetime.now()

        except Exception as e:
            workflow_state.current_stage = WorkflowStage.FAILED
            workflow_state.error_message = str(e)
            workflow_state.updated_at = datetime.now()

        return workflow_state

    async def _validate_claim_intake(
        self, claim_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Validate claim data during intake stage."""
        required_fields = ["policy_number", "incident_date", "description"]

        for field in required_fields:
            if not claim_data.get(field):
                return {"valid": False, "error": f"Missing required field: {field}"}

        # Validate incident date format
        incident_date = claim_data.get("incident_date")
        if incident_date:
            try:
                datetime.fromisoformat(incident_date.replace("Z", "+00:00"))
            except ValueError:
                return {
                    "valid": False,
                    "error": f"Invalid incident_date format: {incident_date}. Expected ISO format.",
                }

        # Validate amount if provided
        amount = claim_data.get("amount")
        if amount is not None:
            if isinstance(amount, str):
                try:
                    parsed_amount = float(
                        amount.replace("$", "").replace(",", ""))
                    if parsed_amount < 0:
                        return {
                            "valid": False,
                            "error": "Claim amount cannot be negative",
                        }
                except ValueError:
                    return {
                        "valid": False,
                        "error": f"Invalid amount format: {amount}. Expected number or string.",
                    }
            elif isinstance(amount, (int, float)):
                if amount < 0:
                    return {
                        "valid": False,
                        "error": "Claim amount cannot be negative",
                    }
            else:
                return {
                    "valid": False,
                    "error": f"Invalid amount format: {amount}. Expected number or string.",
                }

        return {"valid": True}

    async def _process_assessment(self, claim_data: dict[str, Any]) -> AgentDecision:
        """Process claim through assessment agent (without images)."""
        if not self.assessment_agent:
            await self.initialize_agents()

        try:
            assessment_result = await self.assessment_agent.assess_claim_validity(
                claim_data
            )

            return AgentDecision(
                agent_name="assessment",
                decision=assessment_result.get("decision", "unknown"),
                confidence_score=assessment_result.get(
                    "confidence_score", 0.0),
                reasoning=assessment_result.get(
                    "reasoning", "No reasoning provided"),
                timestamp=datetime.now(),
                metadata=assessment_result,
            )
        except Exception as e:
            return AgentDecision(
                agent_name="assessment",
                decision="error",
                confidence_score=0.0,
                reasoning=f"Assessment failed: {str(e)}",
                timestamp=datetime.now(),
                metadata={"error": str(e)},
            )

    async def _process_assessment_with_images(self, claim_data: dict[str, Any], image_files: list) -> AgentDecision:
        """Process claim through enhanced assessment agent with image support."""
        if not self.enhanced_assessment_agent:
            await self.initialize_agents()

        try:
            # Use the enhanced assessment agent for image processing
            assessment_result = await self.enhanced_assessment_agent.assess_claim_with_images(
                claim_data, image_files
            )

            # Store image analysis results in workflow state
            workflow_state = self.active_workflows.get(
                claim_data.get("claim_id"))
            if workflow_state and "image_analysis_result" in assessment_result:
                workflow_state.image_analysis_result = assessment_result["image_analysis_result"]

            return AgentDecision(
                agent_name="enhanced_assessment",
                decision=assessment_result.get("decision", "unknown"),
                confidence_score=assessment_result.get(
                    "confidence_score", 0.0),
                reasoning=assessment_result.get(
                    "reasoning", "No reasoning provided"),
                timestamp=datetime.now(),
                metadata=assessment_result,
            )
        except Exception as e:
            return AgentDecision(
                agent_name="enhanced_assessment",
                decision="error",
                confidence_score=0.0,
                reasoning=f"Enhanced assessment with images failed: {str(e)}",
                timestamp=datetime.now(),
                metadata={"error": str(e)},
            )

    async def _process_communication(
        self, claim_data: dict[str, Any], assessment_decision: AgentDecision
    ) -> AgentDecision:
        """Process communication through communication agent."""
        if not self.communication_agent:
            await self.initialize_agents()

        try:
            # Prepare context for communication
            context = {
                "assessment_decision": assessment_decision.decision,
                "confidence_score": assessment_decision.confidence_score,
                "claim_data": claim_data,
            }

            # Include image analysis context if available
            workflow_state = self.active_workflows.get(
                claim_data.get("claim_id"))
            if workflow_state and workflow_state.image_analysis_result:
                context["image_analysis"] = workflow_state.image_analysis_result

            communication_result = await self.communication_agent.draft_customer_response(
                customer_inquiry=f"Claim status update for {claim_data.get('claim_id')}",
                context=context,
            )

            return AgentDecision(
                agent_name="communication",
                decision="communication_drafted",
                confidence_score=communication_result.get(
                    "confidence_score", 0.8),
                reasoning=communication_result.get(
                    "reasoning", "Communication drafted successfully"
                ),
                timestamp=datetime.now(),
                metadata=communication_result,
            )
        except Exception as e:
            return AgentDecision(
                agent_name="communication",
                decision="error",
                confidence_score=0.0,
                reasoning=f"Communication failed: {str(e)}",
                timestamp=datetime.now(),
                metadata={"error": str(e)},
            )

    def get_workflow_status(self, claim_id: str) -> dict[str, Any] | None:
        """
        Get the current status of a workflow.

        Args:
            claim_id: The ID of the claim to check

        Returns:
            Dictionary with workflow status or None if not found
        """
        workflow_state = self.active_workflows.get(claim_id)
        if workflow_state:
            return workflow_state.to_dict()
        return None

    def get_all_active_workflows(self) -> dict[str, dict[str, Any]]:
        """Get status of all active workflows."""
        return {
            claim_id: workflow_state.to_dict()
            for claim_id, workflow_state in self.active_workflows.items()
        }

    async def create_graphflow_workflow(
        self, claim_data: dict[str, Any]
    ) -> Any | None:
        """
        Create a GraphFlow workflow for structured claim processing.

        This method demonstrates how to use AutoGen's GraphFlow for more
        complex workflow orchestration in future implementations.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            GraphFlow instance or None if creation fails
        """
        if not AUTOGEN_AVAILABLE:
            return None

        try:
            # Initialize agents if not already done
            if not self.enhanced_assessment_agent:
                await self.initialize_agents()

            # Create graph builder
            builder = DiGraphBuilder()

            # Add nodes (agents) - use enhanced assessment agent for image support
            builder.add_node(self.enhanced_assessment_agent.agent)
            builder.add_node(self.communication_agent.agent)

            # Add edges (workflow connections)
            builder.add_edge(
                self.enhanced_assessment_agent.agent, self.communication_agent.agent
            )

            # Create GraphFlow
            graph_flow = GraphFlow(
                participants=[
                    self.enhanced_assessment_agent.agent,
                    self.communication_agent.agent,
                ],
                graph=builder.build(),
            )

            return graph_flow

        except Exception as e:
            print(f"Error creating GraphFlow workflow: {str(e)}")
            return None

    async def run_graphflow_workflow(
        self, claim_data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Run a claim through the GraphFlow workflow.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            Dictionary with workflow results
        """
        try:
            graph_flow = await self.create_graphflow_workflow(claim_data)
            if not graph_flow:
                return {"error": "Failed to create GraphFlow workflow"}

            # Prepare task message
            task_message = f"""
            Process this insurance claim:
            
            Claim ID: {claim_data.get("claim_id")}
            Policy Number: {claim_data.get("policy_number")}
            Incident Date: {claim_data.get("incident_date")}
            Description: {claim_data.get("description")}
            Amount: {claim_data.get("amount", "Not specified")}
            
            Please assess the claim and draft appropriate customer communication.
            """

            # Run the workflow
            result = await graph_flow.run(task=task_message)

            return {
                "success": True,
                "messages": [msg.content for msg in result.messages]
                if result.messages
                else [],
                "workflow_completed": True,
            }

        except Exception as e:
            return {"success": False, "error": str(e), "workflow_completed": False}

    # Enhanced Assessment Methods
    async def assess_claim_complexity_enhanced(
        self, claim_data: dict[str, Any], mode: AssessmentMode | None = None
    ) -> EnhancedComplexityResult:
        """
        Assess claim complexity using the specified mode.

        Args:
            claim_data: Dictionary containing claim information
            mode: Assessment mode to use (defaults to instance default)

        Returns:
            EnhancedComplexityResult with detailed assessment information
        """
        assessment_mode = mode or self.default_assessment_mode

        if assessment_mode == AssessmentMode.RULE_BASED:
            return await self._rule_based_assessment(claim_data)
        elif assessment_mode == AssessmentMode.LLM_DRIVEN:
            return await self._llm_driven_assessment(claim_data)
        elif assessment_mode == AssessmentMode.HYBRID:
            return await self._hybrid_assessment(claim_data)
        else:
            raise ValueError(f"Unknown assessment mode: {assessment_mode}")

    async def _rule_based_assessment(
        self, claim_data: dict[str, Any]
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
        self, claim_data: dict[str, Any]
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
            raise Exception(f"LLM complexity assessment failed: {str(e)}")

    async def _hybrid_assessment(
        self, claim_data: dict[str, Any]
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
            self.logger.error(
                f"LLM assessment failed in hybrid mode: {str(e)}")
            raise Exception(f"Hybrid complexity assessment failed: {str(e)}")

    def _reconcile_assessments(
        self, rule_result: ClaimComplexity, llm_result: ComplexityAssessment
    ) -> tuple[ClaimComplexity, str]:
        """
        Reconcile differences between rule-based and LLM assessments.

        This method implements a sophisticated decision-making algorithm that weighs
        the strengths of both rule-based and AI-driven assessments to produce the
        most accurate final complexity determination.

        Args:
            rule_result: Result from rule-based assessment
            llm_result: Result from LLM assessment

        Returns:
            Tuple of (final_complexity, comparison_notes)
        """
        # Perfect agreement - use either result with confidence
        if rule_result == llm_result.complexity:
            return rule_result, "Both assessments agree"

        # Convert complexity levels to numeric scores for comparison
        # This allows mathematical comparison of assessment differences
        rule_score = self._complexity_to_score(rule_result)
        llm_score = self._complexity_to_score(llm_result.complexity)

        # High-confidence LLM assessment override
        # When LLM has high confidence (>80%), it likely identified nuanced factors
        # that rule-based systems might miss
        if llm_result.confidence_score > 0.8:
            return (
                llm_result.complexity,
                f"LLM assessment preferred (high confidence: {llm_result.confidence_score:.1%})",
            )

        # Close assessment reconciliation - prefer conservative approach
        # When assessments are within 1 complexity level, choose the higher complexity
        # This ensures adequate resources are allocated rather than under-resourcing
        if abs(rule_score - llm_score) <= 1:
            final = rule_result if rule_score > llm_score else llm_result.complexity
            return final, "Conservative assessment chosen due to close results"

        # Significant disagreement with lower LLM confidence
        # Fall back to rule-based assessment as it's more predictable and auditable
        # This maintains consistency when AI confidence is questionable
        return (
            rule_result,
            f"Rule-based preferred due to significant disagreement and lower LLM confidence ({llm_result.confidence_score:.1%})",
        )

    def _complexity_to_score(self, complexity: ClaimComplexity) -> int:
        """
        Convert complexity enum to numeric score for comparison.

        This mapping enables mathematical operations on complexity levels
        for assessment reconciliation and decision-making algorithms.
        """
        mapping = {
            ClaimComplexity.LOW: 1,     # Simple, automated processing
            ClaimComplexity.MEDIUM: 2,  # Standard processing with oversight
            ClaimComplexity.HIGH: 3,    # Complex, requires specialized handling
        }
        return mapping[complexity]

    async def process_claim_workflow_enhanced(
        self,
        claim_data: dict[str, Any],
        assessment_mode: AssessmentMode | None = None,
    ) -> dict[str, Any]:
        """
        Process a claim workflow with enhanced complexity assessment.

        Args:
            claim_data: Dictionary containing claim information
            assessment_mode: Assessment mode to use for complexity evaluation

        Returns:
            Dictionary with workflow results and enhanced assessment data
        """
        try:
            # Perform enhanced complexity assessment
            complexity_result = await self.assess_claim_complexity_enhanced(
                claim_data, assessment_mode
            )

            # Process the workflow using the enhanced assessment
            workflow_state = await self.process_claim_workflow(claim_data)

            # Add enhanced assessment data to the result
            result = {
                "workflow_state": workflow_state.to_dict(),
                "enhanced_assessment": {
                    "final_complexity": complexity_result.final_complexity.value,
                    "confidence_score": complexity_result.confidence_score,
                    "reasoning": complexity_result.reasoning,
                    "assessment_mode": complexity_result.assessment_mode.value,
                    "comparison_notes": complexity_result.comparison_notes,
                },
                "success": True,
            }

            # Include detailed assessment comparison if available
            if complexity_result.rule_based_result and complexity_result.llm_result:
                result["assessment_comparison"] = {
                    "rule_based": complexity_result.rule_based_result.value,
                    "llm_driven": {
                        "complexity": complexity_result.llm_result.complexity.value,
                        "confidence": complexity_result.llm_result.confidence_score,
                        "reasoning": complexity_result.llm_result.reasoning,
                    },
                }

            return result

        except Exception as e:
            self.logger.error(f"Enhanced workflow processing failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "claim_id": claim_data.get("claim_id"),
            }

    async def get_assessment_comparison(
        self, claim_data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Get a comparison of different assessment approaches for a claim.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            Dictionary with comparison results from different assessment modes
        """
        try:
            # Get assessments from all modes
            rule_based = await self._rule_based_assessment(claim_data)
            llm_driven = await self._llm_driven_assessment(claim_data)
            hybrid = await self._hybrid_assessment(claim_data)

            return {
                "claim_id": claim_data.get("claim_id"),
                "assessments": {
                    "rule_based": {
                        "complexity": rule_based.final_complexity.value,
                        "confidence": rule_based.confidence_score,
                        "reasoning": rule_based.reasoning,
                    },
                    "llm_driven": {
                        "complexity": llm_driven.final_complexity.value,
                        "confidence": llm_driven.confidence_score,
                        "reasoning": llm_driven.reasoning,
                    },
                    "hybrid": {
                        "complexity": hybrid.final_complexity.value,
                        "confidence": hybrid.confidence_score,
                        "reasoning": hybrid.reasoning,
                        "comparison_notes": hybrid.comparison_notes,
                    },
                },
                "agreement": {
                    "rule_vs_llm": rule_based.final_complexity == llm_driven.final_complexity,
                    "rule_vs_hybrid": rule_based.final_complexity == hybrid.final_complexity,
                    "llm_vs_hybrid": llm_driven.final_complexity == hybrid.final_complexity,
                },
                "success": True,
            }

        except Exception as e:
            self.logger.error(f"Assessment comparison failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "claim_id": claim_data.get("claim_id"),
            }
