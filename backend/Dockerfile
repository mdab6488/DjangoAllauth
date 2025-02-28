# Use multi-stage build to reduce final image size
# Stage 1: Builder
FROM python:3.12-slim-bookworm as builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    curl \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Setup virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with pip-tools for better dependency management
COPY requirements.txt .
RUN pip install --upgrade pip pip-tools && \
    pip-compile requirements.txt --output-file requirements.lock && \
    pip install -r requirements.lock && \
    pip install psycopg2-binary gunicorn

# Generate required static files during build
COPY . .

# Collect static using a dummy SECRET_KEY
RUN SECRET_KEY=dummy_key_for_collectstatic \
    DATABASE_URL=sqlite:///dummy.db \
    ALLOWED_HOSTS=localhost \
    CORS_ORIGIN_WHITELIST=localhost:3000,localhost:8000 \
    CSRF_TRUSTED_ORIGINS=https://localhost:3000,https://localhost:8000 \
    DJANGO_SETTINGS_MODULE=core.settings \
    python manage.py collectstatic --noinput

# Stage 2: Runtime
FROM python:3.12-slim-bookworm

LABEL maintainer="ALAMIN mdab6488@gmail.com"
LABEL description="Django backend for DjangoAllauth application"
LABEL version="1.0.0"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    DJANGO_SETTINGS_MODULE=core.settings \
    DATABASE=postgres \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app:$PYTHONPATH"

WORKDIR /app

# Create non-root user with specified UID/GID for better security
ARG USER_ID=1000
ARG GROUP_ID=1000
RUN groupadd -g ${GROUP_ID} appgroup && \
    useradd -u ${USER_ID} -g appgroup -s /bin/bash -m appuser

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    netcat-traditional \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY --chown=appuser:appgroup . .
COPY --from=builder --chown=appuser:appgroup /app/static /app/static

# Make entrypoint script executable 
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x entrypoint.sh

# Create and configure directories with proper permissions
RUN mkdir -p /app/media /app/logs && \
    chown -R appuser:appgroup /app/media /app/logs /app/static && \
    chmod -R 755 /app/media /app/logs /app/static

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/healthcheck/ || exit 1

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--worker-class", "gthread", "--threads", "2", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info", "core.wsgi:application"]