"""
Modernized Communication Agent using AutoGen framework with structured output.

This module implements a sophisticated Communication Agent using AutoGen's AssistantAgent
pattern with structured output, streaming capabilities, and proper tool integration.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import TextMessage, StructuredMessage
from autogen_ext.models.openai import AzureOpenAIChatCompletionClient
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.communication import (
    CommunicationRequest,
    CommunicationResponse,
    CommunicationStep,
    CommunicationType,
    CommunicationTone,
    Language,
    StreamingCommunicationChunk,
    CommunicationCapabilities,
    CommunicationError,
)


class AutoGenCommunicationAgent:
    """
    Simplified Communication Agent using AutoGen's AssistantAgent pattern.

    This agent leverages AutoGen's structured output capabilities for generating 
    insurance communications with minimal complexity.
    """

    def __init__(self, model_client: Optional[AzureOpenAIChatCompletionClient] = None):
        """Initialize the AutoGen communication agent."""

        # Initialize model client
        if model_client is None:
            # Validate Azure OpenAI configuration
            if (
                not settings.AZURE_OPENAI_ENDPOINT
                or not settings.AZURE_OPENAI_DEPLOYMENT_NAME
                or not settings.AZURE_OPENAI_API_KEY
            ):
                raise ValueError(
                    "Azure OpenAI configuration missing. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, and AZURE_OPENAI_API_KEY"
                )

            self.model_client = AzureOpenAIChatCompletionClient(
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,  # Model name same as deployment
                # Required for structured output (JSON schema)
                api_version="2024-08-01-preview",
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
            )
        else:
            self.model_client = model_client

        # Create AssistantAgent with structured output
        self.agent = AssistantAgent(
            name="communication_agent",
            model_client=self.model_client,
            system_message=self._get_system_message(),
            # Enable structured output
            output_content_type=CommunicationResponse,
        )

    def _get_system_message(self) -> str:
        """Get the system message for the communication agent."""
        return """You are an expert insurance customer communication specialist using AutoGen framework.

Your role is to generate personalized, professional, and empathetic communications for insurance customers based on claim assessments and customer context.

Key responsibilities:
1. Generate contextually appropriate communications using structured output
2. Maintain professional yet empathetic tone appropriate to the situation
3. Ensure regulatory compliance and include all required information
4. Personalize content based on customer context and history
5. Adapt language and cultural sensitivity for different regions
6. Provide clear, actionable information and next steps

Communication principles:
- Always be clear, honest, and transparent
- Show empathy for customer situations, especially for claim denials
- Provide specific, actionable information and clear next steps
- Include all required regulatory elements and compliance information
- Maintain professional standards while being human and understanding
- Respect cultural and linguistic preferences

You must generate structured communications using the CommunicationResponse model that includes:
- Appropriate subject lines that are clear and informative
- Personalized greetings using customer names
- Clear explanation of situation/decision with context
- Specific next steps or actions required from the customer
- Contact information for questions and support
- Required regulatory disclaimers and appeal rights
- Professional closing with team identification

Always ensure accuracy and consistency with provided assessment results and maintain empathy especially for difficult communications like claim denials."""

    async def generate_communication(
        self, request: CommunicationRequest
    ) -> CommunicationResponse:
        """
        Generate a communication using AutoGen's structured output.

        Args:
            request: CommunicationRequest with all necessary information

        Returns:
            CommunicationResponse with generated communication
        """
        start_time = datetime.now()
        communication_id = str(uuid.uuid4())

        # Prepare task for the agent
        task = f"""Generate a {request.communication_type.value} communication for:
        
Customer: {request.customer_name}
Claim ID: {request.claim_id}
Policy: {request.policy_number}
Language: {request.preferred_language.value}
Urgency: {request.urgency_level.value}

Special Instructions: {request.special_instructions or 'None'}

Assessment Result: {json.dumps(request.assessment_result, default=str) if request.assessment_result else 'None'}

Generate a complete, professional communication that includes appropriate subject line, personalized content, compliance elements, and next steps."""

        # Run the agent
        result = await self.agent.run(task=task)

        # Extract the structured response
        if result.messages and isinstance(result.messages[-1], StructuredMessage):
            structured_result = result.messages[-1].content
            if isinstance(structured_result, CommunicationResponse):
                # Update the response with our metadata
                structured_result.communication_id = communication_id
                structured_result.processing_time_seconds = (
                    datetime.now() - start_time).total_seconds()

                return structured_result

        # If no structured result, raise an error
        raise Exception("Failed to generate structured communication response")

    async def close(self):
        """Close the agent and clean up resources."""
        if hasattr(self.model_client, 'close'):
            await self.model_client.close()
