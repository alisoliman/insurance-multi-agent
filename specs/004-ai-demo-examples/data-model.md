# Data Model: AI-Powered Demo Example Generation

**Feature**: `004-ai-demo-examples`  
**Date**: 2026-01-18  
**Status**: Complete

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ScenarioGenerationRequest                    │
│  (API input for generating new scenarios)                       │
├─────────────────────────────────────────────────────────────────┤
│  locale: string (required)                                      │
│  claim_type: ClaimType (required)                               │
│  complexity: Complexity (optional, default: moderate)           │
│  custom_description: string (optional, mutually exclusive)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GeneratedScenario                          │
│  (Complete scenario with claim + policy data)                   │
├─────────────────────────────────────────────────────────────────┤
│  id: string (UUID, generated)                                   │
│  name: string (auto-generated or user-provided)                 │
│  locale: string                                                 │
│  claim_type: ClaimType                                          │
│  complexity: Complexity                                         │
│  claim: GeneratedClaim                                          │
│  policy: GeneratedPolicy                                        │
│  created_at: datetime                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────────┐     ┌───────────────────────────────┐
│     GeneratedClaim        │     │       GeneratedPolicy         │
│  (Claim data for workflow)│     │  (Policy markdown for search) │
├───────────────────────────┤     ├───────────────────────────────┤
│  claim_id: string         │     │  policy_number: string        │
│  policy_number: string    │◄────┤  policy_type: string          │
│  claimant_id: string      │     │  coverage_type: string        │
│  claimant_name: string    │     │  coverage_limits: Limits      │
│  incident_date: string    │     │  deductibles: Deductibles     │
│  claim_type: string       │     │  exclusions: list[string]     │
│  description: string      │     │  effective_date: string       │
│  estimated_damage: float  │     │  expiration_date: string      │
│  location: string         │     │  markdown_content: string     │
│  police_report: bool      │     └───────────────────────────────┘
│  photos_provided: bool    │
│  witness_statements: str  │
│  vehicle_info: VehicleInfo│
│  customer_info: Customer  │
└───────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       SavedScenario                             │
│  (Persisted scenario in SQLite database)                        │
├─────────────────────────────────────────────────────────────────┤
│  id: string (UUID, primary key)                                 │
│  name: string (user-provided)                                   │
│  locale: string                                                 │
│  claim_type: string                                             │
│  complexity: string                                             │
│  scenario_data: JSON (full GeneratedScenario serialized)        │
│  created_at: datetime                                           │
│  updated_at: datetime (optional)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Enumerations

### ClaimType
```
AUTO        - Vehicle-related claims (collision, theft, damage)
HOME        - Property claims (water damage, fire, theft)
HEALTH      - Medical claims (emergency, surgery, outpatient)
LIFE        - Life insurance claims (death benefit, disability)
COMMERCIAL  - Business claims (liability, property, fleet)
```

### Complexity
```
SIMPLE      - Clear-cut claim, single party, low value
MODERATE    - Some investigation needed, moderate value
COMPLEX     - Multiple parties, high value, investigation required
```

### Locale
```
US          - United States (English, USD)
UK          - United Kingdom (English, GBP)
DE          - Germany (German, EUR)
NL          - Netherlands (Dutch, EUR)
FR          - France (French, EUR)
ES          - Spain (Spanish, EUR)
JP          - Japan (Japanese, JPY)
AU          - Australia (English, AUD)
```

## Detailed Entity Definitions

### GeneratedClaim

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| claim_id | string | Yes | Unique claim identifier | Format: `CLM-{YYYY}-{NNN}` |
| policy_number | string | Yes | Referenced policy number | Must match GeneratedPolicy.policy_number |
| claimant_id | string | Yes | Claimant identifier | Format: `CLM-{NNN}` |
| claimant_name | string | Yes | Full name (locale-appropriate) | Non-empty, ≤100 chars |
| incident_date | string | Yes | Date of incident | ISO 8601 date format |
| claim_type | string | Yes | Type of claim | Must match ClaimType enum value |
| description | string | Yes | Incident description (local language) | Non-empty, ≤2000 chars |
| estimated_damage | float | Yes | Estimated damage amount | > 0, locale currency implied |
| location | string | Yes | Incident location | Locale-appropriate address format |
| police_report | boolean | No | Police report filed | Default: false |
| photos_provided | boolean | No | Photos available | Default: false |
| witness_statements | string | No | Number of witnesses | Numeric string or "none" |
| vehicle_info | VehicleInfo | No | Vehicle details (for auto claims) | Required if claim_type=AUTO |
| customer_info | CustomerInfo | No | Customer contact details | Optional |

### VehicleInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| vin | string | Yes | Vehicle Identification Number |
| make | string | Yes | Vehicle manufacturer |
| model | string | Yes | Vehicle model |
| year | integer | Yes | Manufacturing year |
| license_plate | string | Yes | License plate (locale format) |

### CustomerInfo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Customer full name |
| email | string | Yes | Email address |
| phone | string | Yes | Phone number (locale format) |

### GeneratedPolicy

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| policy_number | string | Yes | Unique policy identifier |
| policy_type | string | Yes | Type of policy (e.g., "Comprehensive Auto") |
| coverage_type | string | Yes | Coverage category |
| coverage_limits | Limits | Yes | Coverage limit amounts |
| deductibles | Deductibles | Yes | Deductible amounts |
| exclusions | list[string] | Yes | Policy exclusions |
| effective_date | string | Yes | Policy start date (ISO 8601) |
| expiration_date | string | Yes | Policy end date (ISO 8601) |
| markdown_content | string | Yes | Full policy document in markdown |

### Limits

| Field | Type | Description |
|-------|------|-------------|
| collision | float | Collision coverage limit |
| comprehensive | float | Comprehensive coverage limit |
| liability_per_person | float | Bodily injury per person |
| liability_per_accident | float | Bodily injury per accident |
| property_damage | float | Property damage limit |
| medical_payments | float | Medical payments limit |

### Deductibles

| Field | Type | Description |
|-------|------|-------------|
| collision | float | Collision deductible |
| comprehensive | float | Comprehensive deductible |

### SavedScenario (Database Schema)

```sql
CREATE TABLE saved_scenarios (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,                     -- User-provided name
    locale TEXT NOT NULL,                   -- Locale code (US, UK, DE, etc.)
    claim_type TEXT NOT NULL,               -- ClaimType enum value
    complexity TEXT NOT NULL,               -- Complexity enum value
    scenario_data TEXT NOT NULL,            -- JSON blob of GeneratedScenario
    created_at TEXT NOT NULL,               -- ISO 8601 datetime
    updated_at TEXT                         -- ISO 8601 datetime (nullable)
);

CREATE INDEX idx_scenarios_locale ON saved_scenarios(locale);
CREATE INDEX idx_scenarios_claim_type ON saved_scenarios(claim_type);
CREATE INDEX idx_scenarios_created_at ON saved_scenarios(created_at DESC);
```

## State Transitions

### Scenario Lifecycle

```
[Not Exists] ──generate──> [Generated] ──save──> [Saved]
                               │                    │
                               │                    ├──delete──> [Not Exists]
                               │                    │
                               └──discard──> [Not Exists]
                               
[Saved] ──load──> [Active in UI] ──run workflow──> [Processed]
```

### Generation Flow

```
1. Request received (ScenarioGenerationRequest)
2. Validate request parameters
3. Build LLM prompt with locale hints
4. Call Azure OpenAI with JSON mode
5. Parse and validate response against Pydantic models
6. Generate unique IDs (claim_id, policy_number)
7. Return GeneratedScenario
```

## Relationships

| Parent | Child | Cardinality | Description |
|--------|-------|-------------|-------------|
| GeneratedScenario | GeneratedClaim | 1:1 | Each scenario has exactly one claim |
| GeneratedScenario | GeneratedPolicy | 1:1 | Each scenario has exactly one policy |
| GeneratedClaim | VehicleInfo | 1:0..1 | Auto claims have vehicle info |
| GeneratedClaim | CustomerInfo | 1:0..1 | Optional customer contact |

## Compatibility with Existing Models

The `GeneratedClaim` model is designed to be fully compatible with the existing `ClaimIn` model in `backend/app/models/claim.py`. Key mapping:

| GeneratedClaim Field | ClaimIn Field | Notes |
|---------------------|---------------|-------|
| claim_id | claim_id | Direct mapping |
| policy_number | policy_number | Direct mapping |
| claimant_id | claimant_id | Direct mapping |
| claimant_name | claimant_name | Direct mapping |
| incident_date | incident_date | Direct mapping |
| claim_type | claim_type | Direct mapping |
| description | description | Local language text |
| estimated_damage | estimated_damage | Direct mapping |
| location | location | Locale-appropriate format |
| police_report | police_report | Direct mapping |
| photos_provided | photos_provided | Direct mapping |
| witness_statements | witness_statements | Direct mapping |
| vehicle_info | vehicle_info | Direct mapping (dict) |

This ensures generated scenarios can be passed directly to `/api/v1/workflow/run` without transformation.
