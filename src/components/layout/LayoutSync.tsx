import { useEffect } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'

/** Mantém layoutStore alinhado a viewport e pointer coarse. */
export function LayoutSync() {
  const sync = useLayoutStore((s) => s.sync)

  useEffect(() => {
    sync()
    window.addEventListener('resize', sync)
    const mq = window.matchMedia('(pointer: coarse)')
    mq.addEventListener('change', sync)
    return () => {
      window.removeEventListener('resize', sync)
      mq.removeEventListener('change', sync)
    }
  }, [sync])

  return null
}
