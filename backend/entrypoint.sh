#!/bin/sh
# Entrypoint: attempt Alembic migrations gracefully, then start the app.
# If migrations fail (e.g. DB temporarily unreachable), the app still starts
# and the in-app init_db() fallback will retry on first request.

echo "Attempting database migrations..."
if alembic upgrade head; then
    echo "Database migrations completed successfully."
else
    echo "WARNING: Database migrations failed. The app will start anyway and retry via init_db()."
fi

exec "$@"
