'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { superAdminApi } from '@/lib/superAdminApi'
import { useSuperAdminStore } from '@/store/superAdminStore'
import type { SuperAdminUser } from '@/types/superadmin'

interface LoginPayload {
  email:    string
  password: string
}

export function useSuperAdminLogin() {
  const setUser = useSuperAdminStore(s => s.setUser)
  const router  = useRouter()

  return useMutation({
    // Le backend pose le cookie httpOnly `sa_token` et renvoie le profil superadmin.
    mutationFn: (payload: LoginPayload) =>
      superAdminApi()
        .post<SuperAdminUser>('/superadmin/auth/login', payload)
        .then(r => r.data),

    onSuccess: (user) => {
      setUser(user)
      router.push('/superadmin')
    },
  })
}

export function useSuperAdminLogout() {
  const logout = useSuperAdminStore(s => s.logout)
  const router = useRouter()

  return async () => {
    try {
      await superAdminApi().post('/superadmin/auth/logout')
    } catch {
      // Best-effort : on nettoie le front quoi qu'il arrive.
    }
    logout()
    router.push('/superadmin/login')
  }
}
