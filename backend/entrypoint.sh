#!/bin/bash
# Docker entrypoint script for Django application
# This script handles database connection verification, migrations, and application startup

# Exit immediately if a command exits with a non-zero status
# -e: exit on error
# -o pipefail: return value of a pipeline is the value of the last (rightmost) command to exit with a non-zero status
set -eo pipefail

# Constants with defaults (can be overridden by environment variables)
: "${MAX_DB_RETRIES:=30}"
: "${DB_RETRY_INTERVAL:=1}"
: "${DB_CONNECTION_TIMEOUT:=30}"
: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"

# Enable debug mode if DEBUG_ENTRYPOINT is set
if [[ "${DEBUG_ENTRYPOINT}" == "true" ]]; then
    set -x
    echo "🐞 Debug mode enabled"
fi

# Function for handling errors with more detailed information
error_handler() {
    local line_no=$1
    local error_code=$2
    echo "❌ Error occurred in entrypoint script at line ${line_no} (exit code: ${error_code})" >&2
    exit "${error_code}"
}

# Log function for consistent output
log() {
    local level=$1
    local message=$2
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [${level}] ${message}"
}

# Setup error handling
trap 'error_handler ${LINENO} $?' ERR

log "INFO" "Starting application entrypoint script"

# Function to check if a variable is set and not empty
check_required_var() {
    local var_name=$1
    if [[ -z "${!var_name}" ]]; then
        log "ERROR" "Required environment variable ${var_name} is not set"
        exit 1
    fi
}

# Wait for PostgreSQL with improved error handling and feedback
if [[ "${DATABASE}" = "postgres" ]]; then
    # Check required PostgreSQL variables
    check_required_var "POSTGRES_USER"
    check_required_var "POSTGRES_PASSWORD"
    check_required_var "POSTGRES_DB"
    
    log "INFO" "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
    
    # Implement retry mechanism with timeout
    RETRY_COUNT=0
    
    until PGPASSWORD=$POSTGRES_PASSWORD psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1" > /dev/null 2>&1; do
        RETRY_COUNT=$((RETRY_COUNT+1))
        if [[ ${RETRY_COUNT} -ge ${MAX_DB_RETRIES} ]]; then
            log "ERROR" "Failed to connect to PostgreSQL after ${MAX_DB_RETRIES} attempts"
            exit 1
        fi
        
        log "WARN" "PostgreSQL is unavailable - retrying in ${DB_RETRY_INTERVAL}s (${RETRY_COUNT}/${MAX_DB_RETRIES})"
        sleep ${DB_RETRY_INTERVAL}
    done
    
    log "INFO" "✅ PostgreSQL is available"
fi

# Run database health check with improved error handling
log "INFO" "Verifying database connection..."
python -c "
import sys
import time
import django
from django.db import connections
from django.db.utils import OperationalError

try:
    django.setup()
    start_time = time.time()
    timeout = float('${DB_CONNECTION_TIMEOUT}')
    
    while True:
        try:
            connections['default'].cursor()
            print('✅ Database connection successful')
            break
        except OperationalError as e:
            if time.time() - start_time > timeout:
                sys.stderr.write(f'❌ Database connection failed after {timeout} seconds: {str(e)}\\n')
                sys.exit(1)
            time.sleep(1)
            sys.stderr.write('.')
except Exception as e:
    sys.stderr.write(f'❌ Error during database check: {str(e)}\\n')
    sys.exit(1)
"

# Run database migrations with error checking
log "INFO" "Running database migrations..."
if ! python manage.py migrate --noinput; then
    log "ERROR" "Database migration failed"
    exit 1
fi
log "INFO" "✅ Database migrations completed successfully"

# Collect static files if enabled
if [[ "${COLLECT_STATIC}" == "true" ]]; then
    log "INFO" "Collecting static files..."
    if ! python manage.py collectstatic --noinput; then
        log "ERROR" "Static file collection failed"
        exit 1
    fi
    log "INFO" "✅ Static files collected successfully"
fi

# Check for application health needs with more detailed output
if [[ "${CHECK_APP_HEALTH}" == "true" ]]; then
    log "INFO" "Checking application health..."
    if ! python manage.py check --deploy; then
        log "WARN" "Application health check reported issues"
        # Continue but warn - not failing as checks might be informational
    else
        log "INFO" "✅ Application health check passed"
    fi
fi

# Create superuser if credentials are provided
if [[ "${CREATE_SUPERUSER}" == "true" ]]; then
    if [[ -n "${DJANGO_SUPERUSER_USERNAME}" && -n "${DJANGO_SUPERUSER_PASSWORD}" && -n "${DJANGO_SUPERUSER_EMAIL}" ]]; then
        log "INFO" "Creating superuser..."
        python -c "
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='${DJANGO_SUPERUSER_USERNAME}').exists():
    User.objects.create_superuser('${DJANGO_SUPERUSER_USERNAME}', '${DJANGO_SUPERUSER_EMAIL}', '${DJANGO_SUPERUSER_PASSWORD}')
    print('✅ Superuser created successfully')
else:
    print('✅ Superuser already exists')
"
    else
        log "WARN" "CREATE_SUPERUSER is true but required environment variables are not set"
    fi
fi

# Run custom initialization commands if specified with improved security
if [[ -n "${INIT_COMMAND}" ]]; then
    log "INFO" "Running initialization command"
    # Using eval but with caution - command should be trusted
    if ! eval "${INIT_COMMAND}"; then
        log "ERROR" "Initialization command failed"
        exit 1
    fi
    log "INFO" "✅ Initialization command completed"
fi

log "INFO" "✅ Entrypoint tasks completed, launching application..."
exec "$@"