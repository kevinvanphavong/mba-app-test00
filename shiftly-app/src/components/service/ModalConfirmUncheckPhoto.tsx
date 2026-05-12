'use client'

/**
 * ModalConfirmUncheckPhoto — Confirmation avant décochage d'une mission requiresPhoto.
 * Affiche la miniature de la preuve + le texte de la mission pour éviter qu'un tap
 * accidentel supprime la photo.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import AuthImage from '@/components/shared/AuthImage'
import type { ServiceMission } from '@/types/service'

interface Props {
  open:        boolean
  mission:     ServiceMission | null
  onConfirm:   () => void
  onCancel:    () => void
  isLoading?:  boolean
}

export default function ModalConfirmUncheckPhoto({
  open, mission, onConfirm, onCancel, isLoading = false,
}: Props) {
  return (
    <AnimatePresence>
      {open && mission && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center tablet:items-center tablet:p-4"
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
            onClick={isLoading ? undefined : onCancel}
          />
          {/* Centrage via flex parent → pas de translate-x/-y → pas de conflit avec
              le transform inline injecté par Framer Motion (sheetVariants). */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="uncheck-photo-title"
            className="relative z-[60] w-full rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] tablet:w-auto tablet:max-w-md tablet:rounded-[20px] tablet:border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
          >
            <div className="flex justify-center pb-1 pt-3 tablet:hidden">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>

            <div className="p-5">
              <h2 id="uncheck-photo-title" className="font-syne text-[16px] font-bold text-[var(--text)]">
                Décocher la mission&nbsp;?
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
                La preuve photo sera supprimée et la mission devra être recochée.
              </p>

              <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface2)] p-3">
                {mission.completionId !== null && mission.hasPhoto && (
                  <div className="w-[120px] h-[120px] rounded-[10px] overflow-hidden border border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
                    <AuthImage
                      src={`/completions/${mission.completionId}/photo`}
                      alt="Preuve actuelle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-[13px] leading-snug text-[var(--text)] flex-1 min-w-0">
                  {mission.texte}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 rounded-[14px] bg-[var(--surface2)] py-3 text-[14px] text-[var(--muted)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 rounded-[14px] py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--red)' }}
                >
                  {isLoading ? '…' : 'Décocher la mission'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
