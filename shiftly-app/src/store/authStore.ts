'use client'

import { create } from 'zustand'

export interface AuthUser {
  id:          number
  nom:         string
  prenom:      string
  email:       string
  role:        'MANAGER' | 'EMPLOYE'
  avatarColor: string | null
  points:      number
  centre: {
    id:           number
    nom:          string
    adresse:      string | null
    telephone:    string | null
    siteWeb:      string | null
    openingHours: Record<string, { ouvert: boolean; ouverture: string | null; fermeture: string | null }> | null
  } | null
}

interface AuthState {
  // Le token n'est JAMAIS en JS (cookie httpOnly). On ne garde que l'état user.
  user:     AuthUser | null
  centreId: number | null
  userId:   number | null

  setUser:  (user: AuthUser | null) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:     null,
  centreId: null,
  userId:   null,

  setUser: (user) => set({
    user,
    centreId: user?.centre?.id ?? null,
    userId:   user?.id         ?? null,
  }),

  // Vide l'état local. L'invalidation du cookie httpOnly se fait côté backend
  // (POST /api/auth/logout) — cf. LogoutButton / useLogout.
  logout: () => set({ user: null, centreId: null, userId: null }),
}))
