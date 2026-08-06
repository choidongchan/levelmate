import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from '../db'

export const USER_COOKIE = 'hp_session'
export const ADMIN_COOKIE = 'hp_admin'

/** 세션 유지 기간 */
const USER_DAYS = 60
const ADMIN_DAYS = 7

export function expiry(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export const userExpiry = () => expiry(USER_DAYS)
export const adminExpiry = () => expiry(ADMIN_DAYS)

export function newToken() {
  return randomBytes(32).toString('base64url')
}

/**
 * 비밀번호는 원문을 담지 않는다.
 * scrypt 는 Node 기본 모듈이라 별도 의존성 없이 쓸 수 있다.
 */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${key}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !key) return false
  const expected = Buffer.from(key, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export type Viewer = {
  userId: string | null
  adminId: string | null
  isAdmin: boolean
}

/** 쿠키에 담긴 토큰으로 지금 누가 보고 있는지 알아낸다. */
export async function readViewer(): Promise<Viewer> {
  const jar = await cookies()
  const userToken = jar.get(USER_COOKIE)?.value
  const adminToken = jar.get(ADMIN_COOKIE)?.value
  const now = new Date()

  const [session, adminSession] = await Promise.all([
    userToken
      ? db.session.findFirst({
          where: { token: userToken, expiresAt: { gt: now } },
          select: { userId: true },
        })
      : null,
    adminToken
      ? db.adminSession.findFirst({
          where: { token: adminToken, expiresAt: { gt: now }, admin: { active: true } },
          select: { adminId: true },
        })
      : null,
  ])

  return {
    userId: session?.userId ?? null,
    adminId: adminSession?.adminId ?? null,
    isAdmin: Boolean(adminSession),
  }
}

/** 만료된 세션을 이따금 치운다. 로그인할 때 곁다리로 돌린다. */
export async function sweepSessions() {
  const now = new Date()
  await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.adminSession.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]).catch(() => {})
}
