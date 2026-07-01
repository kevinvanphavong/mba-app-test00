'use client'

import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { usePrestations, useSiteContenu } from '@/features/monsite/useMonSite'
import SiteTextes from '@/components/monsite/SiteTextes'
import PrestationEditor from '@/components/monsite/PrestationEditor'
import PrestationCreate from '@/components/monsite/PrestationCreate'
import SitePreview from '@/components/monsite/SitePreview'

/**
 * Cockpit gérant — Mon site. Édition des prestations (CRUD, isolé par centre côté API)
 * et des textes du site public + aperçu. React Query, 3 états. Contenu échappé (#5).
 */
export default function MonSitePage() {
  const contenu = useSiteContenu()
  const prestations = usePrestations()

  const isLoading = contenu.isLoading || prestations.isLoading
  const isError = contenu.isError || prestations.isError
  const pretes = contenu.data && prestations.data

  return (
    <>
      <Topbar title="Mon site" subtitle="Prestations & contenu de votre site public" />
      <PageContainer>
        {isLoading && <p className="text-sm text-muted">Chargement…</p>}
        {isError && (
          <div className="text-sm">
            <p className="text-red">Erreur de chargement.</p>
            <button onClick={() => { void contenu.refetch(); void prestations.refetch() }} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && pretes && (
          <div className="grid grid-cols-1 gap-5 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <SiteTextes key={`${contenu.data.siteHeroTitre}-${contenu.data.siteHeroSousTitre}-${contenu.data.siteDescription}`} contenu={contenu.data} />

              <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
                <h2 className="font-syne text-lg font-bold text-text">Prestations</h2>
                <div className="flex flex-col gap-2">
                  {prestations.data.map((p) => (
                    <PrestationEditor key={`${p.id}-${p.nom}-${p.prixCents}-${p.actif}`} prestation={p} />
                  ))}
                </div>
                <PrestationCreate ordreSuivant={prestations.data.length + 1} />
              </div>
            </div>

            <div className="desktop:sticky desktop:top-4 desktop:self-start">
              <SitePreview contenu={contenu.data} prestations={prestations.data} />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  )
}
