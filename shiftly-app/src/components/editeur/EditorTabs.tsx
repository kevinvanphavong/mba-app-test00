'use client'

import type { EditorTab } from '@/types/editeur'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'zones',       label: 'Zones' },
  { id: 'missions',    label: 'Missions' },
  { id: 'competences', label: 'Compétences' },
  { id: 'tutoriels',   label: 'Tutoriels' },
]

interface Props {
  active: EditorTab
  onChange: (tab: EditorTab) => void
}

export default function EditorTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-surface border border-border rounded-[12px] p-[3px] mb-4">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-[7px] rounded-[9px] text-[11px] font-bold transition-all duration-150 text-center ${
            active === t.id
              ? 'bg-surface2 text-text border border-border'
              : 'text-muted bg-transparent border border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
