/**
 * PWA 아이콘(PNG) 생성기.
 *   node scripts/generate-icons.mjs
 * 로고를 바꾸면 app/icon.svg 를 고친 뒤 이 스크립트를 다시 돌리면 된다.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = new URL('../public/icons/', import.meta.url)

// any 용: 라운드 사각형 그대로
const logo = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="13" fill="url(#g)"/>
  <path d="M12 34V17.5l8 8.5 8-8.5V34" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 27.5 36 22l5 5.5" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
</svg>`

// maskable 용: 안드로이드가 가장자리를 잘라내므로 여백(safe zone)을 넉넉히 둔다
const maskable = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" fill="url(#g)"/>
  <g transform="translate(24 24) scale(0.62) translate(-24 -24)">
    <path d="M12 34V17.5l8 8.5 8-8.5V34" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M31 27.5 36 22l5 5.5" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
  </g>
</svg>`

await mkdir(OUT, { recursive: true })

const targets = [
  ['icon-192.png', logo(192), 192],
  ['icon-512.png', logo(512), 512],
  ['maskable-512.png', maskable(512), 512],
  ['apple-touch-icon.png', logo(180), 180],
]

for (const [name, svg, size] of targets) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
  await writeFile(new URL(name, OUT), png)
  console.log(`generated public/icons/${name}`)
}

// 브라우저가 기본으로 찾는 /favicon.ico. PNG를 담은 ICO 컨테이너로 만든다.
const favPng = await sharp(Buffer.from(logo(32))).resize(32, 32).png().toBuffer()
const header = Buffer.alloc(22)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(1, 4) // 이미지 1개
header.writeUInt8(32, 6) // width
header.writeUInt8(32, 7) // height
header.writeUInt8(0, 8) // 팔레트 없음
header.writeUInt8(0, 9) // reserved
header.writeUInt16LE(1, 10) // color planes
header.writeUInt16LE(32, 12) // bits per pixel
header.writeUInt32LE(favPng.length, 14)
header.writeUInt32LE(22, 18) // 이미지 데이터 오프셋
await writeFile(new URL('../app/favicon.ico', import.meta.url), Buffer.concat([header, favPng]))
console.log('generated app/favicon.ico')
