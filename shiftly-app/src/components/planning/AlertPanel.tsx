'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { expandVariants, listItemVariants } from '@/lib/animations'
import type { PlanningAlerte } from '@/types/planning'

interface AlertPanelProps {
  alertes: PlanningAlerte[]
  show:    boolean
}

const PREVIEW = 2

const ICONE: Record<string, string> = {
  haute:   '🔴',
  moyenne: '🟡',
}

const LABEL: Record<string, string> = {
  ZONE_NON_COUVERTE:  'Zone non couverte',
  SANS_PAUSE:         'Sans pause',
  DEPASSEMENT_HEURES: 'Dépassement horaire',
  SOUS_PLANIFIE:      'Sous-planifié',
  MAX_JOURNALIER:     'Durée journalière max',
  MAX_HEBDO_ABSOLU:   'Durée hebdo absolue max',
  MAX_HEBDO_MOYENNE:  'Moyenne hebdo sur 12 semaines',
  REPOS_QUOTIDIEN:    'Repos quotidien insuffisant',
  REPOS_HEBDO:        'Repos hebdomadaire insuffisant',
  PAUSE_6H:           'Pause obligatoire (>6h)',
}

function AlerteItem({ alerte }: { alerte: PlanningAlerte }) {
  return (
    <motion.li variants={listItemVariants} className="flex items-start gap-3 px-4 py-3.5 md:px-5">
      <span className="mt-0.5 shrink-0 text-base leading-none">
        {ICONE[alerte.severite] ?? '⚪'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <p className="text-xs font-semibold text-[var(--text)]">
            {LABEL[alerte.type] ?? alerte.type}
          </p>
          {alerte.date && (
            <span className="shrink-0 text-[11px] text-[var(--muted)]">
              {new Date(alerte.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">{alerte.message}</p>
        {alerte.baseLegale && (
          <p className="mt-1 rounded-md bg-[var(--surface)] px-2 py-1 text-[10px] font-medium text-[var(--muted)] opacity-80">
            {alerte.baseLegale}
          </p>
        )}
      </div>
    </motion.li>
  )
}

// ─── Liste avec aperçu + toggle ───────────────────────────────────────────────

function CollapseList({ items }: { items: PlanningAlerte[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible  = expanded ? items : items.slice(0, PREVIEW)
  const hasMore  = items.length > PREVIEW
  const hidden   = items.length - PREVIEW

  return (
    <div className="relative">
      <ul className="divide-y divide-[var(--border)]">
        {visible.map((a, i) => <AlerteItem key={i} alerte={a} />)}
      </ul>

      {hasMore && !expanded && (
        <div className="relative border-t border-[var(--border)]">
          {/* dégradé remontant sur le dernier item */}
          <div className="pointer-events-none absolute bottom-full left-0 right-0 h-14 bg-gradient-to-t from-[var(--surface2)] to-transparent" />
          <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            {hidden} de plus · Voir tout ↓
          </button>
        </div>
      )}

      {hasMore && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--border)] py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          Réduire ↑
        </button>
      )}
    </div>
  )
}

// ─── Panneau principal ────────────────────────────────────────────────────────

/** Panneau d'alertes dépliable — deux sections : métier et légales ⚖️ */
export default function AlertPanel({ alertes, show }: AlertPanelProps) {
  const alertesMetier = alertes.filter(a => !a.categorie || a.categorie === 'metier')
  const alertesLegal  = alertes.filter(a => a.categorie === 'legal')

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="alert-panel"
          variants={expandVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface2)]"
        >
          {alertes.length === 0 ? (
            <div className="flex items-center gap-2 px-5 py-4 text-sm text-[var(--muted)]">
              <span>✅</span>
              <span>Aucune alerte cette semaine</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Section alertes métier */}
              {alertesMetier.length > 0 && (
                <div>
                  <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Alertes métier
                    </p>
                  </div>
                  <CollapseList items={alertesMetier} />
                </div>
              )}

              {/* Section alertes légales */}
              {alertesLegal.length > 0 && (
                <div className={alertesMetier.length > 0 ? 'border-t-2 border-[var(--border)]' : ''}>
                  <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                      Alertes légales ⚖️
                    </p>
                  </div>
                  <CollapseList items={alertesLegal} />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
