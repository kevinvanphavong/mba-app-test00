import RevealSection from './RevealSection'

type Item = { icon: string; html: string }

// Textes source : maquette V4 lignes 1407-1485.
const SANS: Item[] = [
  { icon: '📞', html: '<strong>8h/semaine au téléphone</strong> à relancer les retardataires, refaire les plannings au stylo, briefer le staff à l\'oral' },
  { icon: '❓', html: '<strong>Le staff arrive et demande "je commence par quoi ?"</strong> — chaque matin, on ré-explique la même chose' },
  { icon: '⚖️', html: '<strong>Les heures supp sont contestées</strong> en fin de mois — pointage au stylo, oublis, risque Prud\'hommes' },
  { icon: '🕳️', html: '<strong>Les missions critiques tombent à la trappe</strong> — vous découvrez le lundi que la fermeture du vendredi a été bâclée' },
  { icon: '🚪', html: '<strong>Le staff part au bout de 6 mois</strong> — pas de progression visible, pas de reconnaissance, turnover qui explose' },
  { icon: '🔁', html: '<strong>Chaque embauche = 4h de formation à l\'oral</strong> que vous recommencez à zéro à chaque fois' },
]

const AVEC: Item[] = [
  { icon: '📊', html: '<strong>Le manager pilote depuis son canapé</strong> — Service du Jour temps réel, qui fait quoi, où, à la minute' },
  { icon: '📋', html: '<strong>Chacun sait quoi faire dès l\'arrivée</strong> — fiche de poste sur mobile, missions du jour cochables, briefing zéro' },
  { icon: '⏱️', html: '<strong>Le pointage est incontestable</strong> — kiosk, horodatage à la seconde, validation hebdo et export paie en 10 min' },
  { icon: '✅', html: '<strong>Chaque mission cochée laisse une trace</strong> — qui, quand, quoi. Plus rien ne passe à la trappe' },
  { icon: '🎓', html: '<strong>Le staff progresse et reste</strong> — compétences validables, tutos intégrés, points, niveaux, reconnaissance' },
  { icon: '🧠', html: '<strong>Vos SOP vivent dans l\'outil</strong> — un nouvel arrivant lit, valide, opérationnel sous 48h sans vous' },
]

// 2 cartes contrastées (Sans / Avec) — storytelling problème → solution.
export default function SansAvecSection() {
  return (
    <RevealSection className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">⚡ Le constat</div>
          <h2 className="mkt-section-title">
            Vos managers{' '}
            <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>éteignent des feux</em>.
          </h2>
          <p className="mkt-section-subtitle">
            Tous les jours, les mêmes douleurs reviennent. Shiftly les résout une bonne fois
            pour toutes — par module, par cas concret.
          </p>
        </div>

        <div className="mkt-sansavec-grid">
          <Card variant="sans" />
          <Card variant="avec" />
        </div>
      </div>
    </RevealSection>
  )
}

function Card({ variant }: { variant: 'sans' | 'avec' }) {
  const isSans = variant === 'sans'
  const items = isSans ? SANS : AVEC

  return (
    <div className={`mkt-sansavec-card ${isSans ? 'is-sans' : 'is-avec'}`}>
      <div className="mkt-sansavec-head">
        <span className="mkt-sansavec-emoji">{isSans ? '😩' : '🎯'}</span>
        {isSans ? 'Sans Shiftly' : 'Avec Shiftly'}
      </div>
      <div className="mkt-sansavec-tagline">
        {isSans
          ? 'Le manager est un pompier. Il subit, il ne pilote rien.'
          : 'Le manager pilote. Le staff exécute, progresse, reste.'}
      </div>

      <div className="mkt-sansavec-list">
        {items.map((it) => (
          <div className="mkt-sansavec-item" key={it.html}>
            <span className="mkt-sansavec-icon">{it.icon}</span>
            <span dangerouslySetInnerHTML={{ __html: it.html }} />
          </div>
        ))}
      </div>

      <div className="mkt-sansavec-kpi">
        <div className="mkt-sansavec-kpi-val">{isSans ? '-15K€' : '+6h'}</div>
        <div className="mkt-sansavec-kpi-lbl">
          {isSans ? (
            <>
              <strong className="mkt-sansavec-kpi-strong-light">
                par an et par établissement
              </strong>
              <br />
              en temps managérial perdu, missions oubliées et turnover non maîtrisé
            </>
          ) : (
            <>
              <strong>rendues à vos managers</strong>
              <br />
              chaque semaine, dès la première semaine d&apos;utilisation
            </>
          )}
        </div>
      </div>
    </div>
  )
}
