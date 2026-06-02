'use client'

import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import api from '@/lib/api'
import type { HaccpReleveType } from '@/types/haccp'

interface Props {
  mois: string
  type: HaccpReleveType | ''
  conforme: 'all' | 'ok' | 'ko'
  onMois: (v: string) => void
  onType: (v: HaccpReleveType | '') => void
  onConforme: (v: 'all' | 'ok' | 'ko') => void
}

const TYPES: { value: HaccpReleveType | ''; label: string }[] = [
  { value: '',            label: 'Tous' },
  { value: 'TEMPERATURE', label: 'T°' },
  { value: 'DLC',         label: 'DLC' },
  { value: 'PHOTO',       label: 'Photo' },
  { value: 'RECEPTION',   label: 'Réception' },
]

const CONFORMES: { value: 'all' | 'ok' | 'ko'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'ok',  label: 'Conformes' },
  { value: 'ko',  label: 'Non conformes' },
]

export default function HaccpRegistreFilters({ mois, type, conforme, onMois, onType, onConforme }: Props) {
  const handleExport = async () => {
    const res = await api.get('/haccp/export', { params: { mois }, responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `registre-haccp-${mois}.pdf`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] p-3 flex flex-col gap-3 tablet:flex-row tablet:items-end tablet:flex-wrap">
      <div>
        <label className={`${ty.sectionLabelMd} block mb-1`}>Mois</label>
        <input
          type="month"
          value={mois}
          onChange={e => onMois(e.target.value)}
          className="bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] font-semibold focus:border-accent outline-none"
        />
      </div>

      <div className="flex-1 min-w-0">
        <label className={`${ty.sectionLabelMd} block mb-1`}>Type</label>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => onType(t.value)}
              className={cn(
                'px-3 py-1.5 text-[12px] font-semibold rounded-full border',
                type === t.value ? 'border-accent bg-accent/15 text-accent' : 'bg-surface2 border-border text-muted'
              )}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={`${ty.sectionLabelMd} block mb-1`}>Statut</label>
        <div className="flex gap-1.5">
          {CONFORMES.map(c => (
            <button
              key={c.value}
              onClick={() => onConforme(c.value)}
              className={cn(
                'px-3 py-1.5 text-[12px] font-semibold rounded-full border',
                conforme === c.value ? 'border-accent bg-accent/15 text-accent' : 'bg-surface2 border-border text-muted'
              )}
            >{c.label}</button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="ml-auto py-2 px-4 rounded-[10px] bg-accent text-white text-[13px] font-semibold text-center"
      >
        📄 Export PDF
      </button>
    </div>
  )
}
