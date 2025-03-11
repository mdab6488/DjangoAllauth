#!/bin/sh
set -e

# Generate SSL certificate if missing
if [ ! -f "/etc/nginx/ssl/nginx-selfsigned.crt" ] || [ ! -f "/etc/nginx/ssl/nginx-selfsigned.key" ]; then
    echo "Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "/etc/nginx/ssl/nginx-selfsigned.key" \
        -out "/etc/nginx/ssl/nginx-selfsigned.crt" \
        -subj "/CN=localhost/C=US/O=DjangoAllauth"
        
    # Generate DH parameters
    openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
fi

# Substitute environment variables in Nginx config
envsubst '${BACKEND_PORT} ${FRONTEND_HOST}' < \
    /etc/nginx/conf.d/template/default.conf.template > \
    /etc/nginx/conf.d/default.conf

# Fix permissions
chmod 644 /etc/nginx/ssl/nginx-selfsigned.crt
chmod 600 /etc/nginx/ssl/nginx-selfsigned.key
chmod 644 /etc/nginx/ssl/dhparam.pem

# Start Nginx
exec "$@"