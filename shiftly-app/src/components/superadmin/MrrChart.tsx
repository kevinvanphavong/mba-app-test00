'use client'

const MOCK_MRR = [
  { mois: 'Oct', mrr: 0 },
  { mois: 'Nov', mrr: 0 },
  { mois: 'Déc', mrr: 0 },
  { mois: 'Jan', mrr: 0 },
  { mois: 'Fév', mrr: 0 },
  { mois: 'Mar', mrr: 0 },
  { mois: 'Avr', mrr: 0 },
]

const MAX = Math.max(...MOCK_MRR.map(d => d.mrr), 1)

export default function MrrChart() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Évolution MRR</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {MOCK_MRR.map(({ mois, mrr }) => (
          <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: '100%',
                height: Math.max((mrr / MAX) * 64, 4),
                background: 'var(--accent)',
                borderRadius: 4,
                opacity: 0.8,
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{mois}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        Données Stripe disponibles en Phase 2
      </p>
    </div>
  )
}
