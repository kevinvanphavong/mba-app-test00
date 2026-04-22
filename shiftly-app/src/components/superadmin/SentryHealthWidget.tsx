'use client'

import type { SentryStats } from '@/types/superadmin'

interface Props {
  stats: SentryStats
}

export default function SentryHealthWidget({ stats }: Props) {
  const status = stats.total === 0 ? 'green' : stats.total < 10 ? 'yellow' : 'red'
  const colors: Record<string, string> = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Santé Sentry (7 jours)</p>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: colors[status], display: 'inline-block',
        }} />
      </div>

      <p style={{ fontSize: 28, fontWeight: 700, color: colors[status], fontFamily: 'Syne, sans-serif' }}>
        {stats.total}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>erreurs sur 7 jours</p>

      {stats.topCentres.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Top centres impactés</p>
          {stats.topCentres.map(c => (
            <div key={c.centreId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text)' }}>Centre #{c.centreId}</span>
              <span style={{ color: 'var(--red)' }}>{c.count} erreurs</span>
            </div>
          ))}
        </div>
      )}

      {stats.total === 0 && (
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--green)' }}>Aucune erreur — tout va bien ✓</p>
      )}
    </div>
  )
}
