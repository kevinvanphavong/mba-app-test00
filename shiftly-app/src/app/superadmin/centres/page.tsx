'use client'

import { motion } from 'framer-motion'
import CentresTable from '@/components/superadmin/CentresTable'
import { fadeUpVariants as fadeUp } from '@/lib/animations'

export default function SuperAdminCentresPage() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Centres
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Liste de tous les centres clients</p>
      </div>

      <CentresTable />
    </motion.div>
  )
}
