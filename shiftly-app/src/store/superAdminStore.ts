'use client'

import { create } from 'zustand'
import type { SuperAdminUser, ImpersonationData } from '@/types/superadmin'

interface SuperAdminState {
  token:              string | null
  user:               SuperAdminUser | null
  isImpersonating:    boolean
  impersonatedCentre: ImpersonationData['centre'] | null
  impersonatedToken:  string | null

  setToken:           (token: string | null) => void
  setUser:            (user: SuperAdminUser | null) => void
  startImpersonation: (data: ImpersonationData) => void
  stopImpersonation:  () => void
  logout:             () => void
}

const SA_TOKEN_KEY = 'superadmin_token'

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  token:              typeof window !== 'undefined' ? localStorage.getItem(SA_TOKEN_KEY) : null,
  user:               null,
  isImpersonating:    false,
  impersonatedCentre: null,
  impersonatedToken:  null,

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      token ? localStorage.setItem(SA_TOKEN_KEY, token) : localStorage.removeItem(SA_TOKEN_KEY)
    }
    set({ token })
  },

  setUser: (user) => set({ user }),

  startImpersonation: (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token)
    }
    set({
      isImpersonating:   true,
      impersonatedCentre: data.centre,
      impersonatedToken:  data.token,
    })
  },

  stopImpersonation: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({
      isImpersonating:   false,
      impersonatedCentre: null,
      impersonatedToken:  null,
    })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SA_TOKEN_KEY)
      localStorage.removeItem('token')
    }
    set({ token: null, user: null, isImpersonating: false, impersonatedCentre: null, impersonatedToken: null })
  },
}))
