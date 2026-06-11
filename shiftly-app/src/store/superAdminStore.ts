'use client'

import { create } from 'zustand'
import type { SuperAdminUser, ImpersonationData } from '@/types/superadmin'

interface SuperAdminState {
  // Le token n'est JAMAIS en JS : cookie httpOnly `sa_token` (superadmin) et
  // `token` (centre impersonné), posés/effacés par le backend.
  user:               SuperAdminUser | null
  isImpersonating:    boolean
  impersonatedCentre: ImpersonationData['centre'] | null

  setUser:            (user: SuperAdminUser | null) => void
  startImpersonation: (data: ImpersonationData) => void
  stopImpersonation:  () => void
  logout:             () => void
}

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  user:               null,
  isImpersonating:    false,
  impersonatedCentre: null,

  setUser: (user) => set({ user }),

  startImpersonation: (data) => set({
    isImpersonating:    true,
    impersonatedCentre: data.centre,
  }),

  stopImpersonation: () => set({
    isImpersonating:    false,
    impersonatedCentre: null,
  }),

  // Vide l'état local ; l'invalidation du cookie se fait côté backend.
  logout: () => set({ user: null, isImpersonating: false, impersonatedCentre: null }),
}))
