'use client'

import axios, { AxiosInstance } from 'axios'
import { useSuperAdminStore } from '@/store/superAdminStore'

/**
 * Client Axios centralisé pour les endpoints /api/superadmin/*.
 * Gère automatiquement l'expiration du JWT : 401 → logout + redirect vers
 * /superadmin/login. Évite la duplication de config entre les hooks.
 */
export function superAdminApi(token: string | null): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && typeof window !== 'undefined') {
        useSuperAdminStore.getState().logout()
        // Laisse React router prendre le relais via le layout guard
        if (!window.location.pathname.startsWith('/superadmin/login')) {
          window.location.href = '/superadmin/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}
