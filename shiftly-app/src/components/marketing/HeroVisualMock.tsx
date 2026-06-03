// Reproduction CSS/SVG du Service du Jour (pas de bitmap) pour le hero.
// Évite la dépendance à une image et reste cohérent avec le thème.
export default function HeroVisualMock() {
  return (
    <div className="mkt-hv" aria-hidden="true">
      <div className="mkt-hv-bar" />
      <div className="mkt-hv-title">Service du soir · Vendredi 12 juin</div>
      <div className="mkt-hv-subtitle">17h00 → 02h00 · 8 staff actifs · Léa responsable</div>

      <div className="mkt-hv-zones">
        <div className="mkt-hv-zone">
          <div className="mkt-hv-zone-name">
            <span className="mkt-hv-zone-dot" style={{ background: 'var(--zone-accueil)' }} />
            Accueil
          </div>
          <div className="mkt-hv-staff">
            <span className="mkt-hv-avatar">LM</span>
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--zone-accueil), var(--purple))' }}
            >
              TC
            </span>
          </div>
          <div className="mkt-hv-zone-progress">
            <span style={{ width: '78%', background: 'var(--zone-accueil)' }} />
          </div>
        </div>

        <div className="mkt-hv-zone">
          <div className="mkt-hv-zone-name">
            <span className="mkt-hv-zone-dot" style={{ background: 'var(--zone-bar)' }} />
            Bar
          </div>
          <div className="mkt-hv-staff">
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--zone-bar), var(--accent))' }}
            >
              SD
            </span>
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--purple), var(--accent))' }}
            >
              JR
            </span>
          </div>
          <div className="mkt-hv-zone-progress">
            <span style={{ width: '62%', background: 'var(--zone-bar)' }} />
          </div>
        </div>

        <div className="mkt-hv-zone">
          <div className="mkt-hv-zone-name">
            <span className="mkt-hv-zone-dot" style={{ background: 'var(--zone-salle)' }} />
            Salle
          </div>
          <div className="mkt-hv-staff">
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--zone-salle), var(--accent2))' }}
            >
              AB
            </span>
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--green), var(--accent))' }}
            >
              MR
            </span>
            <span
              className="mkt-hv-avatar"
              style={{ background: 'linear-gradient(135deg, var(--accent2), var(--zone-salle))' }}
            >
              +2
            </span>
          </div>
          <div className="mkt-hv-zone-progress">
            <span style={{ width: '91%', background: 'var(--zone-salle)' }} />
          </div>
        </div>

        <div className="mkt-hv-zone">
          <div className="mkt-hv-zone-name">
            <span className="mkt-hv-zone-dot" style={{ background: 'var(--zone-manager)' }} />
            Manager
          </div>
          <div className="mkt-hv-staff">
            <span className="mkt-hv-avatar">LP</span>
          </div>
          <div className="mkt-hv-zone-progress">
            <span style={{ width: '100%', background: 'var(--zone-manager)' }} />
          </div>
        </div>
      </div>

      <div className="mkt-hv-stats">
        <div className="mkt-hv-stat">
          <div className="mkt-hv-stat-val">76%</div>
          <div className="mkt-hv-stat-lbl">Avancement</div>
        </div>
        <div className="mkt-hv-stat">
          <div className="mkt-hv-stat-val">23/30</div>
          <div className="mkt-hv-stat-lbl">Missions</div>
        </div>
        <div className="mkt-hv-stat">
          <div className="mkt-hv-stat-val">0</div>
          <div className="mkt-hv-stat-lbl">Incidents</div>
        </div>
      </div>
    </div>
  )
}
