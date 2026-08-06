// Prisma 7 은 .env 를 자동으로 읽지 않는다. 직접 불러와야
// DATABASE_URL 을 찾을 수 있다.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// 빌드 서버처럼 DB 가 없는 곳에서도 `prisma generate` 는 돌아야 한다.
// 실제 접속이 필요한 명령(migrate 등)에서만 값이 없으면 실패한다.
const url = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/_unset'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url },
})
