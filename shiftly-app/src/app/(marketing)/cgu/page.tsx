import type { Metadata } from 'next'
import LegalPlaceholder from '@/components/marketing/LegalPlaceholder'

export const metadata: Metadata = {
  title: 'CGU & CGV',
  description: 'Conditions générales d\'utilisation et de vente de Shiftly.',
}

export default function CguPage() {
  return (
    <LegalPlaceholder
      title="Conditions générales d'utilisation & de vente"
      body="Le contenu détaillé des CGU et CGV sera publié ici par Kévin avant le lancement commercial. En attendant, contactez hello@shiftly.fr pour toute question contractuelle."
    />
  )
}
