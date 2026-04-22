'use client'

import { motion } from 'framer-motion'
import { useSuperAdminDashboard } from '@/hooks/useSuperAdminDashboard'
import DashboardKpiCards    from '@/components/superadmin/DashboardKpiCards'
import MrrChart             from '@/components/superadmin/MrrChart'
import RecentActivityWidget from '@/components/superadmin/RecentActivityWidget'
import SentryHealthWidget   from '@/components/superadmin/SentryHealthWidget'
import { fadeUp } from '@/lib/animations'

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError } = useSuperAdminDashboard()

  if (isLoading) {
    return <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement du dashboard…</p>
  }

  if (isError || !data) {
    return <p style={{ color: 'var(--red)', fontSize: 14 }}>Erreur de chargement</p>
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Vue globale de la plateforme Shiftly</p>
      </div>

      <DashboardKpiCards data={data} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <MrrChart />
        <SentryHealthWidget stats={data.sentryStats} />
      </div>

      <RecentActivityWidget entries={data.recentActivity} />
    </motion.div>
  )
}
