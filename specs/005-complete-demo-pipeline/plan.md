# Implementation Plan: Complete Demo Scenario Pipeline

**Branch**: `005-complete-demo-pipeline` | **Date**: 2026-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-complete-demo-pipeline/spec.md`

## Summary

Complete the synthetic data generation pipeline so generated demo scenarios work end-to-end through both single-agent and multi-agent workflows. Key improvements: persist vehicle data to SQLite, refactor scenario generation to use Pydantic structured outputs via SDK, enhance UI with documentation status hints, and ensure Policy Checker can find generated policies via vector search.

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript/Node.js 18+ (frontend)  
**Primary Dependencies**: FastAPI, openai SDK, aiosqlite, FAISS (backend); Next.js 15, React 19, shadcn/ui (frontend)  
**Storage**: SQLite via aiosqlite (scenarios.db), FAISS vector index (policy_index)  
**Testing**: pytest (backend), component tests (frontend)  
**Target Platform**: Azure Container Apps (Linux containers)
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Scenario generation <15s including indexing (SC-003)  
**Constraints**: 500ms loading indicator delay, generic documentation hints only  
**Scale/Scope**: Demo application for presenters, ~10-50 concurrent users max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. LLM-Powered Multi-Agent Core | ✅ Pass | Enhances existing LLM agents with better data pipeline |
| II. Separation of Agent and Orchestration | ✅ Pass | Changes only data layer, not agent/orchestration interfaces |
| III. API-First Design | ✅ Pass | All changes exposed via existing FastAPI endpoints |
| IV. Modern UI/UX Standards | ✅ Pass | Uses shadcn/ui for documentation hints |
| V. Observability and Explainability | ✅ Pass | Adds logging for structured output parsing |

**Gate Result**: ✅ PASS - No violations. Feature enhances existing architecture without introducing new patterns.

## Project Structure

### Documentation (this feature)

```text
specs/005-complete-demo-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI updates)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── scenario.py          # MODIFY: Add ScenarioGenerationOutput model for SDK structured outputs
│   │   └── vehicle.py           # NEW: VehicleRecord model
│   ├── db/
│   │   ├── database.py          # MODIFY: Add vehicles + policies tables
│   │   └── repositories/
│   │       ├── scenario_repo.py # EXISTING
│   │       ├── vehicle_repo.py  # NEW: Vehicle CRUD operations
│   │       └── policy_repo.py   # NEW: Policy CRUD operations
│   ├── services/
│   │   └── scenario_generator.py # MODIFY: Use Pydantic structured outputs via SDK
│   ├── api/v1/endpoints/
│   │   └── scenarios.py         # MODIFY: Ensure policy indexed on generation
│   └── workflow/
│       └── policy_search.py     # EXISTING: Already has add_policy_from_text()
└── tests/
    └── unit/
        └── test_scenario_generator.py  # NEW: Test structured output generation

frontend/
├── components/
│   ├── workflow-demo.tsx        # MODIFY: Add documentation hints
│   ├── ui/
│   │   └── documentation-hint.tsx # NEW: Reusable hint component
│   └── scenario-generator/
│       └── scenario-preview.tsx # MODIFY: Show vehicle info, doc status
├── lib/
│   └── scenario-api.ts          # EXISTING: Types already complete
└── types/
    └── agent-outputs.ts         # EXISTING
```

**Structure Decision**: Follows existing web application pattern with backend/ and frontend/ separation. New files are minimal - primarily modifications to existing services and one new database table.

## Complexity Tracking

> No violations - table intentionally empty

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |

---

## Phase 0 Output: Research Summary

See [research.md](./research.md) for full details.

| Research Question | Decision | Rationale |
|------------------|----------|-----------|
| Pydantic structured outputs | Use `client.beta.chat.completions.parse()` | Native SDK support, type-safe |
| Vehicle storage | New SQLite table with FK to scenarios | Permanent per clarification |
| Policy indexing | Re-index from saved scenarios on startup | Survives restarts, no duplication |
| Policy search fallback | Return INSUFFICIENT_EVIDENCE | Graceful degradation |
| Documentation hints UI | shadcn Badge + Tooltip | Subtle, consistent with UI |

## Phase 1 Output: Design Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Data Model | [data-model.md](./data-model.md) | Entity schemas, relationships, Pydantic models |
| API Contracts | [contracts/scenarios-api-extended.yaml](./contracts/scenarios-api-extended.yaml) | OpenAPI spec with vehicle endpoints |
| Quickstart | [quickstart.md](./quickstart.md) | Developer setup and implementation order |

## Implementation Scope

### Phase 1: Backend Data Pipeline
1. Add vehicles + policies tables to database.py `init_db()`
2. Create `vehicle_repo.py` with CRUD operations
3. Create `policy_repo.py` with CRUD operations (get_by_policy_number, has_coverage, etc.)
4. Add `ScenarioGenerationOutput` model to scenario.py
5. Refactor scenario_generator.py to use `beta.chat.completions.parse()`
6. Ensure policy indexing on generation
7. Add `reindex_saved_policies()` to app startup lifespan

### Phase 2: API & Integration
8. Update scenario save endpoint to create vehicle + policy records
9. Add Policy Checker INSUFFICIENT_EVIDENCE fallback
10. Wire Policy Checker to use `policy_repo.get_by_policy_number()` for coverage checks
11. Add lookup endpoints (vehicle by VIN, policy by policy_number)

### Phase 3: Frontend UX
9. Create `documentation-hint.tsx` component
10. Integrate hints into workflow-demo.tsx
11. Add 500ms loading indicator delay

### Phase 4: Testing
12. Unit tests for structured output generation
13. Integration tests for scenario → workflow pipeline
14. Manual demo testing with generated scenarios

## Next Steps

Run `/speckit.tasks` to generate detailed task breakdown in [tasks.md](./tasks.md).
