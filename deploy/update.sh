#!/usr/bin/env bash
#
# 한판 업데이트 — 코드가 바뀔 때마다 이것만 돌리면 된다.
#
#   sudo bash /opt/hanpan/deploy/update.sh
#
# 빌드가 실패하면 기존 프로세스를 그대로 두고 멈춘다. 서비스가 안 끊긴다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "sudo 로 실행해주세요"; exit 1; }

log "코드 받기"
sudo -u "$APP_USER" git -C "$APP_DIR" fetch --depth 1 origin main
sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main

cd "$APP_DIR"

log "설치"
sudo -u "$APP_USER" nice -n 19 ionice -c3 npm ci

# 스키마가 바뀌었으면 반영한다. 없으면 조용히 넘어간다.
if [[ -f prisma/schema.prisma ]] && grep -q '^model ' prisma/schema.prisma; then
  log "DB 스키마 반영"
  sudo -u "$APP_USER" npx prisma migrate deploy || echo "  (마이그레이션 없음 — 건너뜀)"
fi

log "빌드"
sudo -u "$APP_USER" nice -n 19 ionice -c3 npm run build

log "재시작"
sudo -u "$APP_USER" pm2 reload "$APP" --update-env
sudo -u "$APP_USER" pm2 save

printf '\n\033[1;32m✓ 완료\033[0m  상태: sudo -u %s pm2 status\n\n' "$APP_USER"
