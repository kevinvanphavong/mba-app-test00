'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { CentreDetail } from '@/types/superadmin'
import {
  useImpersonate,
  useSuspendCentre,
  useReactivateCentre,
  useAddCentreNote,
} from '@/hooks/useSuperAdminCentres'

interface Props {
  centre: CentreDetail
}

export default function CentreActionsPanel({ centre }: Props) {
  const [note, setNote]       = useState('')
  const [showNote, setShowNote] = useState(false)

  const impersonate  = useImpersonate()
  const suspend      = useSuspendCentre()
  const reactivate   = useReactivateCentre()
  const addNote      = useAddCentreNote()

  const handleAddNote = () => {
    if (!note.trim()) return
    addNote.mutate({ centreId: centre.id, contenu: note }, {
      onSuccess: () => { setNote(''); setShowNote(false) },
    })
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Actions</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => impersonate.mutate(centre.id)}
          disabled={impersonate.isPending}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, opacity: impersonate.isPending ? 0.6 : 1,
          }}
        >
          {impersonate.isPending ? 'Connexion…' : '🔑 Impersonate manager'}
        </button>

        {centre.actif ? (
          <button
            onClick={() => suspend.mutate(centre.id)}
            disabled={suspend.isPending}
            style={{
              background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid var(--red)',
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, opacity: suspend.isPending ? 0.6 : 1,
            }}
          >
            Suspendre le centre
          </button>
        ) : (
          <button
            onClick={() => reactivate.mutate(centre.id)}
            disabled={reactivate.isPending}
            style={{
              background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid var(--green)',
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, opacity: reactivate.isPending ? 0.6 : 1,
            }}
          >
            Réactiver le centre
          </button>
        )}

        <button
          onClick={() => setShowNote(v => !v)}
          style={{
            background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 13,
          }}
        >
          + Ajouter une note interne
        </button>

        {showNote && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Votre note interne…"
              rows={3}
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13,
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={addNote.isPending || !note.trim()}
              style={{
                marginTop: 8, background: 'var(--surface2)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 14px', cursor: 'pointer', fontSize: 12,
              }}
            >
              {addNote.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </motion.div>
        )}

        {centre.notes.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Notes internes ({centre.notes.length})</p>
            {centre.notes.map(n => (
              <div key={n.id} style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                fontSize: 12, color: 'var(--text)',
              }}>
                {n.contenu}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
