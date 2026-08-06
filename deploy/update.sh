#!/usr/bin/env bash
#
# 한판 업데이트
#
#   sudo bash /opt/hanpan/deploy/update.sh
#
# 하루에 몇 번씩 돌아도 사이트가 끊기지 않는다. 원칙은 셋이다.
#
#   1. 돌고 있는 앱이 읽는 것(node_modules, .next)은 절대 그 자리에서 건드리지 않는다.
#      옆에 새로 만들고, 다 만든 뒤에 통째로 바꿔 끼운다.
#   2. 한 번에 하나만 돈다. 자동 배포와 손으로 돌린 것이 겹치면 서로의 파일을
#      지우다 깨진다.
#   3. 바꿔 끼운 뒤 사이트가 응답하지 않으면 곧바로 되돌린다.
#
# 중간에 실패하면 아무것도 바꾸지 않는다. 돌던 버전이 그대로 서비스된다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP
LOCK=/var/lock/$APP-deploy.lock

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n\n' "$*"; exit 1; }

# -H 를 붙여 HOME 을 그 계정의 것으로 맞춘다. 안 그러면 npm·prisma 가
# root 의 홈에 캐시를 쓰려다 권한이 없어 실패한다.
asuser() { sudo -u "$APP_USER" -H "$@"; }
slow()   { sudo -u "$APP_USER" -H nice -n 19 ionice -c3 "$@"; }

# 지우고 옮기는 일은 전부 root 로 한다. 소유자가 어긋나 있어도 확실히 된다.
# 만든 뒤에는 앱 계정에 넘긴다.
wipe() { rm -rf -- "$1" 2>/dev/null || true; [[ -e $1 ]] && die "지우지 못했습니다: $1"; return 0; }

[[ $EUID -eq 0 ]] || die "sudo 로 실행해주세요"
cd "$APP_DIR"

# ── 자기 자신을 덮어쓰는 것 피하기 ────────────────────────────────
# 아래에서 코드를 받으면서 이 스크립트 파일도 새것으로 바뀐다.
# bash 는 스크립트를 조금씩 읽어가므로 실행 중에 파일이 바뀌면 위험하다.
# 복사본으로 옮겨서 실행한다.
if [[ ${HANPAN_SELF_COPY:-0} != 1 ]]; then
  SELF=$(mktemp /tmp/$APP-update.XXXXXX.sh)
  cp "$0" "$SELF"
  HANPAN_SELF_COPY=1 bash "$SELF" "$@"
  CODE=$?
  rm -f "$SELF"
  exit $CODE
fi

# ── 한 번에 하나만 ────────────────────────────────────────────────
# 자동 배포는 1분마다 새 커밋이 있는지 본다. 손으로 돌린 것과 겹치면
# 같은 폴더를 동시에 지우고 만들다가 'fts_read failed' 같은 것으로 깨진다.
exec 9>"$LOCK"
if ! flock -n 9; then
  printf '\n\033[1;33m⏳ 다른 배포가 돌고 있습니다. 끝나기를 기다립니다…\033[0m\n'
  echo "   (다른 창에서 진행 상황: sudo tail -f /var/log/$APP-deploy.log)"
  flock -w 900 9 || die "15분을 기다렸는데도 끝나지 않습니다. 로그를 확인해주세요."
  ok "기다림 끝 — 이어서 진행합니다"
fi

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
  # 별도 폴더에 만든 뒤 마지막에 바꿔 끼운다.
  wipe "$APP_DIR/.deps-new"
  mkdir -p "$APP_DIR/.deps-new"
  cp package.json package-lock.json "$APP_DIR/.deps-new/"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR/.deps-new"

  ( cd "$APP_DIR/.deps-new" && slow npm ci --no-audit --no-fund )
  [[ -d $APP_DIR/.deps-new/node_modules ]] || die "설치가 끝났는데 node_modules 가 없습니다"

  wipe "$APP_DIR/node_modules.previous"
  if [[ -d node_modules ]]; then mv node_modules node_modules.previous; fi
  mv "$APP_DIR/.deps-new/node_modules" node_modules
  wipe "$APP_DIR/.deps-new"

  printf '%s\n' "$LOCK_NOW" > "$LOCK_MARK"
  chown -R "$APP_USER:$APP_USER" node_modules
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
[[ -x $PRISMA ]] || die "prisma 가 설치되어 있지 않습니다: $PRISMA"

asuser "$PRISMA" generate >/dev/null
ok "접속 코드 생성"

if [[ -d prisma/migrations ]]; then
  # Postgres 15 부터는 public 스키마에 표를 만들 권한이 기본으로 없다.
  sudo -u postgres psql -q -d "$APP" -c "GRANT ALL ON SCHEMA public TO \"$APP\";" >/dev/null 2>&1 || true
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
wipe "$APP_DIR/.next-building"
sudo -u "$APP_USER" -H env NEXT_DIST_DIR=.next-building nice -n 19 ionice -c3 npm run build
[[ -f $APP_DIR/.next-building/BUILD_ID ]] || die "빌드 결과가 없습니다"
ok "빌드 완료 ($(cat "$APP_DIR/.next-building/BUILD_ID"))"

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
wipe "$APP_DIR/.next-previous"
if [[ -d .next ]]; then mv .next .next-previous; fi
mv "$APP_DIR/.next-building" .next
chown -R "$APP_USER:$APP_USER" .next
ok "교체 완료"

log "재시작"
asuser pm2 reload "$APP" --update-env
asuser pm2 save

# ── 살아 있는지 확인 ──────────────────────────────────────────────
# 바꿔 끼웠는데 안 뜨면 사이트가 통째로 죽는다. 확인하고 아니면 되돌린다.
PORT=$(grep -E '^PORT=' "$APP_DIR/.env" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '"' || true)
PORT=${PORT:-3000}

HEALTHY=0
for _ in $(seq 1 30); do
  sleep 1
  if curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:$PORT/"; then HEALTHY=1; break; fi
done

if [[ $HEALTHY == 0 ]]; then
  printf '\n\033[1;31m✗ 새 버전이 응답하지 않습니다 — 되돌립니다\033[0m\n'
  if [[ -d $APP_DIR/.next-previous ]]; then
    wipe "$APP_DIR/.next-failed"
    mv .next .next-failed
    mv .next-previous .next
    asuser pm2 reload "$APP" --update-env
    echo "  이전 버전으로 돌아갔습니다. 실패한 빌드는 .next-failed 에 남겨뒀습니다."
  fi
  die "배포 실패"
fi

# 직전 것들은 잘 뜬 뒤에 치운다
wipe "$APP_DIR/node_modules.previous"

printf '\n\033[1;32m✓ 완료\033[0m  %s  (빌드 %s)\n\n' \
  "$(asuser git log -1 --pretty='%h %s')" "$(cat "$APP_DIR/.next/BUILD_ID")"
