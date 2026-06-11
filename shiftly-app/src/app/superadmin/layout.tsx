'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { superAdminApi } from '@/lib/superAdminApi'
import { useSuperAdminStore } from '@/store/superAdminStore'
import type { SuperAdminUser } from '@/types/superadmin'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const setUser  = useSuperAdminStore(s => s.setUser)
  const user     = useSuperAdminStore(s => s.user)
  const router   = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/superadmin/login'

  // Vérifie la session via le cookie httpOnly `sa_token` (plus de token en JS).
  const { isLoading, isError } = useQuery({
    queryKey: ['superadmin', 'me'],
    queryFn:  () => superAdminApi()
      .get<SuperAdminUser>('/superadmin/auth/me')
      .then(r => { setUser(r.data); return r.data }),
    enabled:  !isLoginPage,
    retry:    false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!isLoginPage && isError) router.replace('/superadmin/login')
  }, [isError, isLoginPage, router])

  if (isLoginPage) return <>{children}</>
  if (isLoading || !user) return null

  return (
    <>
      <ImpersonationBanner />
      <div className="min-h-screen bg-bg text-text font-sans flex">
        <SuperAdminSidebar />
        <main className="ml-60 flex-1 py-6 px-7 min-h-screen">
          {children}
        </main>
      </div>
    </>
  )
}
