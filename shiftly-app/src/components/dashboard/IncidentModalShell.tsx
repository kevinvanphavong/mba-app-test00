'use client'

import { useEffect }                        from 'react'
import { motion, AnimatePresence }          from 'framer-motion'
import { sheetVariants, backdropVariants }  from '@/lib/animations'

interface IncidentModalShellProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  footer:   React.ReactNode
  maxH?:    string  // ex. 'max-h-[88dvh]' (défaut 92dvh)
}

/**
 * Enveloppe structurelle commune aux modals incident.
 * Gère : backdrop, bottom-sheet, handle, header (titre + ✕), body scrollable, footer.
 * Ferme sur Escape et clic backdrop.
 */
export default function IncidentModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  maxH = 'max-h-[92dvh]',
}: IncidentModalShellProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            className={`fixed bottom-16 desktop:bottom-0 inset-x-0 z-[60] bg-surface rounded-t-[24px] shadow-2xl ${maxH} flex flex-col`}
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <h2 className="font-syne font-extrabold text-[16px] text-text">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {children}
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-border flex-shrink-0">
              {footer}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
