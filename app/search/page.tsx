import type { Metadata } from 'next'
import { SearchScreen } from './search-screen'

export const metadata: Metadata = { title: '메이트 검색' }

export default function SearchPage() {
  return <SearchScreen />
}
