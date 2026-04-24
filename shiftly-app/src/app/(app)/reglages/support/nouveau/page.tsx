'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateTicket } from '@/hooks/useSupport'
import { useToastStore } from '@/store/toastStore'
import AttachmentUploader from '@/components/support/AttachmentUploader'
import { CATEGORIE_OPTIONS } from '@/components/support/TicketCategoryBadge'

export default function NewTicketPage() {
  const [sujet,     setSujet]     = useState('')
  const [categorie, setCategorie] = useState('question')
  const [priorite,  setPriorite]  = useState('MOYENNE')
  const [message,   setMessage]   = useState('')
  const [files,     setFiles]     = useState<File[]>([])

  const router = useRouter()
  const toast  = useToastStore(s => s.show)
  const create = useCreateTicket()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sujet.trim() || !message.trim()) return

    create.mutate(
      { sujet: sujet.trim(), message: message.trim(), categorie, priorite, files },
      {
        onSuccess: () => {
          toast('Demande envoyée — notre équipe va vous répondre', 'success')
          router.push('/reglages/support')
        },
        onError: () => toast('Erreur lors de l\'envoi', 'error'),
      }
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-5 lg:p-8">
      <Link href="/reglages/support" className="text-[12px] text-muted hover:text-accent">← Retour au support</Link>

      <h1 className="font-syne font-extrabold text-[24px] mt-3 mb-6">Nouvelle demande</h1>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div>
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Sujet</label>
          <input
            type="text"
            value={sujet}
            onChange={e => setSujet(e.target.value)}
            required
            maxLength={200}
            placeholder="Résumez votre demande en une phrase"
            className="w-full bg-surface border border-border text-text py-2.5 px-3.5 rounded-xl text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Catégorie</label>
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value)}
              className="w-full bg-surface border border-border text-text py-2.5 px-3 rounded-xl text-[13px] cursor-pointer"
            >
              {CATEGORIE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Priorité</label>
            <select
              value={priorite}
              onChange={e => setPriorite(e.target.value)}
              className="w-full bg-surface border border-border text-text py-2.5 px-3 rounded-xl text-[13px] cursor-pointer"
            >
              <option value="BASSE">Basse — pas urgent</option>
              <option value="MOYENNE">Moyenne — standard</option>
              <option value="HAUTE">Haute — impact fort</option>
              <option value="URGENTE">Urgente — bloquant</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={8}
            placeholder="Décrivez votre problème, question ou suggestion avec le plus de détails possible..."
            className="w-full bg-surface border border-border text-text py-2.5 px-3.5 rounded-xl text-[13px] placeholder:text-muted resize-y focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1.5">Pièces jointes (optionnel)</label>
          <AttachmentUploader files={files} onChange={setFiles} disabled={create.isPending} />
          <p className="text-[10px] text-muted mt-1">Images ou PDF, 5 Mo max par fichier</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={create.isPending || !sujet.trim() || !message.trim()}
            className="flex-1 py-3 rounded-xl text-[14px] font-bold bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90 transition disabled:opacity-60"
          >
            {create.isPending ? 'Envoi…' : 'Envoyer la demande'}
          </button>
          <Link href="/reglages/support" className="px-5 py-3 rounded-xl text-[13px] font-semibold border border-border text-text hover:border-accent hover:text-accent transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
