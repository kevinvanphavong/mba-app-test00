'use client'

import { useState } from 'react'
import { StaffFormCard } from '@/components/staff/StaffFormCard'
import {
  useContrats, useCreateContrat, useDeleteContrat,
  useSuggestContratsFromDocs, type ContratSuggestion,
} from '@/hooks/useContrat'
import { fmtFRDate } from './registreMeta'

interface Props {
  employeId: number
}

/**
 * Historique des contrats généré par l'IA à partir des documents uploadés (R2).
 * Affiche l'arborescence (timeline) des contrats persistés + un bouton qui fait
 * lire les documents par l'IA et propose les contrats trouvés (le manager valide).
 */
export default function ContratAiSuggest({ employeId }: Props) {
  const { data: contrats, isLoading } = useContrats(employeId)
  const suggest = useSuggestContratsFromDocs(employeId)
  const createContrat = useCreateContrat(employeId)
  const deleteContrat = useDeleteContrat(employeId)
  const [propositions, setPropositions] = useState<ContratSuggestion[]>([])

  const run = () => suggest.mutate(undefined, { onSuccess: (d) => setPropositions(d.contrats) })

  const add = (c: ContratSuggestion) => {
    if (!c.dateDebut) return
    createContrat.mutate(
      { typeContrat: c.typeContrat, dateDebut: c.dateDebut, dateFin: c.dateFin, qualification: c.qualification, heuresHebdo: c.heuresHebdo },
      { onSuccess: () => setPropositions((p) => p.filter((x) => x !== c)) },
    )
  }

  const errMsg = suggest.error
    ? (suggest.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Échec de la génération IA.'
    : null

  return (
    <StaffFormCard ico="📄" title="Historique des contrats">
      <button
        type="button"
        onClick={run}
        disabled={suggest.isPending}
        className="self-start rounded-[8px] bg-accent px-3.5 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        {suggest.isPending ? 'Analyse des documents…' : '✨ Générer depuis les documents'}
      </button>

      {errMsg && <p className="text-[12px] text-red">{errMsg}</p>}
      {suggest.isSuccess && propositions.length === 0 && (
        <p className="text-[12px] text-muted">Aucun nouveau contrat détecté dans les documents.</p>
      )}

      {/* Propositions IA à valider */}
      {propositions.map((c, i) => (
        <div key={`p${i}`} className="flex items-center gap-2 rounded-[8px] border border-dashed border-accent/40 bg-accent/5 px-2.5 py-2">
          <span className="rounded-[6px] border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">{c.typeContrat}</span>
          <span className="flex-1 text-[12px] text-text">
            {fmtFRDate(c.dateDebut)} → {c.dateFin ? fmtFRDate(c.dateFin) : 'en cours'}
            {c.heuresHebdo != null && <span className="text-muted"> · {c.heuresHebdo}h</span>}
            {c.qualification && <span className="text-muted"> · {c.qualification}</span>}
          </span>
          <button type="button" onClick={() => add(c)} disabled={!c.dateDebut || createContrat.isPending}
            className="rounded-[6px] bg-green/15 px-2 py-1 text-[11px] font-bold text-green disabled:opacity-40">+ Ajouter</button>
        </div>
      ))}

      {/* Arborescence / historique persisté */}
      <div className="mt-1 border-t border-border pt-2 flex flex-col gap-1.5">
        {isLoading && <p className="text-[12px] text-muted">Chargement…</p>}
        {contrats && contrats.length === 0 && (
          <p className="text-[12px] text-muted">Aucun contrat enregistré. Génère-les depuis les documents ci-dessus.</p>
        )}
        {contrats?.map((c) => (
          <div key={c.id} className="group flex items-center gap-2 rounded-[8px] border border-border bg-surface2 px-2.5 py-2">
            <span className="text-muted">{c.actif ? '▸' : '·'}</span>
            <span className={`rounded-[6px] px-2 py-0.5 text-[10px] font-bold border ${c.actif ? 'bg-green/15 text-green border-green/30' : 'bg-muted/15 text-muted border-muted/30'}`}>{c.typeContrat}</span>
            <span className="flex-1 text-[12px] text-text">
              {fmtFRDate(c.dateDebut)} → {c.actif ? 'en cours' : fmtFRDate(c.dateFin)}
              {c.heuresHebdo != null && <span className="text-muted"> · {c.heuresHebdo}h</span>}
            </span>
            <button type="button" onClick={() => deleteContrat.mutate(c.id)} aria-label="Supprimer le contrat"
              className="text-muted opacity-0 transition-opacity hover:text-red group-hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </StaffFormCard>
  )
}
