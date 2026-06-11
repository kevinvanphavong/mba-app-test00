'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginPayload {
  email:    string
  password: string
}

// ─── Hook login ───────────────────────────────────────────────────────────────

export function useLogin() {
  const setUser = useAuthStore(s => s.setUser)
  const router  = useRouter()

  return useMutation({
    // Le backend pose le cookie httpOnly et renvoie directement le profil
    // user/centre (plus aucun token dans la réponse).
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthUser>('/auth/login', payload).then(r => r.data),

    onSuccess: (user) => {
      setUser(user)
      router.push('/service')
    },
  })
}

// ─── Hook logout ──────────────────────────────────────────────────────────────

export function useLogout() {
  const logout      = useAuthStore(s => s.logout)
  const queryClient = useQueryClient()
  const router      = useRouter()

  return async () => {
    // Invalide le cookie httpOnly côté backend, puis vide l'état local.
    try {
      await api.post('/auth/logout')
    } catch {
      // Best-effort : même si l'appel échoue, on nettoie le front.
    }
    logout()
    queryClient.clear()
    router.push('/login')
  }
}

// ─── Hook utilisateur courant ─────────────────────────────────────────────────

export function useCurrentUser() {
  const setUser = useAuthStore(s => s.setUser)
  const user    = useAuthStore(s => s.user)

  // Réhydrate le store depuis le cookie httpOnly (le token n'est plus en JS).
  const query = useQuery({
    queryKey: ['me'],
    queryFn:  () => api.get<AuthUser>('/me').then(r => {
      setUser(r.data)
      return r.data
    }),
    staleTime: 5 * 60 * 1000, // 5 min — pas de re-fetch inutile
    retry: false,
  })

  return {
    user:    user ?? query.data ?? null,
    loading: query.isLoading,
    isError: query.isError,
  }
}
