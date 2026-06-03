import type { ReactNode } from 'react'
import RevealSection from './RevealSection'

type Module = {
  icon: ReactNode
  title: string
  desc: string
  tag: 'Production' | 'Bientôt'
}

const SVG = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={d} />
  </svg>
)

const MODULES: Module[] = [
  {
    icon: SVG('M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'),
    title: 'Service du Jour',
    desc: 'La page la plus utilisée. Live des zones, missions cochables, avancement temps réel, incidents en un clic. Mobile-first.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Planning & Services',
    desc: 'Plannification semaine, services type, duplication intelligente. Vue manager et vue équipe. Conflits de zones détectés.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Pointage temps réel',
    desc: 'Tablette en kiosk-mode, code PIN, photo de pointage. Validation hebdo conforme IDCC 1790. Export paie en 2 clics.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 17l9 4 9-4M3 12l9 4 9-4" />
      </svg>
    ),
    title: 'Postes & Missions',
    desc: 'Catalogue de zones, missions et compétences. Drag & drop des affectations. Catégories Ouverture / Pendant / Ménage / Fermeture.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'Staff & Compétences',
    desc: 'Fiches équipe, validation des compétences par zone, niveaux, progression. Système de points pour fidéliser.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
    title: 'HACCP intégré',
    desc: 'Relevés de températures, traçabilité produit, plan de nettoyage, alertes DDPP. Dossier sanitaire toujours prêt.',
    tag: 'Bientôt',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    title: 'Tutoriels & Formation',
    desc: 'Formation interne intégrée. Chaque collaborateur apprend ses postes à son rythme. Vous voyez qui a lu quoi.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h18v18H3z" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    title: 'Réservations & CSE',
    desc: 'Gestion des entreprises clientes, réservations groupes, anniversaires, CSE. Pour ne plus rien laisser passer.',
    tag: 'Production',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    title: 'Multi-centre',
    desc: 'Pilotez 2, 5, 20 centres depuis un seul compte. Vues consolidées, KPI par centre, accès cloisonnés. Pensé pour le scaling.',
    tag: 'Production',
  },
]

// 9 modules sur fond sombre — section de rythme visuel après le bloc sand.
export default function ModulesGrid() {
  return (
    <RevealSection className="mkt-section mkt-section-dark" id="modules">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">🧩 Les modules</div>
          <h2 className="mkt-section-title">Tout ce qu&apos;il faut pour faire tourner un parc.</h2>
          <p className="mkt-section-subtitle">
            9 modules connectés. Chacun pensé pour un cas d&apos;usage précis du métier. Aucun
            gras inutile.
          </p>
        </div>
        <div className="mkt-modules-grid">
          {MODULES.map((m) => (
            <div className="mkt-module-card" key={m.title}>
              <div className="mkt-module-icon">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className={`mkt-module-tag ${m.tag === 'Bientôt' ? 'is-soon' : ''}`}>
                {m.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  )
}
