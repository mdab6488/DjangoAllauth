# ===============
# # Stage 1: Builder
# ===============
FROM python:3.12-slim-bookworm AS builder

# Use build arguments with defaults
ARG ENVIRONMENT=development

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=${ENVIRONMENT}

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    curl \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Setup virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install pip-tools
RUN pip install --upgrade pip pip-tools

# Install Python dependencies with pip-tools for better dependency management
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

# Copy application code
COPY . .

# ===============
# Stage 2: Runtime
# ===============
FROM python:3.12-slim-bookworm

LABEL maintainer="ALAMIN mdab6488@gmail.com"
LABEL description="Django backend for DjangoAllauth application"
LABEL version="1.0.0"

# Use environment variables with defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app" 

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

# Create and configure directories with proper permissions
RUN mkdir -p /app/media /app/logs /app/collected_static

# Copy application code
COPY --chown=appuser:appgroup . .
COPY --from=builder --chown=appuser:appgroup /app/static /app/static

# Copy and fix permissions for wait-for-it.sh
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Make entrypoint script executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set proper permissions
RUN chown -R appuser:appgroup /app/media /app/logs /app/collected_static && \
    chmod -R 755 /app/media /app/logs /app/collected_static

# Switch to non-root user
USER appuser

# Expose dynamic port
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

# Update CMD to use the dynamic port
CMD ["gunicorn", "--timeout=120", "-b", "0.0.0.0:8000", "core.wsgi:application"]