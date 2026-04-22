'use client'

import type { CentreUserSummary } from '@/types/superadmin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  users: CentreUserSummary[]
}

export default function CentreDetailUsers({ users }: Props) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Utilisateurs ({users.length})</p>

      {users.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun utilisateur</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                {u.prenom} {u.nom}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 999,
                background: u.role === 'MANAGER' ? 'rgba(249,115,22,0.15)' : 'rgba(107,114,128,0.2)',
                color: u.role === 'MANAGER' ? 'var(--accent)' : 'var(--muted)',
              }}>
                {u.role}
              </span>
              {!u.actif && (
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>inactif</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
