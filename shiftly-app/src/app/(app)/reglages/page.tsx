import type { Metadata } from 'next'
import Link                 from 'next/link'
import dynamic              from 'next/dynamic'
import { ty }               from '@/lib/typography'
import LogoutButton         from '@/components/auth/LogoutButton'

// Ces composants lisent Zustand (localStorage) — désactivation SSR pour éviter le mismatch d'hydration
const ProfileCard          = dynamic(() => import('@/components/settings/ProfileCard'),          { ssr: false })
const ManagerLinks         = dynamic(() => import('@/components/settings/ManagerLinks'),         { ssr: false })
const CentreManagerSection = dynamic(() => import('@/components/settings/CentreManagerSection'), { ssr: false })

export const metadata: Metadata = { title: 'Réglages — Shiftly' }

export default function ReglagesPage() {
  return (
    <div className="mx-auto px-5 py-6">
      <div className="mb-5">
        <h1 className={`${ty.kpi} text-[20px]`}>Réglages</h1>
      </div>

      {/* Profile card */}
      <ProfileCard />

      {/* Support */}
      <div className="mb-4">
        <div className={`${ty.sectionLabel} px-1 mb-2`}>
          <p>Support</p>
        </div>
        <Link
          href="/reglages/support"
          className="block bg-surface border border-border rounded-[18px] overflow-hidden px-4 py-3.5 hover:border-accent transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-[20px] flex-shrink-0">🎧</div>
            <div className="flex-1">
              <div className="font-semibold text-[14px]">Besoin d'aide ?</div>
              <div className="text-[12px] text-muted">Ouvrir une demande auprès de l'équipe Shiftly</div>
            </div>
            <div className="text-muted">→</div>
          </div>
        </Link>
      </div>

      {/* Notifications — à venir */}
      <div className="mb-4">
        <div className={`${ty.sectionLabel} px-1 mb-2`}>
          <p>Notifications</p>
        </div>
        <div className="bg-surface border border-border rounded-[18px] overflow-hidden px-4 py-3">
          <p className={ty.meta}>Bientôt disponible</p>
        </div>
      </div>

      {/* Liens manager (éditeur contenu + éditeur staff) */}
      <ManagerLinks />

      {/* Centre + Informations du centre — manager uniquement */}
      <CentreManagerSection />

      {/* Danger zone */}
      <div>
        <div className={`${ty.sectionLabel} px-1 mb-2`}>
          Compte
        </div>
        <div className="bg-surface border border-red/20 rounded-[18px] overflow-hidden">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
