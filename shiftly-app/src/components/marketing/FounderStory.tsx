import RevealSection from './RevealSection'

// Bloc "Salut, c'est Kévin" — humanise la marque et le support.
export default function FounderStory() {
  return (
    <RevealSection className="mkt-section">
      <div className="mkt-container">
        <div className="mkt-founder">
          <div className="mkt-founder-photo">KV</div>
          <div className="mkt-founder-content">
            <h3>Salut, c&apos;est Kévin. 👋</h3>
            <p>
              J&apos;ai grandi entre les pistes de bowling et les bornes d&apos;arcade. J&apos;ai vu
              mes parents passer leurs dimanches à griffonner des plannings, gérer les retards
              par SMS, courir après les feuilles de pointage. J&apos;ai vu des managers brûlés,
              des équipes démotivées, des clients déçus.
            </p>
            <p>
              En 2024 j&apos;ai lancé Shiftly avec une obsession : faire un outil{' '}
              <em>réellement</em> conçu pour les parcs de loisirs. Pas un clone de Combo. Pas
              un Excel déguisé. Un vrai produit, déployé au quotidien dans nos centres pilotes
              Family Games Center et Bowling Central à Blois.
            </p>
            <p>
              Aujourd&apos;hui, 12 centres l&apos;utilisent tous les soirs. Demain, j&apos;aimerais
              que ce soit le vôtre. Réservez une démo, je la fais moi-même.
            </p>
            <div className="mkt-founder-sign">— Kévin Vanphavong, fondateur</div>
          </div>
        </div>
      </div>
    </RevealSection>
  )
}
