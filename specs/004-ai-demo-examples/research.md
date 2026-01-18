# Research: AI-Powered Demo Example Generation

**Feature**: `004-ai-demo-examples`  
**Date**: 2026-01-18  
**Status**: Complete

## Research Tasks

### 1. Azure OpenAI Structured Output for Scenario Generation

**Task**: Determine best approach for generating structured claim + policy data from AI

**Decision**: Use Azure OpenAI GPT-4o with JSON mode and Pydantic response models

**Rationale**:
- GPT-4o already used by existing agents (no new dependency)
- JSON mode ensures valid, parseable output
- Pydantic models provide validation and type safety
- Single API call can generate both claim and policy data

**Alternatives Considered**:
- Function calling with structured outputs: More complex, JSON mode sufficient
- Multiple LLM calls (one for claim, one for policy): Higher latency, unnecessary
- Template-based generation: Less flexible, can't handle custom descriptions

**Implementation Notes**:
- Use system prompt with example claim/policy structure
- Include locale-specific guidance in the prompt
- Set `response_format={"type": "json_object"}` in API call
- Validate response against Pydantic models before returning

---

### 2. SQLite for Scenario Persistence

**Task**: Determine storage approach for saved scenarios

**Decision**: SQLite database file in backend data directory

**Rationale**:
- Lightweight, no additional infrastructure needed
- File-based, works with existing container deployment
- Sufficient for demo workloads (< 1000 scenarios)
- Python stdlib `sqlite3` + `aiosqlite` for async support
- Easy to backup/restore

**Alternatives Considered**:
- PostgreSQL/Azure SQL: Overkill for demo data, requires infrastructure changes
- Browser localStorage: Spec clarified backend storage for cross-device access
- JSON file storage: Lacks query capability, concurrency issues

**Implementation Notes**:
- Database file location: `backend/app/db/scenarios.db`
- Add `aiosqlite` dependency for async operations
- Auto-create table on first API call
- Include created_at, name, locale, claim_type fields for filtering

---

### 3. Locale Configuration and Formatting

**Task**: Define approach for locale-aware scenario generation

**Decision**: Embed locale knowledge in LLM prompt with structured locale hints

**Rationale**:
- LLMs have strong knowledge of regional naming conventions, addresses, currencies
- Prompt engineering more flexible than hardcoded locale rules
- Allows natural handling of edge cases and mixed locales
- Custom description can override or specify locale naturally

**Alternatives Considered**:
- Locale configuration files with name lists, address formats: Rigid, high maintenance
- External APIs for locale data (Faker, etc.): Additional dependency, network calls
- Post-processing to localize: Loses context, may produce inconsistent results

**Supported Locales** (per spec FR-002):
| Locale | Language | Currency | Example City |
|--------|----------|----------|--------------|
| US | English | USD | New York, Los Angeles |
| UK | English | GBP | London, Manchester |
| Germany | German | EUR | Berlin, Munich |
| Netherlands | Dutch | EUR | Amsterdam, Rotterdam |
| France | French | EUR | Paris, Lyon |
| Spain | Spanish | EUR | Madrid, Barcelona |
| Japan | Japanese | JPY | Tokyo, Osaka |
| Australia | English | AUD | Sydney, Melbourne |

---

### 4. Policy Document Generation

**Task**: Determine how generated policies integrate with existing policy search

**Decision**: Generate inline policy markdown that gets added to the vector index temporarily

**Rationale**:
- Existing PolicyVectorSearch uses FAISS with markdown documents
- Generated policy can be added to vectorstore for the session
- Policy checker agent will find the generated policy via semantic search
- No permanent storage of generated policies needed (ephemeral with scenario)

**Alternatives Considered**:
- Modify policy checker to accept inline policy: Breaks agent separation principle
- Store generated policies as files: File system pollution, cleanup complexity
- Skip policy verification for generated claims: Reduces demo realism

**Implementation Notes**:
- Generate policy markdown following existing structure (see `comprehensive_auto_policy.md`)
- Include policy_number matching the generated claim
- Add to FAISS index as temporary document before workflow execution
- Consider policy caching for repeated scenario runs

---

### 5. Frontend Component Architecture

**Task**: Determine UI component structure for scenario generation

**Decision**: shadcn/ui Dialog modal with tabbed interface (Quick Generate / Custom Description)

**Rationale**:
- Dialog pattern is standard for creation flows
- Tabs separate the two main P1 use cases
- shadcn/ui components per constitution requirement
- Can be opened from existing demo page without navigation

**UI Flow**:
1. User clicks "Generate New Scenario" button on demo page
2. Dialog opens with two tabs:
   - **Quick Generate**: Dropdowns for Locale, Claim Type, Complexity + Generate button
   - **Custom**: Textarea for description + Generate button
3. Loading state shown during generation
4. On success: Dialog closes, new scenario appears in list
5. On error: Error message with retry option

**Components to Create**:
- `ScenarioGeneratorModal`: Main dialog container
- `LocaleSelector`: Dropdown with flag icons
- `ClaimTypeSelector`: Dropdown (Auto, Home, Health, Life, Commercial)
- `ComplexitySelector`: Radio group (Simple, Moderate, Complex)
- `CustomDescriptionInput`: Textarea with character count
- `PresetTemplates`: Quick-access buttons for common combinations

---

### 6. Preset Regional Templates

**Task**: Define preset templates for P3 quick access

**Decision**: 6 preset templates covering major markets and claim types

**Rationale**:
- Balance between variety and UI clutter
- Cover most common demo scenarios
- One-click convenience for repeat presenters

**Preset Templates**:
| Template Name | Locale | Claim Type | Complexity |
|---------------|--------|------------|------------|
| Dutch Auto Claim | Netherlands | Auto | Moderate |
| German Home Insurance | Germany | Home | Simple |
| UK Health Emergency | UK | Health | Moderate |
| US Auto Accident | US | Auto | Complex |
| French Commercial Claim | France | Commercial | Complex |
| Japanese Life Insurance | Japan | Life | Simple |

---

## Dependencies to Add

### Backend (pyproject.toml)
```toml
"aiosqlite>=0.19.0",  # Async SQLite for scenario persistence
```

### Frontend (package.json)
No new dependencies required - shadcn/ui components already available.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM generates invalid JSON | Low | Medium | Pydantic validation + retry logic |
| Generation timeout (>10s) | Medium | Low | Loading state, timeout handling, retry |
| Local language output fails in workflow | Low | High | Test with each locale before release |
| SQLite file permissions in container | Low | Medium | Ensure writable data directory |
| Policy not found by policy checker | Medium | High | Add generated policy to FAISS index |

## Open Questions (Resolved)

All clarification questions resolved in spec.md:
- ✅ Claim description language → Full local language
- ✅ Policy generation → Full end-to-end with matching policy
- ✅ Scenario storage → Backend SQLite database
