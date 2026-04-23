'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMyTicketDetail, useReplyToMyTicket } from '@/hooks/useSupport'
import TicketStatusBadge   from '@/components/support/TicketStatusBadge'
import TicketPriorityBadge from '@/components/support/TicketPriorityBadge'
import TicketCategoryBadge from '@/components/support/TicketCategoryBadge'
import AttachmentList      from '@/components/support/AttachmentList'
import AttachmentUploader  from '@/components/support/AttachmentUploader'
import { useToastStore }   from '@/store/toastStore'

interface Props {
  params: { id: string }
}

export default function MyTicketDetailPage({ params }: Props) {
  const ticketId = Number(params.id)
  const { data, isLoading } = useMyTicketDetail(ticketId)

  const [message, setMessage] = useState('')
  const [files,   setFiles]   = useState<File[]>([])
  const reply = useReplyToMyTicket()
  const toast = useToastStore(s => s.show)

  if (isLoading) return <p className="text-muted text-sm p-6">Chargement…</p>
  if (!data)     return <p className="text-red text-sm p-6">Ticket introuvable</p>

  const submit = () => {
    if (!message.trim()) return
    reply.mutate({ ticketId, message: message.trim(), files }, {
      onSuccess: () => {
        toast('Message envoyé', 'success')
        setMessage('')
        setFiles([])
      },
      onError: () => toast("Erreur lors de l'envoi", 'error'),
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-5 lg:p-8">
      <Link href="/reglages/support" className="text-[12px] text-muted hover:text-accent">← Retour au support</Link>

      <div className="mt-3 mb-5">
        <h1 className="font-syne font-extrabold text-[22px] mb-2">{data.sujet}</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <TicketStatusBadge statut={data.statut} />
          <TicketPriorityBadge priorite={data.priorite} />
          <TicketCategoryBadge categorie={data.categorie} />
          <span className="text-[11px] text-muted">
            · ouvert {format(new Date(data.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
          </span>
        </div>
      </div>

      {/* Conversation */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-5">
        <div className="py-4 px-5 border-b border-border bg-surface2/50 border-l-4 border-l-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[13px]">Vous</span>
            <span className="text-[11px] text-muted ml-auto">
              {format(new Date(data.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
            </span>
          </div>
          <div className="text-[13px] whitespace-pre-wrap">{data.message}</div>
          <AttachmentList attachments={data.attachments} />
        </div>

        {data.replies.map(r => {
          const isSuperAdmin = r.auteur.role === 'SUPERADMIN'
          const name = isSuperAdmin
            ? 'Équipe Shiftly'
            : (r.auteur.prenom ? `${r.auteur.prenom} ${r.auteur.nom}` : r.auteur.nom)

          return (
            <div key={r.id} className={`py-4 px-5 border-b border-border last:border-b-0 ${isSuperAdmin ? 'bg-accent/5 border-l-4 border-l-accent' : 'bg-surface2/50 border-l-4 border-l-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-[13px]">{name}</span>
                <span className="text-[11px] text-muted ml-auto">
                  {format(new Date(r.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="text-[13px] whitespace-pre-wrap">{r.message}</div>
              <AttachmentList attachments={r.attachments} />
            </div>
          )
        })}
      </div>

      {/* Reply form (disabled if closed) */}
      {data.statut !== 'FERME' ? (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Ajouter un message</div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Votre réponse..."
            rows={4}
            className="w-full bg-surface2 border border-border text-text py-2.5 px-3 rounded-lg text-[13px] placeholder:text-muted resize-y focus:outline-none focus:border-accent"
          />
          <div className="flex items-center justify-between mt-3">
            <AttachmentUploader files={files} onChange={setFiles} disabled={reply.isPending} />
            <button
              onClick={submit}
              disabled={reply.isPending || !message.trim()}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white transition disabled:opacity-60 hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
            >
              {reply.isPending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-5 text-center text-muted text-[13px]">
          Ce ticket est fermé. Ouvrez-en un nouveau si vous avez besoin d'aide.
        </div>
      )}

      <p className="text-[11px] text-muted mt-4 text-center">
        Temps de réponse habituel : sous 24h en semaine
      </p>
    </div>
  )
}
