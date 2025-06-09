"""
Orchestrator Agent for coordinating multi-agent insurance claim processing workflows.

This module implements the central orchestrator that manages the workflow between
specialized agents (Assessment, Communication, etc.) using AutoGen's GraphFlow
for structured claim processing.
"""

import asyncio
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict

# AutoGen imports
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinGroupChat, GraphFlow
    from autogen_agentchat.conditions import (
        MaxMessageTermination,
        TextMentionTermination,
    )
    from autogen_agentchat.messages import TextMessage
    from autogen_agentchat.teams import DiGraphBuilder

    AUTOGEN_AVAILABLE = True
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    AUTOGEN_IMPORT_ERROR = str(e)

from app.agents.base import (
    BaseInsuranceAgent,
    ClaimAssessmentAgent,
    CustomerCommunicationAgent,
)
from app.core.config import settings


class WorkflowStage(Enum):
    """Enumeration of workflow stages."""

    INTAKE = "intake"
    ASSESSMENT = "assessment"
    COMMUNICATION = "communication"
    HUMAN_REVIEW = "human_review"
    COMPLETED = "completed"
    FAILED = "failed"


class ClaimComplexity(Enum):
    """Enumeration of claim complexity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class ClaimWorkflowState:
    """State tracking for claim workflow processing."""

    claim_id: str
    current_stage: WorkflowStage
    complexity: ClaimComplexity
    started_at: datetime
    updated_at: datetime
    agent_decisions: List[Dict[str, Any]]
    requires_human_review: bool = False
    error_message: Optional[str] = None
    workflow_id: str = None

    def __post_init__(self):
        if self.workflow_id is None:
            self.workflow_id = str(uuid.uuid4())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["current_stage"] = self.current_stage.value
        data["complexity"] = self.complexity.value
        data["started_at"] = self.started_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data


@dataclass
class AgentDecision:
    """Structure for storing agent decisions."""

    agent_name: str
    decision: str
    confidence_score: float
    reasoning: str
    timestamp: datetime
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data


class OrchestratorAgent(BaseInsuranceAgent):
    """
    Orchestrator Agent that coordinates workflow between specialized agents.

    This agent manages the overall claim processing workflow using AutoGen's
    GraphFlow capabilities, coordinating between Assessment, Communication,
    and other specialized agents.
    """

    def __init__(self):
        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        system_message = """You are the Orchestrator Agent for an insurance claims processing system.

Your responsibilities:
1. Coordinate workflow between specialized agents (Assessment, Communication, etc.)
2. Route claims based on complexity and risk assessment
3. Manage handoffs between agents and ensure proper workflow execution
4. Identify when human intervention is required
5. Maintain workflow state and provide status updates
6. Ensure all decisions are explainable and auditable

You should:
- Analyze claim data to determine processing complexity
- Route claims through appropriate workflow paths
- Coordinate agent handoffs with clear instructions
- Escalate to human review when necessary
- Provide clear status updates and reasoning for all decisions
- Maintain audit trails for compliance

Always provide structured responses with clear reasoning and next steps."""

        super().__init__(name="orchestrator", system_message=system_message)

        # Initialize specialized agents
        self.assessment_agent = None
        self.communication_agent = None

        # Workflow state tracking
        self.active_workflows: Dict[str, ClaimWorkflowState] = {}

        # Escalation criteria
        self.escalation_criteria = {
            "high_amount_threshold": 50000,  # Claims over $50k
            "complex_keywords": ["fraud", "litigation", "death", "catastrophic"],
            "low_confidence_threshold": 0.7,  # Confidence below 70%
        }

    async def initialize_agents(self):
        """Initialize specialized agents for workflow coordination."""
        try:
            self.assessment_agent = ClaimAssessmentAgent()
            self.communication_agent = CustomerCommunicationAgent()
            return True
        except Exception as e:
            print(f"Error initializing agents: {str(e)}")
            return False

    def assess_claim_complexity(self, claim_data: Dict[str, Any]) -> ClaimComplexity:
        """
        Assess the complexity of a claim to determine processing path.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            ClaimComplexity enum value
        """
        complexity_score = 0

        # Check claim amount
        amount = self._parse_amount(claim_data.get("amount", 0))

        # Amount-based complexity scoring
        if amount > 50000:
            complexity_score += 2
        elif amount > 10000:
            complexity_score += 1

        # Check for complex keywords
        description = claim_data.get("description", "").lower()
        for keyword in self.escalation_criteria["complex_keywords"]:
            if keyword in description:
                complexity_score += 2
                break

                # Check for missing documentation - but be more lenient for low-amount claims
        required_docs = ["incident_report", "photos", "police_report"]
        missing_docs = [doc for doc in required_docs if not claim_data.get(doc)]

        # Only add complexity for missing docs if amount is significant
        # For very low amounts (< $1000), don't penalize for missing docs
        # For moderate amounts ($1000-$5000), only penalize if all docs missing
        # For higher amounts (> $5000), penalize if more than 1 doc missing
        if amount > 5000 and len(missing_docs) > 1:
            complexity_score += 1
        elif amount >= 1000 and len(missing_docs) >= 3:
            complexity_score += 1
        # For amounts < $1000, no documentation penalty

        # Determine complexity level
        if complexity_score >= 3:
            return ClaimComplexity.HIGH
        elif complexity_score >= 1:
            return ClaimComplexity.MEDIUM
        else:
            return ClaimComplexity.LOW

    def should_escalate_to_human(
        self, claim_data: Dict[str, Any], agent_decisions: List[AgentDecision]
    ) -> bool:
        """
        Determine if a claim should be escalated to human review.

        Args:
            claim_data: Dictionary containing claim information
            agent_decisions: List of agent decisions made so far

        Returns:
            Boolean indicating if human review is required
        """
        # Check amount threshold
        amount = self._parse_amount(claim_data.get("amount", 0))

        if amount > self.escalation_criteria["high_amount_threshold"]:
            return True

        # Check confidence scores
        for decision in agent_decisions:
            if (
                decision.confidence_score
                < self.escalation_criteria["low_confidence_threshold"]
            ):
                return True

        # Check for complex keywords
        description = claim_data.get("description", "").lower()
        for keyword in self.escalation_criteria["complex_keywords"]:
            if keyword in description:
                return True

        return False

    def _parse_amount(self, amount: Union[str, int, float]) -> float:
        """
        Parse amount from various formats into a float.

        Args:
            amount: Amount in string, int, or float format

        Returns:
            Parsed amount as float, 0 if parsing fails
        """
        if isinstance(amount, (int, float)):
            return float(amount)
        elif isinstance(amount, str):
            try:
                return float(amount.replace("$", "").replace(",", ""))
            except ValueError:
                return 0.0
        else:
            return 0.0

    async def process_claim_workflow(
        self, claim_data: Dict[str, Any]
    ) -> ClaimWorkflowState:
        """
        Main orchestration method for processing a claim through the workflow.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            ClaimWorkflowState with final workflow status
        """
        claim_id = claim_data.get("claim_id", str(uuid.uuid4()))

        # Initialize workflow state
        workflow_state = ClaimWorkflowState(
            claim_id=claim_id,
            current_stage=WorkflowStage.INTAKE,
            complexity=self.assess_claim_complexity(claim_data),
            started_at=datetime.now(),
            updated_at=datetime.now(),
            agent_decisions=[],
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

            # Stage 2: Assessment
            workflow_state.current_stage = WorkflowStage.ASSESSMENT
            workflow_state.updated_at = datetime.now()

            assessment_result = await self._process_assessment(claim_data)
            workflow_state.agent_decisions.append(assessment_result)

            # Check if human review is needed
            if self.should_escalate_to_human(
                claim_data, workflow_state.agent_decisions
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
        self, claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate claim data during intake stage."""
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
        if "amount" in claim_data:
            amount = claim_data.get("amount")
            if amount is not None:
                try:
                    if isinstance(amount, str):
                        # Try to parse string amounts
                        parsed_amount = float(amount.replace("$", "").replace(",", ""))
                        if parsed_amount < 0:
                            return {
                                "valid": False,
                                "error": "Claim amount cannot be negative",
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
                except (ValueError, TypeError):
                    return {
                        "valid": False,
                        "error": f"Invalid amount format: {amount}. Cannot parse as number.",
                    }

        return {"valid": True}

    async def _process_assessment(self, claim_data: Dict[str, Any]) -> AgentDecision:
        """Process claim through assessment agent."""
        if not self.assessment_agent:
            await self.initialize_agents()

        try:
            assessment_result = await self.assessment_agent.assess_claim_validity(
                claim_data
            )

            return AgentDecision(
                agent_name="assessment",
                decision=assessment_result.get("decision", "unknown"),
                confidence_score=assessment_result.get("confidence_score", 0.0),
                reasoning=assessment_result.get("reasoning", "No reasoning provided"),
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

    async def _process_communication(
        self, claim_data: Dict[str, Any], assessment_decision: AgentDecision
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

            communication_result = await self.communication_agent.draft_customer_response(
                customer_inquiry=f"Claim status update for {claim_data.get('claim_id')}",
                context=context,
            )

            return AgentDecision(
                agent_name="communication",
                decision="communication_drafted",
                confidence_score=communication_result.get("confidence_score", 0.8),
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

    def get_workflow_status(self, claim_id: str) -> Optional[Dict[str, Any]]:
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

    def get_all_active_workflows(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all active workflows."""
        return {
            claim_id: workflow_state.to_dict()
            for claim_id, workflow_state in self.active_workflows.items()
        }

    async def create_graphflow_workflow(
        self, claim_data: Dict[str, Any]
    ) -> Optional[Any]:
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
            if not self.assessment_agent:
                await self.initialize_agents()

            # Create graph builder
            builder = DiGraphBuilder()

            # Add nodes (agents)
            builder.add_node(self.assessment_agent.agent)
            builder.add_node(self.communication_agent.agent)

            # Add edges (workflow connections)
            builder.add_edge(
                self.assessment_agent.agent, self.communication_agent.agent
            )

            # Create GraphFlow
            graph_flow = GraphFlow(
                participants=[
                    self.assessment_agent.agent,
                    self.communication_agent.agent,
                ],
                graph=builder.build(),
            )

            return graph_flow

        except Exception as e:
            print(f"Error creating GraphFlow workflow: {str(e)}")
            return None

    async def run_graphflow_workflow(
        self, claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
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
