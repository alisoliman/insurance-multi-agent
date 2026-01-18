# Implementation Plan: AI-Powered Demo Example Generation

**Branch**: `004-ai-demo-examples` | **Date**: 2026-01-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-ai-demo-examples/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable demo presenters to generate localized, culturally-appropriate insurance claim scenarios using AI. The system will provide a UI to select locale/region, claim type, and complexity (or enter a custom description), then use Azure OpenAI to generate complete claim + policy data that can be processed through the existing multi-agent workflow. Generated scenarios are persisted to a backend SQLite database for reuse across sessions and devices.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript/Next.js 15 (frontend)  
**Primary Dependencies**: FastAPI, Azure OpenAI (GPT-4o), shadcn/ui, Pydantic  
**Storage**: SQLite (new, for saved scenarios) + existing FAISS (policy vectors)  
**Testing**: pytest (backend), component tests (frontend)  
**Target Platform**: Azure Container Apps (web application)
**Project Type**: web (frontend + backend)  
**Performance Goals**: Scenario generation <10 seconds, workflow processing unchanged  
**Constraints**: Backend API key security, existing workflow unmodified  
**Scale/Scope**: 8 supported locales, 5 claim types, 3 complexity levels, 20+ saved scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Evaluation ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. LLM-Powered Multi-Agent Core** | ✅ PASS | Uses Azure OpenAI for scenario generation; existing agents unchanged |
| **II. Separation of Agent and Orchestration** | ✅ PASS | New generation service is independent; no workflow modifications |
| **III. API-First Design** | ✅ PASS | New endpoints for generation/save/delete under `/api/v1/scenarios/` |
| **IV. Modern UI/UX Standards** | ✅ PASS | shadcn/ui components; modal/panel for generation interface |
| **V. Observability and Explainability** | ✅ PASS | Generation parameters logged; clear error messages with retry |

### Post-Design Evaluation ✅

| Principle | Status | Design Artifact | Verification |
|-----------|--------|-----------------|--------------|
| **I. LLM-Powered Multi-Agent Core** | ✅ PASS | [research.md](research.md) §1 | GPT-4o JSON mode for structured generation |
| **II. Separation of Agent and Orchestration** | ✅ PASS | [data-model.md](data-model.md) | ScenarioGenerator service independent from workflow |
| **III. API-First Design** | ✅ PASS | [contracts/scenarios-api.yaml](contracts/scenarios-api.yaml) | Full OpenAPI 3.1 spec with typed schemas |
| **IV. Modern UI/UX Standards** | ✅ PASS | [research.md](research.md) §5 | shadcn/ui Dialog, tabs, dropdowns |
| **V. Observability and Explainability** | ✅ PASS | [contracts/scenarios-api.yaml](contracts/scenarios-api.yaml) | ErrorResponse with details, generation params in logs |

**Stack Compliance:**
- Backend: Python 3.12+, FastAPI, Azure OpenAI, SQLite ✅
- Frontend: Next.js 15, React 19, shadcn/ui ✅
- New dependency: `aiosqlite>=0.19.0` (justified: async SQLite for scenario persistence)

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-demo-examples/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI schemas)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── claim.py              # EXTEND: add SavedScenario models
│   │   └── scenario.py           # NEW: scenario generation models
│   ├── services/
│   │   └── scenario_generator.py # NEW: AI generation service
│   ├── api/v1/endpoints/
│   │   └── scenarios.py          # NEW: CRUD + generation endpoints
│   └── db/
│       ├── database.py           # NEW: SQLite connection/init
│       └── repositories/
│           └── scenario_repo.py  # NEW: scenario persistence
└── tests/
    ├── test_scenario_generator.py
    └── test_scenarios_api.py

frontend/
├── components/
│   ├── scenario-generator/       # NEW: generation UI components
│   │   ├── scenario-generator-modal.tsx
│   │   ├── locale-selector.tsx
│   │   ├── claim-type-selector.tsx
│   │   ├── complexity-selector.tsx
│   │   ├── custom-description-input.tsx
│   │   └── preset-templates.tsx
│   └── saved-scenarios/          # NEW: saved scenarios display
│       ├── saved-scenarios-list.tsx
│       └── scenario-card.tsx
├── lib/
│   ├── scenario-api.ts           # NEW: API client for scenarios
│   └── locale-config.ts          # NEW: locale definitions
└── app/demo/
    └── page.tsx                  # MODIFY: add generator button + saved section
```

**Structure Decision**: Web application structure with frontend/backend separation. New functionality isolated in dedicated modules (`scenario_generator.py`, `scenarios.py` endpoints, `scenario-generator/` components) to minimize changes to existing code.

## Complexity Tracking

No constitution violations requiring justification. Design adheres to all principles.
