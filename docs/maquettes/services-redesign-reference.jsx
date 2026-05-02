// ─────────────────────────────────────────────────────────────────────────────
// MAQUETTE DE RÉFÉRENCE — Page Services (vue desktop manager)
// Exportée depuis Claude Design — fournie par Kévin le 2026-05-02.
// Sert de référence visuelle/comportementale au prompt :
//   docs/prompts/PROMPT_CLAUDE_CODE_SERVICES_REDESIGN.md
//
// IMPORTANT — Ce fichier n'est PAS exécutable tel quel dans le projet :
//   - utilise des helpers externes (RAW, tint, LiveBadge, ZoneTag) non typés
//   - styles inline (style={...}) plutôt que Tailwind
//   - pas de hooks React Query, données mockées
//
// Le rôle de Claude Code est d'IMPLÉMENTER cette maquette dans le projet
// Shiftly en respectant la stack et les conventions (cf. CLAUDE.md), pas
// de copier ce fichier tel quel.
// ─────────────────────────────────────────────────────────────────────────────

// Services — historique + à venir des services. Desktop manager view.

function ServicesScreen() {
  const [tab, setTab] = useState('encours');
  const [expanded, setExpanded] = useState(0); // index of expanded row (déplié par défaut sur le 1er)
  const [notes, setNotes] = useState({}); // { 'tab-i': 'note text' }
  const [dateFrom, setDateFrom] = useState('2026-03-13');
  const [dateTo, setDateTo]     = useState('2026-03-22');

  // Sample staff per service / per zone — keyed by `${tab}-${i}`
  const staffByService = {
    'avenir-0': {
      Accueil: [{n:'Mohcine', c:'#5b6bff'}, {n:'Han', c:'#7a4ed6'}],
      Bar:     [{n:'Pôl', c:'#3aa8ff'}, {n:'Mégane', c:'#e64aa6'}, {n:'Hanane', c:'#a855f7'}],
      Salle:   [{n:'Mickael', c:'#22c55e'}, {n:'Hiba', c:'#ef4444'}],
    },
    'avenir-1': {
      Accueil: [{n:'Patou', c:'#5b6bff'}, {n:'Léa', c:'#e64aa6'}],
      Bar:     [{n:'Sami', c:'#3aa8ff'}, {n:'Mégane', c:'#a855f7'}],
      Salle:   [{n:'Hiba', c:'#22c55e'}, {n:'Tom', c:'#f59e0b'}, {n:'Aya', c:'#7a4ed6'}],
    },
    'avenir-2': {
      Accueil: [{n:'Mohcine', c:'#5b6bff'}, {n:'Han', c:'#7a4ed6'}],
      Bar:     [{n:'Pôl', c:'#3aa8ff'}, {n:'Mégane', c:'#e64aa6'}, {n:'Hanane', c:'#a855f7'}],
      Salle:   [{n:'Mickael', c:'#22c55e'}, {n:'Hiba', c:'#ef4444'}, {n:'Sami', c:'#5b6bff'}],
      Manager: [{n:'Kévin', c:'#f97316'}],
    },
    'avenir-3': {
      Accueil: [{n:'Aya', c:'#7a4ed6'}, {n:'Léa', c:'#e64aa6'}],
      Salle:   [{n:'Tom', c:'#22c55e'}, {n:'Mickael', c:'#5b6bff'}, {n:'Hiba', c:'#ef4444'}, {n:'Sami', c:'#3aa8ff'}],
    },
    'encours-0': {
      Accueil: [{n:'Mohcine', c:'#5b6bff'}, {n:'Han', c:'#7a4ed6'}],
      Bar:     [{n:'Pôl', c:'#3aa8ff'}, {n:'Mégane', c:'#e64aa6'}, {n:'Hanane', c:'#a855f7'}],
      Salle:   [{n:'Mickael', c:'#22c55e'}, {n:'Hiba', c:'#ef4444'}, {n:'Aya', c:'#7a4ed6'}],
    },
  };

  // Per-zone progression for a given service (% complétion des tâches)
  const progressByService = {
    'encours-0': {Accueil: 80, Bar: 55, Salle: 62},
    'avenir-0':  {Accueil: 0,  Bar: 0,  Salle: 0},
    'avenir-1':  {Accueil: 0,  Bar: 0,  Salle: 0},
    'avenir-2':  {Accueil: 0,  Bar: 0,  Salle: 0, Manager: 0},
    'avenir-3':  {Accueil: 0,  Salle: 0},
  };

  const services = {
    avenir: [
      {date:'Jeu. 19 mars', iso:'2026-03-19', label:'Soirée Bowling League', hours:'18:00 – 01:00', staff:9, zones:['Accueil','Bar','Salle'], status:'planifié',  resp:'Kévin'},
      {date:'Ven. 20 mars', iso:'2026-03-20', label:'Service standard',       hours:'10:00 – 23:00', staff:7, zones:['Accueil','Bar','Salle'], status:'planifié',  resp:'Patou'},
      {date:'Sam. 21 mars', iso:'2026-03-21', label:'Anniversaire ×3 + match', hours:'10:00 – 01:00', staff:11, zones:['Accueil','Bar','Salle','Manager'], status:'attention', resp:'Kévin'},
      {date:'Dim. 22 mars', iso:'2026-03-22', label:'Brunch + service jour',  hours:'11:00 – 22:00', staff:6, zones:['Accueil','Salle'], status:'planifié',  resp:'Aya'},
    ],
    encours: [
      {date:'Mer. 18 mars', iso:'2026-03-18', label:'Service standard', hours:'10:00 – 23:00', staff:8, zones:['Accueil','Bar','Salle'], status:'live', resp:'Kévin', progress:62},
    ],
    passe: [
      {date:'Mar. 17 mars', iso:'2026-03-17', label:'Service standard',         hours:'10:00 – 23:00', staff:7, zones:['Accueil','Bar','Salle'], status:'cloture', resp:'Patou', tasks:'18/18', incidents:0},
      {date:'Lun. 16 mars', iso:'2026-03-16', label:'Service standard',         hours:'10:00 – 22:00', staff:6, zones:['Accueil','Salle'],       status:'cloture', resp:'Kévin', tasks:'15/16', incidents:1},
      {date:'Dim. 15 mars', iso:'2026-03-15', label:'Brunch + tournoi',         hours:'11:00 – 23:00', staff:8, zones:['Accueil','Bar','Salle'], status:'cloture', resp:'Patou', tasks:'21/22', incidents:0},
      {date:'Sam. 14 mars', iso:'2026-03-14', label:'Soirée karaoké',           hours:'17:00 – 02:00', staff:10, zones:['Accueil','Bar','Salle','Manager'], status:'incident', resp:'Kévin', tasks:'19/22', incidents:2},
      {date:'Ven. 13 mars', iso:'2026-03-13', label:'Service standard',         hours:'10:00 – 23:00', staff:7, zones:['Accueil','Bar','Salle'], status:'cloture', resp:'Aya', tasks:'17/17', incidents:0},
    ],
  };

  const list = services[tab].filter(s => (!dateFrom || s.iso >= dateFrom) && (!dateTo || s.iso <= dateTo));

  const statusChip = (st) => {
    if (st === 'live')      return {style:tint(RAW.orange, {bg:0.14, border:0.30}), label:'● En cours'};
    if (st === 'planifié')  return {style:tint(RAW.blue,   {bg:0.10, border:0.20}), label:'Planifié'};
    if (st === 'attention') return {style:tint(RAW.yellow, {bg:0.12, border:0.24}), label:'Attention'};
    if (st === 'cloture')   return {style:tint(RAW.green,  {bg:0.10, border:0.20}), label:'Clôturé'};
    return {style:tint(RAW.red, {bg:0.10, border:0.22}), label:'Incidents'};
  };

  // Map zone → palette (raw rgb triple) for accents inside the dépliant
  const zoneRaw = {
    Accueil: RAW.blue,
    Bar:     RAW.purple,
    Salle:   RAW.green,
    Manager: RAW.orange,
    Cuisine: RAW.yellow, // au cas où on l'ajoute plus tard
  };

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <div style={{display:'flex',flexDirection:'column',padding:'18px 22px',gap:14,overflowY:'auto',background:'var(--bg)',flex:1}}>

      {/* Hero */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:'18px 20px',position:'relative',overflow:'hidden',boxShadow:'var(--shadow-card)',display:'grid',gridTemplateColumns:'1fr auto',gap:24,alignItems:'center'}}>
        <div className="shiftly-hero-bar" />
        <div>
          <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,color:'var(--muted)',marginBottom:5,fontFamily:"var(--font-syne)"}}>Services</div>
          <div style={{fontFamily:"var(--font-syne)",fontSize:22,fontWeight:800,marginBottom:3,color:'var(--text)',display:'flex',alignItems:'center',gap:10}}>
            Services Bowling Central <LiveBadge />
          </div>
          <div style={{fontSize:12,color:'var(--muted)'}}>Vue manager · 1 service en cours · 4 à venir cette semaine · 5 derniers clôturés</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <div style={{padding:'10px 14px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,minWidth:84,textAlign:'center'}}>
            <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--muted)',marginBottom:4,fontFamily:"var(--font-syne)"}}>Tx clôture</div>
            <div style={{fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,color:'var(--green)'}}>96%</div>
          </div>
          <button style={{padding:'0 14px',height:38,alignSelf:'stretch',borderRadius:10,border:'none',background:'var(--accent-grad)',color:'var(--on-accent)',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"var(--font-syne)",whiteSpace:'nowrap'}}>+ Nouveau service</button>
        </div>
      </div>

      {/* Tabs + filtre dates */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:5,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:4,boxShadow:'var(--shadow-card)',width:'fit-content'}}>
          {[
            {k:'encours', l:'En cours', n:services.encours.length},
            {k:'avenir',  l:'À venir',  n:services.avenir.length},
            {k:'passe',   l:'Historique', n:services.passe.length},
          ].map(t => (
            <button key={t.k} onClick={()=>{setTab(t.k);setExpanded(null);}} style={{
              display:'flex',alignItems:'center',gap:7,padding:'7px 13px',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
              background: tab===t.k ? 'var(--surface2)' : 'transparent',
              color: tab===t.k ? 'var(--text)' : 'var(--muted)',
              fontFamily:"var(--font-dm-sans)"
            }}>
              {t.l}
              <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:5,background: tab===t.k ? 'var(--accent)' : 'var(--bg)',color: tab===t.k ? 'var(--on-accent)' : 'var(--muted)',border: tab===t.k ? 'none' : '1px solid var(--border)'}}>{t.n}</span>
            </button>
          ))}
        </div>

        {/* Filtre dates */}
        <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'4px 10px',boxShadow:'var(--shadow-card)'}}>
          <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--muted)',fontFamily:"var(--font-syne)",marginRight:4}}>Période</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 8px',fontSize:11,color:'var(--text)',fontFamily:'var(--font-dm-sans)',outline:'none',colorScheme:'var(--theme,dark)'}}/>
          <span style={{fontSize:11,color:'var(--muted)'}}>→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,padding:'5px 8px',fontSize:11,color:'var(--text)',fontFamily:'var(--font-dm-sans)',outline:'none'}}/>
          {(dateFrom || dateTo) && (
            <button onClick={()=>{setDateFrom('');setDateTo('');}} title="Effacer le filtre"
              style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:'0 4px',lineHeight:1}}>×</button>
          )}
        </div>

        {/* Raccourcis période */}
        <div style={{display:'flex',gap:4}}>
          {[
            {l:'7j',  from:'2026-03-12', to:'2026-03-19'},
            {l:'30j', from:'2026-02-19', to:'2026-03-22'},
            {l:'Tout',from:'',           to:''},
          ].map(p => (
            <button key={p.l} onClick={()=>{setDateFrom(p.from);setDateTo(p.to);}}
              style={{padding:'6px 10px',borderRadius:7,fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--muted)',fontFamily:'var(--font-syne)',textTransform:'uppercase',letterSpacing:.6}}>
              {p.l}
            </button>
          ))}
        </div>

        <div style={{marginLeft:'auto',fontSize:11,color:'var(--muted)'}}>{list.length} résultat{list.length>1?'s':''}</div>
      </div>

      {/* Table-like list */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,boxShadow:'var(--shadow-card)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'24px 160px 130px 70px 1fr 200px 140px 110px',padding:'10px 16px',background:'var(--surface2)',borderBottom:'1px solid var(--border)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--muted)',fontFamily:"var(--font-syne)",gap:10}}>
          <div></div>
          <div>Date</div>
          <div>Horaires</div>
          <div>Staff</div>
          <div>Équipe</div>
          <div>Zones</div>
          <div>Responsable</div>
          <div style={{textAlign:'right'}}>Statut</div>
        </div>
        {list.length === 0 && (
          <div style={{padding:'40px 16px',textAlign:'center',fontSize:12,color:'var(--muted)'}}>Aucun service sur cette période.</div>
        )}
        {list.map((s, i) => {
          const chip = statusChip(s.status);
          const isOpen = expanded === i;
          const key = `${tab}-${services[tab].indexOf(s)}`;
          const zonesStaff = staffByService[key] || {};
          const zoneProgress = progressByService[key] || {};
          return (
            <React.Fragment key={i}>
              <div onClick={()=>toggle(i)} style={{display:'grid',gridTemplateColumns:'24px 160px 130px 70px 1fr 200px 140px 110px',padding:'13px 16px',borderBottom: (i<list.length-1 || isOpen) ? '1px solid var(--border)' : 'none',alignItems:'center',cursor:'pointer',background: isOpen ? 'var(--surface2)' : 'transparent',transition:'background .15s',gap:10}}>
                <div style={{fontSize:11,color:'var(--muted)',transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',transition:'transform .2s',display:'flex',alignItems:'center',justifyContent:'center'}}>▸</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{s.date}</div>
                  {tab==='passe' && <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>Tâches {s.tasks} · {s.incidents} incident{s.incidents>1?'s':''}</div>}
                  {tab==='encours' && (
                    <div style={{display:'flex',alignItems:'center',gap:7,marginTop:4}}>
                      <div style={{flex:'0 0 90px',height:4,background:'var(--surface)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${s.progress}%`,height:'100%',background:'var(--accent-grad)'}} /></div>
                      <span style={{fontSize:10,color:'var(--muted)'}}>{s.progress}%</span>
                    </div>
                  )}
                </div>
                <div style={{fontSize:11,color:'var(--text-soft)',fontFamily:"var(--font-syne)",fontWeight:700}}>{s.hours}</div>
                <div style={{fontSize:12,color:'var(--text)',fontWeight:600}}>{s.staff}</div>
                <TeamBubbles members={Object.values(staffByService[`${tab}-${services[tab].indexOf(s)}`] || {}).flat()} total={s.staff} />
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{s.zones.map(z => <ZoneTag key={z} zone={z} />)}</div>
                <div style={{fontSize:12,color:'var(--text-soft)'}}>{s.resp}</div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:6,textTransform:'uppercase',letterSpacing:.4,...chip.style}}>{chip.label}</span>
                </div>
              </div>

              {/* Dépliant */}
              {isOpen && (
                <ServiceExpand
                  service={s}
                  zonesStaff={zonesStaff}
                  zoneProgress={zoneProgress}
                  zoneRaw={zoneRaw}
                  isLast={i === list.length - 1}
                  noteValue={notes[`${tab}-${i}`] || ''}
                  onNoteChange={(v)=>setNotes(prev=>({...prev, [`${tab}-${i}`]: v}))}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dépliant : Zones & Staff + Progression + Note ──────────────────
function TeamBubbles({members, total}) {
  const shown = members.slice(0, 4);
  const extra = Math.max(0, (total || members.length) - shown.length);
  if (shown.length === 0) {
    return <span style={{fontSize:11,color:'var(--muted)',fontStyle:'italic'}}>—</span>;
  }
  return (
    <div style={{display:'flex',alignItems:'center'}}>
      {shown.map((m, idx) => (
        <div key={idx} title={m.n} style={{width:24,height:24,borderRadius:'50%',background:m.c,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-syne)',fontWeight:800,fontSize:10,color:'#fff',border:'2px solid var(--surface)',marginLeft: idx===0 ? 0 : -7,position:'relative',zIndex:10-idx}}>{m.n.charAt(0).toUpperCase()}</div>
      ))}
      {extra > 0 && (
        <div style={{width:24,height:24,borderRadius:'50%',background:'var(--surface2)',border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-syne)',fontWeight:800,fontSize:9,color:'var(--muted)',marginLeft:-7}}>+{extra}</div>
      )}
    </div>
  );
}

function ServiceExpand({service, zonesStaff, zoneProgress, zoneRaw, isLast, noteValue, onNoteChange}) {
  const zones = service.zones;
  const [editingNote, setEditingNote] = useState(false);

  return (
    <div style={{padding:'22px 26px 24px',background:'var(--bg)',borderBottom: isLast ? 'none' : '1px solid var(--border)'}}>
      {/* ZONES & STAFF */}
      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,color:'var(--muted)',marginBottom:14,fontFamily:'var(--font-syne)'}}>Zones & Staff</div>

      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:26}}>
        {zones.map(zone => {
          const raw = zoneRaw[zone] || RAW.gray;
          const members = zonesStaff[zone] || [];
          const tintBg = `rgba(${raw.join(',')},.10)`;
          const tintBorder = `rgba(${raw.join(',')},.30)`;
          const dot = `rgb(${raw.join(',')})`;
          return (
            <div key={zone} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,minWidth:120}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:dot,flexShrink:0}} />
                <span style={{fontFamily:'var(--font-syne)',fontSize:14,fontWeight:800,color:'var(--text)'}}>{zone}</span>
                <span style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>· {members.length}</span>
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap',flex:1}}>
                {members.map((m, idx) => (
                  <div key={idx} style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:999,padding:'4px 10px 4px 4px'}}>
                    <span style={{width:22,height:22,borderRadius:'50%',background:m.c,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-syne)',fontWeight:800,fontSize:10,color:'#fff'}}>{m.n.charAt(0).toUpperCase()}</span>
                    <span style={{fontSize:12,color:'var(--text)',fontWeight:500}}>{m.n}</span>
                    <button title="Retirer" style={{background:'transparent',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13,padding:0,lineHeight:1,marginLeft:2}}>×</button>
                  </div>
                ))}
                {members.length === 0 && (
                  <span style={{fontSize:11,color:'var(--muted)',fontStyle:'italic',padding:'4px 0'}}>Aucun membre assigné</span>
                )}
              </div>

              <button style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:999,background:tintBg,border:`1px solid ${tintBorder}`,color:dot,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-dm-sans)',whiteSpace:'nowrap'}}>
                + Membre
              </button>
            </div>
          );
        })}
      </div>

      {/* PROGRESSION */}
      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,color:'var(--muted)',marginBottom:14,fontFamily:'var(--font-syne)'}}>Progression</div>
      <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:26}}>
        {zones.map(zone => {
          const raw = zoneRaw[zone] || RAW.gray;
          const dot = `rgb(${raw.join(',')})`;
          const value = zoneProgress[zone] ?? 0;
          return (
            <div key={zone} style={{display:'grid',gridTemplateColumns:'160px 1fr 50px',alignItems:'center',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <span style={{width:9,height:9,borderRadius:'50%',background:dot,flexShrink:0}} />
                <span style={{fontSize:13,color:'var(--text)',fontWeight:500}}>{zone}</span>
              </div>
              <div style={{height:6,background:'var(--surface2)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${value}%`,height:'100%',background:dot,transition:'width .4s'}} />
              </div>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,fontFamily:'var(--font-syne)',textAlign:'right'}}>{value}%</div>
            </div>
          );
        })}
      </div>

      {/* NOTE */}
      <div style={{paddingTop:14,borderTop:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: (editingNote || noteValue) ? 10 : 0}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,color:'var(--muted)',fontFamily:'var(--font-syne)'}}>Note</div>
          {!editingNote && !noteValue && (
            <button onClick={()=>setEditingNote(true)} style={{background:'transparent',border:'none',color:'var(--accent)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-dm-sans)'}}>+ Ajouter</button>
          )}
          {(editingNote || noteValue) && (
            <div style={{display:'flex',gap:8}}>
              {editingNote && (
                <button onClick={()=>setEditingNote(false)} style={{background:'transparent',border:'1px solid var(--border)',color:'var(--muted)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-dm-sans)',borderRadius:7,padding:'4px 10px'}}>Fermer</button>
              )}
              {!editingNote && noteValue && (
                <button onClick={()=>setEditingNote(true)} style={{background:'transparent',border:'none',color:'var(--accent)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-dm-sans)'}}>Modifier</button>
              )}
            </div>
          )}
        </div>
        {editingNote && (
          <textarea
            value={noteValue}
            onChange={e=>onNoteChange(e.target.value)}
            placeholder="Ajoute une note pour ce service (consignes, événement spécial, infos staff…)"
            autoFocus
            style={{width:'100%',minHeight:78,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--text)',fontFamily:'var(--font-dm-sans)',resize:'vertical',outline:'none',lineHeight:1.5}}
          />
        )}
        {!editingNote && noteValue && (
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--text)',lineHeight:1.5,whiteSpace:'pre-wrap'}}>{noteValue}</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {ServicesScreen});
