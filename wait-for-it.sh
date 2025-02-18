#!/bin/sh
# wait-for-it.sh

TIMEOUT=15
QUIET=0

echoerr() { if [ "$QUIET" -ne 1 ]; then echo "$@" 1>&2; fi }

wait_for() {
  for i in `seq $TIMEOUT` ; do
    nc -z "$1" "$2" > /dev/null 2>&1
    result=$?
    if [ $result -eq 0 ] ; then
      if [ $# -gt 3 ] && [ "$4" = "echo" ]; then
        echo "$3"
      fi
      return 0
    fi
    sleep 1
  done
  echo "Operation timed out" >&2
  return 1
}

wait_for $1 $2 $3 $4