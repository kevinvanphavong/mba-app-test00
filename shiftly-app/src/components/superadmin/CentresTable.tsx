'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSuperAdminCentres } from '@/hooks/useSuperAdminCentres'

export default function CentresTable() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const { data, isLoading, isError } = useSuperAdminCentres(search, statut)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un centre…"
          style={{
            flex: 1,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
          }}
        />
        <select
          value={statut}
          onChange={e => setStatut(e.target.value)}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {isLoading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Chargement…</p>}
      {isError   && <p style={{ color: 'var(--red)',   fontSize: 13 }}>Erreur de chargement</p>}

      {data && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nom', 'Adresse', 'Utilisateurs', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(centre => (
              <tr key={centre.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{centre.nom}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'var(--muted)' }}>{centre.adresse ?? '—'}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'var(--text)' }}>{centre.totalUsers}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 999,
                    background: centre.actif ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: centre.actif ? 'var(--green)' : 'var(--red)',
                  }}>
                    {centre.actif ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <Link
                    href={`/superadmin/centres/${centre.id}`}
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    Détail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data?.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          Aucun centre trouvé
        </p>
      )}
    </div>
  )
}
