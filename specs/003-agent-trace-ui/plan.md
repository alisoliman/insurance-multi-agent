# Implementation Plan: Agent Trace UI Enhancement

**Branch**: `003-agent-trace-ui` | **Date**: January 17, 2026 | **Spec**: [spec.md](spec.md)

## Summary

Enhance the frontend agent trace display to render structured outputs (ClaimAssessment, RiskAssessment, etc.) in type-specific card components, visualize tool calls distinctly, and provide a polished timeline experience. Requires backend API enhancement to expose structured output data and frontend component development using shadcn/ui primitives with Magic UI timeline.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.12+ (backend)  
**Primary Dependencies**: Next.js 15, React 19, shadcn/ui, Tailwind CSS, Magic UI (timeline)  
**Storage**: N/A (stateless UI components)  
**Testing**: Component testing with existing patterns; API contract testing  
**Target Platform**: Web (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Less than 100ms interaction latency, less than 3s initial load  
**Constraints**: WCAG 2.1 AA accessibility, dark mode support  
**Scale/Scope**: Display 50+ conversation steps without degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. LLM-Powered Multi-Agent Core** | PASS | Feature displays agent outputs; does not modify agent logic |
| **II. Separation of Agent and Orchestration** | PASS | UI layer only; no coupling to orchestration |
| **III. API-First Design** | PASS | Extends existing REST API with structured outputs |
| **IV. Modern UI/UX Standards** | PASS | Uses shadcn/ui per constitution; adds Magic UI for timeline |
| **V. Observability and Explainability** | PASS | Enhances visibility into agent decisions and tool calls |

**Stack Modification**: Adding Magic UI (timeline component) - justified for workflow visualization per FR-005.

## Project Structure

### Documentation (this feature)

```
specs/003-agent-trace-ui/
  plan.md              - This file
  research.md          - Phase 0 output (complete)
  data-model.md        - Phase 1 output (complete)
  quickstart.md        - Phase 1 output (complete)
  contracts/           - Phase 1 output (complete)
    workflow-run.md    - Enhanced API contract
  tasks.md             - Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```
backend/
  app/
    models/
      claim.py           - UPDATE: Add AgentOutputOut, ToolCallOut
    api/v1/endpoints/
      workflow.py        - UPDATE: Include structured outputs in response

frontend/
  types/
    agent-outputs.ts       - NEW: TypeScript types for structured outputs
  components/
    agent-outputs/         - NEW: Structured output card components
      index.ts
      status-badge.tsx
      risk-score-bar.tsx
      claim-assessment-card.tsx
      coverage-verification-card.tsx
      risk-assessment-card.tsx
      customer-communication-card.tsx
      final-assessment-card.tsx
      tool-call-card.tsx
      agent-trace-step.tsx
    workflow-demo.tsx      - UPDATE: Use new components
    ui/
      timeline.tsx         - NEW: Magic UI timeline (via npx shadcn)
  app/
    demo/
      page.tsx             - UPDATE: Use new structured output display
```

**Structure Decision**: Web application with frontend/backend separation (existing structure). New components added under frontend/components/agent-outputs/ to maintain modularity.

## Complexity Tracking

No constitution violations requiring justification.

## Phases Summary

### Phase 0: Research - Complete

- research.md: Resolved all NEEDS CLARIFICATION items
- Key decisions: Backend API enhancement required, Magic UI timeline, semantic colors

### Phase 1: Design - Complete

- data-model.md: TypeScript types and Pydantic model updates
- contracts/workflow-run.md: Enhanced API contract with agent_outputs
- quickstart.md: Component usage examples and testing checklist

### Phase 2: Task Generation (Next)

Run /speckit.tasks to generate implementation tasks based on this plan.

## Implementation Sequence

```
1. Backend API Enhancement
   - Update ClaimOut model
   - Modify workflow.py to include structured outputs
   
2. Frontend Types
   - Create types/agent-outputs.ts
   
3. Base UI Components
   - status-badge.tsx
   - risk-score-bar.tsx
   - Install Magic UI timeline
   
4. Agent Output Cards
   - claim-assessment-card.tsx
   - coverage-verification-card.tsx
   - risk-assessment-card.tsx
   - customer-communication-card.tsx
   - final-assessment-card.tsx
   
5. Tool Call Visualization
   - tool-call-card.tsx
   
6. Integration
   - Update workflow-demo.tsx
   - Add timeline component
   - Update agent pages
   
7. Polish and Testing
   - Dark mode verification
   - Accessibility audit
   - Performance testing
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend API changes break existing clients | Low | Medium | Additive changes only; agent_outputs is optional field |
| Magic UI timeline conflicts with existing styles | Medium | Low | Isolate timeline styles; test dark mode compatibility |
| Performance with large traces | Low | Medium | React.memo optimization; lazy expansion |
| Structured output not available (fallback needed) | Medium | Low | Fallback to raw text with warning badge (FR-009) |

## Dependencies

- **Magic UI**: Install via npx shadcn@latest add from magicui.design/r/timeline
- **Existing shadcn/ui**: collapsible, accordion, progress, badge (already installed)
- **Backend**: No new Python dependencies required

## Acceptance Criteria Mapping

| Requirement | Implementation |
|-------------|----------------|
| FR-001 (Structured outputs) | Agent output card components |
| FR-002 (Enum badges) | StatusBadge component |
| FR-003 (List fields) | Bullet lists in card components |
| FR-004 (Tool calls) | ToolCallCard with collapsible |
| FR-005 (Timeline) | Magic UI timeline integration |
| FR-006 (Final assessment) | FinalAssessmentCard at top |
| FR-007 (Risk score bar) | RiskScoreBar with gradient |
| FR-008 (Dark mode) | Tailwind dark: variants |
| FR-009 (Fallback) | Unstructured response badge |
| FR-010 (Expand/collapse) | Collapsible sections, expanded default |
| FR-011 (Accessibility) | WCAG 2.1 AA colors, ARIA labels |
