'use client'

import { motion } from 'framer-motion'

/** États partagés des vues de données publiques (loading / error / empty). */

export function PublicLoading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <motion.span
        className="inline-block h-3 w-3 rounded-full bg-accent"
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <span className="font-sans text-sm">{label}</span>
    </div>
  )
}

export function PublicError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 text-center" role="alert">
      <p className="font-sans text-text">Ce site n’est pas disponible pour le moment.</p>
      <p className="mt-1 font-sans text-sm text-muted">
        Vérifie l’adresse, ou réessaie dans un instant.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-pill bg-accent px-5 py-2 font-sans text-sm font-semibold text-accent-on"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

export function PublicEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center">
      <p className="font-sans text-sm text-muted">{message}</p>
    </div>
  )
}
