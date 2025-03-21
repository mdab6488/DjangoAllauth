#!/bin/sh
set -e

# Process environment variables (if using templates)
envsubst '${SERVER_NAME} ${BACKEND_HOST} ${BACKEND_PORT} ${FRONTEND_HOST} ${FRONTEND_PORT}' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf

# Fix permissions
chown -R nginxuser:nginxgroup /var/cache/nginx /var/run/nginx

# Start Nginx
exec nginx -g 'daemon off;'