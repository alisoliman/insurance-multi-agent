# Shadcn-FastAPI Starter Backend

This is the backend component of the Shadcn-FastAPI Starter boilerplate, built with FastAPI and managed by uv.

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

- Python 3.10 or higher
- [uv](https://github.com/astral-sh/uv) package manager

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

Start the development server:

```bash
uvicorn app.main:app --reload
```

Or use the fastapi CLI:

```bash
fastapi dev
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/api/docs.

### Running Tests

Run the tests with pytest:

```bash
uv run pytest
```

### Docker

Build and run the Docker container:

```bash
# Build the image
docker build -t shadcn-fastapi-backend .

# Run the container
docker run -p 8000:80 shadcn-fastapi-backend
```

## API Endpoints

### Tasks API

- `GET /api/tasks/` - List all tasks with pagination and filtering
- `GET /api/tasks/{task_id}` - Get a specific task
- `POST /api/tasks/` - Create a new task
- `PUT /api/tasks/{task_id}` - Update a task
- `DELETE /api/tasks/{task_id}` - Delete a task

### Health Check

- `GET /` - Health check endpoint

## Project Structure

```
backend/
├── app/                # Application code
│   ├── api/            # API routes
│   │   └── routes/     # Route modules
│   ├── core/           # Core functionality
│   │   ├── config.py   # Settings
│   │   ├── exceptions.py # Custom exceptions
│   │   └── logger.py   # Logging configuration
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # Application entry point
├── tests/              # Test modules
├── .env.example        # Environment variables template
├── Dockerfile          # Docker configuration
├── pyproject.toml      # Project dependencies
└── README.md           # This file
```