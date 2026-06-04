import type { ReactNode } from 'react'
import RevealSection from './RevealSection'

type Module = {
  icon:     ReactNode
  title:    string
  problem:  string
  solution: string  // peut contenir un <strong> inline
}

// Textes source : maquette V4 lignes 1535-1599.
const MODULES: Module[] = [
  {
    title: '⚡ Service du Jour',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    problem:  'Le matin, votre manager passe 45 min à appeler les retardataires, briefer le staff à l\'oral et gribouiller un planning au tableau.',
    solution: 'il ouvre l\'app et voit qui est là, qui fait quoi, où en sont les missions. Le pilotage remplace le pompiérisme.',
  },
  {
    title: '📅 Planning & Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    problem:  'Vos plannings vivent sur un tableau effaçable, un Excel partagé, un groupe WhatsApp. Personne ne sait jamais qui est de fermeture le vendredi.',
    solution: 'planning hebdo digital, services-type duplicables, vue manager et vue staff. Les conflits sont détectés avant qu\'ils ne deviennent un problème.',
  },
  {
    title: '⏱️ Pointage & Validation hebdo',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    problem:  'Pointage au stylo, oublis, heures supp contestées, paie qui prend 4h chaque fin de mois. Et le risque Prud\'hommes en bruit de fond.',
    solution: 'kiosk-mode, code PIN, horodatage à la seconde, validation hebdo en 10 min, règles pensées pour la convention IDCC 1790 (heures supp, nuit, dimanche). Export paie en 2 clics.',
  },
  {
    title: '📋 Postes & Missions',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 17l9 4 9-4M3 12l9 4 9-4" />
      </svg>
    ),
    problem:  'Le staff arrive et demande "je commence par quoi ?". Le manager rebriefe la même chose tous les matins. Les missions critiques tombent à la trappe.',
    solution: 'fiche de poste digitale, missions du jour cochables sur mobile, organisées par moment du service (ouverture, pendant, fermeture).',
  },
  {
    title: '🎓 Staff & Compétences',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    problem:  'Le staff stagne, ne sait pas ce qu\'on attend de lui, ne voit aucune progression, et part au bout de 6 mois. Vous re-recrutez en boucle.',
    solution: 'compétences validables par zone, niveaux, points, progression visible. Le staff voit qu\'il monte, vous voyez qui peut prendre quoi.',
  },
  {
    title: '📚 Tutoriels & Formation',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    problem:  'Chaque embauche = 4h de formation à l\'oral que vous recommencez à zéro. Vos SOP vivent dans votre tête et celle de 2 managers.',
    solution: 'tutoriels internes intégrés, lisibles en 3 min sur mobile. Un nouvel arrivant lit, valide ses acquis, opérationnel sous 48h sans vous accaparer.',
  },
]

// 6 modules storytelling problème → solution sur fond sombre.
export default function ModulesGrid() {
  return (
    <RevealSection className="mkt-section mkt-section-dark" id="modules">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">🧩 Les 6 modules cœur</div>
          <h2 className="mkt-section-title">Six douleurs racines. Six réponses précises.</h2>
          <p className="mkt-section-subtitle">
            Chaque module répond à un problème quotidien concret. Pas de feature gratuite, pas
            de gras inutile. La gestion interne pure.
          </p>
        </div>
        <div className="mkt-modules-grid">
          {MODULES.map((m) => (
            <div className="mkt-module-card" key={m.title}>
              <div className="mkt-module-icon">{m.icon}</div>
              <h3>{m.title}</h3>
              <p className="mkt-module-problem">{m.problem}</p>
              <p className="mkt-module-solution">
                <strong>Avec Shiftly :</strong> {m.solution}
              </p>
              <span className="mkt-module-tag">Production</span>
            </div>
          ))}
        </div>

        <div className="mkt-modules-footnote">
          ➕ <strong>Multi-établissement consolidé</strong> inclus dès le plan Pro pour
          piloter plusieurs établissements depuis un seul compte.
        </div>
      </div>
    </RevealSection>
  )
}
