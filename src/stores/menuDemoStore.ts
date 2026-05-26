import { create } from 'zustand'

type MenuDemoStore = {
  active: boolean
  setActive: (active: boolean) => void
}

export const useMenuDemoStore = create<MenuDemoStore>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}))

export function isMenuDemoActive() {
  return useMenuDemoStore.getState().active
}
