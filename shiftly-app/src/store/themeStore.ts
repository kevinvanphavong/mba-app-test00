'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'sand'

export const THEMES: ReadonlyArray<Theme> = ['dark', 'light', 'sand']

const DEFAULT_THEME: Theme = 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'shiftly-theme',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
