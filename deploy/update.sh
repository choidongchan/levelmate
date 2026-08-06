#!/usr/bin/env bash
#
# 한판 업데이트
#
#   sudo bash /opt/hanpan/deploy/update.sh
#
# 하루에 몇 번씩 돌아도 괜찮도록 두 가지를 지킨다.
#   1) 의존성이 안 바뀌었으면 재설치하지 않는다 (배포 시간 대폭 단축)
#   2) 실행 중인 빌드 산출물을 건드리지 않는다. 다른 곳에 빌드한 뒤
#      원자적으로 교체하므로 빌드 도는 동안에도 사이트가 정상 동작한다
#
# 빌드가 실패하면 아무것도 교체하지 않고 멈춘다. 서비스가 끊기지 않는다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP
NEW=.next-building
OLD=.next-previous

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "sudo 로 실행해주세요"; exit 1; }
cd "$APP_DIR"

# Prisma 7 은 Node 22 이상을 요구한다. 낮으면 올린다.
if [[ $(node -v | sed 's/v\([0-9]*\).*/\1/') -lt 22 ]]; then
  log "Node 22 로 올리는 중"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
  rm -rf "$APP_DIR/node_modules"   # 런타임이 바뀌었으니 네이티브 모듈을 다시 만든다
  ok "node $(node -v)"
fi

log "코드 받기"
LOCK_BEFORE=$(sha1sum package-lock.json 2>/dev/null | cut -c1-40 || echo none)
sudo -u "$APP_USER" git fetch --depth 50 origin main   # 되돌리기용으로 최근 기록을 남긴다
sudo -u "$APP_USER" git reset --hard -q origin/main
ok "$(sudo -u "$APP_USER" git log -1 --pretty='%h %s')"

# ── 의존성: 잠금 파일이 바뀐 경우에만 재설치 ──────────────────────
LOCK_AFTER=$(sha1sum package-lock.json | cut -c1-40)
if [[ $LOCK_BEFORE != "$LOCK_AFTER" || ! -d node_modules ]]; then
  log "의존성 설치 (잠금 파일 변경됨)"
  sudo -u "$APP_USER" nice -n 19 ionice -c3 npm ci
else
  ok "의존성 그대로 — 설치 건너뜀"
fi

# ── DB 스키마 ─────────────────────────────────────────────────────
if [[ -f prisma/schema.prisma ]] && grep -q '^model ' prisma/schema.prisma; then
  if [[ -d prisma/migrations ]]; then
    log "DB 스키마 반영"
    sudo -u "$APP_USER" npx prisma migrate deploy
  fi
fi

# ── 빌드: 실행 중인 .next 를 건드리지 않는다 ──────────────────────
log "빌드"
sudo -u "$APP_USER" rm -rf "$NEW"
sudo -u "$APP_USER" env NEXT_DIST_DIR="$NEW" nice -n 19 ionice -c3 npm run build
ok "빌드 완료"

# ── 자동 배포 등록 ────────────────────────────────────────────────
# 1분마다 GitHub 을 확인해 새 커밋이 있을 때만 배포한다.
CRON=/etc/cron.d/$APP-autodeploy
if [[ ! -f $CRON ]]; then
  cat > "$CRON" <<CRONEOF
# 한판 자동 배포 — 새 커밋이 있을 때만 동작한다
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
* * * * * root /usr/bin/flock -n /var/lock/$APP-cron.lock $APP_DIR/deploy/autodeploy.sh
CRONEOF
  chmod 644 "$CRON"
  ok "자동 배포 등록 (1분마다 확인, 로그: /var/log/$APP-deploy.log)"
fi
chmod +x "$APP_DIR/deploy/"*.sh 2>/dev/null || true

# ── 교체 + 재시작 ─────────────────────────────────────────────────
# 여기까지 왔으면 빌드가 성공한 것이다. 이제서야 실행본을 바꾼다.
log "교체"
sudo -u "$APP_USER" rm -rf "$OLD"
[[ -d .next ]] && sudo -u "$APP_USER" mv .next "$OLD"
sudo -u "$APP_USER" mv "$NEW" .next
ok "교체 완료 (직전 빌드는 $OLD 에 남겨둠)"

log "재시작"
sudo -u "$APP_USER" pm2 reload "$APP" --update-env
sudo -u "$APP_USER" pm2 save

printf '\n\033[1;32m✓ 완료\033[0m  %s\n\n' "$(sudo -u "$APP_USER" git log -1 --pretty='%h %s')"
