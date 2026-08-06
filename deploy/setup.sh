#!/usr/bin/env bash
#
# 한판(HANPAN) 서버 초기 설정
#
# 이 서버에는 이미 다른 서비스가 돌고 있다. 그것을 절대 건드리지 않는다.
#   - 기존 nginx 설정 파일을 수정하지 않고 새 파일만 추가한다
#   - 기존 DB/계정을 건드리지 않고 새 DB/계정만 만든다
#   - 전용 리눅스 계정으로 실행해 다른 서비스 파일에 접근하지 못하게 한다
#   - 메모리 상한을 걸어 한판이 폭주해도 서버 전체가 죽지 않게 한다
#
# 사용법 (root로):
#   bash setup.sh
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP
APP_PORT=3000
REPO=https://github.com/choidongchan/levelmate.git
DOMAIN=www.levelmate.co.kr
DOMAIN_APEX=levelmate.co.kr

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "root로 실행해주세요: sudo bash setup.sh"; exit 1; }

# ── 0. 포트가 비어 있는지 확인 ────────────────────────────────────
log "포트 $APP_PORT 확인"
if ss -tlnp | grep -q ":$APP_PORT "; then
  echo "  포트 $APP_PORT 를 이미 쓰고 있습니다. 스크립트 상단의 APP_PORT 를 3100 등으로 바꾸고 다시 실행하세요."
  exit 1
fi
ok "사용 가능"

# ── 1. 필요한 것만 설치 ───────────────────────────────────────────
log "필요한 패키지 확인"

# Prisma 7 이 Node 22 이상을 요구한다.
if ! command -v node >/dev/null || [[ $(node -v | sed 's/v\([0-9]*\).*/\1/') -lt 22 ]]; then
  echo "  Node 22 설치 중..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
ok "node $(node -v)"

command -v pm2 >/dev/null || npm i -g pm2
ok "pm2 $(pm2 -v)"

command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
ok "certbot 준비됨"

command -v git >/dev/null || apt-get install -y git
ok "git 준비됨"

# ── 2. 전용 계정 ──────────────────────────────────────────────────
# root로 돌리지 않는다. 이 계정은 자기 디렉터리 밖을 건드릴 수 없다.
log "전용 계정 $APP_USER"
id -u "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
ok "계정 준비됨"

# ── 3. 데이터베이스 ───────────────────────────────────────────────
# 이미 돌고 있는 Postgres에 DB 하나만 더 만든다. 기존 DB는 손대지 않는다.
log "데이터베이스 $APP"
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$APP'" | grep -q 1; then
  ok "계정이 이미 있어 비밀번호만 갱신합니다"
  sudo -u postgres psql -c "ALTER USER $APP WITH ENCRYPTED PASSWORD '$DB_PASS';"
else
  sudo -u postgres psql -c "CREATE USER $APP WITH ENCRYPTED PASSWORD '$DB_PASS';"
  ok "계정 생성"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$APP'" | grep -q 1; then
  sudo -u postgres createdb -O "$APP" "$APP"
  ok "DB 생성"
else
  ok "DB가 이미 있습니다"
fi

# ── 4. 코드 ───────────────────────────────────────────────────────
log "코드 받기"
if [[ -d $APP_DIR/.git ]]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --depth 1 origin main
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main
else
  mkdir -p "$APP_DIR"
  chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" git clone --depth 50 "$REPO" "$APP_DIR"
fi
ok "$APP_DIR"

# ── 5. 환경변수 ───────────────────────────────────────────────────
log "환경변수"
ENV_FILE=$APP_DIR/.env
if [[ -f $ENV_FILE ]] && grep -q DATABASE_URL "$ENV_FILE"; then
  ok "기존 .env 유지 (DB 비밀번호만 갱신)"
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://$APP:$DB_PASS@127.0.0.1:5432/$APP?schema=public\"|" "$ENV_FILE"
else
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://$APP:$DB_PASS@127.0.0.1:5432/$APP?schema=public"
NEXT_PUBLIC_SITE_URL="https://$DOMAIN"
PORT=$APP_PORT
EOF
  ok ".env 생성"
fi
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# ── 6. 빌드 ───────────────────────────────────────────────────────
# 기존 서비스가 느려지지 않도록 CPU·디스크 우선순위를 최하로 낮춰서 빌드한다.
log "설치 및 빌드 (몇 분 걸립니다)"
cd "$APP_DIR"
sudo -u "$APP_USER" nice -n 19 ionice -c3 npm ci
sudo -u "$APP_USER" nice -n 19 ionice -c3 npm run build
ok "빌드 완료"

# ── 7. PM2 등록 ───────────────────────────────────────────────────
log "프로세스 등록"
sudo -u "$APP_USER" pm2 delete "$APP" 2>/dev/null || true
sudo -u "$APP_USER" pm2 start npm --name "$APP" \
  --max-memory-restart 600M \
  -- start
sudo -u "$APP_USER" pm2 save

# 서버가 재부팅돼도 자동으로 뜨게
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null
systemctl enable "pm2-$APP_USER" >/dev/null 2>&1 || true
ok "PM2 등록 완료 (메모리 600MB 초과 시 자동 재시작)"

# ── 8. nginx ──────────────────────────────────────────────────────
# 기존 설정 파일은 열지도 않는다. 새 파일 하나만 추가한다.
log "nginx 설정"
cat > /etc/nginx/sites-available/$APP <<EOF
# 한판 (HANPAN) — 다른 서비스와 server_name 으로만 갈린다
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $DOMAIN_APEX;

    client_max_body_size 12M;   # 사진 업로드 여유

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/$APP /etc/nginx/sites-enabled/$APP
nginx -t
systemctl reload nginx
ok "nginx 설정 추가 (기존 사이트 그대로)"

# ── 9. 백업 ───────────────────────────────────────────────────────
log "매일 백업 등록"
mkdir -p /var/backups/$APP
cat > /etc/cron.daily/$APP-backup <<EOF
#!/bin/sh
# 한판 DB 매일 백업. 14일치만 보관한다.
sudo -u postgres pg_dump $APP | gzip > /var/backups/$APP/\$(date +%Y%m%d).sql.gz
find /var/backups/$APP -name '*.sql.gz' -mtime +14 -delete
EOF
chmod +x /etc/cron.daily/$APP-backup
ok "/var/backups/$APP (14일 보관)"

# ── 자동 배포 등록 ────────────────────────────────────────────────
# 1분마다 GitHub 을 확인해 새 커밋이 있을 때만 배포한다.
# 이미 등록돼 있으면 그대로 둔다.
CRON=/etc/cron.d/$APP-autodeploy
if [[ ! -f $CRON ]]; then
  cat > "$CRON" <<CRONEOF
# 한판 자동 배포 — 새 커밋이 있을 때만 동작한다
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
* * * * * root /usr/bin/flock -n /var/lock/$APP-cron.lock $APP_DIR/deploy/autodeploy.sh
CRONEOF
  chmod 644 "$CRON"
  echo "  자동 배포 등록됨 (1분마다 확인, 로그: /var/log/$APP-deploy.log)"
fi
chmod +x "$APP_DIR/deploy/"*.sh 2>/dev/null || true

# ── 완료 ──────────────────────────────────────────────────────────
cat <<EOF

────────────────────────────────────────────────
 설정 완료
────────────────────────────────────────────────

  실행 확인:  curl -I http://127.0.0.1:$APP_PORT
  배포 로그:  tail -f /var/log/$APP-deploy.log
  되돌리기:   sudo bash $APP_DIR/deploy/rollback.sh
  상태 보기:  sudo -u $APP_USER pm2 status
  로그 보기:  sudo -u $APP_USER pm2 logs $APP

 남은 일 2가지
 ───────────────────────────────────────────────
 1) 가비아 DNS 를 이 서버로 변경
      A     @     158.247.212.228
      CNAME www   (지우고) A  www  158.247.212.228

 2) DNS 반영(10~30분) 확인 후 HTTPS 발급
      certbot --nginx -d $DOMAIN -d $DOMAIN_APEX

 DNS 가 아직 Vercel 을 가리키는 상태에서 certbot 을 돌리면 실패합니다.
 반드시 순서를 지켜주세요.

EOF
