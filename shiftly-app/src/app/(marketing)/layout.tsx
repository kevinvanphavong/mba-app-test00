import type { Metadata } from 'next'
import LeadModal from '@/components/marketing/LeadModal'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import MarketingHeader from '@/components/marketing/MarketingHeader'
import './marketing.css'

// Layout du route group (marketing) — racine `/` + pages légales publiques.
// Force le thème sand localement sans toucher au <html data-theme>, ce qui
// laisse intact le thème utilisateur de l'app (gérée par /(app)/layout.tsx).
export const metadata: Metadata = {
  title: {
    default: 'Shiftly — Pilotage opérationnel pour parcs de loisirs et commerces',
    template: '%s · Shiftly',
  },
  description:
    "Pilotage opérationnel pour parcs de loisirs et commerces de proximité. Service du jour, planning, postes, pointage et validation hebdo, formation interne — 6h/semaine rendues à vos managers.",
  openGraph: {
    title: 'Shiftly — Pilotage opérationnel pour parcs de loisirs et commerces',
    description:
      "Service du jour, planning, postes, pointage, formation. 6h/semaine rendues à vos managers. Pensé pour la convention IDCC 1790.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Shiftly',
    images: ['/og-shiftly.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shiftly — Pilotage opérationnel pour loisirs et commerces',
    description: '6h/semaine rendues à vos managers. Règles IDCC 1790 paramétrables. Sans engagement.',
    images: ['/og-shiftly.png'],
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-root" data-theme="sand">
      <MarketingHeader />
      {children}
      <MarketingFooter />
      <LeadModal />
    </div>
  )
}
