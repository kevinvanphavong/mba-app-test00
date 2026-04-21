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
  token:    string | null
  user:     AuthUser | null
  centreId: number | null
  userId:   number | null

  setToken: (token: string | null) => void
  setUser:  (user: AuthUser | null) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token:    typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user:     null,
  centreId: null,
  userId:   null,

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token)
      else       localStorage.removeItem('token')
    }
    set({ token })
  },

  setUser: (user) => set({
    user,
    centreId: user?.centre?.id ?? null,
    userId:   user?.id         ?? null,
  }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      document.cookie = 'token=; path=/; max-age=0'
    }
    set({ token: null, user: null, centreId: null, userId: null })
  },
}))
