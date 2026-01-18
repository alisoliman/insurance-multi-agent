"""
AI-powered scenario generation service using Azure OpenAI.

Based on research.md from specs/004-ai-demo-examples/ and 005-complete-demo-pipeline/
"""

import asyncio
import json
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from openai import AzureOpenAI
from pydantic import ValidationError

from app.core.config import get_settings
from app.models.scenario import (
    ClaimType,
    Complexity,
    CoverageLimits,
    CustomerInfo,
    Deductibles,
    GeneratedClaim,
    GeneratedPolicy,
    GeneratedScenario,
    Locale,
    PresetTemplate,
    ScenarioGenerationOutput,
    ScenarioGenerationRequest,
    VehicleInfo,
)

logger = logging.getLogger(__name__)

# Locale configuration for prompt building
LOCALE_CONFIG = {
    Locale.US: {
        "language": "English",
        "currency": "USD",
        "country": "United States",
        "currency_symbol": "$",
        "example_names": ["John Smith", "Sarah Johnson", "Michael Williams"],
        "example_cities": ["New York", "Los Angeles", "Chicago"],
    },
    Locale.UK: {
        "language": "English",
        "currency": "GBP",
        "country": "United Kingdom",
        "currency_symbol": "£",
        "example_names": ["James Wilson", "Emma Thompson", "Oliver Brown"],
        "example_cities": ["London", "Manchester", "Birmingham"],
    },
    Locale.DE: {
        "language": "German",
        "currency": "EUR",
        "country": "Germany",
        "currency_symbol": "€",
        "example_names": ["Hans Müller", "Anna Schmidt", "Thomas Weber"],
        "example_cities": ["Berlin", "Munich", "Frankfurt"],
    },
    Locale.NL: {
        "language": "Dutch",
        "currency": "EUR",
        "country": "Netherlands",
        "currency_symbol": "€",
        "example_names": ["Jan de Vries", "Maria van den Berg", "Pieter Bakker"],
        "example_cities": ["Amsterdam", "Rotterdam", "The Hague"],
    },
    Locale.FR: {
        "language": "French",
        "currency": "EUR",
        "country": "France",
        "currency_symbol": "€",
        "example_names": ["Jean Dupont", "Marie Martin", "Pierre Bernard"],
        "example_cities": ["Paris", "Lyon", "Marseille"],
    },
    Locale.ES: {
        "language": "Spanish",
        "currency": "EUR",
        "country": "Spain",
        "currency_symbol": "€",
        "example_names": ["Carlos García", "María López", "José Martínez"],
        "example_cities": ["Madrid", "Barcelona", "Valencia"],
    },
    Locale.JP: {
        "language": "Japanese",
        "currency": "JPY",
        "country": "Japan",
        "currency_symbol": "¥",
        "example_names": ["田中太郎", "鈴木花子", "佐藤健一"],
        "example_cities": ["Tokyo", "Osaka", "Kyoto"],
    },
    Locale.AU: {
        "language": "English",
        "currency": "AUD",
        "country": "Australia",
        "currency_symbol": "$",
        "example_names": ["James Mitchell", "Sarah Cooper", "David Taylor"],
        "example_cities": ["Sydney", "Melbourne", "Brisbane"],
    },
}

# Complexity hints for prompt building
COMPLEXITY_CONFIG = {
    Complexity.SIMPLE: {
        "description": "A straightforward claim with a single party, clear circumstances, and low monetary value.",
        "damage_range": (500, 3000),
        "parties": "single party involved",
    },
    Complexity.MODERATE: {
        "description": "A claim requiring some investigation with moderate monetary value.",
        "damage_range": (3000, 15000),
        "parties": "possibly 2 parties involved",
    },
    Complexity.COMPLEX: {
        "description": "A complex claim with multiple parties, high value, requiring detailed investigation.",
        "damage_range": (15000, 100000),
        "parties": "multiple parties involved",
    },
}

# Preset templates for quick generation
PRESET_TEMPLATES = [
    PresetTemplate(
        id="dutch-auto",
        name="Dutch Auto Claim",
        locale=Locale.NL,
        claim_type=ClaimType.AUTO,
        complexity=Complexity.MODERATE,
        description="Auto collision scenario in the Netherlands",
    ),
    PresetTemplate(
        id="german-home",
        name="German Home Insurance",
        locale=Locale.DE,
        claim_type=ClaimType.HOME,
        complexity=Complexity.SIMPLE,
        description="Home insurance claim in Germany",
    ),
    PresetTemplate(
        id="uk-health",
        name="UK Health Emergency",
        locale=Locale.UK,
        claim_type=ClaimType.HEALTH,
        complexity=Complexity.MODERATE,
        description="Health emergency claim in the UK",
    ),
    PresetTemplate(
        id="us-auto",
        name="US Auto Accident",
        locale=Locale.US,
        claim_type=ClaimType.AUTO,
        complexity=Complexity.COMPLEX,
        description="Complex auto accident in the United States",
    ),
    PresetTemplate(
        id="french-commercial",
        name="French Commercial Claim",
        locale=Locale.FR,
        claim_type=ClaimType.COMMERCIAL,
        complexity=Complexity.COMPLEX,
        description="Commercial insurance claim in France",
    ),
    PresetTemplate(
        id="japanese-life",
        name="Japanese Life Insurance",
        locale=Locale.JP,
        claim_type=ClaimType.LIFE,
        complexity=Complexity.SIMPLE,
        description="Life insurance claim in Japan",
    ),
]


def infer_from_description(description: str) -> tuple[Optional[Locale], Optional[ClaimType], Optional[Complexity]]:
    """
    Infer locale, claim type, and complexity from a natural language description.
    
    This uses keyword matching as a fast pre-filter. The AI will still generate
    content based on the full description, but this helps set reasonable defaults.
    
    Args:
        description: Natural language description of the scenario
        
    Returns:
        Tuple of (inferred_locale, inferred_claim_type, inferred_complexity)
        Any value may be None if not inferrable
    """
    desc_lower = description.lower()
    
    # Locale inference based on city/country mentions
    inferred_locale = None
    locale_keywords = {
        Locale.NL: ["netherlands", "dutch", "amsterdam", "rotterdam", "the hague", "utrecht", "eindhoven"],
        Locale.DE: ["germany", "german", "berlin", "munich", "frankfurt", "hamburg", "stuttgart", "münchen"],
        Locale.UK: ["uk", "united kingdom", "britain", "british", "london", "manchester", "birmingham", "england", "scotland", "wales"],
        Locale.FR: ["france", "french", "paris", "lyon", "marseille", "toulouse", "nice", "bordeaux"],
        Locale.ES: ["spain", "spanish", "madrid", "barcelona", "valencia", "seville", "malaga"],
        Locale.JP: ["japan", "japanese", "tokyo", "osaka", "kyoto", "yokohama", "nagoya"],
        Locale.AU: ["australia", "australian", "sydney", "melbourne", "brisbane", "perth", "adelaide"],
        Locale.US: ["us", "usa", "united states", "american", "new york", "los angeles", "chicago", "houston", "phoenix"],
    }
    
    for locale, keywords in locale_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            inferred_locale = locale
            break
    
    # Claim type inference based on keywords
    inferred_claim_type = None
    claim_keywords = {
        ClaimType.AUTO: ["car", "auto", "vehicle", "collision", "crash", "accident", "van", "truck", "motorcycle", "driving", "parking", "traffic"],
        ClaimType.HOME: ["home", "house", "property", "water damage", "fire", "theft", "burglary", "roof", "flood", "pipe", "wiring", "electrical"],
        ClaimType.HEALTH: ["health", "medical", "hospital", "surgery", "doctor", "injury", "illness", "emergency", "ambulance", "treatment"],
        ClaimType.LIFE: ["life", "death", "deceased", "beneficiary", "terminal", "funeral"],
        ClaimType.COMMERCIAL: ["commercial", "business", "company", "office", "store", "warehouse", "inventory", "liability", "professional"],
    }
    
    for claim_type, keywords in claim_keywords.items():
        if any(kw in desc_lower for kw in keywords):
            inferred_claim_type = claim_type
            break
    
    # Complexity inference based on damage/severity indicators
    inferred_complexity = None
    if any(kw in desc_lower for kw in ["total loss", "multiple", "severe", "major", "extensive", "catastrophic", "multi-party", "lawsuit", "fatality"]):
        inferred_complexity = Complexity.COMPLEX
    elif any(kw in desc_lower for kw in ["minor", "small", "simple", "scratch", "dent", "basic"]):
        inferred_complexity = Complexity.SIMPLE
    elif any(kw in desc_lower for kw in ["moderate", "medium", "some damage", "investigation"]):
        inferred_complexity = Complexity.MODERATE
    
    logger.debug(
        f"Inferred from description: locale={inferred_locale}, "
        f"claim_type={inferred_claim_type}, complexity={inferred_complexity}"
    )
    
    return inferred_locale, inferred_claim_type, inferred_complexity


def build_generation_prompt(
    locale: Locale,
    claim_type: ClaimType,
    complexity: Complexity,
    custom_description: Optional[str] = None,
) -> str:
    """
    Build the prompt for scenario generation.
    
    Args:
        locale: Target locale/region
        claim_type: Type of insurance claim
        complexity: Complexity level
        custom_description: Optional custom description to incorporate
        
    Returns:
        Complete prompt string for Azure OpenAI
    """
    locale_info = LOCALE_CONFIG[locale]
    complexity_info = COMPLEXITY_CONFIG[complexity]
    
    base_prompt = f"""You are an insurance scenario generator. Generate a realistic insurance claim scenario for a demo application.

## Locale Requirements
- Country: {locale_info["country"]}
- Language: {locale_info["language"]}
- Currency: {locale_info["currency"]} ({locale_info["currency_symbol"]})
- Use culturally appropriate names (like: {", ".join(locale_info["example_names"])})
- Use real cities from: {", ".join(locale_info["example_cities"])}
- Use locale-appropriate address formats
- Use locale-appropriate phone number formats
- **IMPORTANT**: Write the claim description in {locale_info["language"]}

## Claim Type: {claim_type.value.upper()}
Generate a {claim_type.value} insurance claim.

## Complexity: {complexity.value.upper()}
{complexity_info["description"]}
Estimated damage should be between {complexity_info["damage_range"][0]} and {complexity_info["damage_range"][1]} {locale_info["currency"]}.
{complexity_info["parties"]}.

"""

    if custom_description:
        base_prompt += f"""## Custom Scenario Requirements
The user has provided this description. Incorporate these specific details:
"{custom_description}"

"""

    base_prompt += """## Output Requirements
Generate realistic, culturally appropriate data following the schema exactly.

Key requirements:
- The claim description MUST be in the local language (German for Germany, Dutch for Netherlands, etc.)
- Only include vehicle_info for auto claims. For other claim types, set it to null.
- Include customer_info for all scenarios.
- Use realistic addresses, phone numbers, and names for the locale.
- Ensure policy dates are sensible (effective in past, expiration in future).
- Estimated damage should match the complexity level specified.
"""

    return base_prompt


def generate_policy_markdown(
    policy: GeneratedPolicy,
    claim: GeneratedClaim,
    locale: Locale,
) -> str:
    """
    Generate a policy markdown document matching the existing policy format.
    
    Args:
        policy: Generated policy data
        claim: Generated claim data
        locale: Target locale for formatting
        
    Returns:
        Markdown content for the policy
    """
    locale_info = LOCALE_CONFIG[locale]
    currency = locale_info["currency_symbol"]
    
    markdown = f"""# {policy.policy_type} Policy

**Policy Number:** {policy.policy_number}  
**Policyholder:** {claim.claimant_name}  
**Effective Date:** {policy.effective_date}  
**Expiration Date:** {policy.expiration_date}

## Coverage Type
{policy.coverage_type}

## Coverage Limits

| Coverage | Limit |
|----------|-------|
| Collision | {currency}{policy.coverage_limits.collision:,.2f} |
| Comprehensive | {currency}{policy.coverage_limits.comprehensive:,.2f} |
| Bodily Injury (per person) | {currency}{policy.coverage_limits.liability_per_person:,.2f} |
| Bodily Injury (per accident) | {currency}{policy.coverage_limits.liability_per_accident:,.2f} |
| Property Damage | {currency}{policy.coverage_limits.property_damage:,.2f} |
| Medical Payments | {currency}{policy.coverage_limits.medical_payments:,.2f} |

## Deductibles

- Collision: {currency}{policy.deductibles.collision:,.2f}
- Comprehensive: {currency}{policy.deductibles.comprehensive:,.2f}

## Exclusions

The following are not covered under this policy:

{chr(10).join(f"- {exclusion}" for exclusion in policy.exclusions)}

## Claims Process

To file a claim, contact our claims department with your policy number and incident details.
All claims must be reported within 30 days of the incident.

---
*This policy document is generated for demonstration purposes.*
"""
    
    return markdown


class ScenarioGenerator:
    """Service for generating insurance claim scenarios using Azure OpenAI."""

    # T044: Limit concurrent API calls to prevent rate limiting
    _generation_semaphore = asyncio.Semaphore(3)  # Max 3 concurrent generations

    def __init__(self):
        settings = get_settings()
        
        if not settings.azure_openai_api_key or not settings.azure_openai_endpoint:
            logger.warning("Azure OpenAI credentials not configured - generation will fail")
            self.client = None
            self.deployment = None
        else:
            self.client = AzureOpenAI(
                api_key=settings.azure_openai_api_key,
                api_version="2024-08-01-preview",
                azure_endpoint=settings.azure_openai_endpoint,
            )
            self.deployment = settings.azure_openai_deployment_name or "gpt-4o"

    async def generate(
        self,
        request: ScenarioGenerationRequest,
        max_retries: int = 3,
    ) -> GeneratedScenario:
        """
        Generate a complete insurance scenario using SDK structured outputs.
        
        Uses client.beta.chat.completions.parse() with Pydantic model for
        type-safe generation with automatic validation.
        
        T044: Uses semaphore to limit concurrent generation requests and
        prevent API rate limiting.
        
        Args:
            request: Generation request with locale, claim_type, complexity, etc.
            max_retries: Maximum number of retry attempts on failure (default: 3)
            
        Returns:
            Complete generated scenario with claim and policy
            
        Raises:
            ValueError: If generation fails after retries
        """
        if not self.client:
            raise ValueError("Azure OpenAI not configured")

        # T044: Acquire semaphore to limit concurrent API calls
        async with self._generation_semaphore:
            return await self._generate_internal(request, max_retries)

    async def _generate_internal(
        self,
        request: ScenarioGenerationRequest,
        max_retries: int,
    ) -> GeneratedScenario:
        """Internal generation logic with retry handling."""
        # Use inference for custom descriptions to improve context
        effective_locale = request.locale
        effective_claim_type = request.claim_type
        effective_complexity = request.complexity
        
        if request.custom_description:
            inferred_locale, inferred_claim_type, inferred_complexity = infer_from_description(
                request.custom_description
            )
            # Only override if inference found something and the request used defaults
            # We check if the value is the default by comparing to the model's default
            if inferred_locale is not None:
                # Locale doesn't have a default, but we can suggest from description
                # Only use inferred if it provides more specific context
                logger.info(f"Inferred locale from description: {inferred_locale.value}")
            if inferred_claim_type is not None:
                effective_claim_type = inferred_claim_type
                logger.info(f"Inferred claim type from description: {inferred_claim_type.value}")
            if inferred_complexity is not None:
                effective_complexity = inferred_complexity
                logger.info(f"Inferred complexity from description: {inferred_complexity.value}")

        # Build the prompt with effective values
        prompt = build_generation_prompt(
            locale=effective_locale,
            claim_type=effective_claim_type,
            complexity=effective_complexity,
            custom_description=request.custom_description,
        )
        
        # Create an effective request for building the scenario
        effective_request = ScenarioGenerationRequest(
            locale=effective_locale,
            claim_type=effective_claim_type,
            complexity=effective_complexity,
            custom_description=request.custom_description,
        )

        last_error = None
        for attempt in range(max_retries + 1):
            try:
                logger.info(
                    f"Generating scenario (attempt {attempt + 1}/{max_retries + 1}): "
                    f"locale={effective_locale.value}, claim_type={effective_claim_type.value}, "
                    f"complexity={effective_complexity.value}, using_structured_output=True"
                )

                # Use SDK structured outputs with Pydantic model
                response = self.client.beta.chat.completions.parse(
                    model=self.deployment,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an insurance scenario generator. Generate realistic insurance claim scenarios for demo applications.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format=ScenarioGenerationOutput,
                    temperature=0.8,
                    max_tokens=2000,
                )

                # Get the parsed Pydantic model directly
                parsed_output = response.choices[0].message.parsed
                
                if not parsed_output:
                    # Check if there was a refusal
                    if response.choices[0].message.refusal:
                        raise ValueError(f"Model refused: {response.choices[0].message.refusal}")
                    raise ValueError("Empty parsed response from Azure OpenAI")

                logger.info(
                    f"Successfully parsed ScenarioGenerationOutput: "
                    f"scenario_name='{parsed_output.scenario_name}', "
                    f"claim_type='{parsed_output.claim.claim_type}'"
                )
                
                # Create the scenario from parsed Pydantic model
                return self._build_scenario_from_structured(parsed_output, effective_request)

            except ValidationError as e:
                last_error = f"Pydantic validation error: {e}"
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
            except json.JSONDecodeError as e:
                last_error = f"Invalid JSON response: {e}"
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt + 1} failed: {last_error}")

        raise ValueError(f"Failed to generate scenario after {max_retries + 1} attempts: {last_error}")

    def _build_scenario_from_structured(
        self,
        output: ScenarioGenerationOutput,
        request: ScenarioGenerationRequest,
    ) -> GeneratedScenario:
        """Build a GeneratedScenario from SDK structured output."""
        # Generate unique IDs
        scenario_id = str(uuid4())
        year = datetime.now().year
        claim_id = f"CLM-{year}-{random.randint(100, 999999):06d}"
        policy_number = f"POL-{request.locale.value}-{year}-{random.randint(100000, 999999)}"
        claimant_id = f"CLT-{random.randint(100, 999):03d}"

        claim_data = output.claim
        policy_data = output.policy

        # Build vehicle info if present and claim is auto
        vehicle_info = None
        if request.claim_type == ClaimType.AUTO and claim_data.vehicle_info:
            vi = claim_data.vehicle_info
            vehicle_info = VehicleInfo(
                vin=vi.vin or f"WVWZZZ1JZXW{random.randint(100000, 999999)}",
                make=vi.make or "Unknown",
                model=vi.model or "Unknown",
                year=vi.year or year - 2,
                license_plate=vi.license_plate or "XXX-000",
            )

        # Build customer info if present
        customer_info = None
        if claim_data.customer_info:
            ci = claim_data.customer_info
            customer_info = CustomerInfo(
                name=ci.name,
                email=ci.email,
                phone=ci.phone,
            )

        # Build the claim
        claim = GeneratedClaim(
            claim_id=claim_id,
            policy_number=policy_number,
            claimant_id=claimant_id,
            claimant_name=claim_data.claimant_name or "Unknown Claimant",
            incident_date=claim_data.incident_date or datetime.now().strftime("%Y-%m-%d"),
            claim_type=claim_data.claim_type or request.claim_type.value.title(),
            description=claim_data.description or "Insurance claim description",
            estimated_damage=float(claim_data.estimated_damage or 5000),
            location=claim_data.location or "Unknown location",
            police_report=claim_data.police_report or False,
            photos_provided=claim_data.photos_provided or False,
            witness_statements=str(claim_data.witness_statements or "none"),
            vehicle_info=vehicle_info,
            customer_info=customer_info,
        )

        # Build coverage limits from structured data
        limits = policy_data.coverage_limits
        coverage_limits = CoverageLimits(
            collision=limits.collision,
            comprehensive=limits.comprehensive,
            liability_per_person=limits.liability_per_person,
            liability_per_accident=limits.liability_per_accident,
            property_damage=limits.property_damage,
            medical_payments=limits.medical_payments,
        )

        # Build deductibles from structured data
        deducts = policy_data.deductibles
        deductibles = Deductibles(
            collision=deducts.collision,
            comprehensive=deducts.comprehensive,
        )

        # Use dates from structured output with sensible defaults
        effective_date = policy_data.effective_date or (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        expiration_date = policy_data.expiration_date or (datetime.now() + timedelta(days=185)).strftime("%Y-%m-%d")

        # Build the policy (without markdown first)
        policy = GeneratedPolicy(
            policy_number=policy_number,
            policy_type=policy_data.policy_type or f"Comprehensive {request.claim_type.value.title()}",
            coverage_type=policy_data.coverage_type or request.claim_type.value.title(),
            coverage_limits=coverage_limits,
            deductibles=deductibles,
            exclusions=policy_data.exclusions or ["Racing", "Intentional damage", "War"],
            effective_date=effective_date,
            expiration_date=expiration_date,
            markdown_content="",  # Placeholder, will be set below
        )

        # Generate policy markdown
        policy.markdown_content = generate_policy_markdown(policy, claim, request.locale)

        # Build and return the complete scenario
        return GeneratedScenario(
            id=scenario_id,
            name=output.scenario_name or f"{request.locale.value} {request.claim_type.value.title()} Claim",
            locale=request.locale,
            claim_type=request.claim_type,
            complexity=request.complexity,
            claim=claim,
            policy=policy,
            created_at=datetime.utcnow(),
        )

    def _build_scenario(
        self,
        data: dict,
        request: ScenarioGenerationRequest,
    ) -> GeneratedScenario:
        """Build a GeneratedScenario from parsed LLM output."""
        # Generate unique IDs
        scenario_id = str(uuid4())
        year = datetime.now().year
        claim_id = f"CLM-{year}-{random.randint(100, 999999):06d}"
        policy_number = f"POL-{request.locale.value}-{year}-{random.randint(100000, 999999)}"
        claimant_id = f"CLT-{random.randint(100, 999):03d}"

        claim_data = data.get("claim", {})
        policy_data = data.get("policy", {})
        scenario_name = data.get("scenario_name", f"{request.locale.value} {request.claim_type.value.title()} Claim")

        # Build vehicle info if present and claim is auto
        vehicle_info = None
        if request.claim_type == ClaimType.AUTO and claim_data.get("vehicle_info"):
            vi = claim_data["vehicle_info"]
            vehicle_info = VehicleInfo(
                vin=vi.get("vin", "WVWZZZ1JZXW" + str(random.randint(100000, 999999))),
                make=vi.get("make", "Unknown"),
                model=vi.get("model", "Unknown"),
                year=vi.get("year", year - 2),
                license_plate=vi.get("license_plate", "XXX-000"),
            )

        # Build the claim
        claim = GeneratedClaim(
            claim_id=claim_id,
            policy_number=policy_number,
            claimant_id=claimant_id,
            claimant_name=claim_data.get("claimant_name", "Unknown Claimant"),
            incident_date=claim_data.get("incident_date", datetime.now().strftime("%Y-%m-%d")),
            claim_type=claim_data.get("claim_type", request.claim_type.value.title()),
            description=claim_data.get("description", "Insurance claim description"),
            estimated_damage=float(claim_data.get("estimated_damage", 5000)),
            location=claim_data.get("location", "Unknown location"),
            police_report=claim_data.get("police_report", False),
            photos_provided=claim_data.get("photos_provided", False),
            witness_statements=str(claim_data.get("witness_statements", "none")),
            vehicle_info=vehicle_info,
        )

        # Build coverage limits
        limits_data = policy_data.get("coverage_limits", {})
        coverage_limits = CoverageLimits(
            collision=limits_data.get("collision", 50000),
            comprehensive=limits_data.get("comprehensive", 50000),
            liability_per_person=limits_data.get("liability_per_person", 100000),
            liability_per_accident=limits_data.get("liability_per_accident", 300000),
            property_damage=limits_data.get("property_damage", 100000),
            medical_payments=limits_data.get("medical_payments", 10000),
        )

        # Build deductibles
        deductibles_data = policy_data.get("deductibles", {})
        deductibles = Deductibles(
            collision=deductibles_data.get("collision", 500),
            comprehensive=deductibles_data.get("comprehensive", 250),
        )

        # Calculate policy dates
        effective_date = policy_data.get(
            "effective_date",
            (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d"),
        )
        expiration_date = policy_data.get(
            "expiration_date",
            (datetime.now() + timedelta(days=185)).strftime("%Y-%m-%d"),
        )

        # Build the policy (without markdown first)
        policy = GeneratedPolicy(
            policy_number=policy_number,
            policy_type=policy_data.get("policy_type", f"Comprehensive {request.claim_type.value.title()}"),
            coverage_type=policy_data.get("coverage_type", request.claim_type.value.title()),
            coverage_limits=coverage_limits,
            deductibles=deductibles,
            exclusions=policy_data.get("exclusions", ["Racing", "Intentional damage", "War"]),
            effective_date=effective_date,
            expiration_date=expiration_date,
            markdown_content="",  # Placeholder, will be set below
        )

        # Generate policy markdown
        policy.markdown_content = generate_policy_markdown(policy, claim, request.locale)

        # Build and return the complete scenario
        return GeneratedScenario(
            id=scenario_id,
            name=scenario_name,
            locale=request.locale,
            claim_type=request.claim_type,
            complexity=request.complexity,
            claim=claim,
            policy=policy,
            created_at=datetime.utcnow(),
        )

    def get_templates(self) -> list[PresetTemplate]:
        """Get the list of preset templates."""
        return PRESET_TEMPLATES


# Module-level instance for convenience
_generator: Optional[ScenarioGenerator] = None


def get_scenario_generator() -> ScenarioGenerator:
    """Get the scenario generator singleton."""
    global _generator
    if _generator is None:
        _generator = ScenarioGenerator()
    return _generator


async def reindex_saved_policies() -> int:
    """
    Re-index all saved scenario policies into the FAISS vector store.
    
    This function should be called on application startup to ensure
    all previously saved policies are searchable by the Policy Checker agent.
    
    Returns:
        Number of policies successfully indexed
    """
    from app.db.policy_repo import list_all_policies
    from app.workflow.policy_search import get_policy_search
    
    logger.info("Starting policy re-indexing from saved scenarios...")
    
    try:
        policies = await list_all_policies()
        
        if not policies:
            logger.info("No saved policies to re-index")
            return 0
        
        policy_search = get_policy_search()
        indexed_count = 0
        
        for policy in policies:
            try:
                # Generate markdown content for the policy
                from app.models.scenario import CoverageLimits, Deductibles, GeneratedPolicy, GeneratedClaim, Locale
                
                # Reconstruct CoverageLimits from dict
                coverage_limits = CoverageLimits(
                    collision=policy.coverage_limits.get("collision", 50000),
                    comprehensive=policy.coverage_limits.get("comprehensive", 50000),
                    liability_per_person=policy.coverage_limits.get("liability_per_person", 100000),
                    liability_per_accident=policy.coverage_limits.get("liability_per_accident", 300000),
                    property_damage=policy.coverage_limits.get("property_damage", 100000),
                    medical_payments=policy.coverage_limits.get("medical_payments", 10000),
                )
                
                # Create a minimal GeneratedPolicy for markdown generation
                gen_policy = GeneratedPolicy(
                    policy_number=policy.policy_number,
                    policy_type=policy.policy_type,
                    coverage_type=policy.policy_type,  # Reuse policy_type as coverage_type
                    coverage_limits=coverage_limits,
                    deductibles=Deductibles(collision=policy.deductible, comprehensive=250),
                    exclusions=["Racing", "Intentional damage", "War"],
                    effective_date=policy.effective_date,
                    expiration_date=policy.expiration_date,
                    markdown_content="",  # Will be generated
                )
                
                # Create a minimal claim for markdown generation
                gen_claim = GeneratedClaim(
                    claim_id=f"CLM-TEMP-{policy.policy_number}",
                    policy_number=policy.policy_number,
                    claimant_id="CLT-TEMP",
                    claimant_name=policy.customer_name,
                    incident_date=policy.effective_date,
                    claim_type=policy.policy_type,
                    description="Temporary claim for policy indexing",
                    estimated_damage=0,
                    location="N/A",
                )
                
                # Generate markdown
                markdown_content = generate_policy_markdown(gen_policy, gen_claim, Locale.US)
                
                # Add to vector index
                success = policy_search.add_policy_from_text(
                    policy_number=policy.policy_number,
                    policy_type=policy.policy_type,
                    markdown_content=markdown_content,
                )
                
                if success:
                    indexed_count += 1
                    logger.debug(f"Indexed policy: {policy.policy_number}")
                else:
                    logger.warning(f"Failed to index policy: {policy.policy_number}")
                    
            except Exception as e:
                logger.error(f"Error indexing policy {policy.policy_number}: {e}")
                continue
        
        logger.info(f"Policy re-indexing complete: {indexed_count}/{len(policies)} policies indexed")
        return indexed_count
        
    except Exception as e:
        logger.error(f"Policy re-indexing failed: {e}")
        return 0
