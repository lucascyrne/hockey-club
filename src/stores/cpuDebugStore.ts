import { create } from 'zustand'
import { IS_DEV } from '../lib/env'

export type CpuDebugFlags = {
  enabled: boolean
  predictions: boolean
  states: boolean
  intercepts: boolean
  goalThreats: boolean
  decisions: boolean
  safeZones: boolean
}

const DEFAULT_FLAGS: CpuDebugFlags = {
  enabled: false,
  predictions: true,
  states: true,
  intercepts: true,
  goalThreats: true,
  decisions: true,
  safeZones: false,
}

type CpuDebugStore = CpuDebugFlags & {
  setFlag: <K extends keyof CpuDebugFlags>(key: K, value: CpuDebugFlags[K]) => void
  setFlags: (partial: Partial<CpuDebugFlags>) => void
}

export const useCpuDebugStore = create<CpuDebugStore>((set) => ({
  ...DEFAULT_FLAGS,
  setFlag: (key, value) => set({ [key]: value }),
  setFlags: (partial) => set(partial),
}))

/** Só ativo em dev quando enabled. */
export function isCpuDebugActive(): boolean {
  if (!IS_DEV) return false
  return useCpuDebugStore.getState().enabled
}

export function isCpuDebugLayer(layer: keyof Omit<CpuDebugFlags, 'enabled'>): boolean {
  if (!isCpuDebugActive()) return false
  return useCpuDebugStore.getState()[layer]
}
