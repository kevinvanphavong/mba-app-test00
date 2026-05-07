'use client'

import { useMediaUrl, useDeleteMedia } from '@/hooks/useMedias'
import { useToastStore } from '@/store/toastStore'
import type { Media, MediaEntityType } from '@/types/media'

interface Props {
  media:        Media
  entityType:   MediaEntityType
  entityId:     number
  canDelete?:   boolean
  onClick?:     () => void
}

/**
 * Vignette d'un média : image via URL signée, ou icône PDF avec lien.
 * Bouton suppression visible uniquement si canDelete=true (manager).
 */
export default function MediaThumb({
  media,
  entityType,
  entityId,
  canDelete = false,
  onClick,
}: Props) {
  const { data, isLoading, isError } = useMediaUrl(media.id)
  const deleteMedia = useDeleteMedia()
  const showToast   = useToastStore(s => s.show)

  const isImage = media.mimeType.startsWith('image/')

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Supprimer "${media.filename}" ?`)) return
    try {
      await deleteMedia.mutateAsync({ mediaId: media.id, entityType, entityId })
      showToast('Média supprimé', 'success')
    } catch {
      showToast('Échec suppression', 'error')
    }
  }

  return (
    <div
      className="relative group rounded-lg overflow-hidden bg-[var(--surface2)] border border-[var(--border)] aspect-square cursor-pointer"
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--muted)]">
          …
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--red)]">
          Erreur
        </div>
      )}

      {data && isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.url}
          alt={media.filename}
          className="w-full h-full object-cover"
        />
      )}

      {data && !isImage && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--text)] hover:bg-[var(--surface)]/50"
        >
          <span className="text-2xl">📄</span>
          <span className="text-[10px] truncate w-full px-1 text-center text-[var(--muted)]">
            {media.filename}
          </span>
        </a>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer le média"
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--red)] text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  )
}
