'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import { useCompleteWithPhoto } from '@/hooks/useMissions'
import { useToastStore } from '@/store/toastStore'
import { compressImage } from '@/lib/imageCompress'
import { isAxiosError } from 'axios'
import type { ServiceMission } from '@/types/service'

interface Props {
  open:       boolean
  mission:    ServiceMission | null
  posteId:    number
  onClose:    () => void
  onSuccess?: () => void
}

/**
 * Bottom-sheet de capture photo pour valider une mission requiresPhoto.
 *
 * Flow :
 *   1. Tap "📷 Prendre la photo" → ouvre l'app caméra native (input capture).
 *   2. La photo s'affiche en preview (objectURL).
 *   3. "Valider" → compresse en JPEG ~150 KB → POST multipart → succès.
 *
 * Pas de getUserMedia, pas de stream live. Marche partout (iOS Safari,
 * Android Chrome, WebViews) sans permission JS particulière.
 */
export default function MissionPhotoCaptureModal({
  open, mission, posteId, onClose, onSuccess,
}: Props) {
  const inputRef       = useRef<HTMLInputElement>(null)
  const toast          = useToastStore(s => s.show)
  const completePhoto  = useCompleteWithPhoto()

  const [file,        setFile]        = useState<File | null>(null)
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Reset à chaque ouverture / fermeture pour ne pas réafficher l'ancienne photo
  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [open])

  // Cleanup du blob URL au démontage
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.type.startsWith('image/')) {
      toast('Format non supporté — choisis une photo (JPEG, PNG, WebP)', 'error')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleConfirm() {
    if (!mission || !file) return
    setIsUploading(true)

    try {
      // Compression côté client : 1280px max, JPEG q=0.85 → 100-300 KB typique
      const blob = await compressImage(file, 1280, 0.85)

      await completePhoto.mutateAsync({
        missionId: mission.id,
        posteId,
        photo: blob,
      })

      toast('Mission validée avec preuve photo', 'success')
      onSuccess?.()
      onClose()
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : null
      const detail = isAxiosError(err)
        ? (err.response?.data as { error?: string; detail?: string } | undefined)?.detail
          ?? (err.response?.data as { error?: string } | undefined)?.error
        : null

      if (status === 409) {
        toast('Cette mission est déjà cochée', 'error')
      } else if (status === 400 && detail) {
        toast(detail, 'error')
      } else {
        toast('Erreur lors de l\'envoi de la photo, réessaie', 'error')
      }
    } finally {
      setIsUploading(false)
    }
  }

  function handleRetake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    inputRef.current?.click()
  }

  return (
    <AnimatePresence>
      {open && mission && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
            onClick={isUploading ? undefined : onClose}
          />
          <motion.div
            variants={sheetVariants}
            initial="closed" animate="open" exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 pt-5"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]" />

            <h2 className="font-syne text-[16px] font-extrabold text-[var(--text)]">
              Preuve photo requise
            </h2>
            <p className="mt-1 mb-4 text-[12px] text-[var(--muted)] leading-snug">
              {mission.texte}
            </p>

            {/* Input caché — c'est lui qui ouvre la caméra native sur mobile */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* Preview ou bouton de capture */}
            {previewUrl ? (
              <div className="flex flex-col gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preuve"
                  className="w-full max-h-[60vh] object-contain rounded-[12px] border border-[var(--border)] bg-[var(--bg)]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={isUploading}
                    className="flex-1 py-3 rounded-[12px] border border-[var(--border)] text-[13px] font-semibold text-[var(--muted)] disabled:opacity-50"
                  >
                    Reprendre
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isUploading}
                    className="flex-[2] py-3 rounded-[12px] bg-[var(--accent)] text-white font-syne font-extrabold text-[13px] disabled:opacity-50"
                  >
                    {isUploading ? '… envoi en cours' : '✓ Valider la mission'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full py-6 rounded-[14px] border-2 border-dashed border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] flex flex-col items-center gap-2 hover:border-[var(--accent)] transition-colors"
                >
                  <span className="text-[28px]">📷</span>
                  <span className="text-[13px] font-semibold">Prendre la photo</span>
                  <span className="text-[10px] text-[var(--muted)] leading-snug px-4 text-center">
                    Sur mobile, ouvre directement l'appareil photo. Tu peux aussi choisir une photo de la galerie.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-[12px] border border-[var(--border)] text-[13px] font-semibold text-[var(--muted)]"
                >
                  Annuler
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
