// Postes — gestion des checklists par zone (manager). Desktop view.

function PostesScreen() {
  const [zone, setZone] = useState('Accueil');

  // Référentiel compétences par zone (aligné avec StaffScreen)
  // Chaque compétence : libellé, niveau requis (1-3), si elle requiert une validation manager
  const competences = {
    Accueil: [
    { t: 'Caisse', n: 2, valid: true, desc: 'Encaissement et rendu monnaie' },
    { t: 'Plan piste', n: 1, valid: false, desc: 'Attribuer une piste selon affluence' },
    { t: 'Carte fidélité', n: 1, valid: false, desc: 'Création et lecture' },
    { t: 'Téléphone', n: 1, valid: false, desc: 'Réservations et renseignements' },
    { t: 'Anniversaire', n: 2, valid: true, desc: 'Préparation pack et animation' }],

    Bar: [
    { t: 'Tirage pression', n: 2, valid: true, desc: 'Maîtrise du tirage et mousse' },
    { t: 'Cocktails', n: 3, valid: true, desc: 'Carte cocktails maison' },
    { t: 'Caisse bar', n: 2, valid: true, desc: 'Encaissement bar' },
    { t: 'Inventaire', n: 1, valid: false, desc: 'Comptage hebdo des stocks' },
    { t: 'HACCP', n: 3, valid: true, desc: 'Hygiène et sécurité alimentaire' }],

    Salle: [
    { t: 'Plan piste', n: 1, valid: false, desc: 'Affectation et reset' },
    { t: 'Karaoké', n: 2, valid: false, desc: 'Régler micros et playlist' },
    { t: 'Billards', n: 1, valid: false, desc: 'Mise en place et entretien' },
    { t: 'Chaussures', n: 1, valid: false, desc: 'Désinfection et tri tailles' },
    { t: 'Premiers secours', n: 3, valid: true, desc: 'Diplôme PSC1 requis' }],

    Manager: [
    { t: 'Clôture caisse', n: 3, valid: true, desc: 'Z, rapport et coffre' },
    { t: 'Planning', n: 3, valid: true, desc: 'Création et validation' },
    { t: 'Validation heures', n: 3, valid: true, desc: 'Validation hebdo paie' },
    { t: 'Incidents', n: 3, valid: true, desc: 'Gestion conflits et imprévus' }]

  };

  const data = {
    Accueil: {
      color: 'var(--zone-accueil)', raw: RAW.blue,
      desc: "Premier contact client · enregistrement · gestion karaoké/billards",
      ouv: [
      { t: "Être en tenue à l'heure", p: 'h' },
      { t: 'Allumer ordinateurs, logiciels et TPE', p: 'h' },
      { t: "Vérifier le matériel d'accueil", p: 'm' },
      { t: 'Allumer lumières karaokés', p: 'm' }],

      pdt: [
      { t: 'Vérifier toilettes après chaque pause', p: 'h' },
      { t: 'Si anniversaires demain : préparer matériel', p: 'h' },
      { t: 'Enregistrer les clients (bowling/billards/karaoké)', p: 'h' },
      { t: 'Répondre au téléphone', p: 'm' }],

      ferm: [
      { t: 'Imprimer rapport caisse de fin de service', p: 'h' },
      { t: 'Éteindre TPE et logiciels', p: 'h' },
      { t: 'Verrouiller la porte principale', p: 'h' }]

    },
    Bar: {
      color: 'var(--zone-bar)', raw: RAW.purple,
      desc: "Service boissons et snacks · gestion stocks · propreté comptoir",
      ouv: [
      { t: 'Vérifier stocks et réassort', p: 'h' },
      { t: 'Allumer machines (café, bière pression)', p: 'h' },
      { t: 'Mettre en place verres et matériel', p: 'm' }],

      pdt: [
      { t: 'Préparer et servir les commandes', p: 'h' },
      { t: 'Maintenir propreté du comptoir', p: 'm' },
      { t: 'Encaisser et rendre la monnaie', p: 'h' }],

      ferm: [
      { t: 'Fermer les robinets pression et rincer', p: 'h' },
      { t: 'Nettoyer comptoir avec produit dégraissant', p: 'h' },
      { t: 'Vider la caisse avec le manager', p: 'h' }]

    },
    Salle: {
      color: 'var(--zone-salle)', raw: RAW.green,
      desc: "Pistes bowling · billards · matériel · propreté générale",
      ouv: [
      { t: 'Vérifier pistes (boules, quilles, retour)', p: 'h' },
      { t: 'Mise en place et propreté salle', p: 'h' },
      { t: 'Aspirer moquette zones piste', p: 'm' }],

      pdt: [
      { t: 'Vérifier chaussures (état, usure, taille)', p: 'h' },
      { t: 'Ranger chaussures de bas en haut', p: 'm' },
      { t: 'Désinfecter boules entre clients', p: 'm' }],

      ferm: [
      { t: 'Éteindre pistes et écrans', p: 'h' },
      { t: 'Ranger toutes les boules', p: 'm' },
      { t: 'Passer la machine à laver chaussures', p: 'h' }]

    },
    Manager: {
      color: 'var(--zone-manager)', raw: RAW.orange,
      desc: "Supervision · décisions · résolution incidents · clôture caisse",
      ouv: [
      { t: 'Briefing équipe (5 min, 9h45)', p: 'h' },
      { t: 'Vérifier planning du jour', p: 'h' },
      { t: 'Ouvrir caisse principale', p: 'h' }],

      pdt: [
      { t: 'Tour de salle toutes les 90 min', p: 'm' },
      { t: 'Valider commandes spéciales >50€', p: 'h' },
      { t: 'Gérer incidents en cours', p: 'h' }],

      ferm: [
      { t: 'Clôture caisse et rapport jour', p: 'h' },
      { t: 'Tour final de sécurité (toilettes, issues)', p: 'h' },
      { t: 'Armer alarme et fermer', p: 'h' }]

    }
  };

  const z = data[zone];
  const totalTasks = z.ouv.length + z.pdt.length + z.ferm.length;

  const PriorityChip = ({ p }) => {
    const map = {
      h: { style: tint(RAW.red, { bg: 0.10, border: 0.22 }), l: 'Haute' },
      m: { style: tint(RAW.yellow, { bg: 0.10, border: 0.22 }), l: 'Moy.' },
      l: { style: tint(RAW.gray, { bg: 0.10, border: 0.20 }), l: 'Basse' }
    }[p];
    return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, ...map.style, textTransform: 'uppercase', letterSpacing: .3 }}>{map.l}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '18px 22px', gap: 14, overflowY: 'auto', background: 'var(--bg)', flex: 1 }}>

      {/* Zone tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {Object.entries(data).map(([name, d]) => {
          const active = zone === name;
          const total = d.ouv.length + d.pdt.length + d.ferm.length;
          return (
            <button key={name} onClick={() => setZone(name)} style={{
              padding: '14px 16px', borderRadius: 13, cursor: 'pointer', textAlign: 'left',
              border: active ? `1px solid ${d.color}` : '1px solid var(--border)',
              background: active ? `rgba(${d.raw.join(',')},.08)` : 'var(--surface)',
              boxShadow: active ? 'none' : 'var(--shadow-card)',
              fontFamily: "var(--font-dm-sans)"
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ fontFamily: "var(--font-syne)", fontSize: 14, fontWeight: 800, color: active ? d.color : 'var(--text)' }}>{name}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.4 }}>{d.desc}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily: "var(--font-syne)", fontSize: 11, fontWeight: 700, color: 'var(--text-soft)' }}>{total} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>tâches</span></span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--muted)', opacity:.5 }} />
                <span style={{ fontFamily: "var(--font-syne)", fontSize: 11, fontWeight: 700, color: 'var(--text-soft)' }}>{(competences[name]||[]).length} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>compétences</span></span>
              </div>
            </button>);

        })}
      </div>

      {/* Detail panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: z.color }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{zone} · {totalTasks} tâches</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{z.desc}</div>
          </div>
          <button style={{ padding: '7px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>↻ Réordonner</button>
          <button style={{ padding: '7px 13px', borderRadius: 9, border: 'none', background: 'var(--accent-grad)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter tâche</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
          { k: 'ouv', l: '🔓 Ouverture', items: z.ouv },
          { k: 'pdt', l: '⚡ Pendant le service', items: z.pdt },
          { k: 'ferm', l: '🔒 Fermeture', items: z.ferm }].
          map((col, i) =>
          <div key={col.k} style={{ padding: 16, borderRight: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontFamily: "var(--font-syne)", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--muted)', marginBottom: 5 }}>{col.l} · {col.items.length}</div>
              {col.items.map((task, j) =>
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9 }}>
                  <span style={{ fontFamily: "var(--font-syne)", fontSize: 10, fontWeight: 700, color: 'var(--muted)', width: 18 }}>{j + 1}.</span>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{task.t}</div>
                  <PriorityChip p={task.p} />
                  <span style={{ color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>⋯</span>
                </div>
            )}
              <button style={{ padding: '8px', borderRadius: 9, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>+ Tâche</button>
            </div>
          )}
        </div>
      </div>

      {/* ─── COMPÉTENCES (zone courante) ─── */}
      {(() => {
        const list = competences[zone] || [];
        const validCount = list.filter((c) => c.valid).length;
        return (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: `rgba(${z.raw.join(',')},.05)` }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: z.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Compétences · {list.length}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Référentiel des savoir-faire pour {zone} · {validCount} à valider manager</div>
              </div>
              <button style={{ padding: '7px 13px', borderRadius: 9, border: 'none', background: 'var(--accent-grad)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Compétence</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {list.map((c, idx) =>
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center',
                  padding: '11px 18px',
                  borderBottom: idx < list.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.t}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.desc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }} title={`Niveau ${c.n}/3`}>
                    {[1, 2, 3].map((n) =>
                      <span key={n} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: n <= c.n ? z.color : 'var(--surface2)',
                        border: `1px solid ${n <= c.n ? z.color : 'var(--border)'}`
                      }} />
                    )}
                  </div>
                  {c.valid ?
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, ...tint(RAW.orange, { bg: 0.10, border: 0.22 }), textTransform: 'uppercase', letterSpacing: .3 }}>Valid. manager</span> :
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, ...tint(RAW.gray, { bg: 0.08, border: 0.18 }), textTransform: 'uppercase', letterSpacing: .3, color: 'var(--muted)' }}>Auto</span>
                  }
                  <span style={{ color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}>⋯</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>);

}

Object.assign(window, { PostesScreen });
