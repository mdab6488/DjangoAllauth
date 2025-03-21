#!/bin/sh
set -e

# Use absolute path for SSL_DIR
SSL_DIR="/etc/nginx/ssl"

# Create SSL directory
mkdir -p "$SSL_DIR"

# Generate SSL certificate if it doesn't exist
if [ ! -f "$SSL_DIR/local.crt" ] || [ ! -f "$SSL_DIR/local.key" ]; then
  echo "Generating SSL certificate..."
  
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/local.key" \
    -out "$SSL_DIR/local.crt" \
    -subj "/CN=localhost/C=US/O=DjangoAllauth" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

  echo "Starting dhparam generation at $(date) - this may take several minutes..."
  openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
  echo "Completed dhparam generation at $(date)"
    
  # Set permissions
  chmod 644 "$SSL_DIR"/*
  echo "SSL certificates generated successfully"
else
  echo "SSL certificates already exist"
fi