'use client'

import { usePublicSite } from '@/features/public/usePublicSite'
import SiteHero from '@/components/public/SiteHero'
import PrestationsList from '@/components/public/PrestationsList'
import { PublicLoading, PublicError } from '@/components/public/StateBlocks'

/**
 * Vitrine publique `/site` : hero du centre (résolu par host côté API) + ses
 * prestations. Données via React Query (jamais fetch/useEffect), 3 états gérés.
 */
export default function SitePage() {
  const { data, isLoading, isError, refetch } = usePublicSite()

  if (isLoading) return <PublicLoading label="Chargement du site…" />
  if (isError || !data) return <PublicError onRetry={() => void refetch()} />

  return (
    <div className="flex flex-col gap-10">
      <SiteHero centre={data.centre} heroTitre={data.heroTitre} heroSousTitre={data.heroSousTitre} description={data.description} />

      <section className="flex flex-col gap-4">
        <h2 className="font-syne text-2xl font-bold text-text">Nos prestations</h2>
        <PrestationsList prestations={data.prestations} />
      </section>
    </div>
  )
}
