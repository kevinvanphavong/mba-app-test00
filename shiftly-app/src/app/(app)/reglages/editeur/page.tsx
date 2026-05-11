'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useManagerGuard } from '@/hooks/useManagerGuard'
import type {
  EditorZone, EditorTutoriel, TutorielFormData,
} from '@/types/editeur'

import TutorielList     from '@/components/editeur/TutorielList'
import ModalAddTutoriel from '@/components/editeur/ModalAddTutoriel'
import ModalConfirmDelete from '@/components/editeur/ModalConfirmDelete'

// ─── Page Tutoriels (manager) ─────────────────────────────────────────────────
// La gestion des zones / missions / compétences a été déplacée sur /postes.
// Cette page conserve uniquement l'éditeur de tutoriels — qui n'a pas d'autre
// emplacement dans l'app à date.

export default function EditeurTutorielsPage() {
  const router = useRouter()
  const { isManager } = useManagerGuard()

  const [zones, setZones] = useState<EditorZone[]>([])
  const [tutoriels, setTutoriels] = useState<EditorTutoriel[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [zoneFilter, setZoneFilter] = useState<number | null>(null)

  const [showAddTutoriel, setShowAddTutoriel] = useState(false)
  const [editTutoriel, setEditTutoriel] = useState<EditorTutoriel | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<EditorTutoriel | null>(null)

  // ─── Chargement initial ───────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setApiError(null)
    try {
      const [zRes, tRes] = await Promise.all([
        api.get('/editeur/zones'),
        api.get('/editeur/tutoriels'),
      ])
      setZones(zRes.data)
      setTutoriels(tRes.data)
    } catch {
      setApiError('Impossible de charger les tutoriels.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isManager) fetchAll()
  }, [isManager, fetchAll])

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  async function handleSaveTutoriel(data: TutorielFormData) {
    try {
      if (editTutoriel) {
        const res = await api.put(`/editeur/tutoriels/${editTutoriel.id}`, data)
        setTutoriels(prev => prev.map(t => t.id === editTutoriel.id ? res.data : t))
      } else {
        const res = await api.post('/editeur/tutoriels', data)
        setTutoriels(prev => [...prev, res.data])
      }
    } catch {
      setApiError('Impossible de sauvegarder le tutoriel.')
    }
    setShowAddTutoriel(false); setEditTutoriel(null)
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return
    try {
      await api.delete(`/editeur/tutoriels/${confirmDelete.id}`)
      setTutoriels(prev => prev.filter(t => t.id !== confirmDelete.id))
    } catch {
      setApiError('Impossible de supprimer le tutoriel.')
    }
    setConfirmDelete(null)
  }

  const filtered = zoneFilter !== null
    ? tutoriels.filter(t => t.zoneId === zoneFilter)
    : tutoriels

  if (!isManager) return null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto px-4 pb-24 desktop:max-w-2xl">
      <div className="py-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-accent text-[13px] font-semibold"
        >
          ← Réglages
        </button>
        <button
          onClick={() => { setEditTutoriel(null); setShowAddTutoriel(true) }}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-accent hover:text-accent transition-all"
          aria-label="Ajouter"
        >
          ＋
        </button>
      </div>

      <h1 className="font-syne font-extrabold text-[20px] text-text mb-0.5">Gestion des tutoriels</h1>
      <p className="text-[12px] text-muted mb-4">
        Pour gérer zones, missions et compétences, va sur <button onClick={() => router.push('/postes')} className="text-accent font-semibold hover:underline">Postes</button>.
      </p>

      {apiError && <p className="text-[12px] text-red font-medium mb-3 px-1">{apiError}</p>}

      {/* Chips de filtrage par zone */}
      {zones.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
          <button
            onClick={() => setZoneFilter(null)}
            className={`px-3 py-1.5 rounded-[10px] border text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              zoneFilter === null
                ? 'bg-surface2 border-border text-text'
                : 'border-border text-muted hover:border-accent/40'
            }`}
          >
            Tous
          </button>
          {zones.map(z => (
            <button
              key={z.id}
              onClick={() => setZoneFilter(z.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                zoneFilter === z.id
                  ? 'border-transparent text-white'
                  : 'border-border text-muted hover:border-accent/40'
              }`}
              style={zoneFilter === z.id ? { backgroundColor: z.couleur } : {}}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: zoneFilter === z.id ? 'rgba(255,255,255,0.7)' : z.couleur }}
              />
              {z.nom}
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0,1,2].map(i => <div key={i} className="h-12 bg-surface rounded-[12px] border border-border" />)}
        </div>
      ) : (
        <TutorielList
          tutoriels={filtered}
          onEdit={(t) => { setEditTutoriel(t); setShowAddTutoriel(true) }}
          onDelete={(t) => setConfirmDelete(t)}
          onAdd={() => { setEditTutoriel(null); setShowAddTutoriel(true) }}
        />
      )}

      {/* Modaux */}
      <ModalAddTutoriel
        open={showAddTutoriel}
        editTutoriel={editTutoriel}
        zones={zones}
        onClose={() => { setShowAddTutoriel(false); setEditTutoriel(null) }}
        onSave={handleSaveTutoriel}
      />

      <ModalConfirmDelete
        open={confirmDelete !== null}
        type="tutoriel"
        nom={confirmDelete?.titre ?? ''}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
