FROM python:3.12-slim-bullseye AS builder

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock ./

# Install only runtime dependencies so production images don't carry test tooling.
RUN uv sync --frozen --no-dev --no-install-project --no-cache

FROM python:3.12-slim-bullseye

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY alembic.ini ./
COPY migrations ./migrations
COPY app ./app

ENV PATH="/app/.venv/bin:${PATH}"

# Run the application with an exec-form entrypoint so the server receives signals directly.
CMD ["fastapi", "run", "app/main.py", "--port", "8000"]
