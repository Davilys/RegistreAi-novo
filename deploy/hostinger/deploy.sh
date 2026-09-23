#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/registreai"

cd "$APP_DIR"

# Caddy refuses to start without the admin hash; fail before touching anything.
if ! grep -q '^ADMIN_BASIC_AUTH_HASH=' .env 2>/dev/null; then
  echo "ADMIN_BASIC_AUTH_HASH ausente em $APP_DIR/.env. Gere com: docker compose exec caddy caddy hash-password" >&2
  exit 1
fi

git fetch origin main
git reset --hard origin/main

docker compose build web admin-web
docker compose up -d web admin-web caddy
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

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
