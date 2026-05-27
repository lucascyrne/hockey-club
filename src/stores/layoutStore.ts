import { create } from 'zustand'
import { resolveSplitAxis, type SplitAxis } from '../lib/splitViewport'

type LayoutState = {
  width: number
  height: number
  isCoarsePointer: boolean
  splitAxis: SplitAxis
  isMobile: boolean
  reduceMenuFx: boolean
  sync: () => void
}

function readLayout(): Pick<
  LayoutState,
  'width' | 'height' | 'isCoarsePointer' | 'splitAxis' | 'isMobile' | 'reduceMenuFx'
> {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280
  const height = typeof window !== 'undefined' ? window.innerHeight : 720
  const isCoarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  const splitAxis = resolveSplitAxis(width, height)
  const isMobile = isCoarsePointer || width < 768
  const reduceMenuFx = isCoarsePointer || height > width

  return { width, height, isCoarsePointer, splitAxis, isMobile, reduceMenuFx }
}

export const useLayoutStore = create<LayoutState>((set) => ({
  ...readLayout(),
  sync: () => set(readLayout()),
}))

export function getSplitAxis(): SplitAxis {
  return useLayoutStore.getState().splitAxis
}
