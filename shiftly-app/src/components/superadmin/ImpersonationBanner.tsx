'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuperAdminStore } from '@/store/superAdminStore'

export default function ImpersonationBanner() {
  const isImpersonating    = useSuperAdminStore(s => s.isImpersonating)
  const impersonatedCentre = useSuperAdminStore(s => s.impersonatedCentre)
  const stopImpersonation  = useSuperAdminStore(s => s.stopImpersonation)
  const router             = useRouter()

  const handleQuit = () => {
    stopImpersonation()
    router.push('/superadmin/centres')
  }

  return (
    <AnimatePresence>
      {isImpersonating && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red text-white py-2.5 px-5 flex items-center justify-between text-[13px] font-semibold"
        >
          <span>
            🔴 Vous êtes connecté au centre : {impersonatedCentre?.nom ?? '…'}
          </span>
          <button
            onClick={handleQuit}
            className="bg-white/20 border-none text-white px-3 py-1 rounded-md text-[12px] font-semibold cursor-pointer hover:bg-white/30 transition"
          >
            Quitter
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
