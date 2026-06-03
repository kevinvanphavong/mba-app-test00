import RevealSection from './RevealSection'

const STEPS = [
  {
    n: 1,
    title: 'Vous créez votre centre',
    text: '5 minutes : nom, horaires, zones de jeu (Accueil, Bar, Salle, et tout ce que vous voulez). Pas d\'engagement, essai gratuit 14 jours sans CB.',
  },
  {
    n: 2,
    title: 'Vous importez votre équipe',
    text: 'Saisie manuelle ou import CSV. Chaque collaborateur reçoit ses identifiants. Les rôles MANAGER / EMPLOYÉ sont gérés automatiquement.',
  },
  {
    n: 3,
    title: 'Vous lancez le premier service',
    text: 'Le manager planifie les postes, le staff coche ses missions, vous voyez tout en temps réel sur le dashboard. C\'est plié.',
  },
]

// 3 étapes pour onboarder un nouveau centre, fond surface pour rythme visuel.
export default function ProcessSteps() {
  return (
    <RevealSection className="mkt-section" style={{ background: 'var(--surface)' }}>
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">🚀 Comment ça marche</div>
          <h2 className="mkt-section-title">Opérationnel en moins d&apos;une heure.</h2>
          <p className="mkt-section-subtitle">
            Pas de chef de projet, pas d&apos;intégrateur. Vous créez votre centre et vous
            lancez votre premier service le soir même.
          </p>
        </div>
        <div className="mkt-steps-grid">
          {STEPS.map((s) => (
            <div className="mkt-step" key={s.n}>
              <div className="mkt-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  )
}
