import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Toast from '@/components/ui/Toast'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner />
      <div className="flex h-screen overflow-hidden bg-bg">
        {/* Sidebar desktop (≥ 900px) */}
        <Sidebar />

        {/* Colonne principale : Header + contenu scrollable */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header burger — visible < desktop uniquement */}
          <Header />

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Toast global */}
        <Toast />
      </div>
    </>
  )
}
