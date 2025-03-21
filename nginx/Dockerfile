FROM nginx:stable-alpine

# Install dependencies
RUN apk add --no-cache openssl gettext

# Create non-root user and configure directories with an unused GID
RUN addgroup -g 102 nginxgroup && \
    adduser -D -u 102 -G nginxgroup nginxuser && \
    mkdir -p /etc/nginx/ssl /var/cache/nginx /var/run/nginx /tmp/nginx && \
    chown -R nginxuser:nginxgroup /etc/nginx /var/cache/nginx /var/run/nginx /tmp/nginx && \
    chmod -R 755 /etc/nginx /tmp/nginx

# Copy configurations and entrypoint
COPY --chown=nginxuser:nginxgroup nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginxuser:nginxgroup conf.d/*.template /etc/nginx/conf.d/
COPY --chown=nginxuser:nginxgroup entrypoint.sh /entrypoint.sh

# Set permissions
RUN chmod 755 /entrypoint.sh

USER nginxuser
EXPOSE 80 443
ENTRYPOINT ["/entrypoint.sh"]