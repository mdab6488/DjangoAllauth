#!/bin/bash
# Docker entrypoint script for Django application (Simplified SSL-free version)
set -eo pipefail

# Constants with defaults
: "${MAX_DB_RETRIES:=5}"
: "${DB_RETRY_INTERVAL:=5}"
: "${POSTGRES_DB:=postgres}"
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_PASSWORD:=password}"
: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${DJANGO_SUPERUSER_EMAIL:=admin@example.com}"
: "${DJANGO_SUPERUSER_USERNAME:=admin}"
: "${DJANGO_SUPERUSER_PASSWORD:=admin}"
: "${DJANGO_DEBUG:=false}"

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
    if python manage.py migrate --check > /dev/null 2>&1; then
        log "✅ No new migrations to apply"
    else
        log "⏳ Applying migrations..."
        python manage.py migrate --noinput
        log "✅ Migrations applied"
    fi
}

# Create superuser only if it doesn't exist
# Create superuser only if it doesn't exist
create_superuser() {
    log "👤 Checking for existing superuser..."
    if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(is_superuser=True).exists())" | grep -q "True"; then
        log "🛠️  Creating superuser..."
        python manage.py createsuperuser --noinput --email "${DJANGO_SUPERUSER_EMAIL}" || true
        
        # Set the password for the newly created superuser
        log "🔑 Setting superuser password..."
        python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(username='${DJANGO_SUPERUSER_USERNAME}'); user.set_password('${DJANGO_SUPERUSER_PASSWORD}'); user.save()"
    else
        log "✅ Superuser already exists"
        # Verify and update password if needed
        log "🔑 Checking superuser password..."
        if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(username='${DJANGO_SUPERUSER_USERNAME}'); print(not user.has_usable_password())" | grep -q "True"; then
            log "⚠️ Superuser password not set, updating now..."
            python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(username='${DJANGO_SUPERUSER_USERNAME}'); user.set_password('${DJANGO_SUPERUSER_PASSWORD}'); user.save()"
        fi
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
    python manage.py collectstatic --noinput || true

    # Create superuser if required
    create_superuser

    log "✅ Initialization completed - Starting application"

    # Ensure command execution (default to Gunicorn if no arguments provided)
    if [[ $# -eq 0 ]]; then
        log "🟢 No command provided, starting Gunicorn..."
        exec gunicorn core.wsgi:application --timeout=120 --bind 0.0.0.0:8000 --workers 4
    else
        exec "$@"
    fi
}

# Start main process
main "$@"
