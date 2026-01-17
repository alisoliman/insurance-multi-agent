# Feature Specification: Agent Trace UI Enhancement

**Feature Branch**: `003-agent-trace-ui`  
**Created**: January 17, 2026  
**Status**: Draft  
**Input**: User description: "Improve the cards displays in the frontend to adhere to the new structured outputs and to have a nice visual appeal to showing tool calls and their respective response, in general we want to look at agents displaying their responses and traces and if there are improvements we can make there, you are free to use 3rd party shadcn/ui registries that have ready-made components if you need"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Structured Agent Outputs (Priority: P1)

As a claims processor, I want to see agent responses displayed in a clear, structured format that matches the backend data model, so I can quickly understand each agent's assessment without parsing raw text.

**Why this priority**: The core value proposition is making agent outputs immediately comprehensible. Structured outputs are already implemented in the backend (ClaimAssessment, CoverageVerification, RiskAssessment, etc.) but the frontend currently displays raw conversation text instead of formatted structured data.

**Independent Test**: Can be fully tested by running a workflow and verifying that structured fields (validity_status, risk_level, coverage_status, etc.) are displayed in dedicated UI components rather than inline text.

**Acceptance Scenarios**:

1. **Given** a completed Claim Assessor agent run, **When** results are displayed, **Then** I see validity_status as a colored status badge, red_flags as a list, cost_assessment in a dedicated section, and reasoning in an expandable area.

2. **Given** a completed Risk Analyst agent run, **When** results are displayed, **Then** I see risk_level as a colored indicator (green/yellow/red), risk_score as a visual gauge or progress bar (0-100), and fraud_indicators as a highlighted list.

3. **Given** a completed Policy Checker agent run, **When** results are displayed, **Then** I see coverage_status as a clear badge, cited_sections as clickable/highlighted references, and coverage_details in a readable format.

4. **Given** a completed Communication Agent run, **When** results are displayed, **Then** I see email subject, body, and requested_items in a preview card format resembling an actual email.

---

### User Story 2 - View Tool Calls and Responses (Priority: P2)

As a claims processor, I want to see tool calls (e.g., vehicle details lookup, policy search, image analysis) displayed distinctly from agent reasoning, so I can understand what external data the agent used to make its decision.

**Why this priority**: Tool calls are currently hidden or displayed as raw JSON. Making them visually distinct helps users understand the agent's decision-making process and verify data sources.

**Independent Test**: Can be tested by running an agent that uses tools and verifying that tool invocations appear in collapsible cards showing the tool name, input parameters, and response.

**Acceptance Scenarios**:

1. **Given** an agent invokes a tool, **When** the trace is displayed, **Then** I see a distinct card with the tool name, an icon, input parameters in a readable format, and the response clearly formatted.

2. **Given** a tool call returns an error, **When** the trace is displayed, **Then** the tool card shows an error state with the error message highlighted.

3. **Given** multiple tool calls occur in sequence, **When** I view the trace, **Then** I can collapse/expand each tool call to reduce visual clutter.

---

### User Story 3 - Navigate Agent Trace Timeline (Priority: P2)

As a claims processor, I want to navigate through the agent conversation timeline with clear visual hierarchy, so I can follow the decision-making flow from claim input to final assessment.

**Why this priority**: Current timeline is linear and can become overwhelming. Improved navigation helps users jump to relevant sections quickly.

**Independent Test**: Can be tested by running a full workflow and verifying that the timeline has collapsible agent sections, visual connectors showing flow, and timestamps.

**Acceptance Scenarios**:

1. **Given** a completed multi-agent workflow, **When** viewing the trace, **Then** I see agent sections clearly separated with visual connectors showing the handoff flow.

2. **Given** a long conversation, **When** I want to jump to a specific agent's output, **Then** I can use navigation links or collapse other sections to focus on the target agent.

3. **Given** any trace step, **When** displayed, **Then** I see the timestamp or step number indicating when it occurred in the workflow.

---

### User Story 4 - View Final Assessment Summary (Priority: P1)

As a claims processor, I want the final synthesis/decision displayed prominently with a summary of all agent findings, so I can quickly understand the recommended action and supporting rationale.

**Why this priority**: The final decision is the most critical output. It should be immediately visible and comprehensive without requiring scroll through the entire trace.

**Independent Test**: Can be tested by running a workflow and verifying that the FinalAssessment (recommendation, confidence, summary, key_findings, next_steps) appears in a prominent summary card at the top of results.

**Acceptance Scenarios**:

1. **Given** a completed workflow with final assessment, **When** results load, **Then** I see the recommendation (APPROVE/DENY/INVESTIGATE) prominently displayed with confidence level as a badge.

2. **Given** a final assessment, **When** I view the summary card, **Then** I see key_findings as a bullet list and next_steps as actionable items.

3. **Given** a final assessment with INVESTIGATE recommendation, **When** displayed, **Then** I see visual emphasis (e.g., yellow warning styling) to draw attention.

---

### Edge Cases

- What happens when an agent returns partial/incomplete structured output? Display available fields and show placeholder for missing data.
- How does the system handle tool call timeouts? Display a timeout indicator in the tool card with elapsed time.
- What if the structured output parsing fails? Fall back to displaying raw text with a warning indicator.
- How are very long agent responses handled? Truncate with "Show more" expansion option.
- What happens when there are no tool calls in an agent's trace? Tool section should be hidden or show "No external tools used."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse and display structured agent outputs (ClaimAssessment, CoverageVerification, RiskAssessment, CustomerCommunication, FinalAssessment) in type-specific card components.
- **FR-002**: System MUST display enumerated fields (ValidityStatus, CoverageStatus, RiskLevel, Recommendation, Confidence) as colored badges with consistent styling across all views.
- **FR-003**: System MUST display list fields (red_flags, fraud_indicators, cited_sections, key_findings, next_steps, requested_items) as formatted bullet lists with appropriate styling (e.g., warning colors for red_flags).
- **FR-004**: System MUST display tool calls in collapsible cards showing tool name, input parameters, and formatted response.
- **FR-005**: System MUST provide a visual timeline with agent-specific icons, colors, and connecting lines showing workflow progression.
- **FR-006**: System MUST display the final assessment summary prominently at the top of results with recommendation, confidence, key_findings, and next_steps.
- **FR-007**: System MUST render numeric scores (risk_score 0-100) as a horizontal progress bar with color gradient (green for low risk, yellow for medium, red for high) and display the numeric value as a label.
- **FR-008**: System MUST support dark mode with appropriate color contrast for all status badges and cards.
- **FR-011**: System MUST meet WCAG 2.1 AA accessibility standards including sufficient color contrast ratios, keyboard navigation for all interactive elements, and appropriate ARIA labels for screen readers.
- **FR-009**: System MUST handle fallback gracefully when structured output is unavailable by displaying raw text with a subtle warning badge indicating "Unstructured response" to maintain transparency.
- **FR-010**: System MUST allow expanding/collapsing long content sections to manage visual clutter, with all sections expanded by default to provide full visibility of agent reasoning and tool calls.

### Key Entities

- **StructuredAgentOutput**: Parsed response from an agent containing type-specific fields (varies by agent type).
- **ToolCall**: Record of a tool invocation including name, input parameters, output/response, and timing.
- **AgentTraceStep**: Single step in the conversation timeline with role, content, timestamp, and associated structured output or tool call.
- **WorkflowSummary**: Aggregated view of final assessment with links to individual agent outputs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the final recommendation (APPROVE/DENY/INVESTIGATE) within 2 seconds of viewing workflow results.
- **SC-002**: Users can understand an agent's assessment without reading full text by viewing the structured summary card in under 10 seconds.
- **SC-003**: Tool calls are visually distinguishable from agent reasoning in 100% of displayed traces.
- **SC-004**: All structured output fields from backend models (ClaimAssessment, RiskAssessment, etc.) are rendered in dedicated UI components rather than raw text.
- **SC-005**: Trace timeline supports 50+ conversation steps without significant UI performance degradation.
- **SC-006**: Claims processors report improved clarity when reviewing agent outputs compared to current text-based display.

## Clarifications

### Session 2026-01-17

- Q: Default collapsed/expanded state for tool calls and agent sections? → A: Everything expanded by default
- Q: Accessibility support level for agent trace UI? → A: WCAG 2.1 AA compliance
- Q: Build components from scratch or use third-party shadcn/ui registries? → A: Use third-party registries for complex components, custom for simple ones
- Q: How should risk scores (0-100) be visually represented? → A: Horizontal progress bar with color gradient (green→yellow→red) and numeric label
- Q: How to handle fallback when structured output is unavailable? → A: Display raw text with subtle warning badge indicating "Unstructured response"

## Assumptions

- The backend already returns structured outputs via Pydantic models (ClaimAssessment, CoverageVerification, RiskAssessment, CustomerCommunication, FinalAssessment) in the API response.
- Tool call information is available in the conversation_chronological field or will be added to the API response.
- Third-party shadcn/ui registry components (e.g., Magic UI, Aceternity UI) should be used for complex visual components like timelines, progress gauges, and animated cards; simple domain-specific components should be built custom using base shadcn/ui primitives.
- The application uses Next.js with App Router, Tailwind CSS, and the existing shadcn/ui component library.
- Performance requirements follow standard web application expectations (initial load under 3 seconds, interactions under 100ms).
