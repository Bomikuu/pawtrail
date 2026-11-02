'use client'
import { create } from 'zustand'
/** Ephemeral presentation only. Never persist fetched records or private form data. */
export const useUiStore = create<{
  navigationOpen: boolean
  setNavigationOpen(open: boolean): void
}>((set) => ({
  navigationOpen: false,
  setNavigationOpen: (navigationOpen) => set({ navigationOpen }),
}))
