# Prompt Claude Code — Validation Hebdomadaire du Pointage

---

## Contexte

Tu travailles sur **Shiftly**, une app SaaS de management opérationnel pour parcs de loisirs (bowling, arcade, laser game). Stack : Symfony 8 + API Platform (backend), Next.js 14 + TypeScript strict + Tailwind (frontend).

Le module **Pointage** est déjà implémenté et fonctionnel : la page `/pointage` permet au staff de pointer arrivée/départ/pauses via un code PIN en mode kiosque. Les entités `Pointage`, `PointagePause` et le champ `codePointage` sur `User` existent déjà.

Tu dois maintenant implémenter la **page Validation Hebdomadaire** — une vue manager permettant de relire, contrôler et valider les heures de chaque employé semaine par semaine, avec des alertes de conformité légale (convention collective IDCC 1790).

---

## Ton positionnement

- Tu es un **développeur senior fullstack** qui livre du code production-ready.
- Tu respectes **strictement** les conventions du fichier `CLAUDE.md` à la racine du projet (lis-le en premier).
- Tu suis la spec technique du fichier `docs/modules/POINTAGE_MODULE.md` pour comprendre les entités existantes.
- Tu consultes la maquette `docs/maquettes/pointage-validation.html` pour le rendu visuel attendu.
- Tu fais des **commits atomiques** : un commit = une seule responsabilité.
- Tu **testes après chaque commit** (build passe, pas d'erreur TypeScript, pas d'erreur Symfony).
- Si tu rencontres un problème, tu le résous et documentes la solution.

---

## Fichiers à lire OBLIGATOIREMENT avant de coder

| Ordre | Fichier | Pourquoi |
|---|---|---|
| 1 | `CLAUDE.md` | Règles absolues, design system, conventions |
| 2 | `docs/modules/POINTAGE_MODULE.md` | Spec du module pointage, entités existantes |
| 3 | `docs/maquettes/pointage-validation.html` | Maquette HTML de la page à implémenter |
| 4 | `DESIGN_SYSTEM.md` | Tokens couleurs, typographie, composants UI |
| 5 | `ARCHITECTURE.md` | Structure du projet, routes, modules |
| 6 | `schema.sql` | Schéma BDD actuel (tables pointage, absence, etc.) |
| 7 | `shiftly-api/src/Entity/Pointage.php` | Entité pointage existante |
| 8 | `shiftly-api/src/Entity/PointagePause.php` | Entité pause existante |
| 9 | `shiftly-api/src/Entity/Absence.php` | Entité absence (CP, RTT, maladie, repos, etc.) |
| 10 | `shiftly-api/src/Repository/AbsenceRepository.php` | Méthode `findByCentreAndDateRange()` |
| 11 | `shiftly-app/src/types/planning.ts` | Types TypeScript planning + absences |
| 12 | `shiftly-app/src/app/globals.css` | CSS existant du module pointage |

**Ne code rien tant que tu n'as pas lu ces fichiers.**

---

## Convention CSS/Styling — TRÈS IMPORTANT

Le projet utilise une **architecture CSS stricte** à respecter :

### Principe : séparer le style du composant et le layout

**Tailwind dans le JSX = UNIQUEMENT le layout** : `flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`, `h-*`, breakpoints responsive (`md:`, `lg:`).

**Le style visuel va dans `globals.css`** via des classes sémantiques préfixées par composant :

```css
/* ── Validation : NomComposant ── */
.validation-table { ... }
.validation-row { ... }
.validation-row[data-status="validated"] { ... }
```

### Règles concrètes :

1. **Jamais de couleur Tailwind inline** (`bg-[#151820]`, `text-orange-500`). Toujours `var(--nom)` ou classe `globals.css`.
2. **Un bloc de commentaire par composant** dans `globals.css` : `/* ── Validation : NomComposant ── */`
3. **Nommer les classes par composant** : `.validation-*`, `.week-*`, `.detail-*`. Pas de noms génériques.
4. **`data-status` pour les variantes d'état** sur les éléments qui changent de style.
5. **Les animations restent dans `globals.css`** via `@keyframes` ou Framer Motion.

---

## Spécification fonctionnelle

### Route

`/pointage/validation` — accessible uniquement aux **MANAGER**.

Ajouter un lien dans la sidebar sous la section Pointage (la maquette montre un item "Validation" sous "Temps réel").

### Vue d'ensemble de la page

La page se compose de 5 zones :

1. **En-tête** — Titre "Validation hebdomadaire" + boutons actions (Exporter PDF, Valider la semaine)
2. **Navigation semaine** — Flèches ← → + label "Semaine N" + dates (lun–dim) + badge statut semaine
3. **5 KPIs** — Heures travaillées, Heures prévues, Écart, Taux de ponctualité, **Absences**
4. **Tableau principal** — Grille employés × 7 jours + colonnes totaux + statut
5. **Section basse** — Panneau détail employé (à gauche) + Résumé semaine + Alertes légales (à droite)

---

### 1. Navigation semaine (WeekControl)

- Flèches gauche/droite pour naviguer entre les semaines
- Label : "Semaine 16" (numéro ISO)
- Sous-label : "14 avr. – 20 avr. 2025" (plage lun→dim)
- Badge statut semaine :
  - `En attente` (orange) — au moins un employé non validé
  - `Validée` (vert) — tous les employés validés
  - `En cours` (bleu) — la semaine actuelle avec des services pas encore terminés

### 2. KPIs (5 cartes)

| # | KPI | Source de données | Couleur |
|---|---|---|---|
| 1 | **Heures travaillées** | Somme des heures nettes (pointages) de tous les employés sur la semaine | Bleu |
| 2 | **Heures prévues** | Somme des durées théoriques des postes assignés sur la semaine | Muted |
| 3 | **Écart** | Heures travaillées − Heures prévues. Positif = vert/orange, négatif = rouge | Dynamique |
| 4 | **Taux de ponctualité** | % des pointages arrivée dans les 5 min du début prévu du poste | Vert si ≥90%, orange si 70-89%, rouge si <70% |
| 5 | **Absences** | Nombre total d'absences cumulées par staff sur la semaine (table `absence`). Sous-indicateur : évolution vs semaine N-1 (ex: "+2 vs sem. préc." ou "-1 vs sem. préc.") | Rouge si > 0, vert si 0 |

### 3. Tableau principal (ValidationTable)

**Colonnes :**

| Colonne | Contenu |
|---|---|
| Employé | Nom + rôle/zone |
| Lun → Dim (7 cols) | Cellule jour |
| Total | Heures travaillées réelles sur la semaine |
| Prévu | Heures contractuelles/prévues |
| Écart | Différence (couleur dynamique) |
| Supp. | Heures supplémentaires à majorer |
| Statut | Badge ✓ Validé / ⏳ À valider / ⚠️ Absence |

**Cellules jour — 4 états possibles :**

| État | Affichage | Condition |
|---|---|---|
| **Travaillé** | `09:00–18:00` + `8h15` (heures nettes) | Pointage avec arrivée + départ |
| **Repos** | `—` (tiret gras, fond neutre) | Pas de Poste assigné ce jour-là, OU entrée `absence` avec `type = REPOS` |
| **Absent** | `ABS` (fond rouge léger) | Poste assigné mais pointage resté `PREVU` après fin du service, sans entrée `absence` justifiée (= absence non justifiée). Si absence justifiée (CP, RTT, maladie...) → afficher le type (ex: `CP`, `MAL`) |
| **En cours** | `en cours` + `14:00–??` | Pointage avec statut `EN_COURS` ou `EN_PAUSE` (aujourd'hui uniquement) |

**Indicateurs visuels sur les cellules :**
- **Point rouge (retard-dot)** : si `heureArrivee > heureDebutPoste + 5 minutes`
- **Bordure gauche colorée sur la ligne** : vert = validé, jaune = à valider, rouge = problème (absence non justifiée)

**Interaction :** Cliquer sur une ligne ouvre le panneau détail de cet employé.

### 4. Panneau détail employé (EmployeeDetail)

Affiché quand on clique sur un employé dans le tableau. Contient :

- **En-tête** : nom complet, rôle, zone
- **Jour par jour** : pour chaque jour travaillé de la semaine :
  - Arrivée (heure + ✓ ou retard)
  - Pause(s) (heure début → fin, durée)
  - Départ (heure + dépassement éventuel)
  - Heures nettes du jour
- **Historique corrections** : liste des corrections effectuées par le manager cette semaine (ou "Aucune correction")
- **Boutons d'action** :
  - `✓ Valider` — valide les heures de cet employé pour la semaine
  - `✏️ Corriger` — ouvre un formulaire de correction (modifier arrivée/départ/pause d'un jour)

### 5. Résumé semaine (WeekSummary)

Card affichant les agrégats de la semaine :

- **Total heures équipe** (somme)
- **Heures supplémentaires** (total + détail par employé)
- **Retards détectés** (nombre + détail par employé)
- **Absences** (nombre + détail par employé)
- **Pauses conformes** (% de pauses respectant les 20 min réglementaires)

### 6. Alertes légales (LegalAlerts)

Alertes calculées **à la volée** par un service backend, **PAS stockées en base** (pas dans la table incidents). Elles sont déterministes à partir des données de pointage et d'absence.

**Types d'alertes à implémenter (IDCC 1790) :**

| Alerte | Condition | Sévérité |
|---|---|---|
| **Dépassement hebdo** | Heures travaillées > contrat (35h ou 39h selon le poste) | Warning (jaune) |
| **Majorations 25%** | Heures sup entre 1h et 8h au-delà du contrat | Warning (jaune) |
| **Majorations 50%** | Heures sup au-delà de 8h | Danger (rouge) |
| **Absence non justifiée** | Poste assigné + pointage PREVU + pas d'entrée absence justifiée | Danger (rouge) |
| **Repos quotidien 11h** | Moins de 11h entre le départ d'un jour et l'arrivée du lendemain | Danger (rouge) si non respecté, OK (vert) si conforme |
| **Repos hebdomadaire 35h** | Pas de période de 35h consécutives de repos dans la semaine | Danger (rouge) si non respecté, OK (vert) si conforme |
| **Pause 6h** | Plus de 6h de travail consécutif sans pause de 20 min | Warning (jaune) |
| **Maximum journalier 10h** | Plus de 10h de travail effectif dans un jour | Danger (rouge) |
| **Maximum hebdo 48h** | Plus de 48h dans la semaine | Danger (rouge) |

Chaque alerte affiche : icône + nom employé + titre alerte + détail chiffré.

---

## Spécification technique

### Nouvelles entités

**ValidationHebdo** (nouvelle entité)
```
id                  INT AUTO_INCREMENT
centre              ManyToOne → Centre
user                ManyToOne → User
semaine             DATE (le lundi de la semaine)
statut              VARCHAR(20) : EN_ATTENTE | VALIDEE | CORRIGEE
heuresTravaillees   DECIMAL(5,2) — heures nettes réelles
heuresPrevues       DECIMAL(5,2) — heures théoriques
ecart               DECIMAL(5,2) — travaillées - prévues
heuresSup           DECIMAL(5,2) — heures supplémentaires
nbRetards           INT
nbAbsences          INT
commentaire         TEXT nullable
validePar           ManyToOne → User nullable (le manager qui valide)
valideAt            DATETIME nullable
createdAt           DATETIME
updatedAt           DATETIME
```

Contrainte unique : `(centre_id, user_id, semaine)` — un seul enregistrement par employé par semaine.

**CorrectionPointage** (nouvelle entité — pour tracer les corrections manager)
```
id                  INT AUTO_INCREMENT
pointage            ManyToOne → Pointage
champModifie        VARCHAR(50) — 'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin'
ancienneValeur      DATETIME nullable
nouvelleValeur      DATETIME nullable
motif               TEXT nullable
corrigePar          ManyToOne → User (le manager)
createdAt           DATETIME
```

### Nouveaux endpoints API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/pointages/validation/semaine/{date}` | Données complètes de la semaine (date = un lundi au format YYYY-MM-DD). Retourne : liste employés avec pointages jour par jour, totaux, absences, statut validation |
| GET | `/api/pointages/validation/kpis/{date}` | Les 5 KPIs de la semaine |
| GET | `/api/pointages/validation/alertes/{date}` | Les alertes légales calculées pour la semaine |
| GET | `/api/pointages/validation/detail/{userId}/{date}` | Détail jour par jour d'un employé pour la semaine |
| POST | `/api/pointages/validation/valider/{userId}/{date}` | Valider les heures d'un employé pour la semaine |
| POST | `/api/pointages/validation/valider-semaine/{date}` | Valider toute la semaine en une fois |
| POST | `/api/pointages/validation/correction` | Appliquer une correction (body: pointageId, champ, nouvelleValeur, motif) |

Tous les endpoints sont filtrés par `centre_id` du JWT (multi-tenancy). Tous sont réservés au rôle `MANAGER`.

### Nouveau service backend

**ValidationHebdoService** (`shiftly-api/src/Service/ValidationHebdoService.php`)

Responsabilités :
1. **Agréger les données** d'une semaine : pointages + pauses + absences + postes prévus
2. **Calculer les heures nettes** par jour et par employé (arrivée→départ − pauses)
3. **Calculer les KPIs** (heures travaillées, prévues, écart, ponctualité, absences)
4. **Calculer les alertes légales** à la volée (voir tableau ci-dessus)
5. **Déterminer repos vs absent** :
   - **Repos** = pas de Poste assigné ce jour, OU entrée `absence` avec type `REPOS`
   - **Absent non justifié** = Poste assigné + Pointage resté `PREVU` après fin du service + pas d'entrée `absence`
   - **Absent justifié** = Poste assigné + entrée dans la table `absence` (CP, RTT, MALADIE, EVENEMENT_FAMILLE, AUTRE)
6. **Gérer les corrections** : modifier un pointage + créer un enregistrement `CorrectionPointage`
7. **Valider** : mettre à jour le statut `ValidationHebdo`

### Composants frontend

```
ValidationPage.tsx                — Page /pointage/validation
├── ValidationWeekControl.tsx     — Navigation semaine (flèches, label, dates, badge)
├── ValidationKPIs.tsx            — 5 cartes KPIs
├── ValidationTable.tsx           — Tableau employés × jours
│   └── ValidationDayCell.tsx     — Cellule individuelle (travaillé/repos/absent/en cours)
├── ValidationEmployeeDetail.tsx  — Panneau détail avec jour par jour
│   └── ValidationCorrectionForm.tsx — Formulaire de correction
├── ValidationWeekSummary.tsx     — Card résumé semaine
└── ValidationLegalAlerts.tsx     — Card alertes légales
```

### Types TypeScript

```ts
// src/types/validation.ts

export type ValidationStatut = 'EN_ATTENTE' | 'VALIDEE' | 'CORRIGEE'

export type JourStatut = 'travaille' | 'repos' | 'absent_justifie' | 'absent_non_justifie' | 'en_cours'

export interface ValidationKPI {
  heuresTravaillees: number   // en minutes
  heuresPrevues: number
  ecart: number
  tauxPonctualite: number     // 0-100
  nbAbsences: number
  evolutionAbsences: number   // diff vs semaine N-1 (positif = plus d'absences)
}

export interface ValidationJour {
  date: string                // 'YYYY-MM-DD'
  jourSemaine: string         // 'Lun', 'Mar', etc.
  statut: JourStatut
  heureArrivee: string | null
  heureDepart: string | null
  pauses: { debut: string; fin: string | null; type: 'COURTE' | 'REPAS'; dureeMinutes: number }[]
  heuresNettes: number | null  // en minutes
  heuresPrevues: number | null // en minutes
  estRetard: boolean
  typeAbsence: string | null   // 'CP', 'RTT', 'MALADIE', etc. si absent justifié
}

export interface ValidationEmploye {
  userId: number
  nom: string
  prenom: string
  role: string
  zone: string | null
  jours: ValidationJour[]     // 7 éléments (lun→dim)
  totalTravaille: number      // minutes
  totalPrevu: number
  ecart: number
  heuresSup: number
  nbRetards: number
  statut: ValidationStatut
  note: string | null         // ex: "2 retards cette semaine"
}

export interface ValidationSemaine {
  semaine: number             // numéro ISO
  dateDebut: string           // lundi
  dateFin: string             // dimanche
  statutSemaine: 'en_attente' | 'validee' | 'en_cours'
  employes: ValidationEmploye[]
  kpis: ValidationKPI
}

export interface AlerteLegale {
  type: 'depassement_hebdo' | 'majoration_25' | 'majoration_50' | 'absence_non_justifiee' | 'repos_quotidien' | 'repos_hebdo' | 'pause_6h' | 'max_journalier' | 'max_hebdo'
  severite: 'ok' | 'warning' | 'danger'
  employe: { id: number; nom: string }
  titre: string
  detail: string
}

export interface CorrectionPointage {
  id: number
  pointageId: number
  champModifie: string
  ancienneValeur: string | null
  nouvelleValeur: string | null
  motif: string | null
  corrigePar: string          // nom du manager
  createdAt: string
}
```

### Hook React Query

```ts
// src/hooks/useValidation.ts

// useValidationSemaine(date: string) — GET données complètes semaine
// useValidationKPIs(date: string) — GET KPIs
// useValidationAlertes(date: string) — GET alertes légales
// useValidationDetail(userId: number, date: string) — GET détail employé
// useValiderEmploye() — POST mutation valider un employé
// useValiderSemaine() — POST mutation valider toute la semaine
// useCorrigerPointage() — POST mutation correction
```

---

## Classes CSS à ajouter dans globals.css

Préfixer toutes les classes par `validation-`. Un bloc commenté par composant. Utiliser `data-status` pour les variantes. S'inspirer du pattern existant dans les sections `/* ── Pointage : ... ── */`.

Composants à styler :

- `validation-week-control` — barre navigation semaine
- `validation-kpi-card` — carte KPI (réutiliser le pattern `.kpi-card` existant)
- `validation-table` — tableau principal
- `validation-row` avec `data-status="validated|pending|issue"` — ligne avec bordure gauche colorée
- `validation-day-cell` — cellule jour
- `validation-day-time`, `validation-day-hours`, `validation-day-rest`, `validation-day-absent`, `validation-day-inprogress` — contenus des cellules
- `validation-retard-dot` — point rouge retard
- `validation-total-cell` avec variantes `.green`, `.orange`, `.red` — cellules totaux
- `validation-status-badge` avec variantes `validated`, `pending`, `issue` — badges statut
- `validation-detail-row`, `validation-detail-day`, `validation-detail-times`, `validation-detail-net` — panneau détail
- `validation-alert-item` avec variantes `ok`, `warn`, `danger` — alertes légales
- `validation-summary-stat` — ligne de résumé

---

## Plan d'implémentation — Commits atomiques

### Phase 1 — Backend : Entités + Migration (3 commits)

**Commit 1** — Entité `ValidationHebdo`
- Créer `shiftly-api/src/Entity/ValidationHebdo.php`
- Repository `ValidationHebdoRepository.php`
- Contrainte unique `(centre_id, user_id, semaine)`

**Commit 2** — Entité `CorrectionPointage`
- Créer `shiftly-api/src/Entity/CorrectionPointage.php`
- Repository `CorrectionPointageRepository.php`

**Commit 3** — Migration SQL
- Créer les tables `validation_hebdo` et `correction_pointage`
- Test : `php bin/console doctrine:schema:validate` passe

### Phase 2 — Backend : Service + Controller (3 commits)

**Commit 4** — `ValidationHebdoService` (partie calcul)
- Méthode `getSemaineData(int $centreId, \DateTimeImmutable $lundi)` : agrège pointages + absences + postes
- Méthode `calculerHeuresNettes(Pointage $pointage)` : arrivée→départ − pauses
- Méthode `determinerStatutJour(...)` : repos / absent / travaillé / en cours
- Méthode `calculerKPIs(...)` : 5 KPIs
- Méthode `calculerAlertes(...)` : toutes les alertes légales IDCC 1790

**Commit 5** — `ValidationHebdoService` (partie actions)
- Méthode `validerEmploye(int $userId, \DateTimeImmutable $lundi)` : crée/maj `ValidationHebdo`
- Méthode `validerSemaine(\DateTimeImmutable $lundi)` : valide tous les employés
- Méthode `corrigerPointage(int $pointageId, string $champ, ...)` : applique correction + trace

**Commit 6** — `ValidationController`
- Tous les endpoints API (7 routes — voir tableau ci-dessus)
- Filtrage par `centre_id` du JWT
- Sécurité `#[IsGranted('ROLE_MANAGER')]`
- Test : chaque endpoint retourne des données cohérentes

### Phase 3 — Frontend : Types + Hook (2 commits)

**Commit 7** — Types TypeScript
- Créer `src/types/validation.ts` avec tous les types/interfaces

**Commit 8** — Hook React Query
- Créer `src/hooks/useValidation.ts` avec tous les hooks (queries + mutations)

### Phase 4 — Frontend : CSS globals.css (1 commit)

**Commit 9** — Styles validation dans globals.css
- Ajouter toutes les classes `validation-*` dans `globals.css`
- S'inspirer de la maquette `pointage-validation.html` pour les valeurs exactes
- Utiliser les variables CSS du design system (`--bg`, `--surface`, `--border`, etc.)

### Phase 5 — Frontend : Composants (7 commits)

**Commit 10** — `ValidationWeekControl.tsx`
- Navigation ← → entre semaines
- Label semaine N + dates
- Badge statut semaine

**Commit 11** — `ValidationKPIs.tsx`
- 5 cartes KPIs avec données du hook
- Couleurs dynamiques selon seuils
- Sous-indicateur évolution absences

**Commit 12** — `ValidationDayCell.tsx`
- Les 4 états (travaillé, repos, absent, en cours)
- Point rouge retard
- Type absence si justifiée

**Commit 13** — `ValidationTable.tsx`
- Tableau complet employés × 7 jours
- Colonnes totaux + écart + sup + statut
- Bordures gauche colorées par statut ligne
- Ligne cliquable → ouvre détail

**Commit 14** — `ValidationEmployeeDetail.tsx` + `ValidationCorrectionForm.tsx`
- Panneau détail jour par jour
- Historique corrections
- Boutons Valider + Corriger
- Formulaire correction (sélection jour, champ, nouvelle valeur, motif)

**Commit 15** — `ValidationWeekSummary.tsx` + `ValidationLegalAlerts.tsx`
- Card résumé (heures, sup, retards, absences, pauses conformes)
- Card alertes légales (liste avec icônes, sévérité, détail)

**Commit 16** — `ValidationPage.tsx` + routing
- Assemblage de tous les composants
- Layout responsive (mobile-first → tablette → desktop)
- Ajout de la route `/pointage/validation`
- Ajout du lien dans la sidebar/navigation
- Les 3 états : loading | error | empty (semaine sans données)

### Phase 6 — Finalisation (2 commits)

**Commit 17** — Responsive mobile + tablette
- Le tableau devient scrollable horizontalement sur mobile
- Les cards résumé et alertes passent en pleine largeur
- Le panneau détail s'ouvre en modal sur mobile

**Commit 18** — Mise à jour des fichiers de référence
- Mettre à jour `ARCHITECTURE.md` (nouvelle route, nouveaux composants, nouvelles entités)
- Mettre à jour `DESIGN_SYSTEM.md` (nouvelles classes CSS)
- Mettre à jour `schema.sql` (nouvelles tables)
- Mettre à jour `POINTAGE_MODULE.md` (section Validation Hebdomadaire)

---

## Checklist de vérification finale

Avant de considérer le travail terminé, vérifie :

- [ ] `php bin/console doctrine:schema:validate` passe sans erreur
- [ ] Le build frontend (`npm run build`) passe sans erreur TypeScript
- [ ] La page `/pointage/validation` est accessible en tant que MANAGER
- [ ] La navigation semaine fonctionne (← → changent la semaine affichée)
- [ ] Les 5 KPIs affichent des données cohérentes
- [ ] Le tableau affiche correctement les 4 états de cellule jour
- [ ] Les points de retard s'affichent sur les bons jours
- [ ] Cliquer sur un employé ouvre le panneau détail
- [ ] Le détail jour par jour montre arrivée/pauses/départ/heures nettes
- [ ] Le bouton "Valider" change le statut de l'employé
- [ ] Le bouton "Corriger" permet de modifier une heure et trace la correction
- [ ] "Valider la semaine" valide tous les employés d'un coup
- [ ] Les alertes légales sont calculées correctement (tester avec des cas limites)
- [ ] Le résumé semaine affiche les bons totaux
- [ ] Responsive : la page est utilisable sur mobile (tableau scrollable)
- [ ] Aucune couleur hardcodée — tout passe par `var(--*)` ou `globals.css`
- [ ] Aucun `any` TypeScript
- [ ] Aucun `useEffect` pour les appels API
- [ ] Chaque composant < 150 lignes
- [ ] Les 3 états (loading | error | empty) sont gérés sur la page
- [ ] Les fichiers `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql` sont à jour
