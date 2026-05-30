'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import { useCompletionHistory } from '@/hooks/useCompletionHistory'
import PeriodToggle from './PeriodToggle'
import KpiRow from './KpiRow'
import ZonesDonut from './ZonesDonut'
import MissionsForgotten from './MissionsForgotten'
import HistoryStaffRanking from './HistoryStaffRanking'
import RecentServicesList from './RecentServicesList'
import ServiceDrillDownModal from './ServiceDrillDownModal'
import { ty } from '@/lib/typography'
import type { HistoryPeriod } from '@/types/eventlog'

/** Bloc "Historique des services" — manager uniquement, sous le bloc Service du jour. */
export default function HistorySection() {
  const [period, setPeriod] = useState<HistoryPeriod>('30d')
  const [drillServiceId, setDrillServiceId] = useState<number | null>(null)

  const { data, isLoading, isError } = useCompletionHistory(period)

  // Taux moyen pondéré par nb actions (cohérent avec donut)
  const tauxMoyen = useMemo(() => {
    if (!data) return 0
    const total = data.totalChecks + data.totalUnchecks
    return total > 0 ? (data.totalChecks / total) * 100 : 0
  }, [data])

  return (
    <>
      <motion.section
        variants={fadeUpVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 mt-2"
        aria-label="Historique des services"
      >
        {/* Header */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-syne font-extrabold text-[20px] leading-tight">Historique des services</h2>
            <p className={`${ty.metaSm} mt-1`}>Qui a coché quoi, et quand.</p>
          </div>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>

        {/* Loading */}
        {isLoading && <SkeletonHistory />}

        {/* Error */}
        {isError && (
          <p className="text-red text-[13px]">Impossible de charger l&apos;historique.</p>
        )}

        {/* Empty global */}
        {data && data.totalChecks === 0 && data.totalUnchecks === 0 && !isLoading && (
          <div className="bg-surface border border-border rounded-[14px] py-10 px-6 text-center">
            <div className="text-[28px] mb-2">🕒</div>
            <p className={`${ty.metaLg}`}>Pas encore d&apos;historique sur cette période.</p>
            <p className={`${ty.metaSm} mt-1`}>Les coches et décoches apparaîtront ici dès le prochain service.</p>
          </div>
        )}

        {/* Contenu */}
        {data && (data.totalChecks > 0 || data.totalUnchecks > 0) && (
          <>
            <KpiRow
              totalChecks={data.totalChecks}
              totalUnchecks={data.totalUnchecks}
              tauxMoyen={tauxMoyen}
              servicesCount={data.servicesRecents.length}
            />

            <div className="grid grid-cols-1 desktop:grid-cols-3 gap-3">
              <Widget title="Taux par zone" icon="📍">
                <ZonesDonut rows={data.tauxCompletionParZone} tauxMoyen={tauxMoyen} />
              </Widget>
              <Widget title="Missions oubliées" icon="⚠️">
                <MissionsForgotten rows={data.missionsLesPlusOubliees} />
              </Widget>
              <Widget title="Ranking staff" icon="🏆">
                <HistoryStaffRanking rows={data.rankingStaff} />
              </Widget>
            </div>

            <Widget title="Services récents" icon="🕒" subtitle="Cliquer pour voir le détail">
              <RecentServicesList rows={data.servicesRecents} onSelect={setDrillServiceId} />
            </Widget>
          </>
        )}
      </motion.section>

      <ServiceDrillDownModal
        open={drillServiceId !== null}
        serviceId={drillServiceId}
        onClose={() => setDrillServiceId(null)}
      />
    </>
  )
}

function Widget({ title, icon, subtitle, children }: {
  title: string
  icon: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-[6px] bg-surface2 text-[12px]">
          {icon}
        </span>
        <h3 className="font-syne font-extrabold text-[14px]">{title}</h3>
        {subtitle && <span className={`${ty.metaSm} ml-2`}>{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function SkeletonHistory() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 desktop:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-[12px] bg-surface border border-border" />
        ))}
      </div>
      <div className="grid grid-cols-1 desktop:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-[260px] rounded-[14px] bg-surface border border-border" />
        ))}
      </div>
      <div className="h-[140px] rounded-[14px] bg-surface border border-border" />
    </div>
  )
}
