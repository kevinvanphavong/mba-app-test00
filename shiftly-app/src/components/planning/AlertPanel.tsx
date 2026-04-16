'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { expandVariants, listVariants, listItemVariants } from '@/lib/animations'
import type { PlanningAlerte } from '@/types/planning'

interface AlertPanelProps {
  alertes: PlanningAlerte[]
  show:    boolean
}

const ICONE: Record<string, string> = {
  haute:   '🔴',
  moyenne: '🟡',
}

const LABEL: Record<string, string> = {
  ZONE_NON_COUVERTE:  'Zone non couverte',
  SANS_PAUSE:         'Sans pause',
  DEPASSEMENT_HEURES: 'Dépassement horaire',
  SOUS_PLANIFIE:      'Sous-planifié',
  JOUR_SANS_REPOS:    'Sans repos hebdo',
}

/** Panneau d'alertes dépliable sous la StatsBar */
export default function AlertPanel({ alertes, show }: AlertPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="alert-panel"
          variants={expandVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {alertes.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-4 text-sm text-[var(--muted)]">
                <span>✅</span>
                <span>Aucune alerte cette semaine</span>
              </div>
            ) : (
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-[var(--border)]"
              >
                {alertes.map((alerte, i) => (
                  <motion.li
                    key={i}
                    variants={listItemVariants}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <span className="mt-0.5 text-base leading-none">
                      {ICONE[alerte.severite] ?? '⚪'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text)]">
                        {LABEL[alerte.type] ?? alerte.type}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {alerte.message}
                      </p>
                    </div>
                    {alerte.date && (
                      <span className="shrink-0 text-[11px] text-[var(--muted)]">
                        {new Date(alerte.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </span>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
