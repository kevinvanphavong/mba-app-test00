'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants } from '@/lib/animations'
import AuthImage from './AuthImage'

interface Props {
  /** Ouvert si non null. Ex: '/completions/42/photo'. */
  src:     string | null
  onClose: () => void
}

/**
 * Overlay plein écran qui affiche une image protégée par JWT en taille
 * réelle. Tap fond / bouton × / Escape → fermeture. L'image elle-même
 * passe par AuthImage (axios + objectURL) pour porter le token.
 */
export default function PhotoLightbox({ src, onClose }: Props) {
  // Escape pour fermer
  useEffect(() => {
    if (!src) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, onClose])

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          variants={backdropVariants}
          initial="closed" animate="open" exit="exit"
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Bouton de fermeture */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-[20px] leading-none flex items-center justify-center"
            aria-label="Fermer"
          >
            ×
          </button>

          {/* Conteneur image — clic dessus ne ferme pas */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthImage
              src={src}
              alt="Preuve photo"
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-[8px]"
              fallback={
                <div className="w-[200px] h-[200px] flex items-center justify-center text-white/60 text-[12px]">
                  Chargement…
                </div>
              }
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
