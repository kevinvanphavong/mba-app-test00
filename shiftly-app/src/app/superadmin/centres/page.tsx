'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSuperAdminCentres } from '@/hooks/useSuperAdminCentres'
import type { CentreSummary, CentrePlan } from '@/types/superadmin'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CENTRE_EMOJIS = ['🎳', '🎮', '🎯', '🎤', '🥽', '🌌', '🕹', '🏎', '🎪', '🎨']

function emojiFor(centreId: number): string {
  return CENTRE_EMOJIS[centreId % CENTRE_EMOJIS.length]
}

function formatId(id: number): string {
  return `#C-${String(id).padStart(3, '0')}`
}

function cityFrom(adresse: string | null): string {
  if (!adresse) return '—'
  const parts = adresse.split(',')
  return parts[parts.length - 1]?.trim().replace(/^\d+\s*/, '') || '—'
}

function timeLabel(iso: string | null): { label: string; kind: 'recent' | 'normal' | 'warning' | 'danger' } {
  if (!iso) return { label: 'Jamais', kind: 'danger' }
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = diffMs / 60000

  const label = `il y a ${formatDistanceToNow(date, { locale: fr })}`

  if (diffMin < 30)          return { label, kind: 'recent' }
  if (diffMin < 60 * 24)     return { label, kind: 'normal' }
  if (diffMin < 60 * 24 * 7) return { label, kind: 'warning' }
  return { label, kind: 'danger' }
}

const PLAN_META: Record<CentrePlan, { label: string; badge: string }> = {
  starter:    { label: 'Starter',    badge: 'bg-muted/15 text-muted'   },
  pro:        { label: 'Pro',        badge: 'bg-blue/15 text-blue'     },
  enterprise: { label: 'Enterprise', badge: 'bg-purple/15 text-purple' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminCentresPage() {
  const [search, setSearch] = useState('')
  const [plan,   setPlan]   = useState<string>('')
  const [statut, setStatut] = useState<string>('')
  const [tri,    setTri]    = useState<string>('activity')

  const { data = [], isLoading, isError } = useSuperAdminCentres(search, statut)

  const filtered = useMemo(() => {
    const byPlan = plan ? data.filter(c => c.plan === plan) : data
    const sorted = [...byPlan]
    switch (tri) {
      case 'mrr':  sorted.sort((a, b) => b.mrr - a.mrr);                           break
      case 'nom':  sorted.sort((a, b) => a.nom.localeCompare(b.nom));              break
      case 'date': sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break
      default:     sorted.sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''))
    }
    return sorted
  }, [data, plan, tri])

  const stats = useMemo(() => ({
    total:     data.length,
    mrr:       data.reduce((s, c) => s + c.mrr, 0),
    essai:     0,
    echeance:  0,
    suspendus: data.filter(c => !c.actif).length,
  }), [data])

  const actifs = stats.total - stats.suspendus

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-3.5">
        <div>
          <h1 className="font-syne font-extrabold text-[24px]">Centres clients</h1>
          <p className="text-[13px] text-muted mt-0.5">
            {stats.total} centre{stats.total > 1 ? 's' : ''} au total · {actifs} actif{actifs > 1 ? 's' : ''}
            {stats.essai > 0 ? ` · ${stats.essai} en essai` : ''}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold border border-border text-text bg-transparent hover:border-accent hover:text-accent transition inline-flex items-center gap-1.5">
            <span>📥</span> Exporter CSV
          </button>
          <button className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition inline-flex items-center gap-1.5">
            + Ajouter un centre
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <QuickStat label="Total centres"        value={stats.total}      color="text-text"   />
        <QuickStat label="Revenus mensuels"     value={`${stats.mrr} €`} color="text-green"  />
        <QuickStat label="Période d'essai"      value={stats.essai}      color="text-blue"   />
        <QuickStat label="Renouvellement < 30j" value={stats.echeance}   color="text-yellow" />
        <QuickStat label="Suspendus"            value={stats.suspendus}  color="text-red"    />
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-3.5 px-4 mb-3.5 flex gap-3 items-center flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, ville, manager..."
            className="w-full bg-surface2 border border-border text-text py-2 pl-9 pr-3.5 rounded-lg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <select value={plan} onChange={e => setPlan(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px] cursor-pointer">
          <option value="">Toutes les formules</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select value={statut} onChange={e => setStatut(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px] cursor-pointer">
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
        </select>

        <select value={tri} onChange={e => setTri(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px] cursor-pointer">
          <option value="activity">Tri : Dernière activité</option>
          <option value="mrr">Tri : Revenus</option>
          <option value="date">Tri : Date d'inscription</option>
          <option value="nom">Tri : Nom</option>
        </select>

        {plan && (
          <button
            onClick={() => setPlan('')}
            className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/30 px-2.5 py-1 rounded-[14px] text-[11px] font-semibold"
          >
            Formule : {PLAN_META[plan as CentrePlan]?.label} <span className="opacity-60 hover:opacity-100">×</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading && <div className="p-8 text-center text-muted text-[13px]">Chargement…</div>}
        {isError   && <div className="p-8 text-center text-red text-[13px]">Erreur de chargement</div>}

        {!isLoading && !isError && (
          <>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th active>Centre <span className="ml-1 text-[9px]">▼</span></Th>
                  <Th>Formule</Th>
                  <Th>Revenus</Th>
                  <Th>Employés</Th>
                  <Th>Pointages (30j)</Th>
                  <Th>Dernière activité</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => <Row key={c.id} centre={c} />)}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted text-[13px]">Aucun centre trouvé</div>
            )}

            <div className="flex justify-between items-center px-4 py-3 bg-surface2 border-t border-border text-[12px] text-muted">
              <div>Affichage de {filtered.length} centre{filtered.length > 1 ? 's' : ''} sur {data.length}</div>
              <div className="flex gap-1.5">
                <button className="px-2.5 py-1 bg-surface border border-border rounded-md text-muted hover:text-text hover:border-accent text-[12px] font-semibold">← Préc.</button>
                <button className="px-2.5 py-1 bg-accent border border-accent text-white rounded-md text-[12px] font-semibold">1</button>
                <button className="px-2.5 py-1 bg-surface border border-border rounded-md text-muted hover:text-text hover:border-accent text-[12px] font-semibold">Suiv. →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-3 px-3.5">
      <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold">{label}</div>
      <div className={`font-syne font-extrabold text-[20px] mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Th({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <th className={`text-left py-3 px-4 bg-surface2 text-[10px] uppercase tracking-[1px] font-bold border-b border-border cursor-pointer ${active ? 'text-accent' : 'text-muted'}`}>
      {children}
    </th>
  )
}

function Row({ centre }: { centre: CentreSummary }) {
  const time = timeLabel(centre.lastActivity)
  const timeColorClass = {
    recent:  'text-text',
    normal:  'text-muted',
    warning: 'text-yellow',
    danger:  'text-red',
  }[time.kind]

  return (
    <tr className="hover:bg-accent/5 transition-colors">
      <td className="py-3.5 px-4 border-b border-border/50">
        <Link href={`/superadmin/centres/${centre.id}`} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-[14px] flex-shrink-0">
            {emojiFor(centre.id)}
          </div>
          <div>
            <div className="font-semibold text-text">{centre.nom}</div>
            <div className="text-[10px] text-muted">
              {cityFrom(centre.adresse)} · {formatId(centre.id)}
            </div>
          </div>
        </Link>
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.5px] ${PLAN_META[centre.plan].badge}`}>
          {PLAN_META[centre.plan].label}
        </span>
      </td>

      <td className="py-3.5 px-4 border-b border-border/50 font-syne font-bold text-green">
        {centre.mrr > 0 ? `${centre.mrr}€` : '—'}
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">{centre.totalUsers}</td>
      <td className="py-3.5 px-4 border-b border-border/50">{centre.pointages30j.toLocaleString('fr')}</td>

      <td className={`py-3.5 px-4 border-b border-border/50 text-[12px] ${timeColorClass}`}>
        {time.label}
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <StatusBadge actif={centre.actif} />
      </td>

      <td className="py-3.5 px-4 border-b border-border/50">
        <div className="flex gap-1.5">
          <RowAction title="Voir le détail"            icon="👁" href={`/superadmin/centres/${centre.id}`} />
          <RowAction title="Se connecter au centre"    icon="🎭" />
          <RowAction title="Plus d'options"            icon="⋯" />
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ actif }: { actif: boolean }) {
  if (actif) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-green/15 text-green text-[10px] font-bold">
        <span className="text-[8px]">●</span> Actif
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-red/15 text-red text-[10px] font-bold">
      Suspendu
    </span>
  )
}

function RowAction({ title, icon, href }: { title: string; icon: string; href?: string }) {
  const className = 'w-7 h-7 rounded-md bg-surface2 border border-border flex items-center justify-center cursor-pointer text-muted text-[13px] hover:border-accent hover:text-accent hover:bg-surface transition'
  if (href) {
    return <Link href={href} title={title} className={className}>{icon}</Link>
  }
  return <button type="button" title={title} className={className}>{icon}</button>
}
