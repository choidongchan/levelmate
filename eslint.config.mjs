// eslint-config-next 16은 플랫 컨피그를 그대로 내보낸다 (FlatCompat 불필요).
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...coreWebVitals,
  ...typescript,
]

export default eslintConfig
