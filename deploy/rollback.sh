#!/usr/bin/env bash
#
# 되돌리기 — 예전 버전으로 즉시 돌아간다.
#
#   sudo bash /opt/hanpan/deploy/rollback.sh          # 최근 기록 보기
#   sudo bash /opt/hanpan/deploy/rollback.sh back     # 바로 이전 버전으로
#   sudo bash /opt/hanpan/deploy/rollback.sh a1b2c3d  # 특정 버전으로
#   sudo bash /opt/hanpan/deploy/rollback.sh latest   # 고정 풀고 최신으로
#
# 되돌리면 그 버전에 '고정'된다. 고정된 동안에는 자동 배포가 멈추므로,
# 1분 뒤에 최신 버전이 다시 덮어쓰는 일이 없다.
#
# 주의: 되돌리는 것은 '코드'뿐이다. DB 는 앞선 상태 그대로 남는다.
# 표를 지우거나 이름을 바꾸는 변경을 배포한 뒤라면, 옛 코드가 없어진 표를
# 찾다가 실패할 수 있다. 그런 변경 전에는 백업(/opt/hanpan/backups)을 먼저 확인한다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP
PIN=$APP_DIR/.deploy-pin

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
ok()  { printf '  \033[1;32m✓\033[0m %s\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "sudo 로 실행해주세요"; exit 1; }
cd "$APP_DIR"

# 되돌리려면 과거 기록이 있어야 한다. 얕게 받아온 상태면 전체를 받는다.
if [[ $(sudo -u "$APP_USER" git rev-parse --is-shallow-repository) == "true" ]]; then
  echo "기록을 받아오는 중..."
  sudo -u "$APP_USER" git fetch --unshallow origin main 2>/dev/null || \
    sudo -u "$APP_USER" git fetch --depth 100 origin main
fi
sudo -u "$APP_USER" git fetch -q origin main

TARGET=${1:-}

# ── 인자가 없으면 목록만 보여준다 ──────────────────────────────────
if [[ -z $TARGET ]]; then
  CURRENT=$(sudo -u "$APP_USER" git rev-parse --short HEAD)
  echo
  echo "  현재 버전: $CURRENT $( [[ -f $PIN ]] && echo '(고정됨 — 자동 배포 멈춤)' )"
  echo
  echo "  최근 기록"
  echo "  ─────────────────────────────────────────────────────"
  sudo -u "$APP_USER" git log --pretty=format:'  %h  %ad  %s' --date=format:'%m/%d %H:%M' -15 origin/main
  echo
  echo
  echo "  되돌리기:  sudo bash $0 <해시>"
  echo "  한 단계 뒤: sudo bash $0 back"
  echo "  최신으로:   sudo bash $0 latest"
  echo
  exit 0
fi

# ── 최신으로 복귀 ─────────────────────────────────────────────────
if [[ $TARGET == latest ]]; then
  rm -f "$PIN"
  SHA=$(sudo -u "$APP_USER" git rev-parse origin/main)
  log "최신으로 복귀 (고정 해제 — 자동 배포 다시 켜짐)"
else
  if [[ $TARGET == back ]]; then
    SHA=$(sudo -u "$APP_USER" git rev-parse HEAD~1)
  else
    SHA=$(sudo -u "$APP_USER" git rev-parse "$TARGET^{commit}" 2>/dev/null) || {
      echo "그런 버전이 없습니다: $TARGET"
      exit 1
    }
  fi
  log "되돌리기 → $(sudo -u "$APP_USER" git log -1 --pretty='%h %s' "$SHA")"
fi

# ── 적용 ──────────────────────────────────────────────────────────
sudo -u "$APP_USER" git reset --hard -q "$SHA"
ok "코드 전환"

log "설치"
sudo -u "$APP_USER" nice -n 19 ionice -c3 npm ci

# 실행 중인 빌드를 건드리지 않고 다른 곳에 빌드한 뒤 교체한다
log "빌드"
sudo -u "$APP_USER" rm -rf .next-building
sudo -u "$APP_USER" env NEXT_DIST_DIR=.next-building nice -n 19 ionice -c3 npm run build

log "교체"
sudo -u "$APP_USER" rm -rf .next-previous
[[ -d .next ]] && sudo -u "$APP_USER" mv .next .next-previous
sudo -u "$APP_USER" mv .next-building .next

log "재시작"
sudo -u "$APP_USER" pm2 reload "$APP" --update-env
sudo -u "$APP_USER" pm2 save

# 되돌린 상태면 고정해서 자동 배포가 덮어쓰지 못하게 한다
if [[ ${TARGET} != latest ]]; then
  echo "$SHA" > "$PIN"
  chown "$APP_USER:$APP_USER" "$PIN"
fi

echo
if [[ -f $PIN ]]; then
  printf '\033[1;33m✓ 되돌렸습니다. 이 버전에 고정된 상태입니다.\033[0m\n'
  printf '  자동 배포는 멈춰 있습니다. 다시 켜려면:\n'
  printf '    sudo bash %s latest\n\n' "$0"
else
  printf '\033[1;32m✓ 최신 버전입니다. 자동 배포가 다시 켜졌습니다.\033[0m\n\n'
fi
