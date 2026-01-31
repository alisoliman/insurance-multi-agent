# Contoso Claims - Backend API

This is the backend component of the Contoso Claims multi-agent insurance platform, built with FastAPI and powered by Azure OpenAI.

## Features

- FastAPI framework with async support
- Multi-agent system using agent-framework
- Azure OpenAI integration (GPT-4o)
- Vector search with FAISS for policy documents
- PDF processing for insurance policies
- RESTful API endpoints for agent workflows
- Request validation with Pydantic
- Error handling and logging
- CORS configuration
- Docker containerization

## Getting Started

### Prerequisites

- Python 3.12
- [uv](https://github.com/astral-sh/uv) package manager
- Azure OpenAI account (optional - falls back to mock responses)

### Installation

1. Install uv if you don't have it already:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies and run:

```bash
cd backend
uv run fastapi dev
```

3. Create a `.env` file in the backend directory:

```env
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-large
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### Running the Application

Start the development server:

```bash
uv run fastapi dev
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/api/docs.

### Docker

Build and run the Docker container:

```bash
# Build the image
docker build -t insurance-backend .

# Run the container
docker run -p 8000:80 insurance-backend
```

## API Endpoints

### Agent Endpoints

- `POST /api/v1/agent/run` - Run a single agent (claim-assessor, policy-checker, risk-analyst, communication-agent)
- `GET /api/v1/agent/list` - List available agents

### Workflow Endpoints

- `POST /api/v1/workflow/run` - Run complete multi-agent workflow
- `POST /api/v1/workflow/stream` - Stream workflow execution with real-time updates

### Document Management

- `POST /api/v1/documents/upload` - Upload insurance policy documents
- `GET /api/v1/documents/list` - List uploaded documents
- `POST /api/v1/documents/rebuild-index` - Rebuild vector search index

### Sample Data

- `GET /api/v1/demo/scenarios` - Get demo claim scenarios
- `GET /api/v1/demo/scenarios/{id}` - Get specific scenario

### Health Check

- `GET /` - Health check endpoint

## Project Structure

```
backend/
├── app/                    # Application code
│   ├── api/v1/             # API routes
│   │   └── endpoints/      # Route modules
│   ├── core/               # Core functionality
│   │   ├── config.py       # Settings
│   │   └── logger.py       # Logging configuration
│   ├── workflow/           # Multi-agent system
│   │   ├── agents/         # Individual agent implementations
│   │   ├── supervisor.py   # Workflow orchestration
│   │   ├── tools.py        # Agent tools
│   │   └── policy_search.py # Vector search for policies
│   ├── models/             # Pydantic schemas
│   ├── services/           # Business logic
│   ├── data/               # Sample policies and claims
│   └── main.py             # Application entry point
├── Dockerfile              # Docker configuration
├── pyproject.toml          # Project dependencies
└── README.md               # This file
```

## Agents

The backend implements four specialized AI agents:

1. **Claim Assessor** - Analyzes damage photos and repair costs
2. **Policy Checker** - Verifies coverage and searches policy documents
3. **Risk Analyst** - Detects fraud patterns and assesses risk
4. **Communication Agent** - Generates customer communications

The **Supervisor Agent** orchestrates the workflow and synthesizes final recommendations.