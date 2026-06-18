'use client'

import { useState } from 'react'
import { StaffFormCard, StaffFormField, STAFF_FORM_INPUT } from '@/components/staff/StaffFormCard'
import { useContrats, useCreateContrat, useDeleteContrat } from '@/hooks/useContrat'
import { fmtFRDate } from './registreMeta'

const TYPES = ['CDI', 'CDD', 'EXTRA', 'ALTERNANCE', 'STAGE', 'INTERIM']

interface Props {
  employeId: number
}

/**
 * Carte « Historique des contrats » (E3) — liste les contrats successifs d'un
 * employé (actif = date_fin nulle) + ajout d'un contrat antérieur. 3 états.
 */
export default function StaffFormHistoriqueContrat({ employeId }: Props) {
  const { data: contrats, isLoading, isError } = useContrats(employeId)
  const createContrat = useCreateContrat(employeId)
  const deleteContrat = useDeleteContrat(employeId)

  const [type, setType] = useState('CDD')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')

  const add = () => {
    if (!debut) return
    createContrat.mutate(
      { typeContrat: type, dateDebut: debut, dateFin: fin || null },
      { onSuccess: () => { setDebut(''); setFin('') } },
    )
  }

  return (
    <StaffFormCard ico="📄" title="Historique des contrats">
      {isLoading && <p className="text-[12px] text-muted">Chargement…</p>}
      {isError && <p className="text-[12px] text-red">Erreur de chargement des contrats.</p>}
      {contrats && contrats.length === 0 && (
        <p className="text-[12px] text-muted">Aucun contrat enregistré.</p>
      )}

      {contrats?.map((c) => (
        <div key={c.id} className="group flex items-center gap-2 rounded-[8px] border border-border bg-surface2 px-2.5 py-2">
          <span className={`rounded-[6px] px-2 py-0.5 text-[10px] font-bold border ${c.actif ? 'bg-green/15 text-green border-green/30' : 'bg-muted/15 text-muted border-muted/30'}`}>
            {c.typeContrat}
          </span>
          <span className="flex-1 text-[12px] text-text">
            {fmtFRDate(c.dateDebut)} → {c.actif ? 'en cours' : fmtFRDate(c.dateFin)}
            {c.heuresHebdo != null && <span className="text-muted"> · {c.heuresHebdo}h</span>}
          </span>
          <button
            type="button"
            onClick={() => deleteContrat.mutate(c.id)}
            aria-label="Supprimer le contrat"
            className="text-muted opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
          >×</button>
        </div>
      ))}

      <div className="mt-1 grid grid-cols-[90px_1fr_1fr_auto] items-end gap-2">
        <StaffFormField label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className={STAFF_FORM_INPUT}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </StaffFormField>
        <StaffFormField label="Début">
          <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <StaffFormField label="Fin (si terminé)">
          <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className={STAFF_FORM_INPUT} />
        </StaffFormField>
        <button
          type="button"
          onClick={add}
          disabled={!debut || createContrat.isPending}
          className="h-[38px] rounded-[8px] bg-accent px-3 text-[12px] font-bold text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </StaffFormCard>
  )
}
