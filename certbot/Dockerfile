FROM alpine:latest

# Copy the script
COPY generate-certs.sh /usr/local/bin/generate-certs.sh

# Ensure it's executable and install openssl
RUN chmod +x /usr/local/bin/generate-certs.sh && \
    apk add --no-cache openssl