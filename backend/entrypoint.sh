#!/bin/bash
# Docker entrypoint script for Django application (Simplified SSL-free version)
set -eo pipefail

# Constants with defaults
: "${MAX_DB_RETRIES:=60}"
: "${DB_RETRY_INTERVAL:=2}"
: "${POSTGRES_DB:=djangoallauth_db}"
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_PASSWORD:=postgres}"
: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${DJANGO_SUPERUSER_EMAIL:=admin@example.com}"
: "${DJANGO_DEBUG:=False}"

# Enable debug mode if requested
if [[ "${DJANGO_DEBUG,,}" == "true" ]]; then
    set -x
    echo "🐞 Debug mode enabled"
fi

# Error handling
handle_error() {
    local line_no=$1
    local error_code=$2
    echo "❌ Error at line ${line_no} (exit ${error_code})" >&2
    exit ${error_code}
}

trap 'handle_error ${LINENO} $?' ERR

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %T')] $1"
}

# Database connection check
check_database() {
    log "Checking database connectivity..."
    local retries=0
    while ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t 1; do
        if [[ ${retries} -ge ${MAX_DB_RETRIES} ]]; then
            log "❌ Database connection failed after ${MAX_DB_RETRIES} attempts"
            return 1
        fi
        log "⚠️  Database not ready (attempt $((retries+1))/${MAX_DB_RETRIES})"
        sleep ${DB_RETRY_INTERVAL}
        ((retries++))
    done
    log "✔️ Database connection established"
}

# Ensure the 'postgres' role exists
ensure_postgres_role() {
    log "Ensuring PostgreSQL role '${POSTGRES_USER}' exists..."
    PSQL_CMD="psql -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c"

    if ! $PSQL_CMD "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}';" | grep -q 1; then
        log "Role '${POSTGRES_USER}' not found. Creating..."
        $PSQL_CMD "CREATE ROLE ${POSTGRES_USER} WITH SUPERUSER LOGIN PASSWORD '${POSTGRES_PASSWORD}';"
    else
        log "Role '${POSTGRES_USER}' already exists."
    fi
}

# Main execution flow
main() {
    log "Starting Django application initialization"
    
    # Verify database connection
    check_database

    # Run migrations
    log "Applying database migrations"
    python manage.py migrate --noinput

    # Collect static files
    log "Collecting static assets"
    python manage.py collectstatic --noinput

    # Create superuser if requested
    if [[ -n "${DJANGO_SUPERUSER_EMAIL}" && -n "${DJANGO_SUPERUSER_PASSWORD}" ]]; then
        log "Creating superuser account"
        python manage.py createsuperuser --noinput --email "${DJANGO_SUPERUSER_EMAIL}" || true
    fi

    log "✅ Initialization completed - Starting application"
    exec "$@"
}

# Start main process
main "$@"