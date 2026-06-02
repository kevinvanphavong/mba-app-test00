'use client'

import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { HaccpEquipement } from '@/types/haccp'

interface Props {
  equip: HaccpEquipement
  onEdit: () => void
  onToggleActif: () => void
  onDelete: () => void
  busy?: boolean
}

const TYPE_LABEL: Record<HaccpEquipement['type'], string> = {
  FRIGO:       'Frigo',
  CONGELATEUR: 'Congélateur',
  VITRINE:     'Vitrine',
  AUTRE:       'Autre',
}

const TYPE_ICON: Record<HaccpEquipement['type'], string> = {
  FRIGO: '🧊', CONGELATEUR: '❄️', VITRINE: '🥤', AUTRE: '🛠',
}

export default function HaccpEquipementCard({ equip, onEdit, onToggleActif, onDelete, busy }: Props) {
  return (
    <div className={cn(
      'bg-surface border rounded-[14px] p-4 flex flex-col gap-3 transition-opacity',
      equip.actif ? 'border-border' : 'border-border opacity-60'
    )}>
      <div className="flex items-start gap-3">
        <span className="text-[24px] flex-shrink-0">{TYPE_ICON[equip.type]}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`${ty.cardTitleMd} truncate`}>{equip.nom}</h3>
          <p className={ty.metaSm}>
            {TYPE_LABEL[equip.type]} · {equip.seuilMin}°C → {equip.seuilMax}°C
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleActif}
          disabled={busy}
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] border',
            equip.actif
              ? 'border-green/30 bg-green/10 text-green'
              : 'border-border bg-surface2 text-muted'
          )}
          title={equip.actif ? 'Désactiver' : 'Réactiver'}
        >
          {equip.actif ? 'Actif' : 'Inactif'}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={onEdit}
          disabled={busy}
          className="text-[12px] font-semibold text-accent hover:underline"
        >Modifier</button>
        <span className="text-muted">·</span>
        <button
          onClick={onDelete}
          disabled={busy}
          className="text-[12px] font-semibold text-red hover:underline"
        >Supprimer</button>
      </div>
    </div>
  )
}
