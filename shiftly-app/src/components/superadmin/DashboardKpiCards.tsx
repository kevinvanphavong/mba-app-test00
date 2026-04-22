'use client'

import type { DashboardKPIs } from '@/types/superadmin'

interface Props {
  data: DashboardKPIs
}

const cards = (d: DashboardKPIs) => [
  { label: 'Centres actifs',  value: d.totalCentres,                  color: 'var(--blue)'   },
  { label: 'MRR',             value: `${d.mrr.toLocaleString('fr')} €`, color: 'var(--green)' },
  { label: 'Utilisateurs',    value: d.totalUsers,                    color: 'var(--accent)' },
  { label: 'Erreurs 7j',      value: d.sentryStats.total,             color: 'var(--red)'    },
]

export default function DashboardKpiCards({ data }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {cards(data).map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Syne, sans-serif' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}
