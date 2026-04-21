'use client'

import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import type { PointageStats, PointageEntry } from '@/types/pointage'

interface Props {
  stats:     PointageStats
  pointages: PointageEntry[]
}

interface KpiCardProps {
  value:    number | string
  label:    string
  sub?:     string
  color:    string
  icon:     string
}

function KpiCard({ value, label, sub, color, icon }: KpiCardProps) {
  return (
    <motion.div variants={listItemVariants} className="kpi-card p-3 flex items-center gap-3 min-w-0">
      <div className={`kpi-icon ${color} flex items-center justify-center shrink-0`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="kpi-value leading-none">{value}</p>
        <p className="kpi-label mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

function nomUnique(pointages: PointageEntry[], statut: string): string | undefined {
  const matches = pointages.filter(p => p.statut === statut)
  if (matches.length !== 1) return undefined
  const u = matches[0].user
  return u.prenom ? `${u.prenom} ${u.nom}` : u.nom
}

function moyenneRetard(pointages: PointageEntry[]): string {
  const retards = pointages.filter(p => p.minutesRetard > 0)
  if (!retards.length) return ''
  const moy = Math.round(retards.reduce((s, p) => s + p.minutesRetard, 0) / retards.length)
  return `moy. +${moy} min`
}

export default function PointageKpiRow({ stats, pointages }: Props) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-2 px-4 md:grid-cols-5 md:px-6"
    >
      <KpiCard
        value={stats.presents}
        label="Présents"
        sub={`sur ${stats.total} prévus`}
        color="green"
        icon="✅"
      />
      <KpiCard
        value={stats.enPause}
        label="En pause"
        sub={nomUnique(pointages, 'EN_PAUSE')}
        color="yellow"
        icon="☕"
      />
      <KpiCard
        value={stats.absents}
        label="Absents"
        sub={nomUnique(pointages, 'ABSENT')}
        color="red"
        icon="🚫"
      />
      <KpiCard
        value={stats.retards}
        label="Retards"
        sub={moyenneRetard(pointages)}
        color="orange"
        icon="⚠️"
      />
      <KpiCard
        value={`${stats.heuresCumulees}h`}
        label="Heures cumulées"
        sub="équipe"
        color="blue"
        icon="⏱️"
      />
    </motion.div>
  )
}
