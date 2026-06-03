'use client'

import type { LeadIntent } from '@/store/leadModalStore'

// Champs purement présentationnels de la modale lead — coordonnées + centre +
// sections conditionnelles selon l'intent. Logique isolée dans LeadModal.
export default function LeadModalForm({ intent }: { intent: LeadIntent }) {
  return (
    <>
      <div className="mkt-lead-section">
        <label className="mkt-lead-label">Vos coordonnées</label>
        <div className="mkt-lead-grid">
          <div className="mkt-lead-field">
            <label htmlFor="leadName">Nom complet <span className="mkt-req">*</span></label>
            <input type="text" id="leadName" name="name" placeholder="Marie Dupont" required />
          </div>
          <div className="mkt-lead-field">
            <label htmlFor="leadPhone">Téléphone <span className="mkt-req">*</span></label>
            <input type="tel" id="leadPhone" name="phone" placeholder="06 12 34 56 78" required />
          </div>
          <div className="mkt-lead-field mkt-lead-grid-full">
            <label htmlFor="leadEmail">Email pro <span className="mkt-req">*</span></label>
            <input type="email" id="leadEmail" name="email" placeholder="marie@bowling-central.fr" required />
          </div>
        </div>
      </div>

      <div className="mkt-lead-section">
        <label className="mkt-lead-label">Votre centre</label>
        <div className="mkt-lead-grid">
          <div className="mkt-lead-field mkt-lead-grid-full">
            <label htmlFor="leadCentre">Nom du centre <span className="mkt-req">*</span></label>
            <input type="text" id="leadCentre" name="centre" placeholder="Family Games Center Blois" required />
          </div>
          <div className="mkt-lead-field">
            <label htmlFor="leadActivity">Type d&apos;activité</label>
            <select id="leadActivity" name="activity" defaultValue="bowling">
              <option value="bowling">🎳 Bowling</option>
              <option value="laser">🔫 Laser game</option>
              <option value="arcade">🕹️ Arcade</option>
              <option value="karaoke">🎤 Karaoké</option>
              <option value="vr">🥽 VR</option>
              <option value="mixte">🎪 Centre mixte</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="mkt-lead-field">
            <label htmlFor="leadStaff">Taille équipe</label>
            <select id="leadStaff" name="staff_size" defaultValue="11-30">
              <option value="1-10">1 à 10 collaborateurs</option>
              <option value="11-30">11 à 30 collaborateurs</option>
              <option value="31-50">31 à 50 collaborateurs</option>
              <option value="50+">Plus de 50</option>
            </select>
          </div>
          <div className="mkt-lead-field">
            <label htmlFor="leadCity">Ville</label>
            <input type="text" id="leadCity" name="city" placeholder="Blois" />
          </div>
          <div className="mkt-lead-field">
            <label htmlFor="leadZip">Code postal</label>
            <input type="text" id="leadZip" name="zip" placeholder="41000" />
          </div>
        </div>
      </div>

      {intent === 'demo' && (
        <div className="mkt-lead-section">
          <label className="mkt-lead-label">📅 Disponibilités pour la démo</label>
          <div className="mkt-lead-grid">
            <div className="mkt-lead-field mkt-lead-grid-full">
              <label htmlFor="leadSlot">Vos créneaux préférés</label>
              <input
                type="text"
                id="leadSlot"
                name="preferred_slot"
                placeholder="Lundi matin, mardi 14h-17h…"
              />
            </div>
            <div className="mkt-lead-field mkt-lead-grid-full">
              <label htmlFor="leadChannel">Canal préféré</label>
              <select id="leadChannel" name="channel" defaultValue="meet">
                <option value="meet">📞 Google Meet</option>
                <option value="zoom">📞 Zoom</option>
                <option value="teams">📞 Microsoft Teams</option>
                <option value="phone">☎️ Téléphone simple</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {intent === 'custom' && (
        <div className="mkt-lead-section">
          <label className="mkt-lead-label">✨ Vos besoins spécifiques</label>
          <div className="mkt-lead-field">
            <label htmlFor="leadNeeds">
              Décrivez vos enjeux (multi-centre, intégration existante, contraintes métier…)
            </label>
            <textarea
              id="leadNeeds"
              name="custom_needs"
              placeholder="Ex : 3 bowlings à piloter en parallèle, ERP Sage à intégrer, ouverture nouveau site en juillet…"
            />
          </div>
        </div>
      )}

      <div className="mkt-lead-section">
        <label className="mkt-lead-label">
          💬 Un message ?{' '}
          <span
            style={{
              textTransform: 'none',
              letterSpacing: 0,
              color: 'var(--muted)',
              fontWeight: 400,
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          >
            (facultatif)
          </span>
        </label>
        <div className="mkt-lead-field">
          <textarea
            name="message"
            placeholder="Une question, un contexte, un besoin particulier…"
          />
        </div>
      </div>
    </>
  )
}
