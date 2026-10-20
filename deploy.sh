#!/usr/bin/env bash
# NextGain deploy: kodni yangilaydi, build qiladi va PM2 orqali qayta ishga tushiradi.
# Ishlatish: ./deploy.sh [branch]   (default: develop)
set -euo pipefail

APP_NAME="nextgain"
BRANCH="${1:-develop}"

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "XATO: .env fayli topilmadi" >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 o'rnatilmoqda..."
  npm install -g pm2
fi

echo "==> Kod yangilanmoqda ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Paketlar o'rnatilmoqda"
npm ci

echo "==> Build"
npm run build

mkdir -p logs uploads

echo "==> PM2"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

pm2 status "$APP_NAME"
echo "==> Deploy tugadi"
