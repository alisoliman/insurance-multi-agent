# Insurance Claims Multi-Agent Backend

This is the backend component of the multi-agent insurance claims processing system, built with FastAPI, Microsoft Agent Framework, and PostgreSQL.

## Features

- FastAPI framework with async support
- Dependency management with uv
- RESTful API endpoints for the Task Manager example
- Request validation with Pydantic
- Error handling and logging
- CORS configuration
- Docker containerization

## Getting Started

### Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) package manager
- Docker Desktop or a local PostgreSQL 16 instance

### Installation

1. Install uv if you don't have it already:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Create and activate a virtual environment:

```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate.ps1
```

3. Install dependencies:

```bash
uv pip install -e .
```

4. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

### Running the Application

Start PostgreSQL first:

```bash
docker compose up -d postgres
```

The compose database is published on `127.0.0.1:5433` by default so it does not collide with an existing local PostgreSQL service on `5432`.

Start the development server:

```bash
uv run fastapi dev
```

Or use the fastapi CLI:

```bash
fastapi dev
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/api/docs.

### Running Tests

Run the tests with pytest:

```bash
docker compose up -d postgres
uv run pytest
```

### Docker

Build and run the Docker container:

```bash
# Build the image
docker build -t shadcn-fastapi-backend .

# Run the container
docker run --env-file .env -p 8000:80 shadcn-fastapi-backend
```

## API Endpoints

### Health Check

- `GET /` - Health check endpoint

## Project Structure

```
backend/
├── app/                # Application code
│   ├── api/            # API routes
│   │   └── routes/     # Route modules
│   ├── core/           # Settings and logging
│   ├── db/             # PostgreSQL engine, repositories, migrations
│   ├── models/         # Pydantic models
│   └── main.py         # Application entry point
├── tests/              # Test modules
├── migrations/         # Alembic migration scripts
├── .env.example        # Environment variables template
├── Dockerfile          # Docker configuration
├── pyproject.toml      # Project dependencies
└── README.md           # This file
```
