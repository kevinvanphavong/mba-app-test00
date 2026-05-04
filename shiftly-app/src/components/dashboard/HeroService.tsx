'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import { getInitials } from '@/lib/userDisplay'
import type { DashboardService, DashboardManagerResponsable, DashboardZoneProgress } from '@/types/dashboard'

interface HeroServiceProps {
  data: DashboardService
}

// Cercle de progression globale — paramètres conservés depuis la V1
const RADIUS        = 38
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const STATUT_LABEL: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE:  'Terminé',
}
const STATUT_COLOR: Record<string, string> = {
  PLANIFIE: 'text-blue   bg-blue/10',
  EN_COURS: 'text-green  bg-green/10',
  TERMINE:  'text-muted  bg-surface2',
}

/**
 * Dérive les classes de la grille zones selon le viewport et le nombre de zones.
 *  - mobile (<md)   : 1 col
 *  - tablette (md)  : 2 col
 *  - desktop (lg)   : 1 zone → 1 col, 2/4 zones → 2 col, 3 ou 5+ zones → 3 col
 */
function getZonesGridClass(count: number): string {
  if (count <= 0) return ''
  let lg: string
  if (count === 1)                    lg = 'lg:grid-cols-1'
  else if (count === 2 || count === 4) lg = 'lg:grid-cols-2'
  else                                 lg = 'lg:grid-cols-3'
  return `grid grid-cols-1 md:grid-cols-2 ${lg} gap-3`
}

/** Nom du manager pour la ligne « Prénom(s) (Manager responsable) ». */
function formatManagers(managers: DashboardManagerResponsable[]): string {
  if (managers.length === 0) return ''
  const names = managers
    .map(m => (m.prenom?.trim() || m.nom?.trim() || '').trim())
    .filter(Boolean)
  return names.join(', ')
}

/** Hero V2 — service du jour, progression par zone, équipe en service. */
export default function HeroService({ data }: HeroServiceProps) {
  const { today, tauxCompletion } = data

  if (!today) {
    return (
      <div className="relative bg-surface border border-border rounded-[18px] p-5 overflow-hidden accent-bar">
        <p className={`${ty.bodyLg} text-muted`}>Aucun service planifié aujourd&apos;hui.</p>
      </div>
    )
  }

  const pct        = Math.max(0, Math.min(100, tauxCompletion))
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100)
  const isLive     = today.statut === 'EN_COURS'

  const dayLabel = new Date(today.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const managersLine = formatManagers(today.managersResponsables)
  const zonesGrid    = getZonesGridClass(today.zones.length)

  return (
    <div className="relative bg-surface border border-border rounded-[18px] p-5 overflow-hidden accent-bar">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-5">
        {/* ── Bandeau supérieur : statut + libellé ──────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {isLive ? (
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className={`${ty.badgeMd} font-syne uppercase tracking-wider px-2 py-0.5 rounded-[6px] inline-flex items-center gap-1.5 text-green bg-green/10`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              LIVE
            </motion.span>
          ) : (
            <span
              className={cn(
                `${ty.badgeMd} font-syne uppercase tracking-wider px-2 py-0.5 rounded-[6px]`,
                STATUT_COLOR[today.statut] ?? 'text-muted bg-surface2',
              )}
            >
              {STATUT_LABEL[today.statut] ?? today.statut}
            </span>
          )}
          <span className={ty.meta}>Service du jour</span>
        </div>

        {/* ── Bloc principal : info gauche + cercle droite ──────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-syne font-extrabold text-text capitalize text-[24px] md:text-[28px] leading-tight truncate">
              {dayLabel}
            </h2>

            {today.heureDebut && today.heureFin ? (
              <div className={`${ty.kpi} lg:text-[30px] mt-1`}>
                {today.heureDebut}
                <span className="text-muted font-normal text-[16px] mx-1.5">→</span>
                {today.heureFin}
              </div>
            ) : (
              <p className={`${ty.metaLg} mt-1 text-muted italic`}>Horaires non définis</p>
            )}

            {managersLine && (
              <p className={`${ty.metaLg} mt-2`}>
                <span className="text-text font-medium">{managersLine}</span>
                <span className="text-muted"> · Manager responsable</span>
              </p>
            )}
          </div>

          {/* Cercle de progression globale — conservé tel quel */}
          <div className="relative flex-shrink-0 w-[96px] h-[96px]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full -rotate-90"
              aria-label={`${pct.toFixed(0)}% d'avancement`}
            >
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="#252a3a"
                strokeWidth="7"
              />
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={ty.kpiMd}>
                {pct.toFixed(0)}%
              </span>
              <span className={`${ty.badge} text-muted mt-0.5 uppercase tracking-wide`}>missions</span>
            </div>
          </div>
        </div>

        {/* ── Progression par zone (triée pct ASC) ──────────────────── */}
        {today.zones.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className={`${ty.badge} uppercase tracking-wide text-muted`}>Progression par zone</span>
              <span className={ty.metaSm}>{today.zones.length} zone{today.zones.length > 1 ? 's' : ''}</span>
            </div>
            <ul className={zonesGrid}>
              {today.zones.map(z => <ZoneProgressCard key={z.id} zone={z} />)}
            </ul>
          </div>
        )}

        {/* ── En service (avatars staff distincts) ──────────────────── */}
        {today.staffEnService.length > 0 && (
          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`${ty.badge} uppercase tracking-wide text-muted shrink-0`}>En service</span>
              <div className="flex -space-x-2 overflow-hidden">
                {today.staffEnService.slice(0, 8).map(s => {
                  const initials = getInitials(s.nom, s.prenom)
                  return (
                    <span
                      key={s.id}
                      title={[s.prenom, s.nom].filter(Boolean).join(' ')}
                      className={`${ty.badge} w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold border-2 border-surface`}
                      style={{
                        background: `linear-gradient(135deg, ${s.avatarColor}, ${s.avatarColor}99)`,
                      }}
                    >
                      {initials}
                    </span>
                  )
                })}
                {today.staffEnService.length > 8 && (
                  <span className={`${ty.badge} w-7 h-7 rounded-full flex items-center justify-center bg-surface2 text-muted border-2 border-surface`}>
                    +{today.staffEnService.length - 8}
                  </span>
                )}
              </div>
            </div>
            <span className={`${ty.metaSm} shrink-0`}>
              {today.staffEnService.length} membre{today.staffEnService.length > 1 ? 's' : ''} actif{today.staffEnService.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sous-composant : carte d'une zone (couleur + progression) ─────────────

function ZoneProgressCard({ zone }: { zone: DashboardZoneProgress }) {
  const pct = Math.max(0, Math.min(100, zone.pct))
  return (
    <li className="bg-surface2 border border-border rounded-[12px] px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: zone.couleur }} />
          <span className={`${ty.body} font-medium truncate`}>{zone.nom}</span>
        </div>
        <span className={`${ty.statSyne} shrink-0`} style={{ color: zone.couleur }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: zone.couleur }}
        />
      </div>
      <span className={ty.metaSm}>{zone.completed}/{zone.total} mission{zone.total > 1 ? 's' : ''}</span>
    </li>
  )
}
