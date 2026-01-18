# Data Model: Complete Demo Scenario Pipeline

**Feature**: 005-complete-demo-pipeline  
**Date**: 2026-01-18  
**Status**: Complete

## Entity Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   GeneratedScenario │────<│     Vehicle      │<────│     Policy       │
│   (saved_scenarios) │     │     (NEW)        │     │     (NEW)        │
└─────────────────────┘     └──────────────────┘     └──────────────────┘
          │                                                   │
          │ contains                                          │ indexed in
          ▼                                                   ▼
┌─────────────────────┐                              ┌──────────────────┐
│   GeneratedPolicy   │─────────────────────────────>│  FAISS Index     │
│   (in-memory model) │                              │  (re-indexed)    │
└─────────────────────┘                              └──────────────────┘
          │
          │ references
          ▼
┌─────────────────────┐
│   GeneratedClaim    │
│   (in-memory model) │
└─────────────────────┘
```

**Data Flow on Save:**
1. GeneratedScenario → `saved_scenarios` table (full JSON)
2. VehicleInfo → `vehicles` table (direct lookup by VIN)
3. GeneratedPolicy → `policies` table (direct lookup by policy_number)
4. Policy text → FAISS index (semantic search)

## Database Schema

### Existing Table: saved_scenarios

```sql
-- Already exists in database.py
CREATE TABLE IF NOT EXISTS saved_scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    scenario_data TEXT NOT NULL,  -- JSON blob
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### New Table: vehicles

```sql
CREATE TABLE IF NOT EXISTS vehicles (
    vin TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT NOT NULL,
    color TEXT,
    vehicle_type TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE
);

-- Indexes for lookup patterns
CREATE INDEX IF NOT EXISTS idx_vehicles_policy_number ON vehicles(policy_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_scenario_id ON vehicles(scenario_id);
```

### New Table: policies

```sql
CREATE TABLE IF NOT EXISTS policies (
    policy_number TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    coverage_types TEXT NOT NULL,  -- JSON array: ["collision", "comprehensive", "liability"]
    coverage_limits TEXT NOT NULL, -- JSON object: {"collision": 50000, "liability": 100000}
    deductible REAL NOT NULL,
    premium REAL NOT NULL,
    effective_date TEXT NOT NULL,
    expiration_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    vin TEXT,  -- Link to vehicle
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE,
    FOREIGN KEY (vin) REFERENCES vehicles(vin) ON DELETE SET NULL
);

-- Indexes for lookup patterns
CREATE INDEX IF NOT EXISTS idx_policies_scenario_id ON policies(scenario_id);
CREATE INDEX IF NOT EXISTS idx_policies_customer ON policies(customer_name);
```

**Migration Strategy**: Add table creation to `init_db()` function in database.py. Existing data unaffected.

## Pydantic Models

### Existing Models (no changes needed)

```python
# backend/app/models/scenario.py - Already defined

class VehicleInfo(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    license_plate: str
    color: str = "Silver"
    vehicle_type: str = "sedan"

class CustomerInfo(BaseModel):
    name: str
    policy_number: str
    email: str
    phone: str

class GeneratedClaim(BaseModel):
    description: str
    damage_type: str
    severity: str
    estimated_amount: float
    date_of_incident: str
    location: str
    vehicle_info: VehicleInfo
    has_photos: bool = False
    has_police_report: bool = False
    has_witness_statements: bool = False
    weather_conditions: str | None = None
    time_of_day: str | None = None
    road_conditions: str | None = None

class GeneratedPolicy(BaseModel):
    policy_number: str
    policy_type: str
    coverage_types: list[str]
    coverage_limits: dict[str, Any]
    deductible: float
    premium: float
    effective_date: str
    expiration_date: str
    customer_info: CustomerInfo
    vehicle_info: VehicleInfo

class GeneratedScenario(BaseModel):
    id: str
    name: str
    description: str
    complexity: str
    claim: GeneratedClaim
    policy: GeneratedPolicy
    expected_outcome: str
    key_points: list[str]
    workflow_tips: list[str]
    created_at: str
```

### New Model: ScenarioGenerationOutput

```python
# backend/app/models/scenario.py - ADD THIS

class ScenarioGenerationOutput(BaseModel):
    """
    Model passed to OpenAI SDK response_format for structured output.
    Used directly with client.beta.chat.completions.parse()
    """
    scenario_name: str = Field(description="A descriptive 3-5 word name for this scenario")
    scenario_description: str = Field(description="2-3 sentence description of the claim scenario")
    complexity: Literal["simple", "moderate", "complex"] = Field(description="Scenario complexity level")
    expected_outcome: str = Field(description="Expected claim processing result")
    key_points: list[str] = Field(description="3-5 key demonstration points")
    workflow_tips: list[str] = Field(description="2-3 tips for presenters")
    
    # Nested objects
    claim_data: GeneratedClaimData
    policy_data: GeneratedPolicyData
    
class GeneratedClaimData(BaseModel):
    """Claim data portion of scenario generation output"""
    description: str
    damage_type: str
    severity: Literal["minor", "moderate", "severe", "total_loss"]
    estimated_amount: float = Field(ge=0)
    date_of_incident: str = Field(description="ISO date format YYYY-MM-DD")
    location: str
    weather_conditions: str | None = None
    time_of_day: str | None = None
    road_conditions: str | None = None
    
class GeneratedPolicyData(BaseModel):
    """Policy data portion of scenario generation output"""
    policy_type: Literal["basic", "standard", "premium", "comprehensive"]
    coverage_types: list[str]
    coverage_limits: dict[str, float]
    deductible: float = Field(ge=0)
    premium: float = Field(ge=0)
    effective_date: str = Field(description="ISO date format YYYY-MM-DD")
    expiration_date: str = Field(description="ISO date format YYYY-MM-DD")
```

### New Model: VehicleCreate (Repository DTO)

```python
# backend/app/db/vehicle_repo.py - ADD THIS

class VehicleCreate(BaseModel):
    """DTO for creating vehicle database entry"""
    vin: str
    scenario_id: str
    policy_number: str
    make: str
    model: str
    year: int
    license_plate: str
    color: str | None = None
    vehicle_type: str | None = None

class VehicleRecord(BaseModel):
    """Vehicle record from database"""
    vin: str
    scenario_id: str
    policy_number: str
    make: str
    model: str
    year: int
    license_plate: str
    color: str | None
    vehicle_type: str | None
    created_at: str
```

### New Model: PolicyCreate (Repository DTO)

```python
# backend/app/db/policy_repo.py - ADD THIS

class PolicyCreate(BaseModel):
    """DTO for creating policy database entry"""
    policy_number: str
    scenario_id: str
    policy_type: str
    coverage_types: list[str]
    coverage_limits: dict[str, float]
    deductible: float
    premium: float
    effective_date: str
    expiration_date: str
    customer_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    vin: str | None = None

class PolicyRecord(BaseModel):
    """Policy record from database - used by workflow agents"""
    policy_number: str
    scenario_id: str
    policy_type: str
    coverage_types: list[str]
    coverage_limits: dict[str, float]
    deductible: float
    premium: float
    effective_date: str
    expiration_date: str
    customer_name: str
    customer_email: str | None
    customer_phone: str | None
    vin: str | None
    created_at: str
    
    def has_coverage(self, coverage_type: str) -> bool:
        """Check if policy covers a specific type"""
        return coverage_type.lower() in [c.lower() for c in self.coverage_types]
    
    def get_limit(self, coverage_type: str) -> float | None:
        """Get coverage limit for a specific type"""
        return self.coverage_limits.get(coverage_type)
```

## State Transitions

### Scenario Generation Flow

```
[User Request]
      │
      ▼
┌─────────────────┐
│  Generate via   │
│  LLM (Pydantic) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ ScenarioGen-    │───>│ GeneratedPolicy │
│ erationOutput   │    └────────┬────────┘
└────────┬────────┘             │
         │                      ▼
         │              ┌─────────────────┐
         │              │ Index in FAISS  │
         │              │ (session-only)  │
         │              └─────────────────┘
         ▼
┌─────────────────┐    ┌─────────────────┐
│ GeneratedScen-  │───>│ Vehicle record  │
│ ario (saved)    │    │ (SQLite)        │
└─────────────────┘    └─────────────────┘
```

### Policy Index States

| State | Description |
|-------|-------------|
| NOT_INDEXED | Policy generated but not yet added to FAISS |
| INDEXED_SESSION | Policy in FAISS, cleared on restart |

### Vehicle Record States

| State | Description |
|-------|-------------|
| CREATED | Vehicle saved with scenario |
| DELETED | Cascade deleted when scenario removed |

## Validation Rules

### VehicleInfo
- `vin`: 17 characters, alphanumeric
- `year`: 1900-2030 (reasonable range)
- `license_plate`: Non-empty string

### GeneratedClaim
- `estimated_amount`: >= 0
- `severity`: One of ["minor", "moderate", "severe", "total_loss"]
- `date_of_incident`: Valid ISO date, not in future

### GeneratedPolicy
- `effective_date` < `expiration_date`
- `deductible`: >= 0
- `coverage_limits` values: All >= 0

## Relationships

| Parent | Child | Cardinality | Cascade |
|--------|-------|-------------|---------|
| saved_scenarios | vehicles | 1:1 | DELETE |
| saved_scenarios | policies | 1:1 | DELETE |
| policies | vehicles | 1:1 | SET NULL (vin FK) |
