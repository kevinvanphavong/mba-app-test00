'use client'

import HaccpEquipementCard from './HaccpEquipementCard'
import { ty } from '@/lib/typography'
import type { HaccpEquipement } from '@/types/haccp'

interface Props {
  equipements: HaccpEquipement[]
  onEdit: (e: HaccpEquipement) => void
  onToggleActif: (e: HaccpEquipement) => void
  onDelete: (e: HaccpEquipement) => void
  busy?: boolean
}

export default function HaccpEquipementList({ equipements, onEdit, onToggleActif, onDelete, busy }: Props) {
  if (equipements.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-[14px] py-10 px-6 text-center">
        <div className="text-[28px] mb-2">🧊</div>
        <p className={ty.metaLg}>Aucun équipement configuré.</p>
        <p className={`${ty.metaSm} mt-1`}>Ajoute un frigo ou congélateur pour générer les missions T° automatiquement.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-3">
      {equipements.map(e => (
        <HaccpEquipementCard
          key={e.id}
          equip={e}
          onEdit={() => onEdit(e)}
          onToggleActif={() => onToggleActif(e)}
          onDelete={() => onDelete(e)}
          busy={busy}
        />
      ))}
    </div>
  )
}
