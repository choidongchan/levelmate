import Image from 'next/image'
import { AvatarIllustration } from './avatar-illustration'
import type { User } from '@/lib/types'

/**
 * 프로필 이미지.
 * 검수를 통과한 사진이 있으면 사진을, 없으면 캐릭터 아바타를 그린다.
 */
export function UserArt({
  user,
  className = '',
  sizes = '96px',
}: {
  user: Pick<User, 'nickname' | 'hue' | 'photoUrl' | 'photoStatus'>
  className?: string
  sizes?: string
}) {
  const showPhoto = user.photoUrl && user.photoStatus === 'APPROVED'

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showPhoto ? (
        <Image
          src={user.photoUrl!}
          alt={`${user.nickname} 프로필 사진`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <AvatarIllustration hue={user.hue} className="size-full" />
      )}
    </div>
  )
}
