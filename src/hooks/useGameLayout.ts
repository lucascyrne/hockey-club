import { useLayoutStore } from '../stores/layoutStore'

export function useGameLayout() {
  const splitAxis = useLayoutStore((s) => s.splitAxis)
  const isMobile = useLayoutStore((s) => s.isMobile)
  const isCoarsePointer = useLayoutStore((s) => s.isCoarsePointer)
  const reduceMenuFx = useLayoutStore((s) => s.reduceMenuFx)

  return { splitAxis, isMobile, isCoarsePointer, reduceMenuFx }
}
