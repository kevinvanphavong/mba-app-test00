'use client'

import axios, { AxiosInstance } from 'axios'
import { useSuperAdminStore } from '@/store/superAdminStore'

/**
 * Client Axios centralisé pour les endpoints /api/superadmin/*.
 * Auth par cookie httpOnly `sa_token` (jamais de token en JS) : withCredentials
 * + en-tête anti-CSRF sur les mutations. Gère le 401 : logout + redirect login.
 */
export function superAdminApi(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
  })

  const MUTATIONS = ['post', 'put', 'patch', 'delete']
  instance.interceptors.request.use((config) => {
    if (config.method && MUTATIONS.includes(config.method.toLowerCase())) {
      config.headers['X-CSRF'] = '1'
    }
    return config
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
