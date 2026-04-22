'use client'

import type { SentryIssue } from '@/types/superadmin'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  issues: SentryIssue[]
}

const LEVEL_COLOR: Record<string, string> = {
  error:   'var(--red)',
  warning: 'var(--yellow)',
  info:    'var(--blue)',
}

export default function CentreDetailErrors({ issues }: Props) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Erreurs Sentry ({issues.length})</p>

      {issues.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--green)' }}>Aucune erreur Sentry sur ce centre ✓</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {issues.map(issue => (
          <div key={issue.id} style={{
            padding: '10px 0', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {issue.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Dernière vue {formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true, locale: fr })}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 10, color: LEVEL_COLOR[issue.level] ?? 'var(--muted)' }}>
                {issue.level}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{issue.count}×</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
