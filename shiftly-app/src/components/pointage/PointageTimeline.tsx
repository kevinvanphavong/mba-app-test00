'use client'

import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import type { PointageEntry } from '@/types/pointage'

interface TimelineEvent {
  heure:    string    // ISO datetime
  texte:    string
  nom:      string
  couleur:  'green' | 'yellow' | 'red' | 'blue' | 'muted'
  pulse:    boolean
}

interface Props {
  pointages: PointageEntry[]
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function buildEvents(pointages: PointageEntry[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  for (const p of pointages) {
    const nom = p.user.prenom ? `${p.user.prenom} ${p.user.nom}` : p.user.nom

    if (p.heureArrivee) {
      events.push({
        heure:   p.heureArrivee,
        texte:   p.minutesRetard > 0 ? `Arrivée (retard +${p.minutesRetard} min)` : 'Arrivée',
        nom,
        couleur: p.minutesRetard > 0 ? 'yellow' : 'green',
        pulse:   false,
      })
    }

    for (const pause of p.pauses) {
      events.push({
        heure:   pause.heureDebut,
        texte:   `Début pause ${pause.type === 'REPAS' ? 'repas' : 'courte'}`,
        nom,
        couleur: 'yellow',
        pulse:   false,
      })
      if (pause.heureFin) {
        events.push({
          heure:   pause.heureFin,
          texte:   'Fin de pause',
          nom,
          couleur: 'green',
          pulse:   false,
        })
      }
    }

    if (p.heureDepart) {
      events.push({
        heure:   p.heureDepart,
        texte:   'Départ',
        nom,
        couleur: 'muted',
        pulse:   false,
      })
    }

    if (p.statut === 'ABSENT') {
      events.push({
        heure:   p.heureArrivee ?? new Date().toISOString(),
        texte:   'Marqué absent',
        nom,
        couleur: 'red',
        pulse:   false,
      })
    }
  }

  // Tri décroissant (plus récent en premier) + pulse sur le 1er
  events.sort((a, b) => new Date(b.heure).getTime() - new Date(a.heure).getTime())
  if (events.length > 0) events[0].pulse = true

  return events
}

export default function PointageTimeline({ pointages }: Props) {
  const events = buildEvents(pointages)

  if (!events.length) {
    return (
      <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
        Aucun événement pour l'instant
      </div>
    )
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-0 px-4 md:px-6"
    >
      {events.map((ev, i) => (
        <motion.div key={i} variants={listItemVariants} className="flex gap-3 py-2">
          {/* Ligne verticale + dot */}
          <div className="flex flex-col items-center gap-0" style={{ width: 16 }}>
            <div className={`timeline-dot ${ev.couleur} ${ev.pulse ? 'pulse' : ''} mt-1.5`} />
            {i < events.length - 1 && <div className="timeline-line flex-1 mt-1" style={{ minHeight: 16 }} />}
          </div>

          {/* Contenu */}
          <div className="pb-2 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {ev.texte}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {ev.nom} — {formatHeure(ev.heure)}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
