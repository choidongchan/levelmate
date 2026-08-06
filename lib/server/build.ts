import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * 지금 서버가 돌리고 있는 빌드의 이름.
 *
 * 화면을 켜둔 채로 배포가 되면, 그 탭은 옛 코드를 그대로 들고 있게 된다.
 * 그 상태에서는 남들과 다른 것을 보게 되고, 본인만 멀쩡해 보인다.
 * 브라우저가 이 값을 보고 자기가 낡았는지 스스로 알아채게 하려고 내려보낸다.
 */
let cached: string | null = null

export async function buildId(): Promise<string> {
  if (cached) return cached
  const dir = process.env.NEXT_DIST_DIR || '.next'
  cached = await readFile(path.join(process.cwd(), dir, 'BUILD_ID'), 'utf8')
    .then((s) => s.trim())
    .catch(() => '')
  return cached
}
