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
    default: 'Shiftly — Le logiciel de management pour parcs de loisirs',
    template: '%s · Shiftly',
  },
  description:
    "Bowling, laser game, arcade, karaoké, VR. Shiftly fait gagner 6h par semaine à vos managers — services, postes, pointages, HACCP. Conforme IDCC 1790.",
  openGraph: {
    title: 'Shiftly — Le logiciel de management pour parcs de loisirs',
    description:
      "Bowling, laser game, arcade, karaoké. 6h/semaine rendues à vos managers, pointage conforme IDCC 1790, HACCP intégré.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Shiftly',
    images: ['/og-shiftly.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shiftly — Management opérationnel pour parcs de loisirs',
    description: '6h/semaine rendues à vos managers. Conforme IDCC 1790. Sans engagement.',
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
