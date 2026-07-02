'use client'

import { usePlans } from '@/hooks/useSuperAdminPlans'
import PlanRow from '@/components/superadmin/pricing/PlanRow'
import PlanCreate from '@/components/superadmin/pricing/PlanCreate'

/**
 * Plans tarifaires de l'agence (super-admin) : catalogue global de packs. Liste +
 * création + édition. React Query, 3 états. Accès borné ROLE_SUPERADMIN côté API.
 */
export default function PricingPage() {
  const { data, isLoading, isError, refetch } = usePlans()

  return (
    <>
      <div className="mb-5">
        <h1 className="font-syne text-2xl font-extrabold text-text">Plans tarifaires</h1>
        <p className="mt-0.5 text-[13px] text-muted">Catalogue de packs de l’agence · assignables à un centre depuis la console</p>
      </div>

      <PlanCreate />

      <div className="mt-5">
        {isLoading && <p className="text-sm text-muted">Chargement des plans…</p>}

        {isError && (
          <div className="text-sm">
            <p className="text-red">Erreur de chargement des plans.</p>
            <button onClick={() => void refetch()} className="mt-2 rounded-pill border border-border px-4 py-1.5 text-text-soft hover:border-accent">
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (data.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
            Aucun plan pour le moment. Crée le premier ci-dessus.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((p) => (
              <PlanRow key={p.id} plan={p} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
