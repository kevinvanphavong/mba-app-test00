'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  useSuperAdminUsers,
  useSuperAdminUsersStats,
  useSuperAdminUserDetail,
  useResetUserPassword,
  useDisableUser,
  useEnableUser,
} from '@/hooks/useSuperAdminUsers'
import { useSuperAdminCentres, useImpersonate } from '@/hooks/useSuperAdminCentres'
import { useToastStore } from '@/store/toastStore'
import type { GlobalUser } from '@/types/superadmin'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initialsOf = (u: { prenom: string | null; nom: string }) =>
  `${(u.prenom ?? '').charAt(0)}${u.nom.charAt(0)}`.toUpperCase()

const avatarColor = (u: GlobalUser): string => {
  if (u.avatarColor) return u.avatarColor
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899']
  return colors[u.id % colors.length]
}

function lastLoginLabel(iso: string | null): { label: string; kind: 'online' | 'recent' | 'old' | 'never' } {
  if (!iso) return { label: 'Jamais connecté', kind: 'never' }
  const date = new Date(iso)
  const diffMin = (Date.now() - date.getTime()) / 60000

  if (diffMin < 5)            return { label: 'En ligne',                                                       kind: 'online' }
  if (diffMin < 60 * 24)      return { label: `il y a ${formatDistanceToNow(date, { locale: fr })}`,            kind: 'recent' }
  return { label: `il y a ${formatDistanceToNow(date, { locale: fr })}`, kind: 'old' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role,   setRole]   = useState('')
  const [centre, setCentre] = useState('')
  const [statut, setStatut] = useState('')
  const [sort,   setSort]   = useState('lastLogin')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const stats   = useSuperAdminUsersStats()
  const users   = useSuperAdminUsers({ search, role, centre, statut, sort })
  const centres = useSuperAdminCentres()

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-3.5">
        <div>
          <h1 className="font-syne font-extrabold text-[24px]">Utilisateurs</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Vue globale de tous les utilisateurs, tous centres confondus
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-3 mb-5 max-[1100px]:grid-cols-2">
        <Stat label="Total"           value={stats.data?.total       ?? 0} color="text-text"   />
        <Stat label="Managers"        value={stats.data?.managers    ?? 0} color="text-accent" />
        <Stat label="Employés"        value={stats.data?.employes    ?? 0} color="text-blue"   />
        <Stat label="Actifs 7 jours"  value={stats.data?.actifs7j    ?? 0} color="text-green"  />
        <Stat label="Inactifs 30j+"   value={stats.data?.inactifs30j ?? 0} color="text-red"    />
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
            placeholder="Rechercher par nom, prénom, email..."
            className="w-full bg-surface2 border border-border text-text py-2 pl-9 pr-3.5 rounded-lg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <select value={centre} onChange={e => setCentre(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Tous les centres</option>
          {(centres.data ?? []).map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <select value={role} onChange={e => setRole(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Tous les rôles</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYE">Employé</option>
        </select>

        <select value={statut} onChange={e => setStatut(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="">Tous statuts</option>
          <option value="actif">Actifs 7 jours</option>
          <option value="inactif">Inactifs 30j+</option>
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-surface2 text-text border border-border py-2 px-3 rounded-lg text-[13px]">
          <option value="lastLogin">Tri : Dernière connexion</option>
          <option value="joinDate">Tri : Date d'inscription</option>
          <option value="name">Tri : Nom</option>
        </select>
      </div>

      {/* Table + Drawer grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        {/* Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {users.isLoading && <div className="p-8 text-center text-muted text-[13px]">Chargement…</div>}
          {users.isError   && <div className="p-8 text-center text-red text-[13px]">Erreur de chargement</div>}
          {!users.isLoading && users.data?.length === 0 && (
            <div className="p-8 text-center text-muted text-[13px]">Aucun utilisateur trouvé</div>
          )}
          {users.data && users.data.length > 0 && (
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  <Th>Utilisateur</Th>
                  <Th>Centre</Th>
                  <Th>Rôle</Th>
                  <Th>Dernière connexion</Th>
                </tr>
              </thead>
              <tbody>
                {users.data.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    selected={selectedUserId === u.id}
                    onSelect={() => setSelectedUserId(u.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Drawer */}
        <UserDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      </div>
    </>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-3 px-3.5">
      <div className="text-[10px] text-muted uppercase tracking-[0.8px] font-bold">{label}</div>
      <div className={`font-syne font-extrabold text-[20px] mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-3 px-4 bg-surface2 text-[10px] text-muted uppercase tracking-[1px] font-bold border-b border-border">
      {children}
    </th>
  )
}

function UserRow({ user, selected, onSelect }: { user: GlobalUser; selected: boolean; onSelect: () => void }) {
  const login = lastLoginLabel(user.lastLoginAt)
  const loginColor = {
    online: 'text-green',
    recent: 'text-text',
    old:    'text-muted',
    never:  'text-red',
  }[login.kind]

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-border/50 transition ${selected ? 'bg-accent/5' : 'hover:bg-accent/5'}`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{ background: avatarColor(user) }}
          >
            {initialsOf(user)}
          </div>
          <div>
            <div className="font-semibold">{user.prenom ? `${user.prenom} ${user.nom}` : user.nom}</div>
            <div className="text-[10px] text-muted">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-muted">{user.centre?.nom ?? '—'}</td>
      <td className="py-3 px-4">
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${user.role === 'MANAGER' ? 'bg-accent/15 text-accent' : user.role === 'SUPERADMIN' ? 'bg-purple/15 text-purple' : 'bg-muted/15 text-muted'}`}>
          {user.role === 'MANAGER' ? 'Manager' : user.role === 'SUPERADMIN' ? 'SuperAdmin' : 'Employé'}
        </span>
      </td>
      <td className={`py-3 px-4 text-[12px] ${loginColor}`}>
        <span className="inline-flex items-center gap-1.5">
          {login.kind === 'online' && <span className="w-[7px] h-[7px] rounded-full bg-green inline-block" />}
          {login.label}
        </span>
      </td>
    </tr>
  )
}

// ─── User Drawer ──────────────────────────────────────────────────────────────

function UserDrawer({ userId, onClose }: { userId: number | null; onClose: () => void }) {
  const router = useRouter()
  const toast  = useToastStore(s => s.show)
  const detail = useSuperAdminUserDetail(userId)

  const resetPassword = useResetUserPassword()
  const disableUser   = useDisableUser()
  const enableUser    = useEnableUser()
  const impersonate   = useImpersonate()

  if (!userId) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center text-muted text-[13px] min-h-[300px] flex items-center justify-center">
        Sélectionnez un utilisateur pour voir son profil
      </div>
    )
  }

  if (detail.isLoading || !detail.data) {
    return <div className="bg-surface border border-border rounded-xl p-6 text-muted text-[13px]">Chargement…</div>
  }

  const u = detail.data
  const login = lastLoginLabel(u.lastLoginAt)

  const handleResetPassword = () => {
    if (!confirm('Générer un nouveau mot de passe temporaire pour cet utilisateur ?')) return
    resetPassword.mutate(userId, {
      onSuccess: (d) => {
        toast(`Nouveau mot de passe : ${d.newPassword} (à transmettre)`, 'success')
      },
      onError: () => toast('Erreur lors de la réinitialisation', 'error'),
    })
  }

  const handleToggle = () => {
    const fn = u.actif ? disableUser : enableUser
    fn.mutate(userId, {
      onSuccess: () => toast(u.actif ? 'Utilisateur désactivé' : 'Utilisateur activé', 'success'),
    })
  }

  const handleImpersonate = () => {
    if (!u.centre) return
    impersonate.mutate(u.centre.id, { onSuccess: () => router.push('/service') })
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden sticky top-6">
      <div className="py-4 px-5 border-b border-border flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[15px] font-bold"
            style={{ background: avatarColor(u) }}
          >
            {initialsOf(u)}
          </div>
          <div>
            <div className="font-syne font-extrabold text-[16px]">{u.prenom ? `${u.prenom} ${u.nom}` : u.nom}</div>
            <div className="text-[11px] text-muted">{u.email}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-text text-[18px] leading-none">×</button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Infos */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.8px] text-muted font-bold mb-1.5">Profil</div>
          <InfoLine label="Rôle"             value={u.role === 'MANAGER' ? 'Manager' : u.role === 'SUPERADMIN' ? 'SuperAdmin' : 'Employé'} />
          <InfoLine label="Centre"           value={u.centreDetail?.nom ?? '—'} />
          <InfoLine label="Statut"           value={u.actif ? 'Actif' : 'Désactivé'} />
          <InfoLine label="Inscrit le"       value={format(new Date(u.createdAt), 'd MMM yyyy', { locale: fr })} />
          <InfoLine label="Dernière connexion" value={login.label} />
          {u.heuresHebdo !== null && <InfoLine label="Heures/sem."     value={`${u.heuresHebdo}h`} />}
          {u.typeContrat       && <InfoLine label="Type de contrat" value={u.typeContrat} />}
          {u.codePointage      && <InfoLine label="Code pointage"   value={u.codePointage} />}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          {u.centre && u.role !== 'SUPERADMIN' && (
            <button
              onClick={handleImpersonate}
              disabled={impersonate.isPending}
              className="px-3.5 py-2 rounded-lg text-[12px] font-semibold bg-gradient-to-br from-accent to-accent-light text-white hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition disabled:opacity-60"
            >
              🎭 Se connecter au centre
            </button>
          )}
          <button
            onClick={handleResetPassword}
            disabled={resetPassword.isPending}
            className="px-3.5 py-2 rounded-lg text-[12px] font-semibold border border-border bg-transparent text-text hover:border-accent hover:text-accent transition disabled:opacity-60"
          >
            🔒 Réinitialiser le mot de passe
          </button>
          <button
            onClick={handleToggle}
            disabled={disableUser.isPending || enableUser.isPending}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold border transition disabled:opacity-60 ${u.actif ? 'border-red/30 text-red hover:bg-red/10' : 'border-green/30 text-green hover:bg-green/10'}`}
          >
            {u.actif ? '⏸ Désactiver le compte' : '▶ Réactiver le compte'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-[12px] border-b border-border/50 last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}
