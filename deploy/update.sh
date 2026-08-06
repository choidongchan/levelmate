#!/usr/bin/env bash
#
# 한판 업데이트
#
#   sudo bash /opt/hanpan/deploy/update.sh
#
# 하루에 몇 번씩 돌아도 사이트가 끊기지 않는다. 원칙은 하나다.
#
#   돌고 있는 앱이 읽는 것(node_modules, .next)은 절대 그 자리에서 건드리지 않는다.
#   옆에 새로 만들고, 다 만든 뒤에 통째로 바꿔 끼운다.
#
# 중간에 실패하면 아무것도 바꾸지 않는다. 돌던 버전이 그대로 서비스된다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }
# -H 를 붙여 HOME 을 그 계정의 것으로 맞춘다. 안 그러면 npm·prisma 가
# root 의 홈에 캐시를 쓰려다 권한이 없어 실패한다.
asuser() { sudo -u "$APP_USER" -H "$@"; }
slow()   { sudo -u "$APP_USER" -H nice -n 19 ionice -c3 "$@"; }

[[ $EUID -eq 0 ]] || { echo "sudo 로 실행해주세요"; exit 1; }
cd "$APP_DIR"

# ── Node ──────────────────────────────────────────────────────────
# Prisma 7 은 Node 22 이상을 요구한다. 런타임이 바뀌면 네이티브 모듈을
# 다시 만들어야 하므로, 여기서는 표시만 남기고 재설치는 아래에서 한다.
NODE_UPGRADED=0
if [[ $(node -v | sed 's/v\([0-9]*\).*/\1/') -lt 22 ]]; then
  log "Node 22 로 올리는 중"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
  ok "node $(node -v)"
  NODE_UPGRADED=1
fi

# ── 코드 ──────────────────────────────────────────────────────────
log "코드 받기"
asuser git fetch --depth 50 origin main   # 되돌리기용으로 최근 기록을 남긴다
asuser git reset --hard -q origin/main
ok "$(asuser git log -1 --pretty='%h %s')"

# ── 의존성 ────────────────────────────────────────────────────────
# '지금 깔려 있는 것이 어느 잠금 파일로 깔렸는지'를 적어두고 그걸 본다.
# 배포 도중 실패하면 코드는 이미 새것이라, 이번 실행 안에서만 앞뒤를 비교하면
# 다음 시도 때 '그대로네' 하고 설치를 건너뛴다. 그러면 새 패키지가 영영 안 깔린다.
LOCK_NOW=$(sha1sum package-lock.json | cut -c1-40)
LOCK_MARK=$APP_DIR/node_modules/.installed-from
LOCK_DONE=$(cat "$LOCK_MARK" 2>/dev/null || echo none)

if [[ $LOCK_NOW == "$LOCK_DONE" && $NODE_UPGRADED == 0 && -d node_modules ]]; then
  ok "의존성 그대로 — 설치 건너뜀"
else
  log "의존성 설치"
  # 돌고 있는 앱이 node_modules 를 읽는 중이다. 그 자리에서 지우면 앱이 죽는다.
  # 별도 디렉터리에 만든 뒤 마지막에 바꿔 끼운다.
  asuser rm -rf .deps-new
  asuser mkdir -p .deps-new
  asuser cp package.json package-lock.json .deps-new/
  ( cd .deps-new && slow npm ci --no-audit --no-fund )

  asuser rm -rf node_modules.previous
  if [[ -d node_modules ]]; then asuser mv node_modules node_modules.previous; fi
  asuser mv .deps-new/node_modules node_modules
  asuser rm -rf .deps-new
  asuser tee "$LOCK_MARK" >/dev/null <<< "$LOCK_NOW"
  ok "설치 완료"
fi

# ── 예전 사진 폴더 ────────────────────────────────────────────────
# 사진은 이제 DB 에 담는다. 예전에 파일로 담긴 것이 남아 있을 수 있어
# 읽을 수 있게만 해둔다. 한 번 읽히면 DB 로 옮겨 담고 다시는 안 본다.
UPLOAD_DIR=$APP_DIR/uploads
mkdir -p "$UPLOAD_DIR"
chown "$APP_USER:$APP_USER" "$UPLOAD_DIR"
if ! grep -q '^UPLOAD_DIR=' "$APP_DIR/.env" 2>/dev/null; then
  printf 'UPLOAD_DIR="%s"\n' "$UPLOAD_DIR" >> "$APP_DIR/.env"
  ok ".env 에 UPLOAD_DIR 추가"
fi

# ── DB ────────────────────────────────────────────────────────────
# 접속 코드를 스키마에 맞춰 다시 만든다. 빌드 전에 반드시 해야 한다.
# npx 는 상황에 따라 내려받으려 들 수 있어 설치된 파일을 직접 부른다.
log "DB 준비"
PRISMA=$APP_DIR/node_modules/.bin/prisma
[[ -x $PRISMA ]] || { echo "  prisma 가 설치되어 있지 않습니다: $PRISMA"; exit 1; }

asuser "$PRISMA" generate >/dev/null
ok "접속 코드 생성"

if [[ -d prisma/migrations ]]; then
  asuser "$PRISMA" migrate deploy
  ok "스키마 반영"
fi

# 비어 있을 때만 채운다. 이미 회원이 있으면 아무것도 하지 않는다.
if [[ -f prisma/seed.mjs ]]; then
  asuser node prisma/seed.mjs
fi
ok "DB 준비 완료"

# ── 빌드 ──────────────────────────────────────────────────────────
# 실행 중인 .next 를 건드리지 않고 옆에 만든다.
log "빌드"
asuser rm -rf .next-building
sudo -u "$APP_USER" env NEXT_DIST_DIR=.next-building nice -n 19 ionice -c3 npm run build
ok "빌드 완료"

# ── 자동 배포 등록 ────────────────────────────────────────────────
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
# 여기까지 왔으면 전부 성공한 것이다. 이제서야 실행본을 바꾼다.
log "교체"
asuser rm -rf .next-previous
[[ -d .next ]] && asuser mv .next .next-previous
asuser mv .next-building .next
ok "교체 완료"

log "재시작"
asuser pm2 reload "$APP" --update-env
asuser pm2 save

# 직전 의존성은 재시작이 끝난 뒤에 치운다
asuser rm -rf node_modules.previous 2>/dev/null || true

printf '\n\033[1;32m✓ 완료\033[0m  %s\n\n' "$(asuser git log -1 --pretty='%h %s')"
