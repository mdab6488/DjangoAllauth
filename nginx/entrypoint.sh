#!/bin/sh
set -e

# Process environment variables in config template
envsubst '${SERVER_NAME} ${BACKEND_HOST} ${BACKEND_PORT} ${FRONTEND_HOST} ${FRONTEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure proper permissions for runtime files
chown -R nginxuser:nginxgroup /var/cache/nginx
chown -R nginxuser:nginxgroup /var/run/nginx

# Start Nginx
exec nginx -g 'daemon off;'