'use client'

import type { CentreDetail } from '@/types/superadmin'

interface Props {
  centre: CentreDetail
}

export default function CentreDetailHeader({ centre }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {centre.nom}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {centre.adresse ?? '—'}
          {centre.telephone && ` · ${centre.telephone}`}
          {centre.siteWeb && ` · ${centre.siteWeb}`}
        </p>
      </div>
      <span style={{
        fontSize: 12, padding: '5px 12px', borderRadius: 999,
        background: centre.actif ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        color: centre.actif ? 'var(--green)' : 'var(--red)',
        fontWeight: 600,
      }}>
        {centre.actif ? 'Actif' : 'Suspendu'}
      </span>
    </div>
  )
}
