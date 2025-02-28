#!/bin/bash
set -eo pipefail

# Enable debug mode if DEBUG_ENTRYPOINT is set
if [[ "${DEBUG_ENTRYPOINT}" == "true" ]]; then
    set -x
fi

# Function for handling errors
error_handler() {
    echo "Error occurred in entrypoint script at line $1" >&2
    exit 1
}

# Setup error handling
trap 'error_handler $LINENO' ERR

# Wait for PostgreSQL
if [[ "${DATABASE}" = "postgres" ]]; then
    echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
    
    # Implement retry mechanism with timeout
    RETRY_COUNT=0
    MAX_RETRIES=${MAX_DB_RETRIES:-30}
    RETRY_INTERVAL=${DB_RETRY_INTERVAL:-1}
    
    until PGPASSWORD=$POSTGRES_PASSWORD psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1" > /dev/null 2>&1; do
        RETRY_COUNT=$((RETRY_COUNT+1))
        if [[ ${RETRY_COUNT} -ge ${MAX_RETRIES} ]]; then
            echo "Error: Failed to connect to PostgreSQL after ${MAX_RETRIES} attempts" >&2
            exit 1
        fi
        
        echo "PostgreSQL is unavailable - retrying in ${RETRY_INTERVAL}s (${RETRY_COUNT}/${MAX_RETRIES})"
        sleep ${RETRY_INTERVAL}
    done
    
    echo "PostgreSQL is available"
fi

# Run database health check
echo "Verifying database connection..."
python -c "
import sys
import time
import django
from django.db import connections
from django.db.utils import OperationalError

django.setup()
start_time = time.time()
while True:
    try:
        connections['default'].cursor()
        break
    except OperationalError:
        if time.time() - start_time > 30:
            sys.stderr.write('Database connection failed after 30 seconds\\n')
            sys.exit(1)
        time.sleep(1)
"

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Check for application health needs
if [[ "${CHECK_APP_HEALTH}" == "true" ]]; then
    echo "Checking application health..."
    python manage.py check --deploy
fi

# Run custom initialization commands if specified
if [[ -n "${INIT_COMMAND}" ]]; then
    echo "Running initialization command: ${INIT_COMMAND}"
    eval "${INIT_COMMAND}"
fi

echo "Entrypoint tasks completed, launching application..."
exec "$@"