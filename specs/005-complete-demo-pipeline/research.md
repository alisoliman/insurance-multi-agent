# Research: Complete Demo Scenario Pipeline

**Feature**: 005-complete-demo-pipeline  
**Date**: 2026-01-18  
**Status**: Complete

## Research Questions

### RQ1: How to use Pydantic structured outputs with OpenAI SDK?

**Context**: Current scenario_generator.py uses `response_format={"type": "json_object"}` with manual JSON parsing. Need to use Pydantic models directly.

**Finding**: The OpenAI Python SDK (v1.0+) supports structured outputs via `response_format` parameter with a Pydantic model class. The SDK uses the model's JSON schema.

**Decision**: Use `client.beta.chat.completions.parse()` method with Pydantic model
**Rationale**: This is the recommended approach for structured outputs in OpenAI SDK v1.x
**Alternatives Considered**: 
- Continue with JSON mode + manual parsing (rejected: more error-prone, no schema enforcement)
- Use instructor library (rejected: unnecessary dependency when SDK supports it natively)

**Implementation Pattern**:
```python
from pydantic import BaseModel
from openai import AzureOpenAI

class ScenarioGenerationOutput(BaseModel):
    """Model for LLM to populate - used as response_format"""
    claim: GeneratedClaimData
    policy: GeneratedPolicyData
    scenario_name: str

# Use parse() method for structured output
response = client.beta.chat.completions.parse(
    model=deployment,
    messages=[...],
    response_format=ScenarioGenerationOutput,
)
scenario_data = response.choices[0].message.parsed  # Already a Pydantic model
```

### RQ2: Best practice for dynamic FAISS index updates?

**Context**: Generated policies need to be searchable immediately after generation AND survive server restarts.

**Finding**: FAISS supports incremental document addition via `vectorstore.add_documents()`. Current implementation adds to index but doesn't persist. However, policy data IS persisted in `saved_scenarios.scenario_data` JSON.

**Decision**: Re-index saved scenario policies on server startup
**Rationale**: 
- Policy data already persisted in scenarios table (no duplication)
- Automatically cleaned up when scenario deleted (CASCADE)
- No separate policy files to manage
- Works seamlessly with existing `add_policy_from_text()`

**Implementation**:
```python
# In app startup (main.py lifespan)
async def reindex_saved_policies():
    """Re-add policies from saved scenarios to FAISS index on startup"""
    scenarios = await scenario_repo.list_all()
    for scenario in scenarios:
        policy_text = format_policy_as_document(scenario.policy)
        await policy_search.add_policy_from_text(
            policy_text, 
            policy_number=scenario.policy.policy_number
        )
    logger.info(f"Re-indexed {len(scenarios)} saved scenario policies")
```

**Alternatives Considered**:
- Persist policies as separate markdown files (rejected: duplication, file management overhead)
- Persist FAISS index to disk (rejected: index format changes, stale data issues)
- Session-only indexing (rejected: workflows fail after restart)

### RQ3: SQLite schema for vehicle persistence?

**Context**: Need permanent storage for vehicle data per clarification session.

**Finding**: Current `saved_scenarios` table stores full scenario JSON including vehicle_info. However, for workflow lookups, we may need vehicles queryable by VIN or policy_number.

**Decision**: Add `vehicles` table with foreign key to scenarios
**Rationale**: Enables direct vehicle lookup without parsing scenario JSON
**Schema**:
```sql
CREATE TABLE IF NOT EXISTS vehicles (
    vin TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_policy ON vehicles(policy_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_scenario ON vehicles(scenario_id);
```

### RQ4: Policy Checker fallback when index search fails?

**Context**: Per clarification, should return INSUFFICIENT_EVIDENCE when policy not found in index.

**Finding**: Current `CoverageStatus` enum already has `INSUFFICIENT_EVIDENCE` value in `app/models/agent_outputs.py`.

**Decision**: Modify Policy Checker tool to catch search failures and return INSUFFICIENT_EVIDENCE status
**Rationale**: Workflow continues with degraded accuracy rather than failing entirely
**Implementation**: In `policy_search.py`, wrap search in try/catch, return empty results on failure with warning log.

### RQ5: Documentation hints UI pattern?

**Context**: Need subtle, non-intrusive hints about documentation status.

**Finding**: shadcn/ui has `Badge`, `Tooltip`, and `Alert` components suitable for this. Tabler icons provides appropriate icons (IconPhoto, IconFileText, IconAlertCircle).

**Decision**: Use Badge with muted variant + Tooltip for detailed explanation
**Rationale**: 
- Badge is visually subtle (small, muted colors)
- Tooltip provides detail on hover without cluttering UI
- Consistent with existing UI patterns in the project

**Design**:
```tsx
// Missing documentation hint
<Badge variant="outline" className="text-xs text-muted-foreground">
  <IconAlertCircle className="h-3 w-3 mr-1 text-amber-500" />
  <Tooltip>
    <TooltipTrigger>Docs recommended</TooltipTrigger>
    <TooltipContent>Adding photos increases approval likelihood</TooltipContent>
  </Tooltip>
</Badge>

// Documentation present
<Badge variant="outline" className="text-xs text-green-600">
  <IconPhoto className="h-3 w-3 mr-1" />
  3 photos
</Badge>
```

### RQ6: Policy record persistence for workflow lookup?

**Context**: Workflow agents need to look up policy details (coverage limits, deductibles, effective dates) by policy_number. Currently only stored in scenario JSON blob.

**Finding**: Policy Checker and other agents need direct policy lookup - not just semantic search of policy text. Need queryable policy records.

**Decision**: Add `policies` table with direct fields for coverage lookup
**Rationale**:
- Enables direct lookup by policy_number without parsing JSON
- Supports agent queries: "What's the deductible?" "Is collision covered?"
- Mirrors real-world pattern where policies are first-class entities

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS policies (
    policy_number TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    coverage_types TEXT NOT NULL,  -- JSON array
    coverage_limits TEXT NOT NULL, -- JSON object
    deductible REAL NOT NULL,
    premium REAL NOT NULL,
    effective_date TEXT NOT NULL,
    expiration_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES saved_scenarios(id) ON DELETE CASCADE
);
```

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Structured outputs | OpenAI SDK `beta.chat.completions.parse()` | Native SDK support, type-safe |
| Vehicle storage | SQLite table with FK to scenarios | Permanent per clarification |
| Policy storage | SQLite table with FK to scenarios | Direct lookup by policy_number |
| Policy indexing | Re-index from saved scenarios on startup | Survives restarts, no duplication |
| Policy search fallback | Return INSUFFICIENT_EVIDENCE | Graceful degradation |
| Documentation hints | shadcn Badge + Tooltip | Subtle, consistent with UI |
| Loading indicator | 500ms delay threshold | Prevent flicker per clarification |

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| OpenAI SDK `beta` API changes | Pin SDK version, monitor deprecation notices |
| FAISS memory growth with many saved scenarios | Limit saved scenarios (~100 max), admin cleanup endpoint |
| Vehicle table migration | Check table exists on startup, create if missing |
| Startup time with many scenarios | Batch re-indexing, async startup, log progress |
