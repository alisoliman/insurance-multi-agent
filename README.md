# Shadcn-FastAPI Starter

A minimalist boilerplate for building applications with a Python FastAPI backend and a Next.js frontend using shadcn/ui components.

## Features

- **Backend**: Python FastAPI with uv for dependency management
- **Frontend**: Next.js with shadcn/ui components and TypeScript
- **Deployment**: Azure Container Apps infrastructure
- **Example App**: Task Manager with CRUD operations

## Example Application: Task Manager

This boilerplate includes a simple Task Manager application that demonstrates:

- Task creation, reading, updating, and deletion
- Status filtering (pending, completed, etc.)
- Clean API design with FastAPI
- Modern UI with shadcn/ui components
- Responsive design with dark/light mode

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- uv (Python package manager)
- Azure Developer CLI (for deployment)

### Backend Setup

```bash
cd backend
uv run fastapi dev
```

The API will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The frontend will be available at http://localhost:3000

## Deployment

Deploy to Azure Container Apps:

```bash
azd auth login
azd up
```

## Project Structure

- `backend/`: FastAPI application with task management API
- `frontend/`: Next.js application with shadcn/ui components  
- `infra/`: Azure infrastructure as code (Bicep templates)

## License

MIT