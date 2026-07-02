'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/lib/superAdminApi'

/** Un événement du journal (source AuditLog ou EventLog, présenté à l'identique). */
export interface ActivityItem {
  source:    'audit' | 'event'
  date:      string
  acteur:    string
  centreId:  number | null
  centreNom: string | null
  type:      string
  resume:    string
}

export interface ActivityFeed {
  items:   ActivityItem[]
  total:   number
  page:    number
  perPage: number
  types:   string[]
}

export interface ActivityFilters {
  centre: number | null
  from:   string
  to:     string
  type:   string
  page:   number
}

const PER_PAGE = 20

/** Journal d'activité agrégé (super-admin, lecture seule). */
export function useActivity(filters: ActivityFilters) {
  return useQuery<ActivityFeed, Error>({
    queryKey: ['superadmin', 'activity', filters],
    queryFn: () =>
      superAdminApi()
        .get<ActivityFeed>('/superadmin/activity', {
          params: {
            centre: filters.centre ?? undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            type: filters.type || undefined,
            page: filters.page,
            perPage: PER_PAGE,
          },
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
