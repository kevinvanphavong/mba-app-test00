'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSuperAdminStore } from '@/store/superAdminStore'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // `mounted` : empêche le mismatch d'hydration sur les états dépendants de
  // localStorage (token via Zustand). Tant que mounted=false, on rend null à
  // l'identique côté serveur et côté client.
  const [mounted, setMounted] = useState(false)

  const token    = useSuperAdminStore(s => s.token)
  const router   = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/superadmin/login'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !token && !isLoginPage) router.replace('/superadmin/login')
  }, [mounted, token, isLoginPage, router])

  // Pré-hydration : rendre null à l'identique SSR/CSR pour éviter le mismatch
  if (!mounted) return null
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
