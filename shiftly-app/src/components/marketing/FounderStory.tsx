import RevealSection from './RevealSection'

// Bloc "Salut, c'est Kévin" — humanise la marque et le support.
// Texte source : maquette V4 lignes 1842-1854.
export default function FounderStory() {
  return (
    <RevealSection className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-founder">
          <div className="mkt-founder-photo">KV</div>
          <div className="mkt-founder-content">
            <h3>Salut, c&apos;est Kévin. 👋</h3>
            <p>
              J&apos;ai grandi entre les pistes de bowling et les bornes d&apos;arcade.
              J&apos;ai vu mes parents passer leurs dimanches à griffonner des plannings,
              gérer les retards par SMS, courir après les feuilles de pointage. La même scène
              se rejoue partout — dans les cafés du coin, les restos de quartier, les salons
              de coiffure. Des managers brûlés, des équipes démotivées, des patrons en mode
              pompier.
            </p>
            <p>
              En 2024 j&apos;ai lancé Shiftly avec une obsession : faire un outil de{' '}
              <em>gestion interne</em>, vraiment. Pas un planning RH déguisé. Pas un clone
              de Combo. Un outil qui s&apos;occupe de ce qui se passe <em>pendant</em> le
              service : qui fait quoi, comment, à quel niveau, avec quelle traçabilité.
            </p>
            <p>
              Aujourd&apos;hui, 12 établissements l&apos;utilisent tous les jours —
              bowlings, lasers, et bientôt cafés et commerces de proximité. Demain,
              j&apos;aimerais que ce soit le vôtre. Réservez une démo, je la fais moi-même.
            </p>
            <div className="mkt-founder-sign">— Kévin Vanphavong, fondateur</div>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}
