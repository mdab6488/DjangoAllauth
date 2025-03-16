#!/bin/bash
# Docker entrypoint script for Django application (Simplified SSL-free version)
set -eo pipefail

# Constants with defaults
: "${MAX_DB_RETRIES}"
: "${DB_RETRY_INTERVAL}"
: "${POSTGRES_DB}"
: "${POSTGRES_USER}"
: "${POSTGRES_PASSWORD}"
: "${POSTGRES_HOST}"
: "${POSTGRES_PORT}"
: "${DJANGO_SUPERUSER_EMAIL}"
: "${DJANGO_SUPERUSER_USERNAME}"
: "${DJANGO_SUPERUSER_PASSWORD}"
: "${DJANGO_DEBUG}"
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
    log "🔍 Checking database connectivity..."
    local retries=0
    while ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t 1; do
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

# Run migrations only if needed
apply_migrations() {
    log "🔄 Checking for pending migrations..."
    if [[ -z $(python manage.py showmigrations --plan | grep "[ ]" || true) ]]; then
        log "✅ No new migrations to apply"
    else
        log "⚠️  Applying database migrations"
        python manage.py migrate --noinput
    fi
}

# Create superuser only if it doesn't exist
create_superuser() {
    log "👤 Checking for existing superuser..."
    if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(is_superuser=True).exists())" | grep -q "True"; then
        log "🛠️  Creating superuser..."
        python manage.py createsuperuser --noinput --email "${DJANGO_SUPERUSER_EMAIL}" || true
    else
        log "✅ Superuser already exists"
    fi
}

# Main execution flow
main() {
    log "🚀 Starting Django application initialization"

    # Verify database connection
    check_database

    # Apply migrations (only if needed)
    apply_migrations

    # Collect static files
    log "📦 Collecting static assets"
    python manage.py collectstatic --noinput

    # Create superuser if required
    create_superuser

    log "✅ Initialization completed - Starting application"
    exec "$@"
}

# Start main process
main "$@"