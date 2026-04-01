'use client'

import { ty }              from '@/lib/typography'
import { useAuthStore }    from '@/store/authStore'
import CentreSettingsSection from './HorairesSummary'
import CentreInfoSection     from './CentreInfoSection'

/** Regroupe les sections Centre + Informations du centre — visible manager uniquement */
export default function CentreManagerSection() {
  const role = useAuthStore(s => s.user?.role)

  if (role !== 'MANAGER') return null

  return (
    <div className="mb-4">
      <div className={`${ty.sectionLabel} px-1 mb-2`}>
        Centre
      </div>
      <div className="space-y-3">
        <CentreSettingsSection />
        <CentreInfoSection />
      </div>
    </div>
  )
}
