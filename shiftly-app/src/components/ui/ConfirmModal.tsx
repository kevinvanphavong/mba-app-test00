'use client'

/**
 * ConfirmModal — Modale de confirmation générique du design system.
 * Remplace les `confirm()` natifs partout où une action manager est dangereuse.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'

type Variant = 'danger' | 'default'

interface Props {
  open:        boolean
  title:       string
  message:     string
  confirmLabel?: string
  cancelLabel?:  string
  onConfirm:   () => void
  onCancel:    () => void
  variant?:    Variant
  isLoading?:  boolean
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
}: Props) {
  const accent = variant === 'danger' ? 'var(--red)' : 'var(--accent)'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-black/60"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
            onClick={isLoading ? undefined : onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] tablet:inset-auto tablet:left-1/2 tablet:top-1/2 tablet:max-w-md tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:rounded-[20px]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            <div className="flex justify-center pb-1 pt-3 tablet:hidden">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>

            <div className="px-5 pb-4 pt-2">
              <h2
                id="confirm-modal-title"
                className="font-syne text-[16px] font-bold text-[var(--text)]"
              >
                {title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
                {message}
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 rounded-[14px] bg-[var(--surface2)] py-3 text-[14px] text-[var(--muted)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 rounded-[14px] py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: accent }}
                >
                  {isLoading ? '…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
