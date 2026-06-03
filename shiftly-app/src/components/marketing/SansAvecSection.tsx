import RevealSection from './RevealSection'

type Item = { icon: string; html: string }

const SANS: Item[] = [
  { icon: '⏰', html: '<strong>8h par semaine perdues</strong> à griffonner des plannings et relancer l\'équipe par SMS' },
  { icon: '📋', html: '<strong>Aucune visibilité</strong> sur ce qui est fait, par qui, à quelle heure — vous découvrez le lundi matin' },
  { icon: '⚖️', html: '<strong>Risque Prud\'hommes</strong> sur les heures supp non tracées et les pointages contestés' },
  { icon: '🔥', html: '<strong>Risque DDPP</strong> avec un classeur HACCP que personne n\'a ouvert depuis 3 mois' },
  { icon: '😤', html: '<strong>Turnover qui grimpe</strong> parce que le staff ne sait jamais à quoi s\'attendre' },
  { icon: '🚫', html: '<strong>Combo, Skello, Excel</strong> — pas un seul ne comprend une zone de jeu' },
]

const AVEC: Item[] = [
  { icon: '📊', html: '<strong>Pilotage temps réel</strong> — vous voyez l\'avancement, les KPI, les incidents depuis votre canapé' },
  { icon: '⚡', html: '<strong>Service du Jour</strong> — chaque mission est cochée, tracée, horodatée. Plus rien ne passe à la trappe' },
  { icon: '🛡️', html: '<strong>Conformité IDCC 1790</strong> native — pointages, validation hebdo, export paie irréprochables' },
  { icon: '🧼', html: '<strong>HACCP intégré</strong> — relevés, traçabilité, dossier sanitaire toujours prêt pour la DDPP' },
  { icon: '🎓', html: '<strong>Montée en compétence</strong> automatique — tutoriels, compétences validées, staff fidélisé' },
  { icon: '🎳', html: '<strong>Pensé pour vous</strong> — zones Accueil / Bar / Salle / Manager, week-ends, événements, CSE' },
]

// 2 cartes contrastées (Sans / Avec) qui pitchent la valeur en KPI.
export default function SansAvecSection() {
  return (
    <RevealSection className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">⚡ Le constat</div>
          <h2 className="mkt-section-title">
            Gérer un parc de loisirs{' '}
            <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>comme un resto</em>, ça
            ne marche pas.
          </h2>
          <p className="mkt-section-subtitle">
            Vos zones, vos postes, vos services, vos pics du week-end — ce métier a ses codes.
            Vos outils doivent les suivre.
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
          ? "Le quotidien d'un patron en mode pompier."
          : 'Le centre piloté comme une vraie entreprise.'}
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
              <strong className="mkt-sansavec-kpi-strong-light">par an et par centre</strong>
              <br />
              en temps managérial perdu, missions oubliées et risques cachés
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
