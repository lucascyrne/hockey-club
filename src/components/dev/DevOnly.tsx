import type { ReactNode } from 'react'
import { IS_DEV } from '../../lib/env'

type DevOnlyProps = {
  children: ReactNode
}

export function DevOnly({ children }: DevOnlyProps) {
  if (!IS_DEV) return null
  return children
}
