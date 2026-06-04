import RevealSection from './RevealSection'

type Row = {
  feat:    string
  shiftly: { text: string; star?: boolean }
  planning: { text: string; yes?: boolean }
  excel:   { text: string; yes?: boolean }
}

// 12 lignes reformulées en bénéfice-pour-le-patron — maquette V4 lignes 1631-1703.
const ROWS: Row[] = [
  { feat: '⚡ Vous savez ce qui se passe pendant le service, en temps réel',
    shiftly: { text: '★ Module phare',    star: true }, planning: { text: '✕' },                excel: { text: '✕' } },
  { feat: '📋 Chaque collaborateur sait quoi faire en arrivant',
    shiftly: { text: '★ Pensé service',   star: true }, planning: { text: '✕' },                excel: { text: 'Briefing à l\'oral' } },
  { feat: '🎓 Vos équipes progressent, vous voyez qui peut prendre quoi',
    shiftly: { text: '★ Intégré',         star: true }, planning: { text: '✕' },                excel: { text: '✕' } },
  { feat: '📚 Vos méthodes vivent dans l\'app, plus dans la tête de 2 personnes',
    shiftly: { text: '★ Intégré',         star: true }, planning: { text: '✕' },                excel: { text: 'PDF poussiéreux' } },
  { feat: '⏱️ Heures incontestables et export paie pour votre comptable',
    shiftly: { text: '★ Inclus',          star: true }, planning: { text: '✓ Module séparé', yes: true }, excel: { text: '✕' } },
  { feat: '📅 Plannings prêts en 10 min, dupliqués d\'une semaine à l\'autre',
    shiftly: { text: '✓' },                              planning: { text: '★ Leur fort', yes: true },    excel: { text: 'Tableau effaçable' } },
  { feat: '🏢 Vous pilotez 2, 5, 20 établissements depuis un seul compte',
    shiftly: { text: '✓' },                              planning: { text: '✓', yes: true },              excel: { text: '✕' } },
  { feat: '📱 Vos équipes utilisent leur téléphone, pas un PC en salle de pause',
    shiftly: { text: '★ Conçu mobile',    star: true }, planning: { text: 'Responsive', yes: true },      excel: { text: '✕' } },
  { feat: '🇫🇷 Vos données restent en France, vous gardez le contrôle',
    shiftly: { text: '★ FR / UE',         star: true }, planning: { text: 'UE', yes: true },              excel: { text: 'Hors contrôle' } },
  { feat: '🤝 C\'est moi (Kévin) qui réponds à votre email, pas un ticket dans un tunnel',
    shiftly: { text: '★ Direct fondateur', star: true }, planning: { text: 'Tickets génériques' },        excel: { text: '—' } },
  { feat: '🔓 Pas d\'engagement annuel, vous arrêtez quand vous voulez',
    shiftly: { text: '★ Aucun lock-in',   star: true }, planning: { text: 'Engagement annuel' },         excel: { text: 'Gratuit', yes: true } },
  { feat: '💶 Vous démarrez à un prix juste, sans surprise',
    shiftly: { text: '49€ / mois HT',     star: true }, planning: { text: '~149€ / mois HT' },           excel: { text: '0€ (mais 15K€ cachés)' } },
]

// Comparatif générique — pas de noms de concurrents pour rester loyal.
export default function ComparisonTable() {
  return (
    <RevealSection className="mkt-section mkt-section-dark">
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">✨ Pourquoi Shiftly</div>
          <h2 className="mkt-section-title">Ce qui change quand vous passez à Shiftly.</h2>
          <p className="mkt-section-subtitle">
            Pas une promesse de plus. Des changements concrets dans votre quotidien, dès la
            première semaine d&apos;utilisation.
          </p>
        </div>

        <div className="mkt-compare-wrap">
          <table className="mkt-compare-table">
            <thead>
              <tr>
                <th>Votre quotidien</th>
                <th className="is-shiftly">⭐ Avec Shiftly</th>
                <th>Avec un outil de planning classique</th>
                <th>Sans outil dédié (Excel + carnet)</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.feat}>
                  <td className="is-feat">{r.feat}</td>
                  <td className={`is-yes ${r.shiftly.star ? 'is-star' : ''}`}>{r.shiftly.text}</td>
                  <td className={r.planning.yes ? 'is-yes' : 'is-no'}>{r.planning.text}</td>
                  <td className={r.excel.yes ? 'is-yes' : 'is-no'}>{r.excel.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mkt-compare-footnote">
          💡 <strong>Vous avez déjà un outil de planning ?</strong> Pas besoin de tout
          déménager. Shiftly peut tourner en parallèle pour la gestion interne (service du
          jour, missions, compétences, formation). Migration en douceur, à votre rythme.
        </div>
      </div>
    </RevealSection>
  )
}
