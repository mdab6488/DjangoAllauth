#!/bin/bash
set -e

# Create SSL directory
mkdir -p ./nginx/ssl

# Generate SSL certificate if it doesn't exist
if [ ! -f "./nginx/ssl/nginx-selfsigned.crt" ] || [ ! -f "./nginx/ssl/nginx-selfsigned.key" ]; then
  echo "Generating SSL certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "./nginx/ssl/nginx-selfsigned.key" \
    -out "./nginx/ssl/nginx-selfsigned.crt" \
    -subj "/CN=localhost/C=US/O=DjangoAllauth"
    
  # Generate DH parameters
  openssl dhparam -out ./nginx/ssl/dhparam.pem 2048
    
  # Set permissions
  chmod 644 ./nginx/ssl/nginx-selfsigned.crt
  chmod 644 ./nginx/ssl/nginx-selfsigned.key
  chmod 644 ./nginx/ssl/dhparam.pem
  
  echo "SSL certificates generated successfully"
else
  echo "SSL certificates already exist"
fi