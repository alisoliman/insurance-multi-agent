SHELL := /bin/bash

.PHONY: help install db backend frontend dev stop

help:
	@printf "Targets:\n"
	@printf "  make install   Install backend and frontend dependencies\n"
	@printf "  make db        Start PostgreSQL via Docker Compose\n"
	@printf "  make backend   Run the FastAPI dev server with auto reload\n"
	@printf "  make frontend  Run the Next.js dev server with auto reload\n"
	@printf "  make dev       Start db, backend, and frontend together\n"
	@printf "  make stop      Stop the PostgreSQL container\n"

install:
	cd backend && uv sync
	cd frontend && npm install --legacy-peer-deps

db:
	docker compose up -d postgres

backend:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@$(MAKE) db
	@printf "Starting backend on http://localhost:8000 and frontend on http://localhost:3000\n"
	@set -euo pipefail; \
	backend_pid=""; \
	frontend_pid=""; \
	cleanup() { \
		local exit_code=$$?; \
		trap - INT TERM EXIT; \
		if [ -n "$$backend_pid" ] && kill -0 "$$backend_pid" 2>/dev/null; then \
			kill "$$backend_pid" 2>/dev/null || true; \
		fi; \
		if [ -n "$$frontend_pid" ] && kill -0 "$$frontend_pid" 2>/dev/null; then \
			kill "$$frontend_pid" 2>/dev/null || true; \
		fi; \
		wait "$$backend_pid" 2>/dev/null || true; \
		wait "$$frontend_pid" 2>/dev/null || true; \
		exit $$exit_code; \
	}; \
	trap cleanup INT TERM EXIT; \
	(cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
	backend_pid=$$!; \
	(cd frontend && npm run dev) & \
	frontend_pid=$$!; \
	while kill -0 "$$backend_pid" 2>/dev/null && kill -0 "$$frontend_pid" 2>/dev/null; do \
		sleep 1; \
	done; \
	if ! kill -0 "$$backend_pid" 2>/dev/null; then \
		wait "$$backend_pid"; \
	fi; \
	if ! kill -0 "$$frontend_pid" 2>/dev/null; then \
		wait "$$frontend_pid"; \
	fi

stop:
	docker compose stop postgres
