'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { LeadSummary } from '@/types/lead'
import { INTENT_META, PLAN_META } from './leadMeta'
import LeadStatusBadge from './LeadStatusBadge'

interface Props {
  items:     LeadSummary[]
  isLoading: boolean
  isError:   boolean
}

export default function LeadsTable({ items, isLoading, isError }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {isLoading && <div className="p-8 text-center text-muted text-[13px]">Chargement…</div>}
      {isError   && <div className="p-8 text-center text-red text-[13px]">Erreur de chargement</div>}

      {!isLoading && !isError && (
        <>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <Th>Reçu</Th>
                <Th>Intent</Th>
                <Th>Plan</Th>
                <Th>Contact</Th>
                <Th>Centre</Th>
                <Th>Ville</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => <Row key={lead.id} lead={lead} />)}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-10 text-center text-muted text-[13px]">
              Aucun lead pour ces filtres.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-3 px-4 bg-surface2 text-[10px] uppercase tracking-[1px] font-bold border-b border-border text-muted">
      {children}
    </th>
  )
}

function Row({ lead }: { lead: LeadSummary }) {
  const intent = INTENT_META[lead.intent]
  const plan   = PLAN_META[lead.plan]
  const time   = formatDistanceToNow(new Date(lead.createdAt), { locale: fr, addSuffix: true })

  return (
    <tr className="hover:bg-accent/5 transition-colors">
      <td className="py-3.5 px-4 border-b border-border/50 text-[12px] text-muted">{time}</td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <span className="inline-flex items-center gap-1.5 text-[12px]">
          <span>{intent.emoji}</span>
          <span className="text-text">{intent.label}</span>
        </span>
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.5px] ${plan.badgeClass}`}>
          {plan.label}
        </span>
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <div className="font-semibold text-text">{lead.name || '—'}</div>
        <div className="text-[10px] text-muted">{lead.email}</div>
      </td>

      <td className="py-3.5 px-4 border-b border-border/50 text-text">{lead.centre || '—'}</td>

      <td className="py-3.5 px-4 border-b border-border/50 text-[12px] text-muted">
        {lead.city ? `${lead.zip ? lead.zip + ' ' : ''}${lead.city}` : '—'}
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <LeadStatusBadge status={lead.status} />
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <Link
          href={`/superadmin/leads/${lead.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface2 border border-border text-muted text-[11px] font-semibold hover:border-accent hover:text-accent transition"
        >
          Voir →
        </Link>
      </td>
    </tr>
  )
}
