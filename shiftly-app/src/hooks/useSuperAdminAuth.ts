'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSuperAdminStore } from '@/store/superAdminStore'
import type { SuperAdminUser } from '@/types/superadmin'
import axios from 'axios'

interface LoginPayload {
  email:    string
  password: string
}

interface LoginResponse {
  token: string
}

export function useSuperAdminLogin() {
  const setToken = useSuperAdminStore(s => s.setToken)
  const setUser  = useSuperAdminStore(s => s.setUser)
  const router   = useRouter()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      axios
        .post<LoginResponse>(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/auth/login`, payload)
        .then(r => r.data),

    onSuccess: async (data) => {
      setToken(data.token)
      const me = await axios
        .get<SuperAdminUser>(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        })
        .then(r => r.data)
      setUser(me)
      router.push('/superadmin')
    },
  })
}

export function useSuperAdminLogout() {
  const logout = useSuperAdminStore(s => s.logout)
  const router = useRouter()

  return () => {
    logout()
    router.push('/superadmin/login')
  }
}
