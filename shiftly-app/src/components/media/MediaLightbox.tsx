'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, fadeUpVariants } from '@/lib/animations'
import { useMediaUrl } from '@/hooks/useMedias'
import type { Media } from '@/types/media'

interface Props {
  media:   Media
  onClose: () => void
}

/**
 * Lightbox plein écran pour visualiser une image en grand.
 * Fermeture : clic sur le backdrop ou touche Échap.
 */
export default function MediaLightbox({ media, onClose }: Props) {
  const { data, isLoading, isError } = useMediaUrl(media.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="closed"
        animate="open"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="show"
          onClick={(e) => e.stopPropagation()}
          className="max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
        >
          {isLoading && <p className="text-sm text-white">Chargement…</p>}
          {isError   && <p className="text-sm text-[var(--red)]">Erreur de chargement.</p>}
          {data && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.url}
              alt={media.filename}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          )}
          <p className="mt-2 text-xs text-white/60 truncate w-full text-center">
            {media.filename}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
