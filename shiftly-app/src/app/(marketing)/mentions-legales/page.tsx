import type { Metadata } from 'next'
import LegalPlaceholder from '@/components/marketing/LegalPlaceholder'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Informations légales sur l\'éditeur de Shiftly.',
}

export default function MentionsLegalesPage() {
  return (
    <LegalPlaceholder
      title="Mentions légales"
      body="Les mentions légales complètes (raison sociale, SIRET, hébergeur, directeur de publication) seront publiées ici par Kévin avant le lancement. Pour toute question : hello@shiftly.fr."
    />
  )
}
