import type { Metadata } from 'next'
import LegalPlaceholder from '@/components/marketing/LegalPlaceholder'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Shiftly traite vos données personnelles, conforme RGPD.',
}

export default function ConfidentialitePage() {
  return (
    <LegalPlaceholder
      title="Politique de confidentialité"
      body="La politique RGPD complète sera publiée ici par Kévin avant le lancement. Vos données restent hébergées en France (Railway Frankfurt UE), conservées 24 mois et jamais revendues. Pour toute demande d'accès / rectification / suppression : hello@shiftly.fr."
    />
  )
}
