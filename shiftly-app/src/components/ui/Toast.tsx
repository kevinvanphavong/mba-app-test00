'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '@/store/toastStore'

const TYPE_STYLES = {
  success: 'bg-green/10  border-green/30  text-green',
  error:   'bg-red/10    border-red/30    text-red',
  info:    'border-[rgba(249,115,22,0.25)] text-[var(--accent)]',
}

const TYPE_ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

const AUTO_DISMISS_MS = 3500

/** Toast global — monter une seule fois dans le layout */
export default function Toast() {
  const { message, type, visible, hide } = useToastStore()

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(hide, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [visible, hide])

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] border shadow-xl backdrop-blur-sm text-[13px] font-semibold max-w-[320px] ${TYPE_STYLES[type]}`}
          style={{ background: type === 'info' ? 'rgba(249,115,22,0.08)' : 'var(--surface)' }}
        >
          <span className="text-[15px] font-bold">{TYPE_ICONS[type]}</span>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
