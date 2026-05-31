import { useControls } from 'leva'
import { useEffect } from 'react'
import { useCpuDebugStore } from '../stores/cpuDebugStore'

/** Painel Leva — só montar dentro de DevOnly. */
export function useCpuDebugControls() {
  const flags = useControls('CPU Debug', {
    enabled: { value: false, label: 'Ativar' },
    predictions: { value: true, label: 'Trajetórias' },
    states: { value: true, label: 'Estados FSM' },
    intercepts: { value: true, label: 'Interceptos' },
    goalThreats: { value: true, label: 'Risco gol' },
    decisions: { value: true, label: 'Decisões' },
    safeZones: { value: false, label: 'Zonas seguras' },
  })

  useEffect(() => {
    useCpuDebugStore.getState().setFlags(flags)
  }, [flags])
}
