# Feature Specification: Complete Demo Scenario Pipeline

**Feature Branch**: `005-complete-demo-pipeline`  
**Created**: 2026-01-18  
**Status**: Draft  
**Input**: User description: "Complete the synthetic data generation pipeline for demo scenarios including proper vehicle/database entries, policy indexing, structured outputs via Pydantic SDK integration, and enhanced UX with documentation hints for claim assessor to create exceptional demo experiences for presenters and viewers"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete End-to-End Scenario Generation (Priority: P1)

A presenter generates a new demo scenario for a German auto collision and expects the workflow to process it successfully. Currently, generated scenarios create claims and policies but miss critical elements: vehicle database entries aren't persisted, policy documents aren't properly indexed for the Policy Checker agent, and the workflow may fail or produce incomplete results.

**Why this priority**: This is the foundational capability - without complete data generation, the core demo experience fails. Presenters cannot confidently use generated scenarios because the workflow produces errors or incomplete assessments.

**Independent Test**: Generate a German auto claim scenario, run the workflow, and verify all agents produce meaningful outputs with no "policy not found" errors and the synthesizer delivers a final recommendation.

**Acceptance Scenarios**:

1. **Given** a presenter generates a new auto claim scenario, **When** the scenario is created, **Then** a vehicle database entry with VIN, make, model, year, and license plate is persisted and retrievable by the workflow
2. **Given** a generated scenario with policy data, **When** the scenario generation completes, **Then** the policy markdown is indexed in the vector store so the Policy Checker can find relevant coverage sections
3. **Given** a complete generated scenario, **When** the presenter runs the multi-agent workflow, **Then** all four specialist agents (Claim Assessor, Policy Checker, Risk Analyst, Communication Agent) produce structured outputs without errors
4. **Given** a generated scenario for any supported locale, **When** the workflow completes, **Then** the synthesizer produces a final recommendation (APPROVE, DENY, or INVESTIGATE) based on aggregated agent outputs

---

### User Story 2 - Structured Output Generation via Pydantic Models (Priority: P1)

The scenario generator currently uses JSON mode with manual parsing. Presenters and developers want consistent, type-safe scenario generation using Pydantic models passed to the OpenAI SDK, ensuring generated data always conforms to expected schemas and reducing parsing errors.

**Why this priority**: Equally critical as P1 because inconsistent data structures cause workflow failures. Using SDK-level structured outputs guarantees schema compliance and improves reliability.

**Independent Test**: Generate 10 scenarios across different locales and claim types; verify 100% of them parse into valid Pydantic models without validation errors.

**Acceptance Scenarios**:

1. **Given** a scenario generation request, **When** the AI generates the response, **Then** the response is automatically deserialized into a Pydantic model using the SDK's structured output feature
2. **Given** the Pydantic models for claims and policies, **When** generation occurs, **Then** all required fields are populated with type-correct values (no string where number expected, etc.)
3. **Given** a complex custom description, **When** the AI cannot fully satisfy the schema, **Then** sensible defaults are applied rather than returning invalid data

---

### User Story 3 - Documentation Hints for Claim Assessor (Priority: P1)

During live demos, presenters want viewers to understand that providing supporting documentation (photos, police reports, repair estimates) significantly impacts claim approval likelihood. The UI should subtly hint when documentation would strengthen a claim, without being obtrusive to the demo flow.

**Why this priority**: This directly improves the demo experience by educating viewers about insurance best practices while showcasing the AI's capabilities. It transforms a passive demo into an educational experience.

**Independent Test**: Run a workflow on a claim without photos, observe the hint; add photos and run again, observe the acknowledgment.

**Acceptance Scenarios**:

1. **Given** a claim scenario with `photos_provided: false` and `police_report: false`, **When** the claim card is displayed, **Then** a subtle informational indicator suggests that documentation increases approval likelihood
2. **Given** the presenter uploads supporting images, **When** the Claim Assessor runs, **Then** the UI visually acknowledges that documentation was analyzed (e.g., "📸 3 photos analyzed")
3. **Given** a claim with a police report available, **When** viewing the claim summary, **Then** a badge or icon indicates "Police Report Filed" as a positive factor
4. **Given** the documentation hints, **When** displayed during a demo, **Then** they are visually subtle (muted colors, small icons) and do not distract from the main workflow visualization

---

### User Story 4 - Single Agent Demo with Generated Scenarios (Priority: P2)

Presenters sometimes want to demonstrate individual agent capabilities (e.g., only the Risk Analyst) using generated scenarios. Currently, single-agent demos may not work correctly with generated scenarios because the data pipeline is incomplete.

**Why this priority**: Enables focused demos on specific AI capabilities. Valuable for technical deep-dives but secondary to the complete workflow experience.

**Independent Test**: Generate a scenario, navigate to the Risk Analyst single-agent demo page, run analysis, verify structured output is produced.

**Acceptance Scenarios**:

1. **Given** a generated scenario is selected for single-agent demo, **When** the Claim Assessor runs independently, **Then** it produces a valid `ClaimAssessment` structured output
2. **Given** a generated scenario with policy data, **When** the Policy Checker runs independently, **Then** it successfully searches the vector index and returns `CoverageVerification` output
3. **Given** a generated scenario, **When** the Risk Analyst runs independently, **Then** it returns a `RiskAssessment` with fraud indicators and risk score
4. **Given** a generated scenario, **When** the Communication Agent runs independently, **Then** it produces a `CustomerCommunication` email template in the appropriate locale language

---

### User Story 5 - Presenter-Friendly Scenario Management (Priority: P2)

Presenters preparing for demos want to quickly understand what scenarios are available, preview generated data before running workflows, and manage their scenario library effectively.

**Why this priority**: Improves presenter confidence and preparation. Secondary to core functionality but important for professional demo delivery.

**Independent Test**: Generate a scenario, preview all data fields in an expanded view, save it, retrieve it later, verify all data is intact.

**Acceptance Scenarios**:

1. **Given** a generated scenario, **When** the presenter clicks "Preview", **Then** they see all claim details, policy coverage, vehicle info (if auto), and customer contact information in a readable format
2. **Given** multiple saved scenarios, **When** viewing the scenarios list, **Then** presenters see locale flag icons, claim type badges, complexity indicators, and creation dates for quick identification
3. **Given** a generated scenario before running the workflow, **When** viewing the scenario details, **Then** any missing or suboptimal data (no photos, no police report) is highlighted as an opportunity

---

### User Story 6 - Viewer-Focused Demo Experience (Priority: P3)

Demo viewers (potential customers, stakeholders) want to understand what's happening at each workflow stage. The UI should provide clear visual feedback about agent progress, explain what each agent does, and highlight key findings.

**Why this priority**: Enhances comprehension for non-technical viewers. Important for sales demos but not blocking for core functionality.

**Independent Test**: Run a workflow with a viewer unfamiliar with the system; verify they can explain what each agent did after watching.

**Acceptance Scenarios**:

1. **Given** the workflow is running, **When** an agent starts processing, **Then** a clear visual indicator shows which agent is active with a brief description of its role
2. **Given** an agent produces structured output, **When** displayed to viewers, **Then** key metrics are highlighted (e.g., risk score shown prominently, coverage status shown with color coding)
3. **Given** the workflow completes, **When** the final decision is shown, **Then** it's displayed prominently with a summary of contributing factors from each agent

---

### Edge Cases

- **Empty generation response**: If AI returns empty or malformed JSON, retry up to 3 times with increasing temperature before failing gracefully with a user-friendly error
- **Policy index unavailable**: If the vector index fails to load, log warning but allow workflow to proceed with degraded policy checking (uses raw policy content)
- **Vehicle info for non-auto claims**: For home/health/life claims, vehicle_info should be null and the UI should not display vehicle-related fields
- **Locale without full support**: For locales without full language support (e.g., Japanese), generate names and addresses correctly but allow descriptions to be in English with a note
- **Very large estimated damages**: Claims over $100,000 should automatically suggest complexity "complex" if not already set
- **Concurrent scenario generation**: Multiple users generating scenarios simultaneously should not cause database conflicts or index corruption
- **Missing customer info**: If customer email or phone generation fails, use placeholder values that are clearly marked as demo data
- **Policy coverage gaps**: When generated claim type doesn't match policy coverage, the Policy Checker should correctly identify the mismatch

## Requirements *(mandatory)*

### Functional Requirements

#### Data Pipeline Completeness

- **FR-001**: System MUST persist generated vehicle information (VIN, make, model, year, license plate) to a retrievable data store when generating auto claims
- **FR-002**: System MUST index generated policy markdown content in the vector store immediately after scenario generation
- **FR-003**: System MUST create complete customer records with name, email, and locale-appropriate phone format for all generated scenarios
- **FR-004**: System MUST generate unique identifiers (claim_id, policy_number, claimant_id, VIN) that do not conflict with existing sample data
- **FR-005**: System MUST validate that all required workflow fields are present before saving a generated scenario

#### Structured Output Integration

- **FR-006**: System MUST use Pydantic model schemas passed to the OpenAI SDK's `response_format` parameter for scenario generation
- **FR-007**: System MUST define comprehensive Pydantic models (`GeneratedClaimData`, `GeneratedPolicyData`) with all required fields and proper validation
- **FR-008**: System MUST handle schema validation failures by applying sensible defaults rather than raising errors to users
- **FR-009**: System MUST log successful structured output parsing with model type for debugging and monitoring

#### Documentation Hints UX

- **FR-010**: System MUST display a subtle visual indicator when a claim lacks supporting documentation (photos, police report)
- **FR-011**: System MUST show positive acknowledgment when documentation is present (e.g., "3 photos provided", "Police report filed")
- **FR-012**: System MUST ensure documentation hints are non-intrusive (small icons, muted colors, tooltip explanations on hover)
- **FR-013**: System MUST position documentation hints near the claim summary without cluttering the primary workflow visualization

#### Workflow Integration

- **FR-014**: System MUST ensure generated scenarios are fully compatible with both single-agent and multi-agent workflow demos
- **FR-015**: System MUST pass generated policy content to Policy Checker agent via vector search, not direct file reference
- **FR-016**: System MUST support running workflows on generated scenarios without requiring manual data adjustments
- **FR-017**: System MUST return structured outputs from all agents when processing generated scenarios

#### Presenter Experience

- **FR-018**: System MUST provide a scenario preview mode showing all data fields before workflow execution
- **FR-019**: System MUST display locale flags/icons for quick scenario identification in lists
- **FR-020**: System MUST highlight data quality indicators (documentation status, complexity level) in scenario cards

### Key Entities

- **GeneratedClaimData**: Complete claim information including claim_id, policy_number, claimant details, incident information, estimated damage, location, documentation flags (photos_provided, police_report), and optional vehicle_info for auto claims
- **GeneratedPolicyData**: Policy document data including policy_number, coverage type, limits, deductibles, exclusions, effective/expiration dates, and full markdown content for indexing
- **VehicleRecord**: Persisted vehicle information for auto claims including VIN, make, model, year, license_plate, and association to policy/claim
- **DocumentationStatus**: Derived entity tracking presence of photos, police reports, witness statements, and other supporting evidence for a claim
- **ScenarioQualityMetrics**: Derived indicators showing completeness of generated data and readiness for demo (all fields populated, indexed, valid references)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated scenarios can be processed through the multi-agent workflow without "policy not found" or "vehicle not found" errors
- **SC-002**: Generated scenarios produce structured outputs from all 4 specialist agents with less than 5% failure rate
- **SC-003**: Scenario generation time remains under 15 seconds including policy indexing
- **SC-004**: 95% of generated claim data validates successfully against Pydantic schemas on first generation attempt
- **SC-005**: Presenters can identify scenario locale, type, and documentation status within 2 seconds of viewing a scenario card
- **SC-006**: Documentation hints are visible but do not increase visual clutter (measured by user feedback as "non-intrusive")
- **SC-007**: Single-agent demos work correctly with generated scenarios for all 4 agent types

## Assumptions

- Azure OpenAI supports structured outputs with Pydantic model schemas via the `response_format` parameter (available in recent API versions)
- The existing vector store can handle dynamic document additions without full index rebuilds
- Vehicle data persistence will use the existing SQLite database with permanent storage
- The frontend can be updated to display documentation hints without major component restructuring
- Presenters have basic familiarity with the scenario generation UI from the previous feature (004-ai-demo-examples)

## Clarifications

### Session 2026-01-18

- Q: Should vehicle data be persisted permanently in database or only in-memory for session? → A: Permanent database persistence (SQLite alongside saved scenarios)
- Q: Should documentation hints suggest specific photo types or be generic? → A: Generic hint only ("Adding photos increases approval likelihood")
- Q: Maximum wait time before showing loading indicator during generation? → A: 500ms delay (show spinner only if generation takes longer)
- Q: Should complex scenarios auto-set photos_provided/police_report to true? → A: Always default false (presenter uploads during demo)
- Q: Behavior when Policy Checker cannot find policy in vector index? → A: Return INSUFFICIENT_EVIDENCE status, workflow continues

