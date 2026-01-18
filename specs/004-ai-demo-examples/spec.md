# Feature Specification: AI-Powered Demo Example Generation

**Feature Branch**: `004-ai-demo-examples`  
**Created**: 2026-01-18  
**Status**: Draft  
**Input**: User description: "The demos are now constrained to 3 populated examples but I have colleagues from different markets and backgrounds who would like to show this in a native way. I want to make this demo more general and allow adding more examples using AI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Localized Demo Scenario (Priority: P1)

A Microsoft colleague preparing to demo the insurance claims system to a client in Germany wants to quickly generate a realistic German auto insurance claim scenario that uses local terminology, currency (EUR), typical German insurance concepts, and German customer names.

**Why this priority**: This is the core value proposition - enabling colleagues from any market to create relatable, culturally-appropriate demos without manual data preparation. Directly addresses the stated need for "native" demos.

**Independent Test**: Can be fully tested by selecting "Germany" as the locale, choosing "Auto" claim type, and generating a scenario. Delivers immediate value by producing a usable demo claim.

**Acceptance Scenarios**:

1. **Given** a user is on the demo page, **When** they click "Generate New Scenario", **Then** they see a modal/panel with options for locale/region, claim type, and complexity level
2. **Given** the scenario generator is open, **When** the user selects "Germany" as locale and "Auto" as claim type, **Then** the system generates a claim with German names, EUR currency, German locations, and appropriate insurance terminology
3. **Given** the user has configured scenario parameters, **When** they click "Generate", **Then** a new realistic demo scenario appears in the claims list within 10 seconds
4. **Given** a generated scenario exists, **When** the user runs the workflow, **Then** the multi-agent system processes it successfully with contextually appropriate responses

---

### User Story 2 - Custom Scenario from Description (Priority: P1)

A Solutions Architect needs to demonstrate a very specific claim scenario that matches a client's real-world use case - a commercial fleet vehicle accident involving multiple parties in the Netherlands.

**Why this priority**: Equally critical as P1 since many demos require highly specific scenarios that preset options cannot anticipate. This flexibility enables any imaginable demo scenario.

**Independent Test**: Can be tested by typing a natural language description like "A delivery van in Rotterdam damaged two parked cars during a storm" and generating a matching claim.

**Acceptance Scenarios**:

1. **Given** a user is on the demo page, **When** they open the scenario generator, **Then** they see a text input field for custom scenario description
2. **Given** the user has entered a custom description, **When** they click "Generate", **Then** the AI creates a structured claim that matches the description's context, locale, and specifics
3. **Given** a custom description mentions specific details (amounts, names, locations), **When** the scenario is generated, **Then** those details are incorporated or contextually adapted into the claim

---

### User Story 3 - Save and Reuse Generated Scenarios (Priority: P2)

A team lead has created several excellent demo scenarios for their regional market and wants to save them so team members can reuse them without regenerating.

**Why this priority**: Improves efficiency and consistency across teams, but the core generation capability (P1) must work first.

**Independent Test**: Can be tested by generating a scenario, saving it with a name, refreshing the page, and confirming it appears in a "Saved Scenarios" section.

**Acceptance Scenarios**:

1. **Given** a user has generated a scenario, **When** they click "Save Scenario", **Then** they can provide a name and the scenario is persisted to the backend database
2. **Given** saved scenarios exist, **When** the user opens the demo page, **Then** saved scenarios appear in a separate "My Saved Scenarios" section alongside the default samples
3. **Given** a saved scenario exists, **When** the user clicks "Delete", **Then** the scenario is removed from local storage after confirmation

---

### User Story 4 - Preset Regional Templates (Priority: P3)

Frequent demo presenters want quick access to pre-configured regional templates (e.g., "Dutch Auto Claim", "UK Home Insurance", "US Health Claim") without configuring options each time.

**Why this priority**: Convenience feature that enhances usability but is not required for core functionality.

**Independent Test**: Can be tested by selecting a preset template like "Dutch Auto Claim" and verifying a scenario is generated with appropriate Dutch characteristics.

**Acceptance Scenarios**:

1. **Given** a user opens the scenario generator, **When** the interface loads, **Then** they see a "Quick Templates" section with common regional/type combinations
2. **Given** preset templates are displayed, **When** the user clicks one, **Then** a scenario matching that template is generated immediately

---

### Edge Cases

- What happens when AI generation fails or times out? → Display user-friendly error message with retry option
- How does the system handle unsupported or fictional locales? → AI will make reasonable assumptions for any specified region
- What if the custom description is too vague or inappropriate? → AI will request clarification or use sensible defaults; inappropriate content is rejected with a message
- How are currency and date formats handled for different locales? → Generated scenarios use locale-appropriate formatting (EUR for EU, GBP for UK, USD for US, etc.)
- What happens when database storage quota is reached? → Display warning and suggest deleting old saved scenarios

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Generate New Scenario" interface accessible from the demo page
- **FR-002**: System MUST allow users to select target locale/region from a list of common options (at minimum: US, UK, Germany, Netherlands, France, Spain, Japan, Australia)
- **FR-003**: System MUST allow users to select claim type (auto, home, health, life, commercial)
- **FR-004**: System MUST allow users to select complexity level (Simple, Moderate, Complex)
- **FR-005**: System MUST accept free-form text descriptions for custom scenario generation
- **FR-006**: System MUST generate complete, valid claim data structures matching the existing ClaimSummary and backend claim format
- **FR-007**: Generated scenarios MUST include locale-appropriate: customer names, currency, addresses/locations, phone formats, insurance terminology, policy number formats, and **claim description text written in the local language** (e.g., German for Germany, Dutch for Netherlands)
- **FR-008**: System MUST integrate generated scenarios into the existing demo workflow without modification to the workflow processing logic
- **FR-008a**: System MUST generate a matching policy document alongside each generated claim, with appropriate coverage types, limits, and terms that align with the claim scenario
- **FR-009**: System MUST allow users to save generated scenarios to a local backend database with a custom name
- **FR-010**: System MUST display saved scenarios in a dedicated section on the demo page
- **FR-011**: System MUST allow users to delete saved scenarios
- **FR-012**: System MUST provide preset regional templates for quick scenario generation
- **FR-013**: System MUST display clear loading states during AI generation
- **FR-014**: System MUST handle generation errors gracefully with retry options

### Key Entities

- **Generated Scenario**: A claim data structure created by AI, containing all fields required by the workflow (claim_id, policy_number, claimant_name, incident_date, claim_type, description, estimated_damage, location, vehicle_info/property_info) **plus a matching generated policy** with appropriate coverage details
- **Locale Configuration**: Region-specific settings including currency code, date format, name patterns, address format, phone format, and common insurance terms
- **Saved Scenario**: A generated scenario persisted to the backend database with a user-defined name and creation timestamp, accessible from any browser session
- **Preset Template**: A predefined combination of locale and claim type for quick access

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a new demo scenario from parameters in under 10 seconds
- **SC-002**: Users can generate a scenario from a custom description in under 15 seconds
- **SC-003**: 95% of generated scenarios successfully process through the multi-agent workflow without errors
- **SC-004**: Generated scenarios for supported locales correctly use locale-appropriate formatting (currency, dates, names, addresses)
- **SC-005**: Users can save at least 20 scenarios to the local database
- **SC-006**: Saved scenarios persist across browser sessions and are accessible from any device
- **SC-007**: Users from at least 5 different regional markets can create contextually appropriate demos without manual data editing

## Clarifications

### Session 2026-01-18

- Q: Should claim description text be in local language or English with locale details? → A: Full local language (German for Germany, Dutch for Netherlands, etc.)
- Q: Should generated scenarios also create a matching policy, or reference existing sample policies? → A: Generate matching policy data alongside the claim (full end-to-end generation)
- Q: Should saved scenarios be shareable or browser-local? → A: Saved via local DB (backend database storage, accessible from any browser)

## Assumptions

- The Azure OpenAI API (already used by the backend agents) will be leveraged for scenario generation
- A local database (e.g., SQLite or similar) will be used for persisting saved scenarios on the backend
- Users have access to the backend API for scenario generation and storage
- The existing workflow processing does not need modification - only the input claim data changes
- Generation will happen on the backend to keep API keys secure and maintain consistent quality
