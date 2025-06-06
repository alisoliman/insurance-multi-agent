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

        if not settings.AZURE_OPENAI_ENDPOINT or not settings.AZURE_OPENAI_DEPLOYMENT_NAME or not settings.AZURE_OPENAI_API_KEY:
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
    """Base class for insurance claim processing agents."""

    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message

        if not AUTOGEN_AVAILABLE:
            raise ImportError(f"AutoGen not available: {AUTOGEN_IMPORT_ERROR}")

        self.model_client = AutoGenConfig.get_model_client()
        if self.model_client is None:
            raise ValueError(
                "Could not create model client - check Azure OpenAI configuration")

        # Create the AutoGen agent
        self.agent = AssistantAgent(
            name=self.name,
            model_client=self.model_client,
            system_message=self.system_message,
        )

    async def process_message(self, message: str) -> str:
        """Process a single message through the agent."""
        try:
            # Use AutoGen agent with proper termination
            team = RoundRobinGroupChat(
                participants=[self.agent],
                termination_condition=MaxMessageTermination(max_messages=2)
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


class ClaimAssessmentAgent(BaseInsuranceAgent):
    """Agent specialized for insurance claim assessment."""

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


class CustomerCommunicationAgent(BaseInsuranceAgent):
    """Agent specialized for customer communication."""

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
