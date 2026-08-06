import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

/**
 * DB 접속은 하나만 둔다.
 *
 * 처음 쓸 때 만든다. 모듈을 불러오는 순간 만들어버리면, DATABASE_URL 이
 * 비었을 때 화면 코드까지 통째로 못 불러와서 사이트 전체가 죽는다.
 * 늦게 만들면 그 요청만 실패하고 나머지는 그대로 뜬다.
 *
 * 개발 중에는 파일이 바뀔 때마다 모듈이 다시 불려서, 그대로 두면
 * 접속이 계속 쌓여 DB 가 연결 수 한도에 걸린다. 그래서 전역에 담아둔다.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL 이 설정되지 않았습니다 (.env 를 확인해주세요)')
  }
  // Prisma 7 부터는 접속을 드라이버 어댑터가 맡는다.
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 10 }),
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
  return client
}

let client: PrismaClient | null = null

function instance(): PrismaClient {
  if (!client) client = globalForPrisma.prisma ?? create()
  return client
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(instance(), prop, receiver)
  },
})
