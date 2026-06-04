import Link from 'next/link'

// Pied de page landing : 4 colonnes (brand + Produit + Ressources + Légal).
export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-inner">
          <div className="mkt-footer-brand">
            <Link href="/" className="mkt-logo">
              Shiftly<span className="mkt-logo-dot">.</span>
            </Link>
            <p>
              Le logiciel de pilotage opérationnel pour les parcs de loisirs et les
              commerces de proximité. Fait à Blois, France.
            </p>
          </div>

          <div className="mkt-footer-col">
            <h4>Produit</h4>
            <ul>
              <li><a href="#modules">Modules</a></li>
              <li><a href="#tarifs">Tarifs</a></li>
              <li><a href="#demo">Démo</a></li>
            </ul>
          </div>

          <div className="mkt-footer-col">
            <h4>Ressources</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><Link href="/login">Connexion app</Link></li>
            </ul>
          </div>

          <div className="mkt-footer-col">
            <h4>Légal</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/cgu">CGU &amp; CGV</Link></li>
              <li><Link href="/confidentialite">Politique de confidentialité</Link></li>
              <li><a href="mailto:hello@shiftly.fr">hello@shiftly.fr</a></li>
            </ul>
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© 2026 Shiftly · Tous droits réservés</span>
          <span>Fait avec 🎳 à Blois, France</span>
        </div>
      </div>
    </footer>
  )
}
