#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/registreai"

cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

docker compose build web
docker compose up -d web caddy

if [ -f deploy/hostinger/.env.worker ]; then
  docker compose --profile worker build reg-worker
  docker compose --profile worker up -d reg-worker
fi

docker image prune -f >/dev/null 2>&1 || true

echo
docker compose ps
echo
echo "Health:"
curl -fsS http://127.0.0.1/healthz || {
  echo "Falha no healthcheck HTTP"
  exit 1
}
