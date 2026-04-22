'use client'

import type { CentreDetail } from '@/types/superadmin'

interface Props {
  centre: CentreDetail
}

export default function CentreDetailStats({ centre }: Props) {
  const managers  = centre.users.filter(u => u.role === 'MANAGER').length
  const employes  = centre.users.filter(u => u.role === 'EMPLOYE').length
  const inactifs  = centre.users.filter(u => !u.actif).length

  const stats = [
    { label: 'Total utilisateurs', value: centre.totalUsers  },
    { label: 'Managers',           value: managers           },
    { label: 'Employés',           value: employes           },
    { label: 'Inactifs',           value: inactifs           },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map(({ label, value }) => (
        <div key={label} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}
