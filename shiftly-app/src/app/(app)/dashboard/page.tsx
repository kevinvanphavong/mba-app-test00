'use client'

import Topbar        from '@/components/layout/Topbar'
import HeroService   from '@/components/dashboard/HeroService'
import KPIGrid       from '@/components/dashboard/KPIGrid'
import IncidentsList from '@/components/dashboard/IncidentsList'
import StaffRanking  from '@/components/dashboard/StaffRanking'
import AlertsFeed    from '@/components/dashboard/AlertsFeed'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard()

  return (
    <div className="min-h-full animate-fadeUp">
      <Topbar />

      <div className="px-5 pb-8 lg:px-7 space-y-4">

        {/* ── États loading / erreur ── */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-[130px] bg-surface rounded-[18px] border border-border" />
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-20 bg-surface rounded-[14px] border border-border" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <p className="text-red text-[13px] px-1">Impossible de charger le dashboard.</p>
        )}

        {/* ── Données réelles ── */}
        {data && (
          <>
            <HeroService data={data.service} />

            <KPIGrid
              data={{
                service:   data.service,
                staff:     data.staff,
                incidents: data.incidents,
                tutoriels: data.tutoriels,
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <IncidentsList data={data.incidents} />
              <StaffRanking  topStaff={data.topStaff} />
              <AlertsFeed    alertes={data.incidents.alertes} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
