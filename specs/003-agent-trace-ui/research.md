# Research: Agent Trace UI Enhancement

**Feature**: 003-agent-trace-ui  
**Date**: January 17, 2026

## Overview

This document captures research findings to resolve technical unknowns identified in the feature specification.

---

## Research Tasks

### R1: Backend Structured Output Availability

**Question**: Does the backend currently expose structured outputs to the frontend?

**Finding**: **No** - The backend workflow generates structured outputs (ClaimAssessment, CoverageVerification, RiskAssessment, CustomerCommunication, FinalAssessment) via Pydantic models, but the API endpoint (`/api/v1/workflow/run`) does NOT propagate the `structured_output` field to the response.

**Evidence**:
- [supervisor.py#L249](../../../backend/app/workflow/supervisor.py) adds `structured_output` to chunks
- [workflow.py#L131](../../../backend/app/api/v1/endpoints/workflow.py) only returns `ClaimOut` with `conversation_chronological` (text messages)

**Decision**: Backend API must be enhanced to include structured outputs in the response. Add a new field `agent_outputs` to `ClaimOut` containing typed structured data for each agent.

**Alternatives Considered**:
- Parse structured data from message text on frontend (rejected: fragile, duplicates backend logic)
- Create separate endpoint for structured outputs (rejected: unnecessary complexity, multiple API calls)

---

### R2: Tool Call Information Format

**Question**: How are tool calls currently represented in the API response?

**Finding**: Tool calls are serialized as text with emoji markers (🔧) in message content. The format includes:
- `🔧 Calling tool: {tool_name}` with arguments
- `🔧 Tool Response ({tool_name}):` with results

**Evidence**: [workflow.py#L176-L225](../../../backend/app/api/v1/endpoints/workflow.py) shows Microsoft Agent Framework tool call serialization.

**Decision**: Keep the text format for conversation display, but add structured `tool_calls` array to agent output for dedicated tool call cards. This enables:
- Collapsible tool call visualization
- Distinct styling for tool inputs vs outputs
- Tool timing information

---

### R3: Third-Party Component Libraries

**Question**: Which shadcn/ui registry components are suitable for this feature?

**Finding**: Evaluated multiple registries:

| Component Need | Recommended Source | Component |
|----------------|-------------------|-----------|
| Timeline | Magic UI | `timeline` - animated vertical timeline |
| Progress Bar | shadcn/ui (existing) | `progress` - already installed |
| Collapsible | shadcn/ui (existing) | `collapsible` - already installed |
| Accordion | shadcn/ui (existing) | `accordion` - already installed |
| Badge variants | Custom | Extend existing `badge` with status colors |

**Decision**: 
- Use Magic UI `timeline` component for agent workflow visualization
- Extend existing shadcn/ui components for status badges and progress bars
- Build custom components for structured output cards (domain-specific)

**Rationale**: Minimize new dependencies; leverage existing shadcn/ui primitives where sufficient.

---

### R4: Color Palette for Status Indicators

**Question**: What color scheme should be used for risk levels, validity status, etc.?

**Finding**: Established semantic color conventions:

| Status Type | Colors |
|-------------|--------|
| **ValidityStatus** | VALID (green-500), QUESTIONABLE (yellow-500), INVALID (red-500) |
| **CoverageStatus** | COVERED (green-500), PARTIALLY_COVERED (yellow-500), NOT_COVERED (red-500), INSUFFICIENT_EVIDENCE (gray-500) |
| **RiskLevel** | LOW_RISK (green-500), MEDIUM_RISK (yellow-500), HIGH_RISK (red-500) |
| **Recommendation** | APPROVE (green-500), INVESTIGATE (yellow-500), DENY (red-500) |
| **Confidence** | HIGH (green-500), MEDIUM (yellow-500), LOW (red-500) |

**Decision**: Use Tailwind semantic colors with dark mode variants:
- Success: `green-500` / `green-400` (dark)
- Warning: `yellow-500` / `yellow-400` (dark)
- Danger: `red-500` / `red-400` (dark)
- Neutral: `gray-500` / `gray-400` (dark)

---

### R5: Performance with Large Conversation Traces

**Question**: Will the UI perform well with 50+ conversation steps?

**Finding**: Current implementation uses `ScrollArea` with map rendering. For 50+ items:
- Virtual scrolling not required for 50-100 items (acceptable DOM size)
- Collapsible sections reduce initial render complexity
- React.memo can optimize re-renders

**Decision**: 
- Use standard mapping with lazy expansion
- Implement React.memo for step components
- Add performance monitoring; consider virtual scrolling if >100 steps needed

---

## Summary of Decisions

| Area | Decision | Impact |
|------|----------|--------|
| Backend API | Add `agent_outputs` field with structured data | Backend change required |
| Tool calls | Add structured `tool_calls` array | Backend + Frontend changes |
| Components | Magic UI timeline + custom cards | New component installations |
| Colors | Semantic Tailwind colors with dark mode | Consistent styling |
| Performance | Standard rendering with memo | Acceptable for target scale |

---

## Next Steps

1. Update backend `ClaimOut` model to include structured outputs
2. Create TypeScript types mirroring Pydantic models
3. Install Magic UI timeline component
4. Implement structured output card components
