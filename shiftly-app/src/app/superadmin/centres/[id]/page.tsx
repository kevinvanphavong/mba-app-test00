'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSuperAdminCentreDetail } from '@/hooks/useSuperAdminCentreDetail'
import {
  useImpersonate,
  useSuspendCentre,
  useReactivateCentre,
  useAddCentreNote,
} from '@/hooks/useSuperAdminCentres'
import type { CentreDetail, CentreUserSummary, SentryIssue, CentreNote } from '@/types/superadmin'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CENTRE_EMOJIS = ['🎳', '🎮', '🎯', '🎤', '🥽', '🌌', '🕹', '🏎', '🎪', '🎨']
const emojiFor = (id: number) => CENTRE_EMOJIS[id % CENTRE_EMOJIS.length]

const formatCentreId = (id: number) => `#C-${String(id).padStart(3, '0')}`

const cityFrom = (adresse: string | null): string => {
  if (!adresse) return '—'
  return adresse.split(',').pop()?.trim().replace(/^\d+\s*/, '') || '—'
}

const initialsOf = (prenom: string | null, nom: string) =>
  `${(prenom ?? '').charAt(0)}${nom.charAt(0)}`.toUpperCase()

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string }
}

export default function SuperAdminCentreDetailPage({ params }: Props) {
  const centreId = Number(params.id)
  const { data, isLoading, isError } = useSuperAdminCentreDetail(centreId)

  if (isLoading) return <p className="text-muted text-sm">Chargement…</p>
  if (isError || !data) return <p className="text-red text-sm">Centre introuvable</p>

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted mb-4">
        <Link href="/superadmin" className="hover:text-accent">SuperAdmin</Link>
        <span className="opacity-40">/</span>
        <Link href="/superadmin/centres" className="hover:text-accent">Centres</Link>
        <span className="opacity-40">/</span>
        <span className="text-text font-semibold">{data.nom}</span>
      </div>

      <CentreHeader centre={data} />
      <MiniKpis centre={data} />

      {/* Content Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <div>
          <InfoPanel     centre={data} />
          <UsersPanel    users={data.users} totalUsers={data.totalUsers} />
          <ErrorsPanel   issues={data.sentryIssues} />
        </div>

        <div>
          <NotesPanel    centreId={centreId} notes={data.notes} />
          <ActivityPanel />
          <DangerZone    centreId={centreId} actif={data.actif} />
        </div>
      </div>
    </>
  )
}

// ─── Centre Header ────────────────────────────────────────────────────────────

function CentreHeader({ centre }: { centre: CentreDetail }) {
  const router      = useRouter()
  const impersonate = useImpersonate()
  const addNote     = useAddCentreNote()
  const [noteOpen, setNoteOpen] = useState(false)

  const handleImpersonate = () => {
    impersonate.mutate(centre.id, { onSuccess: () => router.push('/service') })
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] p-[22px] mb-[18px] flex justify-between items-start gap-5 flex-wrap">
      <div className="flex gap-4 items-center flex-1 min-w-[300px]">
        <div className="w-16 h-16 bg-gradient-to-br from-surface2 to-surface3 border border-border rounded-[14px] flex items-center justify-center text-[30px] flex-shrink-0">
          {emojiFor(centre.id)}
        </div>
        <div>
          <h1 className="font-syne font-extrabold text-[24px] mb-1 flex items-center gap-2.5 flex-wrap">
            {centre.nom}
            <StatusBadge actif={centre.actif} />
          </h1>
          <div className="text-muted text-[13px] flex gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5">📍 {cityFrom(centre.adresse)}</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">🆔 {formatCentreId(centre.id)}</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              📅 Inscrit le {format(new Date(centre.createdAt), 'd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {centre.telephone && (
          <a href={`tel:${centre.telephone}`} className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold border border-border text-text bg-transparent hover:border-accent hover:text-accent transition inline-flex items-center gap-1.5">
            📞 Contacter
          </a>
        )}
        <button
          onClick={() => setNoteOpen(v => !v)}
          className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold border border-border text-text bg-transparent hover:border-accent hover:text-accent transition inline-flex items-center gap-1.5"
        >
          📝 Ajouter note
        </button>
        <button
          onClick={handleImpersonate}
          disabled={impersonate.isPending}
          className="px-4 py-2.5 rounded-[9px] text-[13px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          🎭 {impersonate.isPending ? 'Connexion…' : 'Se connecter en tant que manager'}
        </button>
      </div>

      {noteOpen && (
        <QuickAddNote
          onSave={(contenu) => addNote.mutate({ centreId: centre.id, contenu }, { onSuccess: () => setNoteOpen(false) })}
          pending={addNote.isPending}
        />
      )}
    </div>
  )
}

function QuickAddNote({ onSave, pending }: { onSave: (c: string) => void; pending: boolean }) {
  const [contenu, setContenu] = useState('')
  return (
    <div className="w-full mt-2 flex flex-col gap-2">
      <textarea
        value={contenu}
        onChange={e => setContenu(e.target.value)}
        placeholder="Votre note interne…"
        className="w-full bg-surface2 border border-border text-text py-2 px-3 rounded-lg text-[12px] font-sans min-h-[60px] resize-y focus:outline-none focus:border-accent"
      />
      <button
        onClick={() => contenu.trim() && onSave(contenu.trim())}
        disabled={pending || !contenu.trim()}
        className="self-start px-4 py-2 rounded-[9px] text-[12px] font-semibold border border-border text-text hover:border-accent hover:text-accent transition disabled:opacity-60"
      >
        {pending ? 'Enregistrement…' : 'Enregistrer la note'}
      </button>
    </div>
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

// ─── Mini KPIs ────────────────────────────────────────────────────────────────

function MiniKpis({ centre }: { centre: CentreDetail }) {
  const managers = centre.users.filter(u => u.role === 'MANAGER').length
  const sentryCount = centre.sentryIssues.length

  const kpis = [
    { label: 'Employés',             value: centre.totalUsers,      color: 'text-blue',   trend: { label: `dont ${managers} manager${managers > 1 ? 's' : ''}`, kind: 'muted' } },
    { label: 'Pointages (30j)',      value: centre.pointages30j,    color: 'text-text',   trend: { label: centre.pointages30j > 0 ? 'Données réelles' : 'Aucun pointage', kind: centre.pointages30j > 0 ? 'up' : 'muted' } },
    { label: 'Revenus mensuels',     value: `${centre.mrr}€`,       color: 'text-green',  trend: { label: 'Stripe (Phase 2)', kind: 'muted' } },
    { label: "Taux d'engagement",    value: `${centre.engagement}%`, color: 'text-accent', trend: { label: centre.engagement >= 70 ? 'Très bon' : centre.engagement >= 40 ? 'Correct' : 'Faible', kind: centre.engagement >= 70 ? 'up' : centre.engagement >= 40 ? 'muted' : 'down' } },
    { label: 'Erreurs (7 jours)',    value: sentryCount,            color: 'text-red',    trend: { label: sentryCount === 0 ? 'Aucune erreur' : 'À investiguer',      kind: sentryCount === 0 ? 'up' : 'down' } },
  ] as const

  return (
    <div className="grid grid-cols-5 gap-3 mb-[18px] max-[1100px]:grid-cols-2">
      {kpis.map(k => (
        <div key={k.label} className="bg-surface border border-border rounded-[10px] p-3.5 px-4">
          <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold mb-1.5">{k.label}</div>
          <div className={`font-syne font-extrabold text-[22px] leading-none ${k.color}`}>{k.value}</div>
          <div className={`text-[10px] mt-1.5 ${k.trend.kind === 'up' ? 'text-green' : k.trend.kind === 'down' ? 'text-red' : 'text-muted'}`}>
            {k.trend.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Panel shell ──────────────────────────────────────────────────────────────

function Panel({ icon, title, action, children }: { icon: string; title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden mb-[18px]">
      <div className="flex justify-between items-center py-3.5 px-[18px] border-b border-border">
        <div className="font-syne font-bold text-[14px] flex items-center gap-2">
          <span>{icon}</span> {title}
        </div>
        {action && <span className="text-[11px] text-accent font-semibold cursor-pointer">{action}</span>}
      </div>
      <div className="py-3.5 px-[18px]">{children}</div>
    </div>
  )
}

// ─── Info Panel ───────────────────────────────────────────────────────────────

function InfoPanel({ centre }: { centre: CentreDetail }) {
  const manager = centre.users.find(u => u.role === 'MANAGER')

  return (
    <Panel icon="📋" title="Informations générales">
      <InfoRow label="Nom"                value={centre.nom} />
      <InfoRow label="Identifiant interne" value={<code className="bg-surface2 text-accent px-[7px] py-0.5 rounded font-mono text-[11px]">{formatCentreId(centre.id)}</code>} />
      {centre.adresse     && <InfoRow label="Adresse"           value={centre.adresse} />}
      {centre.telephone   && <InfoRow label="Téléphone"         value={centre.telephone} />}
      {centre.siteWeb     && <InfoRow label="Site web"          value={<a href={centre.siteWeb} target="_blank" rel="noreferrer" className="text-accent hover:underline">{centre.siteWeb}</a>} />}
      {manager            && <InfoRow label="Manager principal" value={`${manager.prenom ?? ''} ${manager.nom} · ${manager.email}`.trim()} />}
      <InfoRow label="Inscrit le" value={format(new Date(centre.createdAt), 'd MMMM yyyy', { locale: fr })} />
      <InfoRow label="Convention collective" value="IDCC 1790 (Espaces de loisirs)" />
    </Panel>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-border last:border-b-0 text-[13px] gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}

// ─── Users Panel ──────────────────────────────────────────────────────────────

function UsersPanel({ users, totalUsers }: { users: CentreUserSummary[]; totalUsers: number }) {
  const visible = users.slice(0, 5)
  const remaining = users.length - visible.length

  return (
    <Panel icon="👥" title={`Utilisateurs (${totalUsers})`} action="Voir tous →">
      {users.length === 0 ? (
        <p className="text-[13px] text-muted">Aucun utilisateur</p>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <tbody>
            {visible.map(u => {
              const isManager = u.role === 'MANAGER'
              return (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold ${isManager ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}>
                        {initialsOf(u.prenom, u.nom)}
                      </div>
                      <div>
                        <div className="font-semibold text-[13px]">{u.prenom ? `${u.prenom} ${u.nom}` : u.nom}</div>
                        <div className="text-[10px] text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isManager ? 'bg-accent/15 text-accent' : 'bg-muted/15 text-muted'}`}>
                      {isManager ? 'Manager' : 'Employé'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[11px] text-muted">
                    {u.actif ? (
                      <span className="inline-flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-green inline-block" /> Actif</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-surface2 border border-border inline-block" /> Inactif</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {remaining > 0 && (
              <tr>
                <td colSpan={3} className="text-center pt-3.5">
                  <span className="text-accent text-[12px] font-semibold cursor-pointer">+ {remaining} autre{remaining > 1 ? 's' : ''} utilisateur{remaining > 1 ? 's' : ''} →</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

// ─── Errors Panel ─────────────────────────────────────────────────────────────

function ErrorsPanel({ issues }: { issues: SentryIssue[] }) {
  return (
    <Panel icon="🐛" title="Erreurs (7 derniers jours)" action="Voir dans le tableau de bord ↗">
      {issues.length === 0 ? (
        <p className="text-[13px] text-green">Aucune erreur sur ce centre ✓</p>
      ) : (
        issues.map(issue => (
          <div key={issue.id} className="py-2.5 border-b border-border last:border-b-0">
            <div className="flex justify-between items-start gap-2.5 mb-1.5">
              <div className="text-[12px] font-semibold text-text font-mono flex-1 break-all">{issue.title}</div>
              <div className="bg-red text-white px-2 py-0.5 rounded-[10px] text-[10px] font-bold flex-shrink-0">×{issue.count}</div>
            </div>
            <div className="text-[10px] text-muted">
              Niveau {issue.level} · Dernière vue {formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true, locale: fr })}
            </div>
          </div>
        ))
      )}
    </Panel>
  )
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ centreId, notes }: { centreId: number; notes: CentreNote[] }) {
  const [contenu, setContenu] = useState('')
  const addNote = useAddCentreNote()

  const save = () => {
    if (!contenu.trim()) return
    addNote.mutate({ centreId, contenu: contenu.trim() }, { onSuccess: () => setContenu('') })
  }

  return (
    <Panel icon="📝" title="Notes internes">
      {notes.map(n => (
        <div key={n.id} className="bg-surface2 border border-border rounded-lg p-2.5 px-3 mb-2 text-[12px]">
          <div className="text-[10px] text-muted mb-1">
            {format(new Date(n.createdAt), "d MMMM yyyy · HH:mm", { locale: fr })}
          </div>
          <div>{n.contenu}</div>
        </div>
      ))}

      <textarea
        value={contenu}
        onChange={e => setContenu(e.target.value)}
        placeholder="Ajouter une note interne..."
        className="w-full bg-surface2 border border-border text-text py-2 px-3 rounded-lg text-[12px] min-h-[60px] resize-y focus:outline-none focus:border-accent"
      />
      <button
        onClick={save}
        disabled={addNote.isPending || !contenu.trim()}
        className="w-full mt-2 px-4 py-2 rounded-[8px] text-[12px] font-semibold border border-border text-text bg-transparent hover:border-accent hover:text-accent transition disabled:opacity-60"
      >
        {addNote.isPending ? 'Enregistrement…' : '+ Ajouter'}
      </button>
    </Panel>
  )
}

// ─── Activity Panel (mock Phase 1) ───────────────────────────────────────────

const MOCK_ACTIVITY = [
  { time: 'hier',  text: 'Nouvelle version déployée' },
  { time: 'hier',  text: 'Sauvegarde automatique effectuée' },
]

function ActivityPanel() {
  return (
    <Panel icon="⚡" title="Activité récente">
      {MOCK_ACTIVITY.map((a, i) => (
        <div key={i} className="flex gap-2.5 py-2.5 border-b border-border last:border-b-0 text-[12px]">
          <div className="text-muted text-[11px] min-w-[60px]">{a.time}</div>
          <div className="flex-1">{a.text}</div>
        </div>
      ))}
      <p className="text-[11px] text-muted text-center pt-3">Timeline détaillée en Phase 4</p>
    </Panel>
  )
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone({ centreId, actif }: { centreId: number; actif: boolean }) {
  const suspend    = useSuspendCentre()
  const reactivate = useReactivateCentre()

  return (
    <div className="bg-red/5 border border-red/20 rounded-[14px] p-[18px]">
      <h3 className="font-syne text-[13px] text-red uppercase tracking-[1px] mb-1.5">⚠️ Zone sensible</h3>
      <p className="text-[12px] text-muted mb-3">
        Actions impactant le centre. Toutes ces actions sont enregistrées dans l'historique.
      </p>
      <div className="flex flex-col gap-2">
        {actif ? (
          <button
            onClick={() => suspend.mutate(centreId)}
            disabled={suspend.isPending}
            className="bg-transparent text-red border border-red/30 py-2.5 px-3.5 rounded-lg text-[12px] font-semibold cursor-pointer text-left hover:bg-red/10 transition disabled:opacity-60"
          >
            ⏸ Suspendre le centre (lecture seule)
          </button>
        ) : (
          <button
            onClick={() => reactivate.mutate(centreId)}
            disabled={reactivate.isPending}
            className="bg-transparent text-green border border-green/30 py-2.5 px-3.5 rounded-lg text-[12px] font-semibold cursor-pointer text-left hover:bg-green/10 transition disabled:opacity-60"
          >
            ▶ Réactiver le centre
          </button>
        )}
        <button disabled className="bg-transparent text-red border border-red/30 py-2.5 px-3.5 rounded-lg text-[12px] font-semibold text-left opacity-50 cursor-not-allowed">
          🔒 Forcer reset mot de passe manager (Phase 3)
        </button>
        <button disabled className="bg-transparent text-red border border-red/30 py-2.5 px-3.5 rounded-lg text-[12px] font-semibold text-left opacity-50 cursor-not-allowed">
          📤 Exporter toutes les données (Phase 4)
        </button>
        <button disabled className="bg-transparent text-red border border-red/30 py-2.5 px-3.5 rounded-lg text-[12px] font-semibold text-left opacity-50 cursor-not-allowed">
          ❌ Résilier l'abonnement (Phase 2)
        </button>
      </div>
    </div>
  )
}
