# 서버 배포 (Vultr · bixtore)

한판을 기존 서버에 **다른 서비스와 분리해서** 올리는 절차.

| | |
| --- | --- |
| 서버 | bixtore · 158.247.212.228 · Seoul |
| 사양 | 2 vCPU / 2GB RAM / 65GB SSD / Swap 6.2GB |
| 이미 돌고 있는 것 | nginx(80·443), PostgreSQL(127.0.0.1:5432), 그리고 테스트 중인 서비스 하나 |

## 기존 서비스와 어떻게 분리되나

이 서버에는 이미 다른 서비스가 있다. 그것을 건드리지 않는 것이 이 배포의 전제다.

| 구분 | 방식 |
| --- | --- |
| **실행 계정** | 전용 리눅스 계정 `hanpan`. root 아님. 다른 서비스 파일에 접근 자체가 안 된다 |
| **디렉터리** | `/opt/hanpan` 안에서만 산다 |
| **포트** | `127.0.0.1:3000` — 외부에 열지 않는다. nginx만 접근한다 |
| **DB** | 기존 Postgres에 `hanpan` DB·계정을 **추가**만 한다. 다른 DB 권한 없음 |
| **nginx** | 기존 설정 파일을 열지 않는다. `sites-available/hanpan` 새 파일만 추가하고 `server_name`으로 갈린다 |
| **메모리** | PM2가 600MB를 넘으면 한판만 재시작한다. 한판이 폭주해도 서버가 죽지 않는다 |
| **빌드 부하** | `nice -n 19 ionice -c3` 로 최하 우선순위. 빌드 중에도 기존 서비스 응답이 유지된다 |

## 처음 한 번

서버에 SSH로 접속한 뒤:

```bash
curl -fsSL https://raw.githubusercontent.com/choidongchan/levelmate/main/deploy/setup.sh -o /tmp/setup.sh
sudo bash /tmp/setup.sh
```

스크립트가 하는 일 — Node·PM2·certbot 확인 및 설치, 전용 계정 생성, DB 생성,
코드 내려받기, 빌드, PM2 등록, nginx 설정 추가, 매일 백업 등록.

**중간에 멈추면 그 지점부터 다시 돌려도 된다.** 이미 된 것은 건너뛴다.

## 그다음 DNS 변경

가비아 DNS 관리툴에서 `levelmate.co.kr`:

| 타입 | 호스트 | 값 |
| --- | --- | --- |
| A | `@` | `158.247.212.228` |
| A | `www` | `158.247.212.228` |

기존 `www` CNAME(`...vercel-dns-017.com.`)은 **지운다.** A 레코드와 CNAME은 같은 호스트에 공존할 수 없다.

## DNS 반영 후 HTTPS

10~30분 기다린 뒤:

```bash
sudo certbot --nginx -d www.levelmate.co.kr -d levelmate.co.kr
```

> DNS가 아직 Vercel을 가리키는 상태에서 돌리면 인증에 실패한다. 순서를 지킬 것.

인증서는 자동 갱신된다.

## 이후 업데이트 — 자동으로 나간다

`main` 에 푸시하면 **1분 안에 서버가 알아서 받아서 배포한다.** 손댈 일이 없다.

동작 방식 (`deploy/autodeploy.sh`)

- 1분마다 원격 해시를 한 번 조회한다. 같으면 아무것도 하지 않는다
- 새 커밋이 있을 때만 받아서 빌드하고 재시작한다
- 배포가 도는 중에 다시 불려도 잠금 때문에 겹치지 않는다
- **빌드가 실패하면 돌던 프로세스를 그대로 둔다.** 서비스가 끊기지 않고,
  다음 커밋에서 다시 시도한다

```bash
tail -f /var/log/hanpan-deploy.log   # 배포 기록
```

### 직접 배포하고 싶을 때

```bash
sudo bash /opt/hanpan/deploy/update.sh
```

### 자동 배포를 끄려면

```bash
sudo rm /etc/cron.d/hanpan-autodeploy
```

## 되돌리기

문제가 생기면 예전 버전으로 즉시 돌아간다.

```bash
sudo bash /opt/hanpan/deploy/rollback.sh          # 최근 기록 보기
sudo bash /opt/hanpan/deploy/rollback.sh back     # 바로 이전 버전으로
sudo bash /opt/hanpan/deploy/rollback.sh a1b2c3d  # 특정 버전으로
sudo bash /opt/hanpan/deploy/rollback.sh latest   # 고정 풀고 최신으로
```

**되돌리면 그 버전에 고정된다.** 고정된 동안에는 자동 배포가 멈춘다.
이게 없으면 되돌린 지 1분 만에 최신 버전이 다시 덮어쓴다.

고정 상태는 `/opt/hanpan/.deploy-pin` 파일로 표시된다.
`rollback.sh latest` 를 돌리면 파일이 지워지고 자동 배포가 다시 켜진다.

## 자주 쓰는 명령

```bash
sudo -u hanpan pm2 status          # 상태
sudo -u hanpan pm2 logs hanpan     # 로그
sudo -u hanpan pm2 restart hanpan  # 재시작
ls -lh /var/backups/hanpan/        # 백업 확인
```

## 문제가 생기면

**즉시 되돌리는 방법** — 가비아 DNS를 Vercel로 되돌린다.

| 타입 | 호스트 | 값 |
| --- | --- | --- |
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `731fccfab53e758f.vercel-dns-017.com.` |

Vercel 배포는 지우지 않고 남겨둔다. 서버에 문제가 생겼을 때 DNS만 되돌리면
몇 분 안에 복구된다.

## 한판을 서버에서 완전히 걷어내려면

```bash
sudo -u hanpan pm2 delete hanpan
sudo rm /etc/nginx/sites-enabled/hanpan && sudo nginx -t && sudo systemctl reload nginx
sudo rm -rf /opt/hanpan /etc/cron.daily/hanpan-backup
sudo -u postgres dropdb hanpan && sudo -u postgres dropuser hanpan
sudo userdel -r hanpan
```

기존 서비스에는 아무 영향이 없다.
