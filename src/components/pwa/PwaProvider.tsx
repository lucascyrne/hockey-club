import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Regista o service worker sem UI de instalação ou atualização. */
export function PwaProvider({ children }: { children: ReactNode }) {
  useRegisterSW({ immediate: true })

  return <>{children}</>
}
