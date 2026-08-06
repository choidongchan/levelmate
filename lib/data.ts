/**
 * 1차 UI 확인용 더미 데이터.
 * DB(Prisma) 연동 시 이 파일의 타입은 유지하고 조회 함수만 교체하면 된다.
 */

export type GameKey = 'lol' | 'valorant' | 'pubg' | 'fconline' | 'overwatch'

export const GAMES: Record<GameKey, { name: string; short: string; color: string }> = {
  lol: { name: '리그 오브 레전드', short: 'LOL', color: '#c89b3c' },
  valorant: { name: '발로란트', short: 'VAL', color: '#ff4655' },
  pubg: { name: '배틀그라운드', short: 'PUBG', color: '#f2a900' },
  fconline: { name: 'FC 온라인', short: 'FC', color: '#3b82f6' },
  overwatch: { name: '오버워치', short: 'OW', color: '#f99e1a' },
}

export type Product = {
  id: string
  name: string
  desc: string
  price: string
  unit: string
  icon: 'headset' | 'chart' | 'monitor' | 'group' | 'trophy'
  featured?: boolean
}

export const PRODUCTS: Product[] = [
  { id: 'duo', name: '온라인 듀오', desc: '함께 게임', price: '8,000원~', unit: '/시간', icon: 'headset' },
  { id: 'coach', name: '게임 코칭', desc: '티어 상승', price: '15,000원~', unit: '/시간', icon: 'chart' },
  { id: 'pcbang', name: 'PC방 동행', desc: '제휴 PC방', price: '20,000원~', unit: '/시간', icon: 'monitor', featured: true },
  { id: 'party', name: '5인 파티', desc: '팀 단위 매칭', price: '50,000원~', unit: '/팀', icon: 'group' },
  { id: 'tournament', name: '대회 파트너', desc: '대회 참가', price: '별도 협의', unit: '', icon: 'trophy' },
]

export type Mate = {
  id: string
  nickname: string
  hue: number
  online: boolean
  rating: number
  reviewCount: number
  mainGame: GameKey
  tier: string
  headline: string
  bio: string
  pricePerHour: number
  availableFrom: string
  availableTo: string
  games: GameKey[]
  verified: boolean
  responseRate: number
  region: string
  pcbang: string
}

export const MATES: Mate[] = [
  {
    id: 'onbi',
    nickname: '온비•v•',
    hue: 282,
    online: true,
    rating: 4.9,
    reviewCount: 128,
    mainGame: 'lol',
    tier: '다이아 IV',
    headline: '서포터 전문, 친절해요 :)',
    bio: '매너 좋게 같이 게임하실 분 구해요! 디코 가능, 초보자도 환영합니다 :)',
    pricePerHour: 20000,
    availableFrom: '오후 1시',
    availableTo: '새벽 2시',
    games: ['lol', 'valorant', 'pubg', 'fconline'],
    verified: true,
    responseRate: 98,
    region: '서울시 강남구',
    pcbang: '레벨업 PC방 강남점',
  },
  {
    id: 'hana',
    nickname: '하나♡',
    hue: 320,
    online: true,
    rating: 4.8,
    reviewCount: 96,
    mainGame: 'valorant',
    tier: '플래티넘 3',
    headline: '경쟁전 듀오, 디코 가능!',
    bio: '발로란트 경쟁전 위주로 돌려요. 듀오/쓰리스택 다 좋습니다. 에임 코칭도 가능해요.',
    pricePerHour: 18000,
    availableFrom: '오후 6시',
    availableTo: '새벽 3시',
    games: ['valorant', 'overwatch', 'lol'],
    verified: true,
    responseRate: 95,
    region: '서울시 강남구',
    pcbang: '레벨업 PC방 역삼점',
  },
  {
    id: 'sora',
    nickname: '소라',
    hue: 200,
    online: true,
    rating: 4.9,
    reviewCount: 74,
    mainGame: 'pubg',
    tier: '에이스',
    headline: '즐겜 위주, 텐션 좋아요!',
    bio: '스쿼드 자리 비면 불러주세요. 웃으면서 게임하는 걸 제일 좋아합니다!',
    pricePerHour: 15000,
    availableFrom: '오후 3시',
    availableTo: '자정',
    games: ['pubg', 'overwatch'],
    verified: true,
    responseRate: 92,
    region: '서울시 강남구',
    pcbang: '레벨업 PC방 삼성점',
  },
  {
    id: 'minjung',
    nickname: '민정',
    hue: 155,
    online: false,
    rating: 4.7,
    reviewCount: 63,
    mainGame: 'fconline',
    tier: '챔피언스',
    headline: '전술 코칭 가능해요!',
    bio: '감독모드/전술 세팅 위주로 알려드려요. 랭크 올리고 싶은 분 환영합니다.',
    pricePerHour: 20000,
    availableFrom: '오전 11시',
    availableTo: '오후 10시',
    games: ['fconline'],
    verified: true,
    responseRate: 89,
    region: '서울시 강남구',
    pcbang: '레벨업 PC방 선릉점',
  },
  {
    id: 'yuha',
    nickname: '유하',
    hue: 20,
    online: true,
    rating: 4.6,
    reviewCount: 41,
    mainGame: 'overwatch',
    tier: '마스터',
    headline: '힐러 장인, 편하게 불러주세요',
    bio: '오버워치 서포트 위주. 초보 분들 포지션 잡아드리는 것도 좋아해요.',
    pricePerHour: 16000,
    availableFrom: '오후 2시',
    availableTo: '새벽 1시',
    games: ['overwatch', 'valorant'],
    verified: true,
    responseRate: 90,
    region: '서울시 강남구',
    pcbang: '레벨업 PC방 강남점',
  },
]

export function getMate(id: string): Mate | undefined {
  return MATES.find((m) => m.id === id)
}

export const HOW_TO_STEPS = [
  { icon: 'search', title: '메이트 검색', desc: '게임, 티어, 지역\n시간 선택' },
  { icon: 'calendar', title: '예약 및 결제', desc: '원하는 시간\n선결제' },
  { icon: 'qr', title: 'PC방 체크인', desc: '제휴 매장 QR\n체크인' },
  { icon: 'gamepad', title: '함께 게임', desc: '즐거운 시간\n함께 플레이' },
  { icon: 'star', title: '평가 및 후기', desc: '상호 평가 후\n정산 완료' },
] as const

export const SAFETY_ITEMS = [
  { icon: 'id', title: '본인 인증', desc: '휴대폰 본인 인증 필수' },
  { icon: 'monitor', title: '제휴 PC방', desc: '지정 PC방에서만 동행 가능' },
  { icon: 'check', title: '안심 결제', desc: '앱 내 안전 결제 시스템' },
  { icon: 'alert', title: '신고 & 차단', desc: '문제 발생 시 즉시 신고' },
  { icon: 'shield', title: '개인정보 보호', desc: '개인 연락처 노출 금지' },
] as const

export const PARTNER_BENEFITS = [
  '프리미엄 좌석 예약',
  '맛있는 F&B 주문',
  '다양한 이벤트 참여',
  '대회 참가 신청',
]

export const REGIONS = [
  '서울시 강남구',
  '서울시 마포구',
  '서울시 관악구',
  '경기도 성남시 분당구',
  '부산시 부산진구',
]
