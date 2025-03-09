FROM nginx:1.26.3-alpine

# Install dependencies and configure permissions
RUN apk update && apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl \
    && mkdir -p /var/run/nginx \
    && mkdir -p /var/cache/nginx \
    && chown -R nginx:nginx /var/run/nginx /var/cache/nginx /etc/nginx/ssl \
    && chmod -R 755 /var/run/nginx /var/cache/nginx /etc/nginx/ssl

# Override PID location to writable directory
RUN sed -i '/pid\s*\/var\/run\/nginx.pid;/c\pid /tmp/nginx.pid;' /etc/nginx/nginx.conf

# Copy configuration
COPY conf.d/default.conf /etc/nginx/conf.d/

# Run as non-root user
USER nginx

EXPOSE 80 443