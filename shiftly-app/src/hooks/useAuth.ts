'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginPayload {
  email:    string
  password: string
}

interface LoginResponse {
  token: string
}

// ─── Hook login ───────────────────────────────────────────────────────────────

export function useLogin() {
  const setToken = useAuthStore(s => s.setToken)
  const setUser  = useAuthStore(s => s.setUser)
  const router   = useRouter()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<LoginResponse>('/auth/login', payload).then(r => r.data),

    onSuccess: async (data) => {
      setToken(data.token)
      // Récupère le profil immédiatement après login
      const me = await api.get('/me').then(r => r.data)
      setUser(me)
      router.push('/service')
    },
  })
}

// ─── Hook logout ──────────────────────────────────────────────────────────────

export function useLogout() {
  const logout      = useAuthStore(s => s.logout)
  const queryClient = useQueryClient()
  const router      = useRouter()

  return () => {
    logout()
    queryClient.clear()
    router.push('/login')
  }
}

// ─── Hook utilisateur courant ─────────────────────────────────────────────────

export function useCurrentUser() {
  const token   = useAuthStore(s => s.token)
  const setUser = useAuthStore(s => s.setUser)
  const user    = useAuthStore(s => s.user)

  const query = useQuery({
    queryKey: ['me'],
    queryFn:  () => api.get('/me').then(r => {
      setUser(r.data)
      return r.data
    }),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000, // 5 min — pas de re-fetch inutile
    retry: false,
  })

  return {
    user:    user ?? query.data ?? null,
    loading: query.isLoading,
    isError: query.isError,
  }
}
