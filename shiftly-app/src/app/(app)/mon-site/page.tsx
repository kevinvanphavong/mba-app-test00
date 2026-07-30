'use client'

import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import { usePrestations } from '@/features/monsite/useMonSite'
import PrestationEditor from '@/components/monsite/PrestationEditor'
import PrestationCreate from '@/components/monsite/PrestationCreate'

/**
 * Cockpit gérant — Mon site. Catalogue des prestations réservables (CRUD, isolé par
 * centre côté API). Le rendu du site client vit désormais dans un repo externe qui
 * consomme l'API publique : Shiftly n'édite plus de contenu éditorial ici.
 * React Query, 3 états.
 */
export default function MonSitePage() {
  const { data, isLoading, isError, refetch } = usePrestations()

  return (
    <>
      <Topbar title="Mon site" subtitle="Prestations réservables de votre site public" />
      <PageContainer>
        {isLoading && <p className="text-sm text-muted">Chargement…</p>}

        {isError && (
          <div className="text-sm">
            <p className="text-red">Erreur de chargement.</p>
            <button
              onClick={() => void refetch()}
              className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent"
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="flex max-w-2xl flex-col gap-3 rounded-card border border-border bg-surface p-4">
            <h2 className="font-syne text-lg font-bold text-text">Prestations</h2>

            {data.length === 0 ? (
              <p className="text-sm text-muted">
                Aucune prestation pour le moment — ajoutez-en une pour la rendre réservable.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.map((p) => (
                  <PrestationEditor key={`${p.id}-${p.nom}-${p.prixCents}-${p.actif}`} prestation={p} />
                ))}
              </div>
            )}

            <PrestationCreate ordreSuivant={data.length + 1} />
          </div>
        )}
      </PageContainer>
    </>
  )
}
