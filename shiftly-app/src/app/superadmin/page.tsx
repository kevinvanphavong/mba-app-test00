'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import { useSuperAdminDashboard } from '@/hooks/useSuperAdminDashboard'
import type { DashboardKPIs, TopCentre, AuditLogEntry } from '@/types/superadmin'

// ─── Mock data Phase 1 (remplacé en Phase 2 par Stripe + Sentry réel) ────────
const MRR_HISTORY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const MRR_MONTHS  = ['Mai 25', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Jan 26', 'Fév', 'Mars', 'Avr']

const MODULE_ADOPTION = [
  { label: 'Pointage',        icon: '⏱️', pct: 100, color: 'bg-green'  },
  { label: 'Service du jour', icon: '📅', pct: 100, color: 'bg-green'  },
  { label: 'Planning',        icon: '📆', pct: 100, color: 'bg-green'  },
  { label: 'Tutoriels',       icon: '🎓', pct:  67, color: 'bg-accent' },
  { label: 'HACCP',           icon: '🍔', pct:   0, color: 'bg-red'    },
  { label: 'Entreprises',     icon: '🏢', pct:   0, color: 'bg-red'    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError } = useSuperAdminDashboard()

  if (isLoading) return <p className="text-muted text-sm">Chargement du dashboard…</p>
  if (isError || !data) return <p className="text-red text-sm">Erreur de chargement</p>

  const now = new Date()
  const nowLabel = `${format(now, 'd MMMM yyyy', { locale: fr })} · ${format(now, 'HH:mm')}`

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-[22px] flex-wrap gap-3.5">
        <div>
          <h1 className="font-syne font-extrabold text-[24px]">Dashboard</h1>
          <p className="text-[13px] text-muted mt-0.5">Vue d'ensemble de la plateforme · {nowLabel}</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <select className="bg-surface text-text border border-border py-2.5 px-3.5 rounded-[9px] text-[13px] cursor-pointer">
            <option>30 derniers jours</option>
            <option>7 derniers jours</option>
            <option>90 derniers jours</option>
            <option>Cette année</option>
          </select>
          <button className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold border border-border text-text bg-transparent hover:border-accent hover:text-accent transition inline-flex items-center gap-1.5">
            <span>📥</span> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KpiCard
          label="Centres actifs"
          value={data.totalCentres}
          valueColor="text-accent"
          accentBar="bg-accent"
          iconBg="bg-accent/10"
          icon="🏢"
          trend={{ label: `+${data.totalCentres} au total`, kind: 'neutral' }}
        />
        <KpiCard
          label="MRR"
          value={`${data.mrr} €`}
          valueColor="text-green"
          accentBar="bg-green"
          iconBg="bg-green/10"
          icon="💶"
          trend={{ label: 'Stripe (Phase 2)', kind: 'neutral' }}
        />
        <KpiCard
          label="Users totaux"
          value={data.totalUsers}
          valueColor="text-blue"
          accentBar="bg-blue"
          iconBg="bg-blue/10"
          icon="👥"
          trend={{ label: `Sur ${data.totalCentres} centre${data.totalCentres > 1 ? 's' : ''}`, kind: 'neutral' }}
        />
        <KpiCard
          label="Erreurs Sentry (7j)"
          value={data.sentryStats.total}
          valueColor="text-red"
          accentBar="bg-red"
          iconBg="bg-red/10"
          icon="🐛"
          trend={{ label: data.sentryStats.total === 0 ? 'Aucune erreur' : 'À investiguer', kind: data.sentryStats.total === 0 ? 'up' : 'down' }}
        />
      </div>

      {/* Top widgets */}
      <div className="grid grid-cols-[2fr_1fr] gap-[18px] mb-5 max-[1100px]:grid-cols-1">
        <MrrWidget />
        <SentryWidget total={data.sentryStats.total} />
      </div>

      {/* Bottom widgets */}
      <div className="grid grid-cols-2 gap-[18px] max-[1100px]:grid-cols-1">
        <ActivityWidget entries={data.recentActivity} />

        <div className="flex flex-col gap-[18px]">
          <TopCentresWidget centres={data.topCentres} />
          <ModuleAdoptionWidget />
        </div>
      </div>
    </>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label:      string
  value:      number | string
  valueColor: string
  accentBar:  string
  iconBg:     string
  icon:       string
  trend:      { label: string; kind: 'up' | 'down' | 'neutral' }
}

function KpiCard({ label, value, valueColor, accentBar, iconBg, icon, trend }: KpiProps) {
  const trendColor = {
    up:      'text-green',
    down:    'text-red',
    neutral: 'text-muted',
  }[trend.kind]

  return (
    <div className="relative bg-surface border border-border rounded-[14px] p-[18px] overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}`} />
      <div className="flex justify-between items-start mb-3.5">
        <div className="text-[11px] text-muted uppercase tracking-[1px] font-bold">{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] ${iconBg}`}>{icon}</div>
      </div>
      <div className={`font-syne font-extrabold text-[30px] leading-none mb-1.5 ${valueColor}`}>{value}</div>
      <div className={`text-[11px] font-semibold inline-flex items-center gap-1 ${trendColor}`}>{trend.label}</div>
    </div>
  )
}

// ─── Widget shell ─────────────────────────────────────────────────────────────

function WidgetShell({
  icon,
  title,
  action,
  children,
}: {
  icon:    string
  title:   string
  action?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
      <div className="flex justify-between items-center py-3.5 px-[18px] border-b border-border">
        <div className="font-syne font-bold text-[14px] flex items-center gap-2">
          <span className="text-[16px]">{icon}</span> {title}
        </div>
        {action && <span className="text-[11px] text-accent cursor-pointer font-semibold">{action}</span>}
      </div>
      <div className="py-4 px-[18px]">{children}</div>
    </div>
  )
}

// ─── MRR Widget ───────────────────────────────────────────────────────────────

function MrrWidget() {
  const max   = Math.max(...MRR_HISTORY, 1)
  const pts   = MRR_HISTORY.map((v, i) => {
    const x = (i / (MRR_HISTORY.length - 1)) * 600
    const y = 180 - (v / max) * 160 - 10
    return `${x},${y}`
  }).join(' L ')
  const path  = `M ${pts}`
  const fill  = `M ${pts} L 600,180 L 0,180 Z`

  return (
    <WidgetShell icon="📈" title="Croissance MRR" action="Voir détails →">
      <div className="h-[180px] relative my-2 mb-3">
        <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="30"  x2="600" y2="30"  stroke="#252a3a" strokeDasharray="3,3" />
          <line x1="0" y1="80"  x2="600" y2="80"  stroke="#252a3a" strokeDasharray="3,3" />
          <line x1="0" y1="130" x2="600" y2="130" stroke="#252a3a" strokeDasharray="3,3" />
          <path d={fill} fill="url(#mrrGrad)" />
          <path d={path} stroke="#22c55e" strokeWidth="2.5" fill="none" />
        </svg>
      </div>

      <div className="flex justify-between px-1 text-[10px] text-muted">
        {MRR_MONTHS.map(m => <span key={m}>{m}</span>)}
      </div>

      <div className="grid grid-cols-3 gap-3.5 mt-3.5 pt-3.5 border-t border-border">
        <ChartStat label="MRR actuel"       value="0 €"       color="text-green"  />
        <ChartStat label="New MRR (30j)"    value="—"         color="text-accent" />
        <ChartStat label="Churn MRR (30j)"  value="—"         color="text-red"    />
      </div>
    </WidgetShell>
  )
}

function ChartStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-muted uppercase tracking-[0.8px] mb-[3px]">{label}</div>
      <div className={`font-syne font-extrabold text-[16px] ${color}`}>{value}</div>
    </div>
  )
}

// ─── Sentry Widget ────────────────────────────────────────────────────────────

function SentryWidget({ total }: { total: number }) {
  const isHealthy = total === 0

  return (
    <WidgetShell icon="🛡️" title="Santé Sentry" action="Sentry ↗">
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[22px] ${isHealthy ? 'bg-green/10' : 'bg-yellow/10'}`}>
          {isHealthy ? '✓' : '⚠'}
        </div>
        <div>
          <div className={`font-syne font-bold text-[16px] leading-none ${isHealthy ? 'text-green' : 'text-yellow'}`}>
            {isHealthy ? 'Système opérationnel' : `${total} erreur${total > 1 ? 's' : ''}`}
          </div>
          <div className="text-[11px] text-muted mt-[3px]">
            {isHealthy ? 'Aucune erreur 7 derniers jours' : 'Dernière erreur · récente'}
          </div>
        </div>
      </div>

      {isHealthy && (
        <p className="text-[12px] text-muted">
          Sentry surveille l'API et l'app. Les erreurs apparaîtront ici par ordre de fréquence.
        </p>
      )}

      <div className="text-center mt-3.5 pt-3 border-t border-border text-accent text-[11px] font-semibold cursor-pointer">
        {isHealthy ? 'Ouvrir Sentry' : `Voir les ${total} erreurs →`}
      </div>
    </WidgetShell>
  )
}

// ─── Activity Widget ──────────────────────────────────────────────────────────

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  IMPERSONATE_START: { icon: '🎭', color: 'bg-purple/10 text-purple', label: 'Impersonation démarrée' },
  ADD_NOTE:          { icon: '📝', color: 'bg-blue/10 text-blue',     label: 'Note ajoutée'           },
  CENTRE_SUSPEND:    { icon: '⏸',  color: 'bg-red/10 text-red',       label: 'Centre suspendu'        },
  CENTRE_REACTIVATE: { icon: '▶',  color: 'bg-green/10 text-green',   label: 'Centre réactivé'        },
}

function ActivityWidget({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <WidgetShell icon="⚡" title="Activité récente" action="Tout voir →">
      {entries.length === 0 ? (
        <p className="text-[13px] text-muted">Aucune activité récente</p>
      ) : (
        <div className="flex flex-col">
          {entries.map(e => {
            const meta = ACTION_META[e.action] ?? { icon: '•', color: 'bg-muted/10 text-muted', label: e.action }
            return (
              <div key={e.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0 text-[13px]">
                <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[14px] flex-shrink-0 ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px]">
                    {meta.label} <span className="text-accent">#{e.targetId}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {e.targetType} · {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: fr })}
                    {e.ip && ` · ${e.ip}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </WidgetShell>
  )
}

// ─── Top Centres ──────────────────────────────────────────────────────────────

function TopCentresWidget({ centres }: { centres: TopCentre[] }) {
  const rankClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow/15 text-yellow'
    if (rank === 2) return 'bg-muted/20 text-muted'
    if (rank === 3) return 'bg-accent/15 text-accent'
    return 'bg-surface2 text-muted'
  }

  return (
    <WidgetShell icon="🏆" title="Top 5 centres (engagement 30j)">
      {centres.length === 0 ? (
        <p className="text-[13px] text-muted">Aucune donnée</p>
      ) : (
        <div className="flex flex-col">
          {centres.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
              <div className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center font-syne flex-shrink-0 ${rankClass(i + 1)}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate">{c.nom}</div>
                <div className="text-[11px] text-muted truncate">
                  {c.adresse ? c.adresse.split(',').pop()?.trim().replace(/^\d+\s*/, '') : '—'} · {c.totalUsers} users · {c.pointages30j} pointages
                </div>
              </div>
              <div className="font-syne font-extrabold text-[14px] text-green">{c.engagement}%</div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

// ─── Module Adoption ──────────────────────────────────────────────────────────

function ModuleAdoptionWidget() {
  return (
    <WidgetShell icon="📦" title="Adoption modules">
      <div className="flex flex-col">
        {MODULE_ADOPTION.map(m => (
          <div key={m.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
            <div className="text-[13px] font-semibold">
              <span className="mr-1.5">{m.icon}</span>{m.label}
            </div>
            <div className="flex-1 mx-4 h-1.5 bg-surface2 rounded-full overflow-hidden max-w-[160px]">
              <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
            </div>
            <div className="font-syne font-bold text-[13px] text-text min-w-[36px] text-right">{m.pct}%</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  )
}
