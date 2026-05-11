'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import { useMedias } from '@/hooks/useMedias'
import { useAuthStore } from '@/store/authStore'
import MediaThumb from './MediaThumb'
import MediaLightbox from './MediaLightbox'
import type { Media, MediaEntityType } from '@/types/media'

interface Props {
  entityType: MediaEntityType
  entityId:   number | null
}

/**
 * Grille responsive des médias d'une entité parente.
 * 2 colonnes mobile → 3 tablette → 4 desktop.
 * 3 états : loading | error | empty.
 */
export default function MediaGallery({ entityType, entityId }: Props) {
  const { data: medias, isLoading, isError } = useMedias(entityType, entityId)
  const role = useAuthStore(s => s.user?.role)
  const canDelete = role === 'MANAGER'

  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  if (!entityId) return null

  if (isLoading) {
    return <p className="text-sm text-[var(--muted)]">Chargement…</p>
  }

  if (isError) {
    return <p className="text-sm text-[var(--red)]">Impossible de charger les médias.</p>
  }

  if (!medias || medias.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Aucun média pour le moment.</p>
  }

  return (
    <>
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-2"
      >
        {medias.map((m) => (
          <motion.div key={m.id} variants={listItemVariants}>
            <MediaThumb
              media={m}
              entityType={entityType}
              entityId={entityId}
              canDelete={canDelete}
              onClick={() => m.mimeType.startsWith('image/') && setOpenMedia(m)}
            />
          </motion.div>
        ))}
      </motion.div>

      {openMedia && (
        <MediaLightbox media={openMedia} onClose={() => setOpenMedia(null)} />
      )}
    </>
  )
}
