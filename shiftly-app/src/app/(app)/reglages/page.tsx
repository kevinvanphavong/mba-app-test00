import type { Metadata } from 'next'
import { ty }                from '@/lib/typography'
import LogoutButton          from '@/components/auth/LogoutButton'
import ProfileCard           from '@/components/settings/ProfileCard'
import ManagerLinks           from '@/components/settings/ManagerLinks'
import CentreManagerSection  from '@/components/settings/CentreManagerSection'

export const metadata: Metadata = { title: 'Réglages — Shiftly' }

export default function ReglagesPage() {
  return (
    <div className="mx-auto px-5 py-6">
      <div className="mb-5">
        <h1 className={`${ty.kpi} text-[20px]`}>Réglages</h1>
      </div>

      {/* Profile card */}
      <ProfileCard />

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
          Danger
        </div>
        <div className="bg-surface border border-red/20 rounded-[18px] overflow-hidden">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
