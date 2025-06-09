"""
Base AutoGen agent configuration and utilities for insurance claims processing.
"""

import asyncio
from typing import Dict, Any, Optional

# Import AutoGen components
try:
    from autogen_agentchat.agents import AssistantAgent
    from autogen_agentchat.teams import RoundRobinGroupChat
    from autogen_agentchat.conditions import MaxMessageTermination
    from autogen_ext.models.openai import AzureOpenAIChatCompletionClient

    AUTOGEN_AVAILABLE = True
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    AUTOGEN_IMPORT_ERROR = str(e)

from app.core.config import settings


class AutoGenConfig:
    """Configuration for AutoGen agents."""

    @staticmethod
    def get_model_client() -> Optional[Any]:
        """Get the Azure OpenAI model client for agents."""
        if not AUTOGEN_AVAILABLE:
            return None

        if (
            not settings.AZURE_OPENAI_ENDPOINT
            or not settings.AZURE_OPENAI_DEPLOYMENT_NAME
            or not settings.AZURE_OPENAI_API_KEY
        ):
            raise ValueError(
                "Azure OpenAI configuration missing. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, and AZURE_OPENAI_API_KEY"
            )

        # Create Azure OpenAI client with key-based authentication
        return AzureOpenAIChatCompletionClient(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,  # Model name same as deployment
            api_version=settings.AZURE_OPENAI_API_VERSION or "2024-06-01",
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,  # Using key-based authentication
        )


class BaseInsuranceAgent:
    """
    Hybrid base class for insurance claim processing agents.

    Provides AutoGen compatibility through delegation while maintaining
    insurance-specific functionality and business logic.
    """

    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message

        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        self.model_client = AutoGenConfig.get_model_client()
        if self.model_client is None:
            raise ValueError(
                "Could not create model client - check Azure OpenAI configuration"
            )

        # Create the internal AutoGen agent
        self.agent = AssistantAgent(
            name=self.name,
            model_client=self.model_client,
            system_message=self.system_message,
        )

    def __getattr__(self, name):
        """
        Delegate unknown methods to the internal AutoGen agent.
        This provides AutoGen compatibility while keeping our custom methods.
        """
        if hasattr(self.agent, name):
            return getattr(self.agent, name)
        raise AttributeError(
            f"'{self.__class__.__name__}' object has no attribute '{name}'"
        )

    # Insurance-specific methods
    async def process_message(self, message: str) -> str:
        """
        Process a single message through the agent with insurance-specific handling.

        Args:
            message: The input message to process

        Returns:
            The agent's response as a string
        """
        try:
            # Use AutoGen agent with proper termination
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2),
            )

            result = await team.run(task=message)

            if result.messages and len(result.messages) > 1:
                return result.messages[-1].content
            elif result.messages:
                return result.messages[-1].content
            else:
                return "No response generated"

        except Exception as e:
            return f"Error processing message: {str(e)}"

    def validate_insurance_context(self, message: str) -> bool:
        """
        Validate if the message contains insurance-related context.

        Args:
            message: The message to validate

        Returns:
            True if the message appears to be insurance-related
        """
        insurance_keywords = [
            "claim",
            "policy",
            "coverage",
            "deductible",
            "premium",
            "insurance",
            "damage",
            "accident",
            "liability",
            "beneficiary",
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in insurance_keywords)

    async def process_insurance_claim(self, claim_data: dict) -> dict:
        """
        Process a structured insurance claim with validation and assessment.

        Args:
            claim_data: Dictionary containing claim information

        Returns:
            Dictionary with assessment results
        """
        try:
            # Validate required fields
            required_fields = ["policy_number", "incident_date", "description"]
            missing_fields = [
                field for field in required_fields if field not in claim_data
            ]

            if missing_fields:
                return {
                    "status": "incomplete",
                    "missing_fields": missing_fields,
                    "message": f"Missing required fields: {', '.join(missing_fields)}",
                }

            # Format claim data for agent processing
            claim_message = f"""
            Please assess this insurance claim:
            
            Policy Number: {claim_data.get("policy_number")}
            Incident Date: {claim_data.get("incident_date")}
            Description: {claim_data.get("description")}
            Estimated Amount: {claim_data.get("amount", "Not specified")}
            
            Please provide a structured assessment including:
            1. Completeness review
            2. Initial validity assessment
            3. Required documentation
            4. Recommended next steps
            """

            response = await self.process_message(claim_message)

            return {
                "status": "processed",
                "assessment": response,
                "claim_id": claim_data.get("claim_id"),
                "processed_by": self.name,
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "claim_id": claim_data.get("claim_id"),
            }

    def get_agent_info(self) -> dict:
        """
        Get information about this agent and its capabilities.

        Returns:
            Dictionary with agent information
        """
        return {
            "name": self.name,
            "type": self.__class__.__name__,
            "system_message": self.system_message,
            "model_client_type": type(self.model_client).__name__,
            "autogen_compatible": True,
            "insurance_features": [
                "claim_processing",
                "context_validation",
                "structured_assessment",
            ],
        }


class ClaimAssessmentAgent(BaseInsuranceAgent):
    """Agent specialized for insurance claim assessment with AutoGen compatibility."""

    def __init__(self):
        system_message = """
        You are an insurance claim assessment agent. Your role is to:
        1. Review insurance claims for completeness and accuracy
        2. Assess claim validity based on policy terms
        3. Identify any missing documentation or information
        4. Provide clear, professional recommendations
        
        Always be thorough, fair, and follow insurance industry best practices.
        Respond in a structured format with clear reasoning.
        """
        super().__init__("ClaimAssessmentAgent", system_message)

    async def assess_claim_validity(
        self, claim_data: dict, policy_terms: dict = None
    ) -> dict:
        """
        Specialized method for claim validity assessment.

        Args:
            claim_data: The claim information
            policy_terms: Optional policy terms for validation

        Returns:
            Detailed validity assessment
        """
        assessment = await self.process_insurance_claim(claim_data)

        # Add claim-specific analysis
        if assessment["status"] == "processed":
            assessment["validity_score"] = self._calculate_validity_score(claim_data)
            assessment["risk_factors"] = self._identify_risk_factors(claim_data)

        return assessment

    def _calculate_validity_score(self, claim_data: dict) -> float:
        """Calculate a basic validity score based on claim data completeness."""
        score = 0.0
        total_factors = 5

        if claim_data.get("policy_number"):
            score += 1
        if claim_data.get("incident_date"):
            score += 1
        if claim_data.get("description") and len(claim_data["description"]) > 20:
            score += 1
        if claim_data.get("amount") and isinstance(claim_data["amount"], (int, float)):
            score += 1
        if claim_data.get("documentation"):
            score += 1

        return score / total_factors

    def _identify_risk_factors(self, claim_data: dict) -> list:
        """Identify potential risk factors in the claim."""
        risk_factors = []

        amount = claim_data.get("amount", 0)
        if isinstance(amount, (int, float)) and amount > 10000:
            risk_factors.append("high_value_claim")

        description = claim_data.get("description", "").lower()
        if any(word in description for word in ["total loss", "destroyed", "stolen"]):
            risk_factors.append("total_loss_indicator")

        return risk_factors


class CustomerCommunicationAgent(BaseInsuranceAgent):
    """Agent specialized for customer communication with AutoGen compatibility."""

    def __init__(self):
        system_message = """
        You are a customer communication agent for an insurance company. Your role is to:
        1. Draft clear, empathetic, and professional communications to customers
        2. Explain claim decisions in understandable terms
        3. Provide next steps and required actions
        4. Maintain a helpful and supportive tone
        
        Always prioritize customer satisfaction while being accurate and compliant.
        Use simple language and avoid insurance jargon when possible.
        """
        super().__init__("CustomerCommunicationAgent", system_message)

    async def draft_customer_response(
        self, customer_inquiry: str, context: dict = None
    ) -> dict:
        """
        Draft a customer response with appropriate tone and information.

        Args:
            customer_inquiry: The customer's message or question
            context: Additional context about the customer or claim

        Returns:
            Dictionary with drafted response and metadata
        """
        try:
            # Add context to the inquiry if provided
            if context:
                enhanced_inquiry = f"""
                Customer Inquiry: {customer_inquiry}
                
                Additional Context:
                - Customer ID: {context.get("customer_id", "Not provided")}
                - Claim Status: {context.get("claim_status", "Unknown")}
                - Policy Type: {context.get("policy_type", "Not specified")}
                
                Please provide a helpful, empathetic response addressing their inquiry.
                """
            else:
                enhanced_inquiry = customer_inquiry

            response = await self.process_message(enhanced_inquiry)

            return {
                "status": "success",
                "response": response,
                "tone": "professional_empathetic",
                "generated_by": self.name,
                "context_used": bool(context),
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}
