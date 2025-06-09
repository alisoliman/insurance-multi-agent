"""
Enhanced Communication Agent for insurance customer communications.

This module implements a sophisticated Communication Agent that leverages LLM capabilities
for personalized, contextual customer communications while maintaining compliance
and regulatory requirements.
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

from app.agents.base import BaseInsuranceAgent
from app.core.config import settings


class CommunicationType(Enum):
    """Enumeration of communication types."""

    CLAIM_STATUS_UPDATE = "claim_status_update"
    APPROVAL_NOTIFICATION = "approval_notification"
    REJECTION_NOTIFICATION = "rejection_notification"
    INFORMATION_REQUEST = "information_request"
    HUMAN_REVIEW_NOTIFICATION = "human_review_notification"
    INVESTIGATION_UPDATE = "investigation_update"
    GENERAL_INQUIRY_RESPONSE = "general_inquiry_response"


class CommunicationTone(Enum):
    """Enumeration of communication tones."""

    PROFESSIONAL = "professional"
    EMPATHETIC = "empathetic"
    URGENT = "urgent"
    REASSURING = "reassuring"
    CONGRATULATORY = "congratulatory"


class Language(Enum):
    """Supported languages for communication."""

    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    PORTUGUESE = "pt"
    CHINESE = "zh"


@dataclass
class CommunicationContext:
    """Context information for generating communications."""

    customer_name: str
    claim_id: str
    policy_number: str
    communication_type: CommunicationType
    assessment_result: Optional[Dict[str, Any]] = None
    policy_details: Optional[Dict[str, Any]] = None
    preferred_language: Language = Language.ENGLISH
    communication_history: Optional[List[Dict[str, Any]]] = None
    special_instructions: Optional[str] = None
    urgency_level: str = "normal"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["communication_type"] = self.communication_type.value
        data["preferred_language"] = self.preferred_language.value
        return data


@dataclass
class CommunicationResult:
    """Result of communication generation."""

    communication_id: str
    communication_type: CommunicationType
    subject: str
    content: str
    language: Language
    tone: CommunicationTone
    personalization_score: float
    compliance_verified: bool
    generated_at: datetime
    processing_time_seconds: float
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data["communication_type"] = self.communication_type.value
        data["language"] = self.language.value
        data["tone"] = self.tone.value
        data["generated_at"] = self.generated_at.isoformat()
        return data


class EnhancedCommunicationAgent(BaseInsuranceAgent):
    """
    Enhanced Communication Agent that generates personalized customer communications.

    This agent leverages LLM capabilities for contextual, personalized communication
    generation while ensuring compliance and regulatory requirements.
    """

    def __init__(self):
        if not AUTOGEN_AVAILABLE:
            raise ImportError("AutoGen not available for Communication Agent")

        system_message = """You are an expert insurance customer communication specialist.

Your role is to generate personalized, professional, and empathetic communications for insurance customers based on claim assessments and customer context.

Key responsibilities:
1. Generate contextually appropriate communications based on assessment results
2. Maintain professional yet empathetic tone
3. Ensure regulatory compliance and include required information
4. Personalize content based on customer context and history
5. Adapt language and cultural sensitivity for different regions
6. Provide clear, actionable information and next steps

Communication principles:
- Always be clear, honest, and transparent
- Show empathy for customer situations
- Provide specific, actionable information
- Include all required regulatory elements
- Maintain professional standards
- Respect cultural and linguistic preferences

You must generate structured communications that include:
- Appropriate subject lines
- Personalized greetings
- Clear explanation of situation/decision
- Specific next steps or actions required
- Contact information for questions
- Required regulatory disclaimers
- Professional closing

Always ensure accuracy and consistency with provided assessment results."""

        super().__init__(name="enhanced_communication", system_message=system_message)

        # Communication configuration
        self.supported_languages = [lang for lang in Language]
        self.compliance_requirements = {
            "include_claim_number": True,
            "include_contact_info": True,
            "include_appeal_rights": True,
            "regulatory_disclaimers": True,
        }

        # Tone guidelines for different communication types
        self.tone_mapping = {
            CommunicationType.APPROVAL_NOTIFICATION: CommunicationTone.CONGRATULATORY,
            CommunicationType.REJECTION_NOTIFICATION: CommunicationTone.EMPATHETIC,
            CommunicationType.INFORMATION_REQUEST: CommunicationTone.PROFESSIONAL,
            CommunicationType.HUMAN_REVIEW_NOTIFICATION: CommunicationTone.REASSURING,
            CommunicationType.INVESTIGATION_UPDATE: CommunicationTone.PROFESSIONAL,
            CommunicationType.CLAIM_STATUS_UPDATE: CommunicationTone.PROFESSIONAL,
            CommunicationType.GENERAL_INQUIRY_RESPONSE: CommunicationTone.PROFESSIONAL,
        }

    async def generate_communication(
        self, context: CommunicationContext
    ) -> CommunicationResult:
        """
        Generate a personalized communication based on context.

        Args:
            context: CommunicationContext with all necessary information

        Returns:
            CommunicationResult with generated communication
        """
        start_time = datetime.now()

        try:
            # Perform LLM-driven communication generation
            communication_data = await self._perform_llm_communication_generation(
                context
            )

            # Apply compliance validation
            validated_communication = self._apply_compliance_validation(
                communication_data, context
            )

            # Calculate personalization score
            personalization_score = self._calculate_personalization_score(
                validated_communication, context
            )

            processing_time = (datetime.now() - start_time).total_seconds()

            return CommunicationResult(
                communication_id=str(uuid.uuid4()),
                communication_type=context.communication_type,
                subject=validated_communication.get("subject", ""),
                content=validated_communication.get("content", ""),
                language=context.preferred_language,
                tone=self.tone_mapping.get(
                    context.communication_type, CommunicationTone.PROFESSIONAL
                ),
                personalization_score=personalization_score,
                compliance_verified=validated_communication.get(
                    "compliance_verified", False
                ),
                generated_at=datetime.now(),
                processing_time_seconds=processing_time,
                metadata={
                    "context_variables_used": list(context.to_dict().keys()),
                    "llm_response_quality": validated_communication.get(
                        "quality_score", 0.0
                    ),
                    "compliance_checks_passed": validated_communication.get(
                        "compliance_checks", []
                    ),
                    "personalization_elements": validated_communication.get(
                        "personalization_elements", []
                    ),
                },
            )

        except Exception as e:
            self.logger.error(f"LLM communication generation failed: {str(e)}")
            # Return error instead of fallback
            raise Exception(f"Communication generation failed: {str(e)}")

    async def _perform_llm_communication_generation(
        self, context: CommunicationContext
    ) -> Dict[str, Any]:
        """
        Use LLM to generate personalized communication content.

        Args:
            context: Communication context

        Returns:
            Dictionary with generated communication data
        """
        # Prepare comprehensive prompt for LLM
        prompt = self._build_communication_prompt(context)

        try:
            # Use BaseInsuranceAgent's process_message method for proper AutoGen handling
            content = await self.process_message(prompt)

            if not content or content.startswith("Error processing message:"):
                raise Exception(f"LLM processing failed: {content}")

            # Try to parse as JSON first, fallback to text parsing
            try:
                # Extract JSON from markdown code blocks if present
                json_content = self._extract_json_from_content(content)
                parsed_response = json.loads(json_content)
                return self._validate_llm_response(parsed_response)
            except json.JSONDecodeError:
                return self._parse_text_response(content, context)

        except Exception as e:
            raise Exception(f"LLM communication generation failed: {str(e)}")

    def _extract_json_from_content(self, content: str) -> str:
        """Extract JSON content from markdown code blocks or raw text."""
        # Remove leading/trailing whitespace
        content = content.strip()

        # Check if content is wrapped in markdown code blocks
        if content.startswith("```json") and content.endswith("```"):
            # Extract content between ```json and ```
            lines = content.split("\n")
            json_lines = []
            in_json_block = False

            for line in lines:
                if line.strip() == "```json":
                    in_json_block = True
                    continue
                elif line.strip() == "```" and in_json_block:
                    break
                elif in_json_block:
                    json_lines.append(line)

            return "\n".join(json_lines)
        elif content.startswith("```") and content.endswith("```"):
            # Handle generic code blocks
            lines = content.split("\n")
            if len(lines) > 2:
                return "\n".join(lines[1:-1])

        # Return content as-is if no code blocks detected
        return content

    def _build_communication_prompt(self, context: CommunicationContext) -> str:
        """Build comprehensive prompt for LLM communication generation."""

        # Base prompt structure
        prompt = f"""Generate a professional insurance customer communication with the following requirements:

COMMUNICATION TYPE: {context.communication_type.value}
CUSTOMER NAME: {context.customer_name}
CLAIM ID: {context.claim_id}
POLICY NUMBER: {context.policy_number}
LANGUAGE: {context.preferred_language.value}
URGENCY: {context.urgency_level}

"""

        # Add assessment result context if available
        if context.assessment_result:
            prompt += f"""
ASSESSMENT RESULT:
- Decision: {context.assessment_result.get("decision", "N/A")}
- Confidence: {context.assessment_result.get("confidence_score", "N/A")}
- Reasoning: {context.assessment_result.get("reasoning", "N/A")[:200]}...

"""

        # Add policy context if available
        if context.policy_details:
            prompt += f"""
POLICY DETAILS:
- Policy Type: {context.policy_details.get("policy_type", "N/A")}
- Coverage Limits: {context.policy_details.get("coverage_limits", "N/A")}
- Deductible: {context.policy_details.get("deductible", "N/A")}

"""

        # Add special instructions
        if context.special_instructions:
            prompt += f"""
SPECIAL INSTRUCTIONS: {context.special_instructions}

"""

        # Add communication requirements
        language_instruction = ""
        if context.preferred_language.value != "en":
            language_name = {
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "pt": "Portuguese",
                "zh": "Chinese",
            }.get(context.preferred_language.value, context.preferred_language.value)
            language_instruction = f"7. **CRITICAL: Write ALL content (subject and body) in {language_name} language. Do not use English.**"

        prompt += f"""
REQUIREMENTS:
1. Generate a clear, professional subject line
2. Create personalized, empathetic content appropriate for {context.communication_type.value}
3. Include all required regulatory elements (claim number, contact info, appeal rights)
4. Provide specific next steps or actions
5. Maintain {self.tone_mapping.get(context.communication_type, CommunicationTone.PROFESSIONAL).value} tone
6. Ensure cultural sensitivity for {context.preferred_language.value} language
{language_instruction}

RESPONSE FORMAT (JSON):
{{
    "subject": "Clear, specific subject line",
    "content": "Full communication content with proper formatting",
    "next_steps": ["Specific action 1", "Specific action 2"],
    "contact_info": "Relevant contact information",
    "regulatory_disclaimers": ["Required disclaimer 1", "Required disclaimer 2"],
    "personalization_elements": ["Element 1", "Element 2"],
    "quality_score": 0.95
}}

Generate the communication now:"""

        return prompt

    def _validate_llm_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and enhance LLM response."""
        required_fields = ["subject", "content"]

        for field in required_fields:
            if field not in response or not response[field]:
                raise ValueError(f"Missing required field: {field}")

        # Add default values for missing optional fields
        response.setdefault("next_steps", [])
        response.setdefault(
            "contact_info", "Please contact customer service at 1-800-CLAIMS"
        )
        response.setdefault("regulatory_disclaimers", [])
        response.setdefault("personalization_elements", [])
        response.setdefault("quality_score", 0.8)

        return response

    def _parse_text_response(
        self, content: str, context: CommunicationContext
    ) -> Dict[str, Any]:
        """Parse text response when JSON parsing fails."""
        lines = content.split("\n")

        # Extract subject (usually first line or line starting with "Subject:")
        subject = ""
        content_lines = []

        for line in lines:
            if line.strip().lower().startswith("subject:"):
                subject = line.split(":", 1)[1].strip()
            elif line.strip() and not subject:
                subject = line.strip()
                break

        # Extract content (everything after subject)
        content_started = False
        for line in lines:
            if content_started or (subject and line.strip() != subject):
                content_started = True
                content_lines.append(line)

        return {
            "subject": subject or f"Regarding Your Claim {context.claim_id}",
            "content": "\n".join(content_lines).strip(),
            "next_steps": [],
            "contact_info": "Please contact customer service at 1-800-CLAIMS",
            "regulatory_disclaimers": [],
            "personalization_elements": ["customer_name", "claim_id"],
            "quality_score": 0.7,
        }

    def _apply_compliance_validation(
        self, communication_data: Dict[str, Any], context: CommunicationContext
    ) -> Dict[str, Any]:
        """Apply compliance validation and add required elements."""
        compliance_checks = []

        # Ensure claim number is included
        if context.claim_id not in communication_data["content"]:
            communication_data["content"] += f"\n\nClaim Number: {context.claim_id}"
            compliance_checks.append("claim_number_added")

        # Ensure contact information is included
        if "contact" not in communication_data["content"].lower():
            communication_data["content"] += f"\n\n{communication_data['contact_info']}"
            compliance_checks.append("contact_info_added")

        # Add regulatory disclaimers for certain communication types
        if context.communication_type in [
            CommunicationType.REJECTION_NOTIFICATION,
            CommunicationType.HUMAN_REVIEW_NOTIFICATION,
        ]:
            appeal_text = "\n\nYou have the right to appeal this decision. Please contact your state insurance commissioner for more information about the appeals process."
            if "appeal" not in communication_data["content"].lower():
                communication_data["content"] += appeal_text
                compliance_checks.append("appeal_rights_added")

        communication_data["compliance_verified"] = True
        communication_data["compliance_checks"] = compliance_checks

        return communication_data

    def _calculate_personalization_score(
        self, communication_data: Dict[str, Any], context: CommunicationContext
    ) -> float:
        """Calculate personalization score based on context usage."""
        score = 0.0
        max_score = 1.0

        # Check for customer name usage
        if context.customer_name.lower() in communication_data["content"].lower():
            score += 0.2

        # Check for claim-specific information
        if context.claim_id in communication_data["content"]:
            score += 0.2

        # Check for assessment result integration
        if context.assessment_result and any(
            key in communication_data["content"].lower()
            for key in ["decision", "assessment", "review"]
        ):
            score += 0.3

        # Check for policy-specific information
        if (
            context.policy_details
            and context.policy_number in communication_data["content"]
        ):
            score += 0.2

        # Check for appropriate tone
        tone_keywords = {
            CommunicationTone.CONGRATULATORY: [
                "congratulations",
                "pleased",
                "approved",
            ],
            CommunicationTone.EMPATHETIC: ["understand", "sorry", "regret"],
            CommunicationTone.PROFESSIONAL: ["review", "process", "information"],
            CommunicationTone.REASSURING: ["ensure", "committed", "support"],
        }

        expected_tone = self.tone_mapping.get(
            context.communication_type, CommunicationTone.PROFESSIONAL
        )
        if any(
            keyword in communication_data["content"].lower()
            for keyword in tone_keywords.get(expected_tone, [])
        ):
            score += 0.1

        return min(score, max_score)

    def get_communication_capabilities(self) -> Dict[str, Any]:
        """Get information about communication agent capabilities."""
        return {
            "agent_type": "enhanced_communication_agent",
            "llm_driven": True,
            "communication_types": [ct.value for ct in CommunicationType],
            "supported_languages": [lang.value for lang in Language],
            "tone_options": [tone.value for tone in CommunicationTone],
            "personalization_features": [
                "customer_name_integration",
                "claim_specific_content",
                "assessment_result_integration",
                "policy_context_awareness",
                "cultural_sensitivity",
                "tone_adaptation",
            ],
            "compliance_features": [
                "regulatory_disclaimers",
                "appeal_rights_information",
                "contact_information",
                "claim_number_inclusion",
                "state_specific_requirements",
            ],
            "quality_assurance": [
                "personalization_scoring",
                "compliance_validation",
                "tone_verification",
                "content_accuracy_checks",
            ],
        }

    async def generate_communication_from_assessment(
        self, assessment_result: Dict[str, Any], customer_data: Dict[str, Any]
    ) -> CommunicationResult:
        """
        Generate communication based on assessment result.

        Convenience method for orchestrator integration.
        """
        # Determine communication type based on assessment decision
        decision = assessment_result.get("decision", "").lower()

        if decision == "approve":
            comm_type = CommunicationType.APPROVAL_NOTIFICATION
        elif decision == "reject":
            comm_type = CommunicationType.REJECTION_NOTIFICATION
        elif decision == "human_review":
            comm_type = CommunicationType.HUMAN_REVIEW_NOTIFICATION
        elif decision == "investigate":
            comm_type = CommunicationType.INVESTIGATION_UPDATE
        else:
            comm_type = CommunicationType.CLAIM_STATUS_UPDATE

        # Create communication context
        context = CommunicationContext(
            customer_name=customer_data.get("customer_name", "Valued Customer"),
            claim_id=customer_data.get("claim_id", "N/A"),
            policy_number=customer_data.get("policy_number", "N/A"),
            communication_type=comm_type,
            assessment_result=assessment_result,
            policy_details=customer_data.get("policy_details"),
            preferred_language=Language(customer_data.get("preferred_language", "en")),
        )

        return await self.generate_communication(context)
