'use client'

import { motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import type { PointageStats } from '@/types/pointage'

interface Props {
  stats:      PointageStats
  onConfirm:  () => void
  onCancel:   () => void
  isLoading?: boolean
}

export default function PointageCloturerModal({ stats, onConfirm, onCancel, isLoading }: Props) {
  const ouverts = stats.presents + stats.enPause
  const prevus  = stats.prevus

  return (
    <motion.div
      variants={backdropVariants}
      initial="closed" animate="open" exit="exit"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
    >
      <motion.div
        variants={sheetVariants}
        initial="closed" animate="open" exit="exit"
        className="action-modal w-full max-w-sm p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
          {/* Icône + titre */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="action-modal-icon red flex items-center justify-center text-2xl">
              🔒
            </div>
            <div>
              <p className="font-bold text-base font-syne" style={{ color: 'var(--text)' }}>
                Clôturer le service ?
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                Cette action est irréversible.
              </p>
            </div>
          </div>

          {/* Résumé des impacts */}
          <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            {ouverts > 0 && (
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <span className="font-semibold" style={{ color: 'var(--green)' }}>{ouverts}</span> pointage{ouverts > 1 ? 's' : ''} ouvert{ouverts > 1 ? 's' : ''} → clôturé{ouverts > 1 ? 's' : ''}
              </p>
            )}
            {prevus > 0 && (
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <span className="font-semibold" style={{ color: 'var(--red)' }}>{prevus}</span> employé{prevus > 1 ? 's' : ''} non pointé{prevus > 1 ? 's' : ''} → absent{prevus > 1 ? 's' : ''}
              </p>
            )}
            {ouverts === 0 && prevus === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Tous les pointages sont déjà clôturés.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--red)', color: '#fff', opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? 'Clôture…' : 'Clôturer'}
            </button>
          </div>
      </motion.div>
    </motion.div>
  )
}
