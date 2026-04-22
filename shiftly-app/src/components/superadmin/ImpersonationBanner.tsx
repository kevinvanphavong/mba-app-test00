'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSuperAdminStore } from '@/store/superAdminStore'

export default function ImpersonationBanner() {
  const isImpersonating    = useSuperAdminStore(s => s.isImpersonating)
  const impersonatedCentre = useSuperAdminStore(s => s.impersonatedCentre)
  const stopImpersonation  = useSuperAdminStore(s => s.stopImpersonation)

  return (
    <AnimatePresence>
      {isImpersonating && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--red)',
            color: '#fff',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>
            🔴 Vous êtes connecté au centre : {impersonatedCentre?.nom ?? '…'}
          </span>
          <button
            onClick={stopImpersonation}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Quitter
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
