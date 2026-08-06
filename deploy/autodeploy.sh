#!/usr/bin/env bash
#
# 자동 배포 — 1분마다 돌면서 GitHub에 새 커밋이 있을 때만 배포한다.
#
# 새 커밋이 없으면 아무것도 하지 않고 즉시 끝난다(원격 해시 조회 한 번).
# 배포가 도는 중에 다시 불려도 잠금 때문에 겹치지 않는다.
# 빌드가 실패하면 돌던 프로세스를 그대로 두므로 서비스가 끊기지 않는다.
#
set -euo pipefail

APP=hanpan
APP_DIR=/opt/$APP
APP_USER=$APP
LOG=/var/log/$APP-deploy.log

# 겹쳐 도는 것 방지. 이미 배포 중이면 조용히 빠진다.
exec 9>"/var/lock/$APP-deploy.lock"
flock -n 9 || exit 0

# 로그가 무한정 자라지 않게 (1MB 넘으면 최근 200줄만 남긴다)
if [[ -f $LOG ]] && [[ $(stat -c%s "$LOG") -gt 1048576 ]]; then
  tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

cd "$APP_DIR"

# 되돌려서 특정 버전에 고정한 상태면 자동 배포를 하지 않는다.
# 이게 없으면 롤백한 지 1분 만에 최신 버전이 다시 덮어쓴다.
[[ -f $APP_DIR/.deploy-pin ]] && exit 0

LOCAL=$(sudo -u "$APP_USER" git rev-parse HEAD)
REMOTE=$(sudo -u "$APP_USER" git ls-remote origin refs/heads/main 2>/dev/null | cut -f1)

# 네트워크가 잠깐 안 되면 그냥 넘어간다. 다음 분에 다시 본다.
[[ -n ${REMOTE:-} ]] || exit 0
[[ $LOCAL != "$REMOTE" ]] || exit 0

{
  echo "──────────────────────────────────────────"
  echo "[$(date '+%F %T')] 새 커밋 ${LOCAL:0:7} → ${REMOTE:0:7}"
} >> "$LOG"

# 배포 스크립트 자체가 바뀌었을 수 있으므로 코드를 먼저 받는다.
# 이 순서가 아니면 옛 스크립트로 배포하게 되고, 스크립트 수정이 영영
# 적용되지 않는다. (update.sh 안의 pull 은 그대로 두어도 무해하다)
if ! sudo -u "$APP_USER" git fetch -q --depth 50 origin main >> "$LOG" 2>&1 \
  || ! sudo -u "$APP_USER" git reset --hard -q "$REMOTE" >> "$LOG" 2>&1; then
  echo "[$(date '+%F %T')] ✗ 코드 받기 실패 — 이전 버전으로 계속 서비스 중" >> "$LOG"
  exit 0
fi

if bash "$APP_DIR/deploy/update.sh" >> "$LOG" 2>&1; then
  echo "[$(date '+%F %T')] ✓ 배포 완료" >> "$LOG"
else
  # 실패해도 기존 프로세스는 그대로 돈다. 다음 커밋에서 다시 시도한다.
  echo "[$(date '+%F %T')] ✗ 배포 실패 — 이전 버전으로 계속 서비스 중" >> "$LOG"
fi
