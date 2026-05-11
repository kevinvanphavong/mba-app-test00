'use client'

import { useState } from 'react'
import { useMediaUrl } from '@/hooks/useMedias'
import MediaLightbox from '@/components/media/MediaLightbox'
import type { Media } from '@/types/media'

interface Props {
  mediaIds: number[]
}

/**
 * Médias inline d'un bloc tutoriel (étape, intro, tip).
 * Grid 2 cols mobile → 3 cols desktop. Image → ouverture lightbox.
 * PDF → lien vers nouvel onglet (URL signée).
 *
 * 3 états : loading silencieux (pas de spinner pour ne pas alourdir le rendu),
 * error → vignette neutre, empty → null.
 */
export default function TutoBlockMedia({ mediaIds }: Props) {
  const [openMedia, setOpenMedia] = useState<Media | null>(null)

  if (!mediaIds || mediaIds.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 tablet:grid-cols-3 gap-2 mt-2">
        {mediaIds.map((id) => (
          <BlockMediaTile key={id} mediaId={id} onOpenImage={setOpenMedia} />
        ))}
      </div>

      {openMedia && (
        <MediaLightbox media={openMedia} onClose={() => setOpenMedia(null)} />
      )}
    </>
  )
}

function isPdfUrl(signedUrl: string): boolean {
  try {
    return new URL(signedUrl).pathname.toLowerCase().endsWith('.pdf')
  } catch {
    return false
  }
}

// ─── Vignette d'un média ──────────────────────────────────────────────────────

interface TileProps {
  mediaId:     number
  onOpenImage: (media: Media) => void
}

function BlockMediaTile({ mediaId, onOpenImage }: TileProps) {
  const { data, isLoading, isError } = useMediaUrl(mediaId)

  if (isLoading || isError || !data) {
    return (
      <div className="aspect-square rounded-lg bg-surface2 border border-border" />
    )
  }

  // Note : useMediaUrl ne retourne pas le mime. On le déduit de l'extension de
  // la clé R2 (présente dans le pathname de l'URL signée, avant les query params).
  const isPdf = isPdfUrl(data.url)

  if (isPdf) {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="aspect-square rounded-lg border border-border bg-surface2 flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors"
      >
        <span className="text-2xl">📄</span>
        <span className="text-[10px] text-muted">PDF</span>
      </a>
    )
  }

  // Image — clic ouvre lightbox via un Media synthétique (on n'a pas le filename ici)
  const syntheticMedia: Media = {
    id:         mediaId,
    entityType: 'tutoriel',
    entityId:   0,
    filename:   '',
    mimeType:   'image/*',
    sizeBytes:  0,
    createdAt:  '',
  }

  return (
    <button
      type="button"
      onClick={() => onOpenImage(syntheticMedia)}
      className="aspect-square rounded-lg overflow-hidden border border-border bg-surface2 hover:border-accent transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.url}
        alt=""
        className="w-full h-full object-cover"
      />
    </button>
  )
}
