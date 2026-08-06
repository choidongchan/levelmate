'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AvatarIllustration } from './avatar-illustration'
import type { User } from '@/lib/types'

/**
 * 프로필 이미지.
 * 검수를 통과한 사진이 있으면 사진을, 없거나 파일을 못 찾으면 캐릭터 아바타를 그린다.
 * 사진 파일은 public/mates/ 에 넣는다 — 없어도 화면이 깨지지 않는다.
 */
export function UserArt({
  user,
  className = '',
  sizes = '96px',
  priority = false,
}: {
  user: Pick<User, 'nickname' | 'hue' | 'photoUrl' | 'photoStatus'>
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const showPhoto = user.photoUrl && user.photoStatus === 'APPROVED' && !failed

  /**
   * 올린 사진(/api/photos/…)은 이미 720×960 WebP 로 만들어 둔 것이라
   * 다시 줄일 게 없다. 굳이 이미지 최적화를 거치면 실패할 구석만 하나 더 생기고,
   * 실패하면 조용히 캐릭터로 바뀌어서 "사진이 왜 안 나오지"가 된다.
   * data URL 도 최적화 대상이 아니다.
   */
  const asIs =
    user.photoUrl?.startsWith('data:') || user.photoUrl?.startsWith('/api/photos/')

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {showPhoto && asIs ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoUrl!}
          alt={`${user.nickname} 프로필 사진`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : showPhoto ? (
        <Image
          src={user.photoUrl!}
          alt={`${user.nickname} 프로필 사진`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <AvatarIllustration hue={user.hue} className="size-full" />
      )}
    </div>
  )
}
