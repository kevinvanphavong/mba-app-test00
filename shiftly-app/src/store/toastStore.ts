'use client'

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message:  string | null
  type:     ToastType
  visible:  boolean
  show: (message: string, type?: ToastType) => void
  hide: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type:    'success',
  visible: false,

  show: (message, type = 'success') => {
    set({ message, type, visible: true })
  },

  hide: () => set({ visible: false }),
}))
