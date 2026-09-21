#!/usr/bin/env bash
set -euo pipefail

cd /opt/registreai

echo "Containers:"
docker compose ps

echo
echo "HTTP:"
curl -fsS http://127.0.0.1/healthz

echo
echo "Worker:"
if docker compose --profile worker ps reg-worker 2>/dev/null | grep -q "Up"; then
  echo "reg-worker: running"
else
  echo "reg-worker: not active"
fi
