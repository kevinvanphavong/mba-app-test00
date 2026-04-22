'use client'

import { use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSuperAdminCentreDetail } from '@/hooks/useSuperAdminCentreDetail'
import CentreDetailHeader   from '@/components/superadmin/CentreDetailHeader'
import CentreDetailStats    from '@/components/superadmin/CentreDetailStats'
import CentreDetailUsers    from '@/components/superadmin/CentreDetailUsers'
import CentreDetailErrors   from '@/components/superadmin/CentreDetailErrors'
import CentreActionsPanel   from '@/components/superadmin/CentreActionsPanel'
import { fadeUpVariants as fadeUp } from '@/lib/animations'

interface Props {
  params: Promise<{ id: string }>
}

export default function SuperAdminCentreDetailPage({ params }: Props) {
  const { id } = use(params)
  const { data, isLoading, isError } = useSuperAdminCentreDetail(Number(id))

  if (isLoading) return <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement…</p>
  if (isError || !data) return <p style={{ color: 'var(--red)', fontSize: 14 }}>Centre introuvable</p>

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Link href="/superadmin/centres" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
        ← Retour aux centres
      </Link>

      <CentreDetailHeader centre={data} />
      <CentreDetailStats  centre={data} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CentreDetailUsers  users={data.users} />
          <CentreDetailErrors issues={data.sentryIssues} />
        </div>
        <CentreActionsPanel centre={data} />
      </div>
    </motion.div>
  )
}
