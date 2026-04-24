'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSuperAdminTickets, useSupportStats } from '@/hooks/useSuperAdminSupport'
import { useSuperAdminCentres } from '@/hooks/useSuperAdminCentres'
import TicketStatusBadge from '@/components/support/TicketStatusBadge'
import TicketPriorityBadge from '@/components/support/TicketPriorityBadge'
import TicketCategoryBadge from '@/components/support/TicketCategoryBadge'
import type { SupportTicketSummary } from '@/types/support'

export default function SuperAdminSupportPage() {
  const [search,    setSearch]    = useState('')
  const [statut,    setStatut]    = useState('')
  const [priorite,  setPriorite]  = useState('')
  const [categorie, setCategorie] = useState('')
  const [centre,    setCentre]    = useState('')

  const stats   = useSupportStats()
  const tickets = useSuperAdminTickets({ search, statut, priorite, categorie, centre })
  const centres = useSuperAdminCentres()

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-3.5">
        <div>
          <h1 className="font-syne font-extrabold text-[24px]">Support</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Tickets ouverts par les managers
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-5 max-[1100px]:grid-cols-2">
        <Stat label="Ouverts"              value={stats.data?.ouverts             ?? 0} color="text-blue"   />
        <Stat label="En cours"             value={stats.data?.enCours             ?? 0} color="text-yellow" />
        <Stat label="Urgents"              value={stats.data?.urgents             ?? 0} color="text-red"    />
        <Stat label="Résolus cette semaine" value={stats.data?.resolusCetteSemaine ?? 0} color="text-green"  />
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-3.5 px-4 mb-3.5 flex gap-3 items-center flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par sujet ou message..."
            className="w-full bg-surface2 border border-border text-text py-2 pl-9 pr-3.5 rounded-lg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <select value={statut} onChange={e => setStatut(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Tous statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_COURS">En cours</option>
          <option value="RESOLU">Résolu</option>
          <option value="FERME">Fermé</option>
        </select>

        <select value={priorite} onChange={e => setPriorite(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Toutes priorités</option>
          <option value="BASSE">Basse</option>
          <option value="MOYENNE">Moyenne</option>
          <option value="HAUTE">Haute</option>
          <option value="URGENTE">Urgente</option>
        </select>

        <select value={categorie} onChange={e => setCategorie(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Toutes catégories</option>
          <option value="bug">Bug</option>
          <option value="question">Question</option>
          <option value="feature_request">Suggestion</option>
          <option value="facturation">Facturation</option>
          <option value="autre">Autre</option>
        </select>

        <select value={centre} onChange={e => setCentre(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Tous centres</option>
          {(centres.data ?? []).map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {tickets.isLoading && <div className="p-8 text-center text-muted text-[13px]">Chargement…</div>}
        {tickets.isError   && <div className="p-8 text-center text-red text-[13px]">Erreur de chargement</div>}
        {!tickets.isLoading && tickets.data?.length === 0 && (
          <div className="p-8 text-center text-muted text-[13px]">Aucun ticket trouvé</div>
        )}
        {tickets.data && tickets.data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>Centre</Th>
                <Th>Catégorie</Th>
                <Th>Priorité</Th>
                <Th>Statut</Th>
                <Th>Dernière activité</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map(t => <TicketRow key={t.id} ticket={t} />)}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-3 px-3.5">
      <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold">{label}</div>
      <div className={`font-syne font-extrabold text-[20px] mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-3 px-4 bg-surface2 text-[10px] text-muted uppercase tracking-[1px] font-bold border-b border-border">
      {children}
    </th>
  )
}

function TicketRow({ ticket }: { ticket: SupportTicketSummary }) {
  return (
    <tr className="cursor-pointer border-b border-border/50 hover:bg-accent/5 transition">
      <td className="py-3 px-4">
        <Link href={`/superadmin/support/${ticket.id}`} className="block">
          <div className="flex items-center gap-2">
            {ticket.unread && <span className="w-[7px] h-[7px] rounded-full bg-accent inline-block flex-shrink-0" />}
            <div className="font-semibold">{ticket.sujet}</div>
          </div>
          <div className="text-[11px] text-muted mt-0.5 truncate max-w-[400px]">
            {ticket.auteur.prenom ? `${ticket.auteur.prenom} ${ticket.auteur.nom}` : ticket.auteur.nom} · {ticket.extrait}
          </div>
        </Link>
      </td>
      <td className="py-3 px-4 text-muted">{ticket.centre?.nom ?? '—'}</td>
      <td className="py-3 px-4"><TicketCategoryBadge categorie={ticket.categorie} /></td>
      <td className="py-3 px-4"><TicketPriorityBadge priorite={ticket.priorite} /></td>
      <td className="py-3 px-4"><TicketStatusBadge statut={ticket.statut} /></td>
      <td className="py-3 px-4 text-[12px] text-muted">
        il y a {formatDistanceToNow(new Date(ticket.lastActivity), { locale: fr })}
      </td>
    </tr>
  )
}
