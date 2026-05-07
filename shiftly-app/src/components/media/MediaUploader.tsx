'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import { useUploadMedia } from '@/hooks/useMedias'
import { useToastStore } from '@/store/toastStore'
import type { MediaEntityType } from '@/types/media'

interface Props {
  entityType: MediaEntityType
  entityId:   number
  /** Mimes acceptés côté input (le serveur revérifie). */
  accept?:    string
  onUploaded?: () => void
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

/**
 * Drag&drop ou clic-pour-uploader, multi-fichier, mobile-first.
 * États : idle | uploading | error.
 */
export default function MediaUploader({
  entityType,
  entityId,
  accept     = DEFAULT_ACCEPT,
  onUploaded,
}: Props) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const upload   = useUploadMedia()
  const showToast = useToastStore(s => s.show)

  const triggerInput = () => inputRef.current?.click()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    let okCount = 0
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync({ file, entityType, entityId })
        okCount += 1
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Échec upload'
        showToast(message, 'error')
      }
    }

    if (okCount > 0) {
      showToast(`${okCount} fichier${okCount > 1 ? 's' : ''} uploadé${okCount > 1 ? 's' : ''}`, 'success')
      onUploaded?.()
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    void handleFiles(e.dataTransfer.files)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files)
    // Reset pour permettre de re-uploader le même fichier
    if (inputRef.current) inputRef.current.value = ''
  }

  const isUploading = upload.isPending
  const hasError    = upload.isError

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="show"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={triggerInput}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerInput() }}
      className={[
        'flex flex-col items-center justify-center gap-2',
        'rounded-xl border-2 border-dashed cursor-pointer transition-colors',
        'p-6 text-center select-none',
        dragOver
          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
          : 'border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)]/60',
      ].join(' ')}
      aria-label="Uploader un fichier"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={onChange}
        className="hidden"
      />

      {isUploading ? (
        <p className="text-sm text-[var(--text)]">Upload en cours…</p>
      ) : hasError ? (
        <p className="text-sm text-[var(--red)]">Échec upload — réessaye.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-[var(--text)]">
            Glisse un fichier ou clique
          </p>
          <p className="text-xs text-[var(--muted)]">
            JPEG · PNG · WebP · PDF — max 5 MB (images) / 20 MB (PDF)
          </p>
        </>
      )}
    </motion.div>
  )
}
