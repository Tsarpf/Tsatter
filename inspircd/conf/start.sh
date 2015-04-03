#!/bin/bash
/inspircd/inspircd start --nofork
echo "Executing: $@"
exec "$@"