'use client'

import { useState } from 'react'
import { StaffFormCard } from '@/components/staff/StaffFormCard'
import { useSuggestContratsFromDocs, useCreateContrat, type ContratSuggestion } from '@/hooks/useContrat'
import { fmtFRDate } from './registreMeta'

interface Props {
  employeId: number
}

/**
 * Génération IA de l'historique des contrats à partir des documents uploadés (R2).
 * L'IA propose, le manager valide : chaque proposition est ajoutée explicitement.
 */
export default function ContratAiSuggest({ employeId }: Props) {
  const suggest = useSuggestContratsFromDocs(employeId)
  const createContrat = useCreateContrat(employeId)
  const [propositions, setPropositions] = useState<ContratSuggestion[]>([])

  const run = () => {
    suggest.mutate(undefined, { onSuccess: (d) => setPropositions(d.contrats) })
  }

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
    <StaffFormCard ico="🤖" title="Générer l'historique depuis les documents (IA)">
      <p className="text-[11.5px] text-muted">
        L&apos;IA lit les documents uploadés ci-dessus et propose les contrats trouvés. Tu valides chaque ajout.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={suggest.isPending}
        className="self-start rounded-[8px] bg-accent px-3.5 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        {suggest.isPending ? 'Analyse en cours…' : '✨ Générer depuis les documents'}
      </button>

      {errMsg && <p className="text-[12px] text-red">{errMsg}</p>}

      {suggest.isSuccess && propositions.length === 0 && (
        <p className="text-[12px] text-muted">Aucun contrat détecté dans les documents.</p>
      )}

      {propositions.map((c, i) => (
        <div key={i} className="flex items-center gap-2 rounded-[8px] border border-dashed border-accent/40 bg-accent/5 px-2.5 py-2">
          <span className="rounded-[6px] border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
            {c.typeContrat}
          </span>
          <span className="flex-1 text-[12px] text-text">
            {fmtFRDate(c.dateDebut)} → {c.dateFin ? fmtFRDate(c.dateFin) : 'en cours'}
            {c.heuresHebdo != null && <span className="text-muted"> · {c.heuresHebdo}h</span>}
            {c.qualification && <span className="text-muted"> · {c.qualification}</span>}
          </span>
          <button
            type="button"
            onClick={() => add(c)}
            disabled={!c.dateDebut || createContrat.isPending}
            className="rounded-[6px] bg-green/15 px-2 py-1 text-[11px] font-bold text-green disabled:opacity-40"
          >
            + Ajouter
          </button>
        </div>
      ))}
    </StaffFormCard>
  )
}
