import type { Metadata } from 'next'
import { ty }                from '@/lib/typography'
import LogoutButton          from '@/components/auth/LogoutButton'
import ProfileCard           from '@/components/settings/ProfileCard'
import CentreSettingsSection from '@/components/settings/HorairesSummary'
import ManagerLinks          from '@/components/settings/ManagerLinks'

export const metadata: Metadata = { title: 'Réglages — Shiftly' }

export default function ReglagesPage() {
  return (
    <div className="mx-auto px-5 py-6">
      <div className="mb-5">
        <h1 className={`${ty.kpi} text-[20px]`}>Réglages</h1>
      </div>

      {/* Profile card */}
      <ProfileCard />

      {/* Notifications */}
      <div className="mb-4">
        <div className={`${ty.sectionLabel} px-1 mb-2`}>
          <p>Notifications</p>
        </div>
        <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border">
          {[
            { label: 'Incidents critiques', sub: 'Alertes push immédiates', toggle: true  },
            { label: 'Rappels ouverture',   sub: '30 min avant le service', toggle: true  },
            { label: 'Résumé quotidien',    sub: 'Email chaque soir',       toggle: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className={`${ty.bodyLg} font-medium`}>{item.label}</div>
                <div className={ty.meta}>{item.sub}</div>
              </div>
              <div className={`w-[44px] h-[24px] rounded-full relative flex-shrink-0 ${
                item.toggle ? 'bg-green' : 'bg-surface2 border border-border'
              }`}>
                <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${
                  item.toggle ? 'left-[23px]' : 'left-[3px]'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liens manager (éditeur contenu + éditeur staff) */}
      <ManagerLinks />

      {/* Centre — section dynamique (horaires calculés depuis la BDD) */}
      <CentreSettingsSection />

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
