# Implementation Plan: Structured Agent Outputs

**Branch**: `002-structured-agent-outputs` | **Date**: 2026-01-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-structured-agent-outputs/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement structured outputs for all insurance claim processing agents using Pydantic models and the `response_format` parameter in `AzureOpenAIChatOptions`. This eliminates brittle regex parsing of agent responses by enforcing JSON schema at the LLM level, ensuring each agent returns typed, deserializable data structures with enum-enforced status fields.

## Technical Context

**Language/Version**: Python 3.12+  
**Primary Dependencies**: agent-framework (1.0.0b260116), Pydantic v2, FastAPI  
**Storage**: N/A (no persistence changes)  
**Testing**: pytest  
**Target Platform**: Linux server / Azure Container Apps  
**Project Type**: web (backend + frontend)  
**Performance Goals**: Maintain current throughput; no regression  
**Constraints**: Backward compatibility with existing API consumers  
**Scale/Scope**: 5 agents (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent, Synthesizer)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. LLM-Powered Multi-Agent Core | ✅ PASS | Enhances agent outputs with structured schemas |
| II. Separation of Agent and Orchestration | ✅ PASS | Schema models are agent-specific, orchestration unchanged |
| III. API-First Design | ✅ PASS | Structured JSON outputs align with API-first principle |
| IV. Modern UI/UX Standards | ✅ PASS | N/A - backend feature |
| V. Observability and Explainability | ✅ PASS | Structured outputs include reasoning/analysis text fields |

**Gate Result**: PASS - No violations. Proceed with planning.

## Project Structure

### Documentation (this feature)

```text
specs/002-structured-agent-outputs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── agent_outputs.py    # NEW: Pydantic models for structured outputs
│   └── workflow/
│       ├── agents/
│       │   ├── claim_assessor.py    # MODIFY: Add response_format
│       │   ├── policy_checker.py    # MODIFY: Add response_format
│       │   ├── risk_analyst.py      # MODIFY: Add response_format
│       │   ├── communication_agent.py # MODIFY: Add response_format
│       │   └── synthesizer.py       # MODIFY: Add response_format
│       └── supervisor.py            # MODIFY: Parse structured responses
└── tests/
    └── unit/
        └── test_agent_outputs.py    # NEW: Schema validation tests

frontend/
└── (no changes required)
```

**Structure Decision**: Web application structure (existing). New models file in `backend/app/models/` for Pydantic output schemas. Supervisor modified to pass `response_format` parameter to `agent.run()` calls per official Microsoft Agent Framework docs.

## Complexity Tracking

> No constitution violations; no complexity justifications needed.
