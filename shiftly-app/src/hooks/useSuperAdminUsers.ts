'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  return useQuery<GlobalUser[]>({
    queryKey: ['superadmin', 'users', filters],
    queryFn:  () => superAdminApi().get<GlobalUser[]>('/superadmin/users', { params: filters }).then(r => r.data),
    enabled: true,
    retry:    false,
  })
}

export function useSuperAdminUsersStats() {

  return useQuery<GlobalUserStats>({
    queryKey: ['superadmin', 'users', 'stats'],
    queryFn:  () => superAdminApi().get<GlobalUserStats>('/superadmin/users/stats').then(r => r.data),
    enabled: true,
    retry:    false,
  })
}

export function useSuperAdminUserDetail(userId: number | null) {

  return useQuery<GlobalUserDetail>({
    queryKey: ['superadmin', 'user', userId],
    queryFn:  () => superAdminApi().get<GlobalUserDetail>(`/superadmin/users/${userId}`).then(r => r.data),
    enabled:  !!userId,
    retry:    false,
  })
}

export function useResetUserPassword() {

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi().post<{ newPassword: string }>(`/superadmin/users/${userId}/reset-password`).then(r => r.data),
  })
}

export function useDisableUser() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi().post(`/superadmin/users/${userId}/disable`).then(r => r.data),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'user', userId] })
    },
  })
}

export function useEnableUser() {
  const qc    = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) =>
      superAdminApi().post(`/superadmin/users/${userId}/enable`).then(r => r.data),
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'user', userId] })
    },
  })
}
