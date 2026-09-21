#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/registreai"
REPO_URL="https://github.com/Davilys/RegistreAi-novo.git"

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute como root: sudo bash deploy/hostinger/bootstrap.sh"
  exit 1
fi

apt-get update
apt-get install -y git ca-certificates curl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp deploy/hostinger/.env.example .env
fi

echo
echo "Bootstrap concluído."
echo "Edite $APP_DIR/.env e rode:"
echo "  cd $APP_DIR && docker compose up -d --build web caddy"
echo
echo "O worker só deve ser ativado depois de criar deploy/hostinger/.env.worker com os segredos reais."
