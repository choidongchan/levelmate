// Prisma 7 은 .env 를 자동으로 읽지 않는다. 직접 불러와야
// DATABASE_URL 을 찾을 수 있다.
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
