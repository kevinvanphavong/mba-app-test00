import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import Toast from '@/components/ui/Toast'
import ImpersonationBanner from '@/components/superadmin/ImpersonationBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner />
      <div className="flex h-screen overflow-hidden bg-bg">
        {/* Desktop/iPad sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Toast global */}
        <Toast />
      </div>
    </>
  )
}
