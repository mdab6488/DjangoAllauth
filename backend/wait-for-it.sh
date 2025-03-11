#!/bin/bash
# wait-for-it.sh - Simplified version

set -e

host="$1"
port="$2"
timeout="${3:-60}"

if [ -z "$host" ] || [ -z "$port" ]; then
  echo "Usage: $0 host port [timeout]" >&2
  exit 1
fi

echo "Waiting for $host:$port (timeout: ${timeout}s)"

for i in $(seq 1 $timeout); do
  if nc -z "$host" "$port"; then
    echo "Service available after ${i}s"
    exit 0
  fi
  sleep 1
done

echo "Timeout reached after ${timeout}s" >&2
exit 1#!/bin/bash
# wait-for-it.sh - Simplified version

set -e

host="$1"
port="$2"
timeout="${3:-60}"

if [ -z "$host" ] || [ -z "$port" ]; then
  echo "Usage: $0 host port [timeout]" >&2
  exit 1
fi

echo "Waiting for $host:$port (timeout: ${timeout}s)"

for i in $(seq 1 $timeout); do
  if nc -z "$host" "$port"; then
    echo "Service available after ${i}s"
    exit 0
  fi
  sleep 1
done

echo "Timeout reached after ${timeout}s" >&2
exit 1