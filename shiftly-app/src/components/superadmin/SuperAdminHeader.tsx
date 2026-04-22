'use client'

import { useSuperAdminStore } from '@/store/superAdminStore'
import { useSuperAdminLogout } from '@/hooks/useSuperAdminAuth'

export default function SuperAdminHeader() {
  const user   = useSuperAdminStore(s => s.user)
  const logout = useSuperAdminLogout()

  return (
    <header style={{
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
        Back-office SuperAdmin
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && (
          <span style={{ fontSize: 13, color: 'var(--text)' }}>
            {user.prenom} {user.nom}
          </span>
        )}
        <button
          onClick={logout}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  )
}
