'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { ty } from '@/lib/typography'

interface Props {
  open:      boolean
  title:     string
  subtitle?: string
  onClose:   () => void
  footer:    React.ReactNode
  children:  React.ReactNode
}

/** Coquille modale HACCP — backdrop + bottom-sheet + handle + header + footer. */
export default function HaccpModalShell({ open, title, subtitle, onClose, footer, children }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 inset-x-0 z-[60] bg-surface rounded-t-[24px] shadow-2xl max-h-[92dvh] flex flex-col"
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-5 py-3 border-b border-border flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-syne font-extrabold text-[16px] truncate">{title}</h3>
                {subtitle && <p className={`${ty.metaSm} mt-0.5 truncate`}>{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-8 h-8 rounded-[8px] bg-surface2 text-text text-[18px] hover:bg-surface3 transition-colors"
              >×</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
            <div className="px-5 py-3 border-t border-border flex gap-2 flex-shrink-0">{footer}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
