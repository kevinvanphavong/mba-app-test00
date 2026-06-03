import RevealSection from './RevealSection'

const QUESTIONS: { q: string; a: string }[] = [
  { q: 'Combien de temps pour démarrer ?', a: 'Moins d\'une heure. Vous créez votre centre, vous importez votre équipe (CSV ou manuel), vous lancez votre premier service. Pas besoin d\'intégrateur ni de chef de projet. La grande majorité de nos clients sont opérationnels le soir même.' },
  { q: 'Est-ce que c\'est conforme à la convention IDCC 1790 ?', a: 'Oui, nativement. Le module pointage et la validation hebdomadaire sont conçus avec la convention collective des Espaces de loisirs en tête : majoration des heures supp, repos dominical, heures de nuit. Vos exports paie sont conformes en sortie.' },
  { q: 'Mes données sont-elles hébergées en France ?', a: 'Oui. Hébergement sur infrastructure européenne RGPD compliant (Railway Frankfurt). Aucune donnée n\'est transmise hors UE. DPA à disposition sur demande.' },
  { q: 'Je gère plusieurs centres, comment ça marche ?', a: 'Le plan Pro permet de piloter plusieurs centres depuis un seul compte. Chaque centre garde ses données isolées (multi-tenant), mais vous avez une vue consolidée KPI et une bascule en 1 clic entre vos établissements.' },
  { q: 'Quelle différence avec Combo, Skello ou Planning Shaker ?', a: 'Ces outils sont conçus pour la restauration. Ils gèrent tables, couverts, services en deux temps. Nous, nous gérons zones de jeu, postes par zone, compétences par zone, pics de week-end et soirées événementielles. C\'est un autre métier, et donc un autre produit.' },
  { q: 'Peut-on essayer sans carte bancaire ?', a: 'Oui. 14 jours gratuits, accès complet aux modules Service, Postes, Staff, Tutoriels. Aucune carte demandée. À la fin, vous choisissez un plan ou vous arrêtez tout — pas de prélèvement surprise.' },
  { q: 'Comment se passe la résiliation ?', a: 'Sans engagement. Vous arrêtez en 1 clic depuis vos réglages. Pas de frais de sortie. Vous récupérez vos données (export CSV) à tout moment.' },
  { q: 'Mes équipes vont-elles s\'y mettre ?', a: 'Oui — c\'est notre obsession. Shiftly est mobile-first, design clair, gestes intuitifs. Nos centres pilotes rapportent une adoption complète en 2 à 5 jours, sans formation. Et le module Tutoriels permet d\'embarquer les nouvelles recrues en quelques minutes.' },
  { q: 'Le HACCP, c\'est pour quand ?', a: 'Module en cours de production, livraison prévue septembre 2026. Il couvrira les relevés de températures, la traçabilité produit, le plan de nettoyage et la génération automatique du dossier sanitaire pour la DDPP. Inclus dans le plan Pro.' },
  { q: 'Je migre depuis Excel, c\'est compliqué ?', a: 'Non. Vous nous envoyez vos plannings et listes d\'équipes en CSV ou capture d\'écran, on s\'occupe du reste lors de l\'onboarding. Inclus dans toutes les formules.' },
  { q: 'Le support, c\'est qui ?', a: 'C\'est moi, Kévin, le fondateur. Pour le moment, je réponds personnellement à chaque demande. Email sous 24h en Starter, sous 4h en Pro, SLA dédié en Premium.' },
  { q: 'Et si je ne suis pas satisfait ?', a: 'Garantie satisfait ou remboursé sur le premier mois. Si Shiftly ne tient pas ses promesses, vous récupérez votre paiement et on en discute pour comprendre ce qu\'on aurait pu faire mieux.' },
]

// FAQ : <details> natif pour l'a11y + comportement attendu sans JS.
export default function FaqAccordion() {
  return (
    <RevealSection id="faq" className="mkt-section" style={{ background: 'var(--surface)' }}>
      <div className="mkt-container">
        <div className="mkt-section-head">
          <div className="mkt-section-label">💬 Questions fréquentes</div>
          <h2 className="mkt-section-title">Tout ce que vous voulez savoir avant de signer.</h2>
        </div>

        <div className="mkt-faq-list">
          {QUESTIONS.map(({ q, a }) => (
            <details className="mkt-faq-item" key={q}>
              <summary>{q}</summary>
              <div className="mkt-faq-answer">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </RevealSection>
  )
}
