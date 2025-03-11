FROM nginx:latest

# Install dependencies
RUN apt-get update && apt-get install -y openssl

# Create directories with proper permissions
RUN mkdir -p /etc/nginx/ssl \
    && mkdir -p /var/run/nginx \
    && mkdir -p /var/cache/nginx \
    && mkdir -p /etc/nginx/conf.d/template \
    && chown -R nginx:nginx /var/run/nginx /var/cache/nginx /etc/nginx/ssl /etc/nginx/conf.d

# Override PID location
RUN sed -i '/pid\s*\/var\/run\/nginx.pid;/c\pid /tmp/nginx.pid;' /etc/nginx/nginx.conf

# Copy configuration template
COPY conf.d/default.conf /etc/nginx/conf.d/template/default.conf.template

# Script to be run as entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]