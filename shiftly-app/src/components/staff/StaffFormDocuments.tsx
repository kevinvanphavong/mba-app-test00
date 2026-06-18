'use client'

/**
 * Carte « Documents » de la fiche employé (E2) — contrats signés, pièces
 * d'identité, etc. stockés sur R2 et listés par employé.
 *
 * Réutilise le module Media existant (MediaUploader + MediaGallery) avec le
 * type polymorphe 'employe_document'. Présentationnel : reçoit l'id employé.
 */

import { StaffFormCard } from './StaffFormCard'
import MediaUploader from '@/components/media/MediaUploader'
import MediaGallery from '@/components/media/MediaGallery'

interface Props {
  employeId: number
}

export default function StaffFormDocuments({ employeId }: Props) {
  return (
    <StaffFormCard ico="📎" title="Documents">
      <p className="text-[11.5px] text-muted">
        Contrats signés, pièces d&apos;identité, justificatifs… (images ou PDF).
      </p>
      <MediaUploader entityType="employe_document" entityId={employeId} />
      <MediaGallery entityType="employe_document" entityId={employeId} />
    </StaffFormCard>
  )
}
