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

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {showPhoto ? (
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
