'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSuperAdminStore } from '@/store/superAdminStore'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import SuperAdminHeader from '@/components/superadmin/SuperAdminHeader'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const token    = useSuperAdminStore(s => s.token)
  const router   = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/superadmin/login'

  useEffect(() => {
    if (!token && !isLoginPage) router.replace('/superadmin/login')
  }, [token, isLoginPage, router])

  // Page login : pas de sidebar/header (plein écran)
  if (isLoginPage) return <>{children}</>

  if (!token) return null

  return (
    <>
      <ImpersonationBanner />
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
        <SuperAdminSidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SuperAdminHeader />
          <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
