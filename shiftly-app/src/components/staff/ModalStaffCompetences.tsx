'use client'

import { useState, useEffect } from 'react'
import { cn }                  from '@/lib/cn'
import api                     from '@/lib/api'
import type { StaffMember }    from '@/types/staff'

interface CompetenceRow {
  competenceId:      number
  nom:               string
  difficulte:        'simple' | 'avancee' | 'experimente'
  points:            number
  zoneId:            number
  zoneName:          string
  zoneCouleur:       string | null
  acquis:            boolean
  staffCompetenceId: number | null
}

const DIFF_LABEL = { simple: 'Simple', avancee: 'Avancé', experimente: 'Expert' }
const DIFF_CLS   = {
  simple:      'text-green  bg-green/10  border-green/20',
  avancee:     'text-yellow bg-yellow/10 border-yellow/20',
  experimente: 'text-red    bg-red/10    border-red/20',
}

interface Props {
  open:    boolean
  member:  StaffMember | null
  onClose: () => void
  /** Appelé quand les points du membre changent (pour mise à jour locale) */
  onPointsChange?: (userId: number, newPoints: number) => void
}

export default function ModalStaffCompetences({ open, member, onClose, onPointsChange }: Props) {
  const [competences, setCompetences] = useState<CompetenceRow[]>([])
  const [loading,     setLoading]     = useState(false)
  const [toggling,    setToggling]    = useState<number | null>(null) // competenceId en cours

  useEffect(() => {
    if (!open || !member) return
    setLoading(true)
    api.get(`/editeur/staff/${member.id}/competences`)
      .then(r => setCompetences(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, member])

  async function handleToggle(row: CompetenceRow) {
    if (!member || toggling !== null) return
    setToggling(row.competenceId)

    try {
      if (row.acquis && row.staffCompetenceId) {
        // Révocation
        const res = await api.delete(`/editeur/staff/${member.id}/competences/${row.staffCompetenceId}`)
        setCompetences(prev => prev.map(c =>
          c.competenceId === row.competenceId
            ? { ...c, acquis: false, staffCompetenceId: null }
            : c
        ))
        onPointsChange?.(member.id, res.data.points)
      } else {
        // Attribution
        const res = await api.post(`/editeur/staff/${member.id}/competences`, {
          competenceId: row.competenceId,
        })
        setCompetences(prev => prev.map(c =>
          c.competenceId === row.competenceId
            ? { ...c, acquis: true, staffCompetenceId: res.data.staffCompetenceId }
            : c
        ))
        onPointsChange?.(member.id, res.data.points)
      }
    } catch {
      // Silencieux — le toggle revient à son état initial
    } finally {
      setToggling(null)
    }
  }

  if (!open || !member) return null

  // Grouper par zone
  const grouped = competences.reduce<Record<string, CompetenceRow[]>>((acc, c) => {
    if (!acc[c.zoneName]) acc[c.zoneName] = []
    acc[c.zoneName].push(c)
    return acc
  }, {})

  const acquises = competences.filter(c => c.acquis).length
  const total    = competences.length

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-[24px] px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-syne font-extrabold text-[16px] text-text">
              Compétences de {member.prenom ?? member.nom}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              {acquises}/{total} acquises
            </p>
          </div>
          <button onClick={onClose} className="text-muted text-[20px] leading-none">×</button>
        </div>

        {/* Barre de progression */}
        {total > 0 && (
          <div className="h-[4px] bg-surface2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.round(acquises / total * 100)}%` }}
            />
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[0,1,2,3].map(i => <div key={i} className="h-10 bg-surface2 rounded-[10px]" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-[13px] text-muted text-center py-6">
            Aucune compétence définie dans ce centre.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([zoneName, comps]) => {
              const couleur = comps[0]?.zoneCouleur ?? '#6b7280'
              return (
                <div key={zoneName}>
                  {/* Zone header */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: couleur }} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: couleur }}>
                      {zoneName}
                    </span>
                  </div>

                  {/* Compétences */}
                  <div className="flex flex-col gap-1.5">
                    {comps.map(row => {
                      const isToggling = toggling === row.competenceId
                      return (
                        <div
                          key={row.competenceId}
                          className="flex items-center gap-3 px-3 py-2 bg-surface2 rounded-[10px]"
                        >
                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-text truncate">{row.nom}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] border',
                                DIFF_CLS[row.difficulte]
                              )}>
                                {DIFF_LABEL[row.difficulte]}
                              </span>
                              <span className="text-[10px] text-accent font-syne font-bold">+{row.points} pts</span>
                            </div>
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(row)}
                            disabled={isToggling}
                            className={cn(
                              'w-[44px] h-[24px] rounded-full relative flex-shrink-0 transition-colors',
                              isToggling ? 'opacity-50' : '',
                              row.acquis ? 'bg-green' : 'bg-surface border border-border'
                            )}
                          >
                            <span className={cn(
                              'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all',
                              row.acquis ? 'left-[23px]' : 'left-[3px]'
                            )} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
