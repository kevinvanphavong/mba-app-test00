'use client'

import { useState } from 'react'
import { useResumeIa, useSetAbonnement, type KpiCentre } from '@/hooks/useConsoleAgence'
import GestionClientModal from '@/components/superadmin/console/GestionClientModal'

const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/**
 * Une ligne de KPI par centre. Lecture seule SAUF l'abonnement mensuel et les actions
 * de gestion (bouton « Gérer » : domaine, suspension, reset mdp, impersonation).
 */
export default function CentreRow({ centre }: { centre: KpiCentre }) {
  const [euroInput, setEuroInput] = useState((centre.abonnementMensuelCents / 100).toString())
  const [gestion, setGestion] = useState(false)
  const setAbo = useSetAbonnement()
  const resume = useResumeIa()

  const saveAbo = () => {
    const cents = Math.round(parseFloat(euroInput.replace(',', '.')) * 100)
    if (!Number.isNaN(cents) && cents >= 0) setAbo.mutate({ id: centre.id, cents })
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      {gestion && <GestionClientModal centre={centre} onClose={() => setGestion(false)} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-syne font-bold text-text">{centre.nom}</span>
          {!centre.actif && <span className="rounded-pill bg-red/15 px-2 py-0.5 text-[11px] font-medium text-red">Suspendu</span>}
          <button onClick={() => setGestion(true)} className="rounded-pill border border-border px-3 py-0.5 text-xs text-text-soft hover:border-accent hover:text-accent">
            Gérer
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={euroInput}
            onChange={(e) => setEuroInput(e.target.value)}
            onBlur={saveAbo}
            inputMode="decimal"
            className="w-24 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent"
            aria-label={`Abonnement mensuel de ${centre.nom} (€)`}
          />
          <span className="text-xs text-muted">€/mois</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm tablet:grid-cols-4">
        <Stat label="Réservations" value={String(centre.reservations)} />
        <Stat label="CA estimé" value={euros(centre.caEstimeCents)} />
        <Stat label="Relances no-show" value={String(centre.noShowRelances)} />
        <Stat label="Avis" value={centre.noteMoyenne !== null ? `${centre.avis} · ${centre.noteMoyenne}/5` : String(centre.avis)} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => resume.mutate(centre.id)}
          disabled={resume.isPending}
          className="self-start rounded-pill border border-border px-4 py-1.5 text-sm text-text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {resume.isPending ? 'Rédaction…' : '✨ Résumé IA du mois'}
        </button>
        {resume.isError && (
          <p className="text-sm text-red">Résumé indisponible (quota plateforme ou IA momentanément KO).</p>
        )}
        {resume.data && (
          <p className="rounded-card border border-accent/40 bg-accent/5 p-3 text-sm text-text-soft">{resume.data.resume}</p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-medium text-text">{value}</p>
    </div>
  )
}
