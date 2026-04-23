'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMyTickets } from '@/hooks/useSupport'
import TicketStatusBadge   from '@/components/support/TicketStatusBadge'
import TicketPriorityBadge from '@/components/support/TicketPriorityBadge'
import TicketCategoryBadge from '@/components/support/TicketCategoryBadge'

export default function MyTicketsPage() {
  const { data, isLoading } = useMyTickets()

  return (
    <div className="max-w-4xl mx-auto p-5 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-extrabold text-[26px]">Support</h1>
          <p className="text-[13px] text-muted mt-1">Vos demandes à l'équipe Shiftly</p>
        </div>
        <Link
          href="/reglages/support/nouveau"
          className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition inline-flex items-center gap-1.5"
        >
          + Nouvelle demande
        </Link>
      </div>

      {isLoading && <p className="text-muted text-[13px]">Chargement…</p>}

      {data && data.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <div className="text-[48px] mb-3">💬</div>
          <h2 className="font-syne font-bold text-[18px] mb-2">Aucune demande pour l'instant</h2>
          <p className="text-[13px] text-muted mb-4">
            Si vous rencontrez un problème ou avez une question, l'équipe Shiftly est là pour vous aider.
          </p>
          <Link
            href="/reglages/support/nouveau"
            className="inline-block px-4 py-2.5 rounded-[9px] text-[13px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white"
          >
            + Ouvrir une demande
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {data.map(t => (
            <Link
              key={t.id}
              href={`/reglages/support/${t.id}`}
              className="block py-4 px-5 hover:bg-accent/5 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {t.hasUnreadReply && (
                    <span className="w-[8px] h-[8px] rounded-full bg-accent inline-block flex-shrink-0" />
                  )}
                  <div className="font-semibold text-[14px] truncate">{t.sujet}</div>
                </div>
                <TicketStatusBadge statut={t.statut} />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted">
                <TicketCategoryBadge categorie={t.categorie} />
                <TicketPriorityBadge priorite={t.priorite} />
                <span>· ouvert il y a {formatDistanceToNow(new Date(t.createdAt), { locale: fr })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
