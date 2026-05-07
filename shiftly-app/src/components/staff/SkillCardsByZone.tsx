'use client'

/**
 * SkillCardsByZone — grille des compétences groupées par zone, dépendance de MemberPanel.
 * Sortie en composant à part pour respecter la limite de 150 lignes par fichier.
 */

import { useMemo } from 'react'
import SkillTag from './SkillTag'
import type { CompetenceCatalogItem } from '@/types/staff'

interface Props {
  userId:           number
  catalog:          CompetenceCatalogItem[]
  /** Map { competenceId → staffCompetenceId } pour résoudre l'acquis O(1) */
  acquisIds:        Map<number, number>
  canEdit:          boolean
  highlightCompId:  number | null
}

interface ZoneGroup {
  name:    string
  couleur: string
  items:   (CompetenceCatalogItem & { acquis: boolean; staffCompetenceId: number | null })[]
}

function groupByZone(catalog: CompetenceCatalogItem[], acquisIds: Map<number, number>): ZoneGroup[] {
  const map = new Map<string, ZoneGroup>()
  for (const c of catalog) {
    if (!map.has(c.zoneName)) map.set(c.zoneName, { name: c.zoneName, couleur: c.zoneCouleur, items: [] })
    map.get(c.zoneName)!.items.push({
      ...c,
      acquis:            acquisIds.has(c.id),
      staffCompetenceId: acquisIds.get(c.id) ?? null,
    })
  }
  return Array.from(map.values())
}

export default function SkillCardsByZone({ userId, catalog, acquisIds, canEdit, highlightCompId }: Props) {
  const zones = useMemo(() => groupByZone(catalog, acquisIds), [catalog, acquisIds])

  if (zones.length === 0) {
    return <div className="text-[12px] text-muted">Aucune compétence configurée pour ce centre.</div>
  }

  return (
    <div className="skill-grid">
      {zones.map(zone => {
        const total    = zone.items.length
        const acquired = zone.items.filter(i => i.acquis).length
        const pct      = total > 0 ? Math.round(acquired / total * 100) : 0
        return (
          <div key={zone.name} className="skill-card">
            <div className="skill-card-head">
              <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: zone.couleur }}>
                <span className="w-2 h-2 rounded-full" style={{ background: zone.couleur }} /> {zone.name}
              </div>
              <span className="text-[11px] text-muted"><strong className="text-text">{acquired}/{total}</strong></span>
              <span className="text-[10px] text-muted ml-auto">{pct}%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {zone.items.map(item => (
                <SkillTag
                  key={item.id}
                  userId={userId}
                  competenceId={item.id}
                  staffCompetenceId={item.staffCompetenceId}
                  nom={item.nom}
                  zoneCouleur={zone.couleur}
                  acquis={item.acquis}
                  canEdit={canEdit}
                  highlight={highlightCompId === item.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
