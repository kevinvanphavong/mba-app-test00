import RevealSection from './RevealSection'

type Row = {
  feat: string
  shiftly: { text: string; star?: boolean }
  combo: { text: string; yes?: boolean }
  excel: { text: string; yes?: boolean }
}

const ROWS: Row[] = [
  { feat: '🎳 Zones de jeu natives (Accueil · Bar · Salle · Manager)', shiftly: { text: '★ Pensé loisirs', star: true }, combo: { text: 'Bricolage' }, excel: { text: '✕' } },
  { feat: '⚡ Service du Jour temps réel + missions cochables', shiftly: { text: '★ Module phare', star: true }, combo: { text: '✕' }, excel: { text: '✕' } },
  { feat: '🎓 Compétences validées par zone + tutoriels intégrés', shiftly: { text: '★ Intégré', star: true }, combo: { text: '✕' }, excel: { text: '✕' } },
  { feat: '⏱️ Pointage kiosk + validation hebdo IDCC 1790', shiftly: { text: '★ Natif loisirs', star: true }, combo: { text: '✓ (resto)', yes: true }, excel: { text: '✕' } },
  { feat: '🧼 HACCP intégré (relevés, traçabilité, DDPP)', shiftly: { text: '★ Sept. 2026', star: true }, combo: { text: 'Outil tiers payant' }, excel: { text: '✕' } },
  { feat: '🎉 Réservations groupes, CSE, anniversaires', shiftly: { text: '★ Inclus', star: true }, combo: { text: '✕' }, excel: { text: 'Outil tiers' } },
  { feat: '🏢 Multi-centre consolidé + back-office groupe', shiftly: { text: '✓', star: false }, combo: { text: '✓', yes: true }, excel: { text: '✕' } },
  { feat: '📱 Mobile-first pour le staff (pas un truc desktop)', shiftly: { text: '★ Conçu mobile', star: true }, combo: { text: 'Responsive', yes: true }, excel: { text: '✕' } },
  { feat: '🇫🇷 Données hébergées en France · RGPD', shiftly: { text: '★ FR / UE', star: true }, combo: { text: 'UE', yes: true }, excel: { text: 'Hors contrôle' } },
  { feat: '🤝 Support direct par le fondateur, en français', shiftly: { text: '★ Kévin répond', star: true }, combo: { text: 'Tickets génériques' }, excel: { text: '—' } },
  { feat: '🔓 Sans engagement · résiliation 1 clic', shiftly: { text: '★ Aucun lock-in', star: true }, combo: { text: 'Engagement annuel' }, excel: { text: 'Gratuit', yes: true } },
  { feat: '💶 Prix d\'entrée par centre', shiftly: { text: '79€ / mois HT', star: true }, combo: { text: '~149€ / mois HT' }, excel: { text: '0€ (mais 15K€ cachés)' } },
]

// Tableau comparatif Shiftly vs Combo/Skello vs Excel — 12 lignes.
export default function ComparisonTable() {
  return (
    <RevealSection className="mkt-section mkt-section-dark">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">⚔️ Pourquoi Shiftly</div>
          <h2 className="mkt-section-title">
            Combo et Skello servent la resto.
            <br />
            Shiftly sert votre métier.
          </h2>
          <p className="mkt-section-subtitle">
            Aucun généraliste n&apos;a été conçu pour 4 zones de jeu, un bar, un accueil, des
            pics de samedi soir et une convention IDCC 1790. Nous, si.
          </p>
        </div>

        <div className="mkt-compare-wrap">
          <table className="mkt-compare-table">
            <thead>
              <tr>
                <th>Ce qui compte pour vous</th>
                <th className="is-shiftly">🎯 Shiftly</th>
                <th>Combo / Skello</th>
                <th>Excel + WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.feat}>
                  <td className="is-feat">{r.feat}</td>
                  <td className={`is-yes ${r.shiftly.star ? 'is-star' : ''}`}>{r.shiftly.text}</td>
                  <td className={r.combo.yes ? 'is-yes' : 'is-no'}>{r.combo.text}</td>
                  <td className={r.excel.yes ? 'is-yes' : 'is-no'}>{r.excel.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RevealSection>
  )
}
