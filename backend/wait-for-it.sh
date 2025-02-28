#!/bin/bash
# wait-for-it.sh - Wait for a service to be available before proceeding

set -e

host="$1"
port="$2"
message="${3:-Service is up}"
echo_mode="${4:-silent}"
timeout="${WAIT_TIMEOUT:-60}"

usage() {
  echo "Usage: $(basename $0) host port [message] [echo]"
  echo "  host: The hostname or IP to connect to"
  echo "  port: The port to connect to"
  echo "  message: Message to display when service is up (optional)"
  echo "  echo: Set to 'echo' to display the message, default is silent"
  echo "  WAIT_TIMEOUT: Environment variable to set timeout (default: 60 seconds)"
  exit 1
}

# Check for required arguments
if [ -z "$host" ] || [ -z "$port" ]; then
  usage
fi

echo "Waiting for $host:$port..."

for i in $(seq 1 $timeout); do
  if nc -z "$host" "$port" > /dev/null 2>&1; then
    if [ "$echo_mode" = "echo" ]; then
      echo "$message"
    fi
    exit 0
  fi
  
  # Progress indicator
  if [ $((i % 5)) -eq 0 ]; then
    echo "Still waiting for $host:$port ($i/${timeout}s)..."
  fi
  
  sleep 1
done

echo "Error: Timed out waiting for $host:$port after ${timeout}s" >&2
exit 1