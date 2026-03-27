'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  JOURS_SEMAINE,
  JOURS_LABELS,
  DEFAULT_OPENING_HOURS,
  type OpeningHours,
  type JourSemaine,
} from '@/types/centre'

export default function HorairesPage() {
  const { user, loading: userLoading } = useCurrentUser()

  const [hours,          setHours]          = useState<OpeningHours>(DEFAULT_OPENING_HOURS)
  const [fetchingCentre, setFetchingCentre] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [success,        setSuccess]        = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    if (!user?.centre?.id) return
    setFetchingCentre(true)
    api.get(`/centres/${user.centre.id}/horaires`)
      .then(res => setHours(res.data as OpeningHours))
      .catch(() => setError('Impossible de charger les horaires.'))
      .finally(() => setFetchingCentre(false))
  }, [user?.centre?.id])

  function toggleJour(jour: JourSemaine) {
    setHours(prev => ({
      ...prev,
      [jour]: { ...prev[jour], ouvert: !prev[jour].ouvert },
    }))
    setSuccess(false)
  }

  function setHeure(jour: JourSemaine, champ: 'ouverture' | 'fermeture', val: string) {
    setHours(prev => ({
      ...prev,
      [jour]: { ...prev[jour], [champ]: val || null },
    }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.centre?.id) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api.put(`/centres/${user.centre.id}/horaires`, hours)
      setSuccess(true)
    } catch {
      setError("Impossible d'enregistrer les horaires.")
    } finally {
      setSaving(false)
    }
  }

  const isLoading = userLoading || fetchingCentre

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
        <div>
          <h1 className="font-syne font-extrabold text-[20px] text-text leading-none">
            Horaires d'ouverture
          </h1>
          <p className="text-[11px] text-muted mt-0.5">
            Définissez les jours et heures d'ouverture du centre
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border animate-pulse">
          {JOURS_SEMAINE.map(j => (
            <div key={j} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-16 h-3 bg-surface2 rounded" />
              <div className="flex-1" />
              <div className="w-10 h-5 bg-surface2 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border">
            {JOURS_SEMAINE.map(jour => {
              const h = hours[jour]
              return (
                <div key={jour} className="px-4 py-3.5">
                  {/* Ligne principale : nom + toggle */}
                  <div className="flex items-center justify-between mb-0">
                    <span className={`text-[13px] font-semibold ${h.ouvert ? 'text-text' : 'text-muted'}`}>
                      {JOURS_LABELS[jour].long}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleJour(jour)}
                      className={`w-[44px] h-[24px] rounded-full relative flex-shrink-0 transition-colors ${
                        h.ouvert ? 'bg-green' : 'bg-surface2 border border-border'
                      }`}
                    >
                      <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all ${
                        h.ouvert ? 'left-[23px]' : 'left-[3px]'
                      }`} />
                    </button>
                  </div>

                  {/* Champs heure (conditionnels) */}
                  {h.ouvert && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="flex-1">
                        <label className="block text-[10px] text-muted uppercase tracking-wide mb-1">
                          Ouverture
                        </label>
                        <input
                          type="time"
                          value={h.ouverture ?? ''}
                          onChange={e => setHeure(jour, 'ouverture', e.target.value)}
                          className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      <span className="text-muted text-[14px] mt-4">→</span>
                      <div className="flex-1">
                        <label className="block text-[10px] text-muted uppercase tracking-wide mb-1">
                          Fermeture
                        </label>
                        <input
                          type="time"
                          value={h.fermeture ?? ''}
                          onChange={e => setHeure(jour, 'fermeture', e.target.value)}
                          className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Label fermé */}
                  {!h.ouvert && (
                    <p className="text-[11px] text-muted mt-1">Fermé</p>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <p className="text-[12px] text-red font-medium px-1">{error}</p>
          )}
          {success && (
            <p className="text-[12px] text-green font-medium px-1">Horaires enregistrés ✓</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-[14px] bg-accent text-white font-extrabold text-[14px]
                       hover:opacity-90 active:scale-[.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  )
}
