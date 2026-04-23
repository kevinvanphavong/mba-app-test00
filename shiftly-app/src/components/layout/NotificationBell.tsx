'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSupportNotifications } from '@/hooks/useSupport'

const STATUT_LABEL: Record<string, string> = {
  OUVERT:   'Ouvert',
  EN_COURS: 'En cours',
  RESOLU:   'Résolu',
  FERME:    'Fermé',
}

export default function NotificationBell() {
  const { data } = useSupportNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = data?.count ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-[16px] hover:border-accent transition"
        aria-label="Notifications"
      >
        🔔
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="py-3 px-4 border-b border-border">
            <div className="font-syne font-bold text-[14px]">Notifications</div>
            <div className="text-[11px] text-muted mt-0.5">
              {count === 0 ? 'Aucune nouvelle réponse' : `${count} ticket${count > 1 ? 's' : ''} avec nouvelle réponse`}
            </div>
          </div>

          {count === 0 ? (
            <div className="py-6 px-4 text-center text-[12px] text-muted">
              Tout est à jour ✓
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data?.tickets.map(t => (
                <Link
                  key={t.id}
                  href={`/reglages/support/${t.id}`}
                  onClick={() => setOpen(false)}
                  className="block py-3 px-4 hover:bg-accent/5 transition"
                >
                  <div className="text-[13px] font-semibold truncate">{t.sujet}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Statut : {STATUT_LABEL[t.statut] ?? t.statut}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/reglages/support"
            onClick={() => setOpen(false)}
            className="block py-2.5 px-4 text-center text-[12px] text-accent font-semibold border-t border-border hover:bg-accent/5 transition"
          >
            Voir tous mes tickets →
          </Link>
        </div>
      )}
    </div>
  )
}
