'use client'

import { useState } from 'react'
import type { KpiCentre } from '@/hooks/useConsoleAgence'
import { useChangerDomaine, useResetPasswordGerant, useToggleActifCentre } from '@/hooks/useConsoleAgence'
import { useImpersonate } from '@/hooks/useSuperAdminCentres'

const conflit = (e: unknown): string =>
  (e as { response?: { status?: number } })?.response?.status === 409
    ? 'Ce domaine est déjà pris par un autre centre.'
    : 'Action impossible, réessaie.'

/**
 * Gestion d'un client (super-admin) : domaine, suspension (coupe l'accès), reset du
 * mot de passe gérant, « se connecter en tant que ». Actions sensibles confirmées.
 */
export default function GestionClientModal({ centre, onClose }: { centre: KpiCentre; onClose: () => void }) {
  const [domaine, setDomaine] = useState('')
  const [pw, setPw] = useState('')
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const changer = useChangerDomaine()
  const reset = useResetPasswordGerant()
  const toggle = useToggleActifCentre()
  const impersonate = useImpersonate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-syne text-lg font-bold text-text">Gérer · {centre.nom}</h2>

        <div className="flex flex-col gap-5 text-sm">
          {/* Domaine */}
          <section className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted">Domaine</span>
            <div className="flex gap-2">
              <input value={domaine} onChange={(e) => setDomaine(e.target.value)} placeholder="vr-galaxie-nantes.fr" className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-3 py-2 text-text outline-none focus:border-accent" />
              <button onClick={() => changer.mutate({ id: centre.id, domaine: domaine.trim() })} disabled={changer.isPending || domaine.trim() === ''} className="rounded-pill bg-accent px-4 py-2 font-semibold text-accent-on disabled:opacity-40">
                Changer
              </button>
            </div>
            {changer.isError && <p className="text-red">{conflit(changer.error)}</p>}
            {changer.isSuccess && <p className="text-green">Domaine mis à jour.</p>}
          </section>

          {/* Suspension (confirmée) */}
          <section className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted">Accès du client</span>
            {centre.actif ? (
              !confirmSuspend ? (
                <button onClick={() => setConfirmSuspend(true)} className="self-start rounded-pill border border-red/50 px-4 py-1.5 text-red hover:bg-red/10">
                  Suspendre l’accès
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-text-soft">Confirmer ? Le site public et le cockpit seront coupés.</span>
                  <button onClick={() => toggle.mutate({ id: centre.id, actif: false }, { onSuccess: () => setConfirmSuspend(false) })} className="rounded-pill bg-red px-3 py-1 font-semibold text-white">Oui</button>
                  <button onClick={() => setConfirmSuspend(false)} className="rounded-pill border border-border px-3 py-1 text-text-soft">Non</button>
                </div>
              )
            ) : (
              <button onClick={() => toggle.mutate({ id: centre.id, actif: true })} className="self-start rounded-pill border border-green/50 px-4 py-1.5 text-green hover:bg-green/10">
                Réactiver l’accès
              </button>
            )}
          </section>

          {/* Reset mot de passe gérant */}
          <section className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted">Mot de passe gérant</span>
            <div className="flex gap-2">
              <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nouveau (8 car. min.)" className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-3 py-2 text-text outline-none focus:border-accent" />
              <button onClick={() => reset.mutate({ id: centre.id, motDePasse: pw })} disabled={reset.isPending || pw.length < 8} className="rounded-pill bg-accent px-4 py-2 font-semibold text-accent-on disabled:opacity-40">
                Réinitialiser
              </button>
            </div>
            {reset.isSuccess && <p className="text-green">Réinitialisé pour {reset.data.managerEmail}. Communique « {pw} » hors-bande (non stocké en clair).</p>}
            {reset.isError && <p className="text-red">Reset impossible (aucun gérant actif ?).</p>}
          </section>

          <button onClick={() => impersonate.mutate(centre.id)} disabled={impersonate.isPending || !centre.actif} className="rounded-pill border border-border px-4 py-2 text-text-soft hover:border-accent disabled:opacity-40">
            🔓 Se connecter en tant que ce gérant
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-pill border border-border px-4 py-2 text-sm text-text-soft hover:border-accent">Fermer</button>
        </div>
      </div>
    </div>
  )
}
