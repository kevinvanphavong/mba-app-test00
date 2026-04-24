'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSuperAdminStore } from '@/store/superAdminStore'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const token    = useSuperAdminStore(s => s.token)
  const router   = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/superadmin/login'

  useEffect(() => {
    if (!token && !isLoginPage) router.replace('/superadmin/login')
  }, [token, isLoginPage, router])

  if (isLoginPage) return <>{children}</>
  if (!token) return null

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
