"""
Pydantic models for AI-powered demo scenario generation.

Based on data-model.md from specs/004-ai-demo-examples/ and 005-complete-demo-pipeline/
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class ClaimType(str, Enum):
    """Insurance claim types."""
    AUTO = "auto"
    HOME = "home"
    HEALTH = "health"
    LIFE = "life"
    COMMERCIAL = "commercial"


class Complexity(str, Enum):
    """Scenario complexity levels."""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class Locale(str, Enum):
    """Supported locale codes."""
    US = "US"
    UK = "UK"
    DE = "DE"
    NL = "NL"
    FR = "FR"
    ES = "ES"
    JP = "JP"
    AU = "AU"


# =============================================================================
# SDK Structured Output Models (Feature 005)
# For use with client.beta.chat.completions.parse()
# =============================================================================

class GeneratedVehicleData(BaseModel):
    """Vehicle data from LLM - used in SDK structured output."""
    vin: str = Field(
        ...,
        description="Vehicle Identification Number - 17 characters, like WVWZZZ1JZXW123456",
    )
    make: str = Field(..., description="Vehicle manufacturer, e.g., Volkswagen, Toyota, BMW")
    model: str = Field(..., description="Vehicle model name, e.g., Golf, Camry, 3 Series")
    year: int = Field(
        ...,
        ge=1990,
        le=2030,
        description="Manufacturing year between 1990 and 2030",
    )
    license_plate: str = Field(
        ...,
        description="License plate in locale-appropriate format, e.g., AB-123-CD for Germany",
    )
    color: Optional[str] = Field(
        default=None,
        description="Vehicle color if relevant to the claim, e.g., Silver, Black, Red",
    )


class GeneratedCustomerData(BaseModel):
    """Customer contact data from LLM - used in SDK structured output."""
    name: str = Field(
        ...,
        description="Customer full name in local format, e.g., 'Hans Müller' for Germany",
    )
    email: str = Field(
        ...,
        description="Valid email address, e.g., hans.mueller@example.de",
    )
    phone: str = Field(
        ...,
        description="Phone number in locale format, e.g., +49 151 12345678 for Germany",
    )


class GeneratedClaimData(BaseModel):
    """Claim data portion from LLM SDK structured output."""
    claimant_name: str = Field(
        ...,
        max_length=100,
        description="Full name in local format, e.g., 'Jan de Vries' for Netherlands",
    )
    incident_date: str = Field(
        ...,
        description="Date of incident in ISO 8601 format: YYYY-MM-DD, e.g., 2024-01-15",
    )
    claim_type: str = Field(
        ...,
        description="Descriptive claim type like 'Auto Collision', 'Water Damage', 'Medical Emergency'",
    )
    description: str = Field(
        ...,
        max_length=2000,
        description="Detailed incident description IN THE LOCAL LANGUAGE. For Germany use German, etc.",
    )
    estimated_damage: float = Field(
        ...,
        gt=0,
        description="Estimated damage amount in local currency as a number without currency symbols",
    )
    location: str = Field(
        ...,
        description="Full address in locale format, e.g., 'Kurfürstendamm 123, 10719 Berlin, Germany'",
    )
    police_report: bool = Field(
        default=False,
        description="Whether a police report was filed. True for serious accidents.",
    )
    photos_provided: bool = Field(
        default=False,
        description="Whether photos of damage are available. Set to false to demonstrate documentation hints.",
    )
    witness_statements: str = Field(
        default="none",
        description="Number of witness statements: 'none', '1', '2', or '3+'",
    )
    vehicle_info: Optional[GeneratedVehicleData] = Field(
        default=None,
        description="Vehicle details - REQUIRED for auto claims, null for other claim types",
    )
    customer_info: Optional[GeneratedCustomerData] = Field(
        default=None,
        description="Customer contact details - include for all scenarios",
    )


class GeneratedCoverageLimitsData(BaseModel):
    """Coverage limits from LLM SDK structured output."""
    collision: float = Field(
        default=50000,
        description="Collision coverage limit in local currency",
    )
    comprehensive: float = Field(
        default=50000,
        description="Comprehensive coverage limit in local currency",
    )
    liability_per_person: float = Field(
        default=100000,
        description="Bodily injury limit per person",
    )
    liability_per_accident: float = Field(
        default=300000,
        description="Bodily injury limit per accident total",
    )
    property_damage: float = Field(
        default=100000,
        description="Property damage liability limit",
    )
    medical_payments: float = Field(
        default=10000,
        description="Medical payments coverage limit",
    )


class GeneratedDeductiblesData(BaseModel):
    """Deductibles from LLM SDK structured output."""
    collision: float = Field(
        default=500,
        description="Collision deductible amount in local currency",
    )
    comprehensive: float = Field(
        default=250,
        description="Comprehensive deductible amount in local currency",
    )


class GeneratedPolicyData(BaseModel):
    """Policy data portion from LLM SDK structured output."""
    policy_type: str = Field(
        ...,
        description="Policy type like 'Comprehensive Auto', 'Homeowners', 'Term Life'",
    )
    coverage_type: str = Field(
        ...,
        description="Coverage category matching claim type, e.g., 'Auto', 'Home', 'Health'",
    )
    coverage_limits: GeneratedCoverageLimitsData = Field(
        default_factory=GeneratedCoverageLimitsData,
        description="Coverage limit amounts",
    )
    deductibles: GeneratedDeductiblesData = Field(
        default_factory=GeneratedDeductiblesData,
        description="Deductible amounts",
    )
    exclusions: list[str] = Field(
        default_factory=lambda: ["Racing", "Intentional damage", "War"],
        description="List of policy exclusions - 3 to 6 items typical",
    )
    effective_date: str = Field(
        ...,
        description="Policy start date in ISO 8601 format, should be in the past",
    )
    expiration_date: str = Field(
        ...,
        description="Policy end date in ISO 8601 format, should be in the future",
    )


class ScenarioGenerationOutput(BaseModel):
    """
    Complete LLM output model for SDK structured outputs.
    
    Used with client.beta.chat.completions.parse(response_format=ScenarioGenerationOutput)
    """
    claim: GeneratedClaimData = Field(
        ...,
        description="Complete claim data for the scenario",
    )
    policy: GeneratedPolicyData = Field(
        ...,
        description="Complete policy data for the scenario",
    )
    scenario_name: str = Field(
        ...,
        max_length=100,
        description="Short descriptive name for this scenario, e.g., 'Berlin Auto Collision'",
    )


# =============================================================================
# Internal Application Models (Original - unchanged)
# =============================================================================


class VehicleInfo(BaseModel):
    """Vehicle details for auto claims."""
    vin: str = Field(..., description="Vehicle Identification Number")
    make: str = Field(..., description="Vehicle manufacturer")
    model: str = Field(..., description="Vehicle model")
    year: int = Field(..., ge=1900, le=2100, description="Manufacturing year")
    license_plate: str = Field(..., description="License plate (locale format)")


class CustomerInfo(BaseModel):
    """Customer contact details."""
    name: str = Field(..., description="Customer full name")
    email: str = Field(..., description="Email address")
    phone: str = Field(..., description="Phone number (locale format)")


class CoverageLimits(BaseModel):
    """Coverage limit amounts."""
    collision: float = Field(default=50000, description="Collision coverage limit")
    comprehensive: float = Field(default=50000, description="Comprehensive coverage limit")
    liability_per_person: float = Field(default=100000, description="Bodily injury per person")
    liability_per_accident: float = Field(default=300000, description="Bodily injury per accident")
    property_damage: float = Field(default=100000, description="Property damage limit")
    medical_payments: float = Field(default=10000, description="Medical payments limit")


class Deductibles(BaseModel):
    """Deductible amounts."""
    collision: float = Field(default=500, description="Collision deductible")
    comprehensive: float = Field(default=250, description="Comprehensive deductible")


class GeneratedClaim(BaseModel):
    """Claim data for workflow - compatible with existing ClaimIn model."""
    claim_id: str = Field(..., pattern=r"^CLM-\d{4}-\d{3,6}$", description="Unique claim identifier")
    policy_number: str = Field(..., description="Referenced policy number")
    claimant_id: str = Field(..., description="Claimant identifier")
    claimant_name: str = Field(..., max_length=100, description="Full name (locale-appropriate)")
    incident_date: str = Field(..., description="Date of incident (ISO 8601)")
    claim_type: str = Field(..., description="Type of claim")
    description: str = Field(..., max_length=2000, description="Incident description (local language)")
    estimated_damage: float = Field(..., gt=0, description="Estimated damage amount")
    location: str = Field(..., description="Incident location")
    police_report: bool = Field(default=False, description="Police report filed")
    photos_provided: bool = Field(default=False, description="Photos available")
    witness_statements: str = Field(default="none", description="Number of witnesses")
    vehicle_info: Optional[VehicleInfo] = Field(default=None, description="Vehicle details (for auto claims)")
    customer_info: Optional[CustomerInfo] = Field(default=None, description="Customer contact details")


class GeneratedPolicy(BaseModel):
    """Policy markdown for search."""
    policy_number: str = Field(..., description="Unique policy identifier")
    policy_type: str = Field(..., description="Type of policy")
    coverage_type: str = Field(..., description="Coverage category")
    coverage_limits: CoverageLimits = Field(default_factory=CoverageLimits)
    deductibles: Deductibles = Field(default_factory=Deductibles)
    exclusions: list[str] = Field(default_factory=list, description="Policy exclusions")
    effective_date: str = Field(..., description="Policy start date (ISO 8601)")
    expiration_date: str = Field(..., description="Policy end date (ISO 8601)")
    markdown_content: str = Field(..., description="Full policy document in markdown")


class GeneratedScenario(BaseModel):
    """Complete scenario with claim + policy data."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="UUID")
    name: str = Field(..., description="Auto-generated or user-provided name")
    locale: Locale = Field(..., description="Locale code")
    claim_type: ClaimType = Field(..., description="Claim type")
    complexity: Complexity = Field(..., description="Complexity level")
    claim: GeneratedClaim = Field(..., description="Claim data")
    policy: GeneratedPolicy = Field(..., description="Policy data")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")


class ScenarioGenerationRequest(BaseModel):
    """API input for generating new scenarios."""
    locale: Locale = Field(..., description="Target locale/region")
    claim_type: ClaimType = Field(default=ClaimType.AUTO, description="Type of claim")
    complexity: Complexity = Field(default=Complexity.MODERATE, description="Complexity level")
    custom_description: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Free-form description for custom scenario generation"
    )


class SaveScenarioRequest(BaseModel):
    """Request to save a generated scenario."""
    name: str = Field(..., max_length=100, description="User-provided name")
    scenario: GeneratedScenario = Field(..., description="Scenario to save")


class SavedScenarioSummary(BaseModel):
    """Summary of a saved scenario for list display."""
    id: str = Field(..., description="UUID")
    name: str = Field(..., description="User-provided name")
    locale: Locale = Field(..., description="Locale code")
    claim_type: ClaimType = Field(..., description="Claim type")
    complexity: Complexity = Field(..., description="Complexity level")
    estimated_damage: float = Field(..., description="Claim estimated damage for display")
    created_at: datetime = Field(..., description="Creation timestamp")


class SavedScenario(GeneratedScenario):
    """Saved scenario with optional update timestamp."""
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")


class ScenarioListResponse(BaseModel):
    """Response for list scenarios endpoint."""
    scenarios: list[SavedScenarioSummary] = Field(default_factory=list)
    total: int = Field(..., description="Total count of matching scenarios")
    limit: int = Field(default=50)
    offset: int = Field(default=0)


class PresetTemplate(BaseModel):
    """Preset regional template for quick generation."""
    id: str = Field(..., description="Template ID")
    name: str = Field(..., description="Display name")
    locale: Locale = Field(..., description="Locale code")
    claim_type: ClaimType = Field(..., description="Claim type")
    complexity: Complexity = Field(..., description="Complexity level")
    description: str = Field(default="", description="Template description")


class TemplateListResponse(BaseModel):
    """Response for templates endpoint."""
    templates: list[PresetTemplate] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    """Error response for API errors."""
    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable message")
    details: Optional[dict] = Field(default=None, description="Additional error context")
