# Implementation Plan: Migrate to Microsoft Agent Framework

**Branch**: `001-migrate-ms-agents` | **Date**: 2026-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migrate-ms-agents/spec.md`

## Summary

Migrate the multi-agent orchestration layer from LangGraph/LangGraph-Supervisor to Microsoft Agent Framework (`agent-framework` package) while preserving all external behavior: agent prompts, tools, API contracts, and assessment output format. The migration replaces the orchestration primitives (`create_react_agent`, `create_supervisor`) with Microsoft Agent Framework equivalents (`ChatAgent`, `AzureOpenAIChatClient`, workflow builders) using a sequential/handoff workflow pattern for the supervisor.

## Technical Context

**Language/Version**: Python 3.12+  
**Primary Dependencies**: FastAPI, Microsoft Agent Framework (`agent-framework`), Azure OpenAI  
**Storage**: FAISS for policy document vectors (unchanged)  
**Testing**: pytest via `uv run pytest`  
**Target Platform**: Linux server (Azure Container Apps)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: Parity with current LangGraph implementation (±10% variance)  
**Constraints**: API contracts must remain unchanged; streaming must continue to work  
**Scale/Scope**: 4 specialist agents + 1 supervisor orchestrator

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. LLM-Powered Multi-Agent Core | ✅ PASS | Agents remain LLM-powered with same prompts; supports mock fallback |
| II. Separation of Agent and Orchestration | ✅ PASS | Core purpose of this migration—decoupling orchestration from agent logic |
| III. API-First Design | ✅ PASS | FastAPI endpoints unchanged; JSON responses preserved |
| IV. Modern UI/UX Standards | ✅ PASS | Frontend unchanged; real-time workflow visibility maintained |
| V. Observability and Explainability | ✅ PASS | Structured logging preserved; agent outputs remain traceable |

**Gate Result**: PASS - No constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-ms-agents/
├── plan.md              # This file
├── research.md          # Phase 0 output - framework comparison & migration patterns
├── data-model.md        # Phase 1 output - agent/workflow data structures
├── quickstart.md        # Phase 1 output - local development guide
├── contracts/           # Phase 1 output - API contracts (unchanged)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── workflow/
│   │   ├── __init__.py              # Public interface (process_claim_with_supervisor)
│   │   ├── supervisor.py            # MODIFIED: MS Agent Framework orchestration
│   │   ├── registry.py              # MODIFIED: Agent registration
│   │   ├── tools.py                 # MODIFIED: Tool definitions (Annotated types)
│   │   ├── policy_search.py         # UNCHANGED: Vector search
│   │   ├── pdf_processor.py         # UNCHANGED: PDF processing
│   │   └── agents/
│   │       ├── __init__.py
│   │       ├── claim_assessor.py    # MODIFIED: ChatAgent factory
│   │       ├── policy_checker.py    # MODIFIED: ChatAgent factory
│   │       ├── risk_analyst.py      # MODIFIED: ChatAgent factory
│   │       └── communication_agent.py # MODIFIED: ChatAgent factory
│   ├── api/v1/endpoints/
│   │   ├── workflow.py              # UNCHANGED: API contract
│   │   └── agent.py                 # UNCHANGED: API contract
│   └── services/
│       ├── claim_processing.py      # UNCHANGED: Service interface
│       └── single_agent.py          # MODIFIED: Single agent invocation
├── pyproject.toml                   # MODIFIED: Dependencies
└── tests/                           # Test suite

frontend/
└── [UNCHANGED - no modifications required]
```

**Structure Decision**: Web application pattern. Backend orchestration files modified; API layer and frontend unchanged to maintain backward compatibility.

## Constitution Check (Post-Design Re-evaluation)

*Re-check after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. LLM-Powered Multi-Agent Core | ✅ PASS | `ChatAgent` maintains LLM-powered agents; tool binding preserved; mock fallback supported via credential fallback pattern |
| II. Separation of Agent and Orchestration | ✅ PASS | Migration explicitly decouples: agents defined as `AgentConfig`, orchestration via `SequentialBuilder` workflow—easily swappable |
| III. API-First Design | ✅ PASS | Contracts documented in `contracts/`; no changes to request/response schemas |
| IV. Modern UI/UX Standards | ✅ PASS | N/A for backend migration; frontend unchanged |
| V. Observability and Explainability | ✅ PASS | Workflow events provide traceability; logging patterns preserved |

**Post-Design Gate Result**: ✅ PASS - Design aligns with all constitutional principles.

## Complexity Tracking

> No constitutional violations—this section is empty.

<!-- No complexity justifications needed -->
