# Insurance Multi-Agent Backend (FastAPI)

This repository contains a modular FastAPI backend that exposes a multi-agent workflow (built with LangGraph) for processing insurance claims.

## Features

* **Multi-Agent Workflow** – Claim assessor, policy checker, risk analyst, communication agent, orchestrated by a LangGraph supervisor.
* **Tools** – Policy lookup, claimant history, vehicle details, policy-document semantic search, Azure-GPT multimodal image analysis.
* **Config** – Centralised settings via `app/core/config.py`.
* **Dev server** – Run with `uv run fastapi dev`.

## Getting Started

### Prerequisites

* Python 3.12+
* [uv](https://github.com/astral-sh/uv)
* Azure OpenAI account (optional – the app can run with stubbed LLM if env vars are missing)

### Backend Setup

```bash
cd backend
uv run fastapi dev
```

The API will be available at http://localhost:8000

### Environment Variables

Set these in your shell or a `.env` file if you want real Azure OpenAI calls:

```
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

Without them the backend falls back to a local stub LLM.

## Project Structure

```
backend/
  app/
    api/v1/endpoints/      # FastAPI routers
    core/                 # Settings, utils
    models/               # Pydantic schemas
    services/             # Orchestration wrappers
    workflow/             # Agents, tools, supervisor graph
```

## License

MIT