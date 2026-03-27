'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type Zone = {
  id: number
  nom: string
  couleur: string | null
  ordre: number
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

export default function ZonesPage() {
  const { user, loading: userLoading } = useCurrentUser()

  const [zones, setZones]         = useState<Zone[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNom, setEditNom]     = useState('')
  const [editCouleur, setEditCouleur] = useState('')
  const [editOrdre, setEditOrdre] = useState(0)
  const [saving, setSaving]       = useState(false)

  // Add form state
  const [showAdd, setShowAdd]     = useState(false)
  const [newNom, setNewNom]       = useState('')
  const [newCouleur, setNewCouleur] = useState(PRESET_COLORS[0])
  const [adding, setAdding]       = useState(false)

  const centreId = user?.centre?.id

  useEffect(() => {
    if (!centreId) return
    fetchZones()
  }, [centreId])

  async function fetchZones() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/zones?centre=/api/centres/${centreId}&order[ordre]=asc`)
      const members: Zone[] = (res.data['hydra:member'] ?? res.data).map((z: Zone) => ({
        id:      z.id,
        nom:     z.nom,
        couleur: z.couleur,
        ordre:   z.ordre,
      }))
      setZones(members)
    } catch {
      setError('Impossible de charger les zones.')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(zone: Zone) {
    setEditingId(zone.id)
    setEditNom(zone.nom)
    setEditCouleur(zone.couleur ?? PRESET_COLORS[0])
    setEditOrdre(zone.ordre)
  }

  async function saveEdit() {
    if (!editingId || !centreId) return
    setSaving(true)
    try {
      await api.put(`/zones/${editingId}`, {
        nom:     editNom,
        couleur: editCouleur,
        ordre:   editOrdre,
        centre:  `/api/centres/${centreId}`,
      })
      setEditingId(null)
      await fetchZones()
    } catch {
      setError("Impossible d'enregistrer la zone.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteZone(id: number) {
    if (!confirm('Supprimer cette zone ? Les missions et compétences associées seront aussi supprimées.')) return
    try {
      await api.delete(`/zones/${id}`)
      setZones(prev => prev.filter(z => z.id !== id))
    } catch {
      setError('Impossible de supprimer la zone.')
    }
  }

  async function addZone() {
    if (!newNom.trim() || !centreId) return
    setAdding(true)
    try {
      await api.post('/zones', {
        nom:     newNom.trim(),
        couleur: newCouleur,
        ordre:   zones.length,
        centre:  `/api/centres/${centreId}`,
      })
      setNewNom('')
      setNewCouleur(PRESET_COLORS[0])
      setShowAdd(false)
      await fetchZones()
    } catch {
      setError("Impossible d'ajouter la zone.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-[390px] mx-auto px-5 py-6 lg:max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/reglages"
          className="w-9 h-9 rounded-[12px] bg-surface border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          ←
        </Link>
        <h1 className="font-syne font-extrabold text-[20px] text-text">Zones actives</h1>
      </div>

      {error && (
        <p className="text-[12px] text-red font-medium px-1 mb-3">{error}</p>
      )}

      {/* Zone list */}
      {(userLoading || loading) ? (
        <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border animate-pulse">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-[10px] bg-surface2 flex-shrink-0" />
              <div className="h-4 w-28 bg-surface2 rounded flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border mb-3">
          {zones.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-muted">
              Aucune zone configurée.
            </div>
          )}

          {zones.map(zone => (
            <div key={zone.id}>
              {editingId === zone.id ? (
                /* ── Edit form inline ── */
                <div className="px-4 py-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={editNom}
                      onChange={e => setEditNom(e.target.value)}
                      placeholder="Nom de la zone"
                      className="flex-1 bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      value={editOrdre}
                      onChange={e => setEditOrdre(Number(e.target.value))}
                      className="w-16 bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent"
                      title="Ordre"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditCouleur(c)}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor: editCouleur === c ? 'white' : 'transparent',
                          boxShadow: editCouleur === c ? `0 0 0 2px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 py-2 rounded-[10px] bg-accent text-white text-[12px] font-bold disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="py-2 px-4 rounded-[10px] bg-surface2 border border-border text-[12px] text-muted"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Zone row ── */
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-[10px] flex-shrink-0"
                    style={{ backgroundColor: zone.couleur ?? '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text font-medium">{zone.nom}</div>
                    <div className="text-[11px] text-muted">Ordre : {zone.ordre}</div>
                  </div>
                  <button
                    onClick={() => startEdit(zone)}
                    className="text-[11px] text-accent font-semibold mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteZone(zone.id)}
                    className="text-[11px] text-red font-semibold"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add zone */}
      {showAdd ? (
        <div className="bg-surface border border-border rounded-[18px] p-4 space-y-3">
          <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Nouvelle zone</p>
          <input
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            placeholder="Nom de la zone (ex: Bar, Cuisine…)"
            className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCouleur(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newCouleur === c ? 'white' : 'transparent',
                  boxShadow: newCouleur === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addZone}
              disabled={adding || !newNom.trim()}
              className="flex-1 py-2.5 rounded-[12px] bg-accent text-white text-[13px] font-bold disabled:opacity-50"
            >
              {adding ? 'Ajout…' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewNom('') }}
              className="py-2.5 px-4 rounded-[12px] bg-surface2 border border-border text-[13px] text-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 rounded-[14px] bg-surface border border-border text-[13px] text-accent font-bold
                     hover:bg-surface2 active:scale-[.98] transition-all"
        >
          + Ajouter une zone
        </button>
      )}
    </div>
  )
}
