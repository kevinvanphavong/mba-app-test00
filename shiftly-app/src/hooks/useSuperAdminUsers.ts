'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { superAdminApi } from '@/lib/superAdminApi'
import type { GlobalUser, GlobalUserDetail, GlobalUserStats } from '@/types/superadmin'

interface UserFilters {
  search?: string
  role?:   string
  centre?: string
  statut?: string
  sort?:   string
}

export function useSuperAdminUsers(filters: UserFilters = {}) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<GlobalUser[]>({
    queryKey: ['superadmin', 'users', filters],
    queryFn:  () => superAdminApi(token).get<GlobalUser[]>('/superadmin/users', { params: filters }).then(r => r.data),
    enabled:  !!token,
    retry:    false,
  })
}

export function useSuperAdminUsersStats() {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<GlobalUserStats>({
    queryKey: ['superadmin', 'users', 'stats'],
    queryFn:  () => superAdminApi(token).get<GlobalUserStats>('/superadmin/users/stats').then(r => r.data),
    enabled:  !!token,
    retry:    false,
  })
}

export function useSuperAdminUserDetail(userId: number | null) {
  const token = useSuperAdminStore(s => s.token)

  return useQuery<GlobalUserDetail>({
    queryKey: ['superadmin', 'user', userId],
    queryFn:  () => superAdminApi(token).get<GlobalUserDetail>(`/superadmin/users/${userId}`).then(r => r.data),
    enabled:  !!token && !!userId,
    retry:    false,
  })
}

export function useResetUserPassword() {
  const token = useSuperAdminStore(s => s.token)

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi(token).post<{ newPassword: string }>(`/superadmin/users/${userId}/reset-password`).then(r => r.data),
  })
}

export function useDisableUser() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi(token).post(`/superadmin/users/${userId}/disable`).then(r => r.data),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'user', userId] })
    },
  })
}

export function useEnableUser() {
  const token = useSuperAdminStore(s => s.token)
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi(token).post(`/superadmin/users/${userId}/enable`).then(r => r.data),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'user', userId] })
    },
  })
}
