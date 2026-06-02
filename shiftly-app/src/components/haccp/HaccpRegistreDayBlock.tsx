'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import HaccpRegistreRow from './HaccpRegistreRow'
import { ty } from '@/lib/typography'
import type { HaccpRegistreItem } from '@/types/haccp'

interface Props {
  date: string  // 'YYYY-MM-DD'
  items: HaccpRegistreItem[]
}

export default function HaccpRegistreDayBlock({ date, items }: Props) {
  const label = (() => {
    try { return format(new Date(date), "EEEE d MMMM", { locale: fr }) } catch { return date }
  })()

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
      <div className="px-4 py-2.5 bg-surface2 border-b border-border flex items-center justify-between">
        <h3 className="font-syne font-extrabold text-[14px] capitalize">{label}</h3>
        <span className={ty.metaSm}>{items.length} relevé{items.length > 1 ? 's' : ''}</span>
      </div>
      <ul>
        {items.map(it => <HaccpRegistreRow key={it.id} item={it} />)}
      </ul>
    </div>
  )
}
