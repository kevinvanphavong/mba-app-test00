'use client'

import { useMemo } from 'react'
import HaccpRegistreDayBlock from './HaccpRegistreDayBlock'
import { ty } from '@/lib/typography'
import type { HaccpRegistreItem } from '@/types/haccp'

interface Props { items: HaccpRegistreItem[] }

/** Groupe les items par jour (YYYY-MM-DD) puis rend un block par jour. */
export default function HaccpRegistreTable({ items }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<string, HaccpRegistreItem[]>()
    for (const it of items) {
      const d = it.createdAt?.slice(0, 10) ?? '—'
      const list = map.get(d) ?? []
      list.push(it)
      map.set(d, list)
    }
    // Tri décroissant par date (le plus récent en haut)
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-[14px] py-10 px-6 text-center">
        <div className="text-[28px] mb-2">📋</div>
        <p className={ty.metaLg}>Aucun relevé sur cette période.</p>
        <p className={`${ty.metaSm} mt-1`}>Coche une mission HACCP dans /service pour générer la première trace.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {byDay.map(([day, list]) => (
        <HaccpRegistreDayBlock key={day} date={day} items={list} />
      ))}
    </div>
  )
}
