'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  useSuperAdminTicketDetail,
  useReplyTicket,
  useChangeTicketStatus,
  useChangeTicketPriority,
} from '@/hooks/useSuperAdminSupport'
import TicketStatusBadge  from '@/components/support/TicketStatusBadge'
import TicketPriorityBadge from '@/components/support/TicketPriorityBadge'
import TicketCategoryBadge from '@/components/support/TicketCategoryBadge'
import AttachmentList      from '@/components/support/AttachmentList'
import AttachmentUploader  from '@/components/support/AttachmentUploader'
import { useToastStore }   from '@/store/toastStore'
import type {
  SupportReply,
  SupportTicketDetail,
  TicketStatut,
  TicketPriorite,
} from '@/types/support'

interface Props {
  params: { id: string }
}

export default function SuperAdminTicketDetailPage({ params }: Props) {
  const ticketId = Number(params.id)
  const { data, isLoading, isError } = useSuperAdminTicketDetail(ticketId)

  if (isLoading) return <p className="text-muted text-sm">Chargement…</p>
  if (isError || !data) return <p className="text-red text-sm">Ticket introuvable</p>

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted mb-4">
        <Link href="/superadmin" className="hover:text-accent">SuperAdmin</Link>
        <span className="opacity-40">/</span>
        <Link href="/superadmin/support" className="hover:text-accent">Support</Link>
        <span className="opacity-40">/</span>
        <span className="text-text font-semibold truncate max-w-[400px]">{data.sujet}</span>
      </div>

      <Header ticket={data} />

      {/* Content grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <div>
          <Conversation ticket={data} />
          <ReplyForm ticketId={ticketId} />
        </div>
        <SidePanel ticket={data} />
      </div>
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ ticket }: { ticket: SupportTicketDetail }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-[22px] mb-[18px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <h1 className="font-syne font-extrabold text-[22px] mb-2">{ticket.sujet}</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <TicketStatusBadge statut={ticket.statut} />
            <TicketPriorityBadge priorite={ticket.priorite} />
            <TicketCategoryBadge categorie={ticket.categorie} />
            <span className="text-[11px] text-muted">
              · {ticket.centre?.nom} · ouvert {format(new Date(ticket.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation ─────────────────────────────────────────────────────────────

function Conversation({ ticket }: { ticket: SupportTicketDetail }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden mb-[18px]">
      {/* Message initial */}
      <Message
        auteurName={ticket.auteur.prenom ? `${ticket.auteur.prenom} ${ticket.auteur.nom}` : ticket.auteur.nom}
        auteurRole="Auteur"
        message={ticket.message}
        createdAt={ticket.createdAt}
        isOwn={false}
        interne={false}
        attachments={ticket.attachments}
      />

      {/* Réponses */}
      {ticket.replies.map(r => (
        <ReplyBubble key={r.id} reply={r} />
      ))}
    </div>
  )
}

function ReplyBubble({ reply }: { reply: SupportReply }) {
  const name = reply.auteur.prenom ? `${reply.auteur.prenom} ${reply.auteur.nom}` : reply.auteur.nom
  const isSuperAdmin = reply.auteur.role === 'SUPERADMIN'

  return (
    <Message
      auteurName={name}
      auteurRole={isSuperAdmin ? 'Support Shiftly' : 'Client'}
      message={reply.message}
      createdAt={reply.createdAt}
      isOwn={isSuperAdmin}
      interne={reply.interne}
      attachments={reply.attachments}
    />
  )
}

function Message({
  auteurName, auteurRole, message, createdAt, isOwn, interne, attachments,
}: {
  auteurName:  string
  auteurRole:  string
  message:     string
  createdAt:   string
  isOwn:       boolean
  interne:     boolean
  attachments: SupportTicketDetail['attachments']
}) {
  const bgClass = interne
    ? 'bg-yellow/5 border-l-4 border-yellow'
    : isOwn
      ? 'bg-accent/5 border-l-4 border-accent'
      : 'bg-surface2/50 border-l-4 border-border'

  return (
    <div className={`py-4 px-5 border-b border-border last:border-b-0 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-[13px]">{auteurName}</span>
        <span className="text-[11px] text-muted">· {auteurRole}</span>
        {interne && (
          <span className="inline-block bg-yellow/20 text-yellow px-2 py-0.5 rounded text-[10px] font-bold ml-auto">
            🔒 Note interne
          </span>
        )}
        <span className={`text-[11px] text-muted ${interne ? '' : 'ml-auto'}`}>
          {format(new Date(createdAt), "d MMM 'à' HH:mm", { locale: fr })}
        </span>
      </div>
      <div className="text-[13px] whitespace-pre-wrap">{message}</div>
      {attachments.length > 0 && <AttachmentList attachments={attachments} />}
    </div>
  )
}

// ─── Reply form ───────────────────────────────────────────────────────────────

function ReplyForm({ ticketId }: { ticketId: number }) {
  const [message, setMessage] = useState('')
  const [interne, setInterne] = useState(false)
  const [files,   setFiles]   = useState<File[]>([])
  const reply = useReplyTicket()
  const toast = useToastStore(s => s.show)

  const submit = () => {
    if (!message.trim()) return
    reply.mutate(
      { ticketId, message: message.trim(), interne, files },
      {
        onSuccess: () => {
          toast(interne ? 'Note interne ajoutée' : 'Réponse envoyée', 'success')
          setMessage('')
          setFiles([])
          setInterne(false)
        },
        onError: () => toast("Erreur lors de l'envoi", 'error'),
      }
    )
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] p-5">
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={interne}
            onChange={e => setInterne(e.target.checked)}
            className="accent-yellow"
          />
          <span className="text-[12px]">Note interne (invisible pour le client)</span>
        </label>
      </div>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={interne ? 'Note interne destinée à l\'équipe…' : 'Votre réponse au client…'}
        rows={5}
        className="w-full bg-surface2 border border-border text-text py-2.5 px-3 rounded-lg text-[13px] placeholder:text-muted resize-y focus:outline-none focus:border-accent"
      />

      <div className="flex items-center justify-between mt-3">
        <AttachmentUploader files={files} onChange={setFiles} disabled={reply.isPending} />
        <button
          onClick={submit}
          disabled={reply.isPending || !message.trim()}
          className={`px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-60 ${interne ? 'bg-yellow' : 'bg-gradient-to-br from-accent to-accent-light hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)]'}`}
        >
          {reply.isPending ? 'Envoi…' : interne ? 'Enregistrer la note' : 'Envoyer la réponse'}
        </button>
      </div>
    </div>
  )
}

// ─── Side panel (actions) ─────────────────────────────────────────────────────

function SidePanel({ ticket }: { ticket: SupportTicketDetail }) {
  const changeStatus   = useChangeTicketStatus()
  const changePriority = useChangeTicketPriority()

  const statuts:    TicketStatut[]   = ['OUVERT', 'EN_COURS', 'RESOLU', 'FERME']
  const priorites:  TicketPriorite[] = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE']

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="bg-surface border border-border rounded-[14px] p-5">
        <div className="font-syne font-bold text-[14px] mb-3">Gestion</div>

        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.8px] text-muted font-bold mb-1.5">Statut</div>
            <select
              value={ticket.statut}
              onChange={e => changeStatus.mutate({ ticketId: ticket.id, statut: e.target.value as TicketStatut })}
              className="w-full bg-surface2 border border-border text-text py-2 px-3 rounded-lg text-[13px]"
            >
              {statuts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.8px] text-muted font-bold mb-1.5">Priorité</div>
            <select
              value={ticket.priorite}
              onChange={e => changePriority.mutate({ ticketId: ticket.id, priorite: e.target.value as TicketPriorite })}
              className="w-full bg-surface2 border border-border text-text py-2 px-3 rounded-lg text-[13px]"
            >
              {priorites.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[14px] p-5">
        <div className="font-syne font-bold text-[14px] mb-3">Auteur</div>
        <InfoLine label="Nom"    value={ticket.auteur.prenom ? `${ticket.auteur.prenom} ${ticket.auteur.nom}` : ticket.auteur.nom} />
        <InfoLine label="Email"  value={ticket.auteur.email ?? '—'} />
        <InfoLine label="Centre" value={ticket.centre?.nom ?? '—'} />
        <InfoLine label="Ouvert" value={`il y a ${formatDistanceToNow(new Date(ticket.createdAt), { locale: fr })}`} />
        <InfoLine label="Réponses" value={String(ticket.replies.length)} />
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-[12px] border-b border-border/50 last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}
