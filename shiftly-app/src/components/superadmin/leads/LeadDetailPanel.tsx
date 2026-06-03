'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUpdateLeadNotes, useUpdateLeadStatus } from '@/hooks/useLeads'
import type { LeadDetail, LeadStatus } from '@/types/lead'
import { ACTIVITY_LABEL, INTENT_META, PLAN_META, STATUS_META, STATUS_ORDER } from './leadMeta'
import LeadStatusBadge from './LeadStatusBadge'
import LeadActionsRow from './LeadActionsRow'

interface Props {
  lead: LeadDetail
}

export default function LeadDetailPanel({ lead }: Props) {
  const updateStatus = useUpdateLeadStatus()
  const updateNotes  = useUpdateLeadNotes()
  const [notes, setNotes] = useState<string>(lead.notes ?? '')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => { setNotes(lead.notes ?? '') }, [lead.id, lead.notes])

  const handleStatus = (status: LeadStatus) => {
    if (status === lead.status) return
    updateStatus.mutate({ id: lead.id, status })
  }

  const handleSaveNotes = () => {
    updateNotes.mutate(
      { id: lead.id, notes },
      {
        onSuccess: () => {
          setSavedFlash(true)
          setTimeout(() => setSavedFlash(false), 1800)
        },
      },
    )
  }

  const intent = INTENT_META[lead.intent]
  const plan   = PLAN_META[lead.plan]

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] text-muted uppercase tracking-[1px]">Lead #{lead.id}</span>
              <LeadStatusBadge status={lead.status} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.5px] ${plan.badgeClass}`}>
                {plan.label}
              </span>
            </div>
            <h1 className="font-syne font-extrabold text-[26px]">{lead.name || '—'}</h1>
            <div className="text-[13px] text-muted mt-1">
              <span>{intent.emoji} {intent.label}</span>
              <span className="mx-2">·</span>
              <span>{lead.centre || '—'}</span>
              <span className="mx-2">·</span>
              <span>{ACTIVITY_LABEL[lead.activity]}</span>
            </div>
          </div>
          <LeadActionsRow email={lead.email} phone={lead.phone} />
        </div>
      </div>

      {/* Actions workflow */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-[10px] text-muted uppercase tracking-[1px] font-bold mb-3">Workflow</div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s]
            const on   = lead.status === s
            return (
              <button
                key={s}
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => handleStatus(s)}
                className={[
                  'px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition',
                  on
                    ? `${meta.badgeClass} border-current`
                    : 'bg-surface2 text-muted border-border hover:text-text hover:border-accent/40',
                  updateStatus.isPending ? 'opacity-60 cursor-wait' : '',
                ].join(' ')}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
        {lead.handledBy && (
          <div className="text-[11px] text-muted mt-3">
            Pris en charge par {lead.handledBy.prenom ?? ''} {lead.handledBy.nom}
            {lead.handledAt && ` · ${format(new Date(lead.handledAt), 'd MMM yyyy à HH:mm', { locale: fr })}`}
          </div>
        )}
      </div>

      {/* Champs */}
      <div className="bg-surface border border-border rounded-xl p-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
        <Field label="Email"     value={lead.email} />
        <Field label="Téléphone" value={lead.phone || '—'} />
        <Field label="Activité"  value={ACTIVITY_LABEL[lead.activity]} />
        <Field label="Effectif"  value={lead.staffSize || '—'} />
        <Field label="Ville"     value={lead.city ? `${lead.zip ? lead.zip + ' ' : ''}${lead.city}` : '—'} />
        <Field label="Plan visé" value={plan.label} />
        {lead.preferredSlot && <Field label="Créneau préféré" value={lead.preferredSlot} />}
        {lead.channel        && <Field label="Canal démo"     value={lead.channel} />}
        {lead.customNeeds    && <Field label="Besoins sur-mesure" value={lead.customNeeds} fullWidth />}
        {lead.message        && <Field label="Message"        value={lead.message} fullWidth />}
        <Field label="Source"        value={lead.source} />
        <Field
          label="Consentement RGPD"
          value={lead.consent
            ? `Oui · ${lead.consentAt ? format(new Date(lead.consentAt), 'd MMM yyyy HH:mm', { locale: fr }) : ''}`
            : 'Non'}
        />
        <Field label="Reçu le" value={format(new Date(lead.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr })} />
      </div>

      {/* Notes internes */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-muted uppercase tracking-[1px] font-bold">Notes internes</div>
          {savedFlash && <span className="text-[11px] text-green">Enregistré ✓</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Notes commerciales, contexte d'appel, prochaines actions…"
          className="w-full bg-surface2 border border-border text-text p-3 rounded-lg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-y"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            disabled={updateNotes.isPending || notes === (lead.notes ?? '')}
            onClick={handleSaveNotes}
            className="px-4 py-2 rounded-lg bg-accent text-white text-[12px] font-semibold hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateNotes.isPending ? 'Sauvegarde…' : 'Enregistrer les notes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold mb-0.5">{label}</div>
      <div className="text-text whitespace-pre-wrap break-words">{value}</div>
    </div>
  )
}
