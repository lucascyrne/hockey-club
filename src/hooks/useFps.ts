import { useEffect, useRef, useState } from 'react'

const SAMPLE_MS = 500

export function useFps() {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)
  const lastSample = useRef(performance.now())
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const tick = (now: number) => {
      frames.current += 1
      const elapsed = now - lastSample.current
      if (elapsed >= SAMPLE_MS) {
        setFps(Math.round((frames.current * 1000) / elapsed))
        frames.current = 0
        lastSample.current = now
      }
      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [])

  return fps
}
