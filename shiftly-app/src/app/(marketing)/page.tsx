'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import api from '@/lib/api'
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
// - Au mount, on interroge /api/me (cookie httpOnly) via React Query : si la
//   session est valide → redirect vers /service. Le 401 sur `/` ne redirige pas
//   (cf. intercepteur api). Pendant le check, splash neutre pour éviter le flash.
// - Sinon, on rend la landing complète.
export default function LandingPage() {
  const router = useRouter()

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn:  () => api.get('/me').then(r => r.data),
    retry:    false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (me) router.replace('/service')
  }, [me, router])

  if (isLoading || me) {
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
