# Research: Structured Agent Outputs

**Feature**: 002-structured-agent-outputs  
**Date**: 2026-01-17

## Research Tasks

### 1. Agent Framework Structured Output Support

**Task**: Determine how to use structured outputs with the Microsoft Agent Framework

**Source**: [Microsoft Agent Framework - Producing Structured Output with Agents](https://learn.microsoft.com/en-us/agent-framework/tutorials/agents/structured-output?pivots=programming-language-python)

**Findings**:
- The `ChatAgent` supports structured output when used with compatible chat clients (Azure OpenAI)
- Pass a Pydantic model to the `response_format` parameter when calling `agent.run()`
- The structured output is available in `response.value` as a **Pydantic model instance** (not JSON string)
- No need to manually parse JSON - the framework handles deserialization automatically

**Official Example**:
```python
from pydantic import BaseModel

class PersonInfo(BaseModel):
    name: str | None = None
    age: int | None = None
    occupation: str | None = None

# Run with structured output
response = await agent.run(
    "Extract info about John Smith, 35-year-old software engineer.",
    response_format=PersonInfo
)

# Access the structured data directly as Pydantic model
if response.value:
    person_info = response.value
    print(f"Name: {person_info.name}, Age: {person_info.age}")
```

**Decision**: Use `response_format` parameter in `agent.run()` and access structured data via `response.value`

**Rationale**: Native support in the framework; response is automatically deserialized to Pydantic model instance.

**Alternatives considered**:
- Manual JSON schema dict: More error-prone, loses type safety
- Post-processing with regex: Current approach, brittle and unreliable

---

### 2. Pydantic Model Design for LLM Structured Outputs

**Task**: Best practices for Pydantic models used with LLM structured outputs

**Findings**:
- Use `str` enums (inherit from both `str` and `Enum`) for status fields
- Keep schemas relatively flat; deeply nested structures increase LLM confusion
- Include text fields for reasoning/analysis alongside structured fields
- All fields are required by default in Pydantic v2; use `Optional[]` or default values for optional fields
- Field descriptions via `Field(description="...")` help LLM understand intent

**Decision**: 
- Create flat Pydantic models with enum status fields
- Include `reasoning`/`analysis` text fields for explainability
- Use `List[str]` for variable-length findings (red flags, indicators, etc.)

**Rationale**: Balances schema strictness (enums) with flexibility (text fields) per clarification session.

---

### 3. Integration with Agent Factory Pattern

**Task**: How to pass structured output config to existing agent factories

**Findings**:
- Current agent factories (`create_*_agent()`) return a `ChatAgent` instance
- Options can be passed either:
  1. As `default_options` in `ChatAgent.__init__()` (applies to all runs)
  2. As `options` in `agent.run()` (per-invocation override)
- For consistent structured output, `default_options` is cleaner

**Decision**: Modify each agent factory to include `default_options` with `response_format` set to the agent's output model

**Rationale**: Encapsulates the structured output requirement in the agent definition; callers don't need to remember to pass options.

---

### 4. Response Parsing in Supervisor

**Task**: How to extract structured data from agent responses

**Findings** (from official docs):
- `agent.run()` returns an `AgentResponse` object
- When `response_format` is a Pydantic model, the response is **automatically deserialized**
- Access structured data via `response.value` - already a Pydantic model instance
- No need to call `model_validate_json()` - the framework handles this
- Check `if response.value:` before accessing to handle edge cases

**Decision**: 
- Access `response.value` directly in supervisor - it's already the typed Pydantic model
- Check for `None` value before accessing fields

**Rationale**: The framework handles JSON parsing and Pydantic validation internally; simpler code, fewer error cases.

---

## Summary

All research questions resolved. Key implementation approach:

1. **Models**: Create `backend/app/models/agent_outputs.py` with Pydantic models for each agent
2. **Agent runs**: Pass `response_format=OutputModel` to `agent.run()` calls
3. **Supervisor**: Access `response.value` directly - it's already the Pydantic model instance
4. **Error handling**: Check `if response.value:` before accessing; fail fast on None
