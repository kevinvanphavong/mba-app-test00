'use client'

import type { AuditLogEntry } from '@/types/superadmin'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ACTION_LABELS: Record<string, string> = {
  IMPERSONATE_START: 'Impersonation démarrée',
  CENTRE_SUSPEND:    'Centre suspendu',
  CENTRE_REACTIVATE: 'Centre réactivé',
  ADD_NOTE:          'Note ajoutée',
}

interface Props {
  entries: AuditLogEntry[]
}

export default function RecentActivityWidget({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Activité récente</p>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>Aucune activité</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Activité récente</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                {ACTION_LABELS[e.action] ?? e.action}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                {e.targetType} #{e.targetId} · {e.ip}
              </p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: fr })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
