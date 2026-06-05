'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ComparisonTable from '@/components/marketing/ComparisonTable'
import CtaFinal from '@/components/marketing/CtaFinal'
import FaqAccordion from '@/components/marketing/FaqAccordion'
import FounderStory from '@/components/marketing/FounderStory'
import HeroSection from '@/components/marketing/HeroSection'
import ModulesGrid from '@/components/marketing/ModulesGrid'
import PainPointsMarquee from '@/components/marketing/PainPointsMarquee'
import PricingSection from '@/components/marketing/PricingSection'
import ProcessSteps from '@/components/marketing/ProcessSteps'
import SansAvecSection from '@/components/marketing/SansAvecSection'

// Page racine `/` : landing publique auth-aware.
// - Au mount, on lit le JWT côté client → si présent, redirect vers /service
//   (la source de vérité de l'auth est localStorage, le cookie middleware peut
//   être absent en dev). Pendant ce check, splash neutre pour éviter le flash.
// - Sinon, on rend la landing complète.
export default function LandingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      router.replace('/service')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="mkt-splash" aria-hidden="true">
        <span className="mkt-splash-dot" />
      </div>
    )
  }

  return (
    <main>
      <HeroSection />
      <PainPointsMarquee />
      <SansAvecSection />
      <ProcessSteps />
      <ModulesGrid />
      <ComparisonTable />
      <PricingSection />
      <FounderStory />
      <FaqAccordion />
      <CtaFinal />
    </main>
  )
}
