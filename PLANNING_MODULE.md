# PLANNING_MODULE.md — Module Planning Shiftly

> Conception technique complète du module Planning hebdomadaire.
> Ce document est la référence pour l'implémentation.
> Dernière mise à jour : Avril 2026

---

## 1. Vue d'ensemble

Le module Planning permet au **Manager** de planifier les shifts hebdomadaires du staff
sur les différentes zones du centre, et à l'**Employé** de consulter son planning
sur 3 semaines glissantes (obligation légale — Convention Collective IDCC 1790,
espaces de loisirs : 7 jours calendaires minimum de prévenance).

### Périmètre — Socle (Phase A–C)

- Vue hebdomadaire par employé (grille 7 jours × N employés)
- Création / modification / suppression de shifts (heure début, fin, zone, pause)
- Workflow brouillon → publié par semaine
- Indicateurs temps réel (heures hebdo vs contrat, zones couvertes, alertes)
- Duplication de semaine
- Vue employé : 3 semaines glissantes (semaine en cours + 2 prochaines publiées)

### Périmètre — Phase C (conformité juridique)

- Archivage légal des publications (PlanningSnapshot avec checksum SHA-256)
- Garde-fou délai de prévenance IDCC 1790 (7j / 3j exceptionnel)
- Alertes Code du travail (6 alertes sur limites légales absolues)
- Export PDF du planning (document légal pour inspection du travail)

### Périmètre — Avancé (Phase D, différé)

- Templates de semaine type
- Drag & drop des shifts
- Indisponibilités employé
- Compteurs mensuels / annuels
- Calcul automatique des coûts (taux horaire × heures)
- Validation des écarts d'heures (salarié déclare, manager valide)
- Journal d'audit automatique
- Champs contractuels étendus sur User

---

## 2. Schéma de données

### 2.1 Extension de l'entité `Poste` (existante)

Le Poste représente déjà l'affectation d'un User à une Zone pour un Service donné.
On l'**étend** avec les horaires individuels du shift plutôt que de créer une entité séparée.

**Nouveaux champs :**

| Champ | Type | Nullable | Défaut | Notes |
|---|---|---|---|---|
| `heureDebut` | time_immutable | oui | null | Heure de début du shift |
| `heureFin` | time_immutable | oui | null | Heure de fin du shift |
| `pauseMinutes` | int | non | 0 | Durée de pause en minutes |

**Calcul des heures travaillées :**

```
Si heureFin >= heureDebut → durée = heureFin - heureDebut - pauseMinutes
Si heureFin < heureDebut  → shift de nuit : durée = (24h - heureDebut) + heureFin - pauseMinutes
Exemple : 17h → 01h = 8h - pause
```

**Contrainte unique existante** : `(service_id, zone_id, user_id)` → un employé ne peut
être affecté qu'une fois à une zone par service. Un même employé peut avoir plusieurs
postes sur le même service s'ils sont dans des zones différentes.

### 2.2 Extension de l'entité `User` (existante)

**Nouveaux champs :**

| Champ | Type | Nullable | Défaut | Notes |
|---|---|---|---|---|
| `heuresHebdo` | int | oui | null | Heures contractuelles par semaine |
| `typeContrat` | string(30) | oui | null | CDI, CDD, EXTRA, ALTERNANCE, STAGE |

> Note : `heuresHebdo` existe déjà dans ENTITES.md comme champ prévu.
> `typeContrat` est un ajout pour le planning (affichage + filtrage).

### 2.3 Nouvelle entité `PlanningSnapshot`

Chaque publication d'un planning crée un snapshot immuable — c'est la **preuve légale**
en cas de litige prud'homal ou de contrôle de l'inspection du travail. Si un planning
est modifié puis republié, l'ancienne version reste archivée.

| Champ | Type | Nullable | Défaut | Notes |
|---|---|---|---|---|
| `id` | int | non | auto | PK |
| `centre` | Centre | non | — | FK multi-tenant |
| `weekStart` | date_immutable | non | — | Lundi de la semaine |
| `publishedAt` | datetime_immutable | non | — | Horodatage exact de cette publication |
| `publishedBy` | User | non | — | Manager qui a publié |
| `data` | json | non | — | Copie intégrale du planning (employés, shifts, heures, zones) |
| `motifModification` | text | oui | null | Obligatoire si republication ou si délai < 7j |
| `checksum` | string(64) | non | — | SHA-256 du JSON `data` (preuve d'intégrité) |
| `delaiRespect` | boolean | non | true | false si publié à moins de 7j calendaires |

**Règles :**
- Un snapshot est **immuable** — jamais modifié ni supprimé
- Créé automatiquement à chaque appel de `POST /planning/publish`
- Conservation minimum **3 ans** (prescription prud'homale des heures sup)
- Le champ `data` contient le JSON complet tel que retourné par `GET /planning/week`
- Le `checksum` = SHA-256 du JSON sérialisé (prouve que le contenu n'a pas été altéré après coup)

### 2.4 Nouvelle entité `PlanningWeek`

Représente l'état de publication d'une semaine de planning pour un centre.

| Champ | Type | Nullable | Défaut | Notes |
|---|---|---|---|---|
| `id` | int | non | auto | PK |
| `centre` | Centre | non | — | FK multi-tenant |
| `weekStart` | date_immutable | non | — | Lundi de la semaine (toujours un lundi) |
| `statut` | string(20) | non | BROUILLON | BROUILLON / PUBLIE |
| `publishedAt` | datetime_immutable | oui | null | Date de publication |
| `publishedBy` | User | oui | null | Manager qui a publié |
| `note` | text | oui | null | Note visible par le staff |

**Contrainte unique** : `(centre_id, week_start)` — une seule entrée par semaine par centre

**Logique métier :**
- Une semaine sans `PlanningWeek` est implicitement en brouillon (pas encore créée)
- La publication crée ou met à jour l'entrée avec `statut = PUBLIE`
- Un planning publié reste modifiable (repasse en BROUILLON si on modifie après publication)
- L'employé ne voit que les semaines PUBLIE

---

## 3. Migration SQL

```sql
-- ============================================================
-- Migration Planning Module
-- ============================================================

-- 1. Extension de poste : horaires individuels
ALTER TABLE poste
    ADD COLUMN heure_debut TIME DEFAULT NULL AFTER user_id,
    ADD COLUMN heure_fin   TIME DEFAULT NULL AFTER heure_debut,
    ADD COLUMN pause_minutes INT NOT NULL DEFAULT 0 AFTER heure_fin;

-- 2. Extension de user : contrat
ALTER TABLE `user`
    ADD COLUMN heures_hebdo INT DEFAULT NULL AFTER actif,
    ADD COLUMN type_contrat VARCHAR(30) DEFAULT NULL AFTER heures_hebdo;

-- 3. Nouvelle table planning_snapshot (archivage légal)
CREATE TABLE planning_snapshot (
    id                INT AUTO_INCREMENT NOT NULL,
    centre_id         INT          NOT NULL,
    week_start        DATE         NOT NULL,
    published_at      DATETIME     NOT NULL,
    published_by      INT          NOT NULL,
    data              JSON         NOT NULL,
    motif_modification TEXT        DEFAULT NULL,
    checksum          VARCHAR(64)  NOT NULL,
    delai_respect     TINYINT(1)   NOT NULL DEFAULT 1,
    INDEX idx_ps_centre (centre_id),
    INDEX idx_ps_week (centre_id, week_start),
    INDEX idx_ps_published_by (published_by),
    PRIMARY KEY (id),
    CONSTRAINT FK_ps_centre       FOREIGN KEY (centre_id)    REFERENCES centre (id),
    CONSTRAINT FK_ps_published_by FOREIGN KEY (published_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Nouvelle table planning_week
CREATE TABLE planning_week (
    id           INT AUTO_INCREMENT NOT NULL,
    centre_id    INT          NOT NULL,
    week_start   DATE         NOT NULL,               -- toujours un lundi
    statut       VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    published_at DATETIME     DEFAULT NULL,
    published_by INT          DEFAULT NULL,
    note         TEXT         DEFAULT NULL,
    UNIQUE KEY uniq_pw_centre_week (centre_id, week_start),
    INDEX idx_pw_centre (centre_id),
    INDEX idx_pw_published_by (published_by),
    PRIMARY KEY (id),
    CONSTRAINT FK_pw_centre       FOREIGN KEY (centre_id)    REFERENCES centre (id),
    CONSTRAINT FK_pw_published_by FOREIGN KEY (published_by) REFERENCES `user` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Endpoints API

### 4.1 GET `/api/planning/week` — Planning hebdomadaire (Manager)

**Params :** `?centreId={id}&weekStart=2026-04-13`

**Réponse :**
```json
{
  "weekStart": "2026-04-13",
  "weekEnd": "2026-04-19",
  "statut": "BROUILLON",
  "note": null,
  "zones": [
    { "id": 1, "nom": "Accueil", "couleur": "#3b82f6" },
    { "id": 2, "nom": "Bar",     "couleur": "#a855f7" },
    { "id": 3, "nom": "Salle",   "couleur": "#22c55e" }
  ],
  "employees": [
    {
      "id": 1,
      "nom": "Kévin",
      "prenom": null,
      "role": "MANAGER",
      "avatarColor": "#f97316",
      "heuresHebdo": 39,
      "typeContrat": "CDI",
      "shifts": [
        {
          "posteId": 42,
          "serviceId": 10,
          "date": "2026-04-14",
          "zoneId": 1,
          "zoneNom": "Accueil",
          "zoneCouleur": "#3b82f6",
          "heureDebut": "09:00",
          "heureFin": "17:00",
          "pauseMinutes": 30
        }
      ],
      "totalHeures": 38.5,
      "ecartContrat": -0.5
    }
  ],
  "alertes": [
    {
      "type": "ZONE_NON_COUVERTE",
      "message": "Salle non couverte le mercredi 16/04",
      "date": "2026-04-16",
      "zoneId": 3
    }
  ],
  "stats": {
    "employesPlanifies": 8,
    "totalHeures": 285,
    "creneauxVides": 2,
    "sousPlanifies": 1
  }
}
```

**Controller :** `PlanningController::week()`
**Service :** `PlanningService::getWeekData(Centre, weekStart)`

### 4.2 POST `/api/planning/publish` — Publier une semaine

**Body :**
```json
{
  "weekStart": "2026-04-13",
  "motifModification": null,
  "forcePublication": false
}
```

**Logique :**
1. Vérifie que des postes existent pour cette semaine
2. **Calcule le délai de prévenance** : nombre de jours calendaires entre `now()` et le lundi de la semaine
3. **Garde-fou IDCC 1790** :
   - Si délai ≥ 7 jours → publication normale
   - Si délai < 7 jours et `forcePublication = false` → retourne **HTTP 422** avec :
     ```json
     {
       "warning": "DELAI_PREVENANCE_NON_RESPECTE",
       "delaiJours": 4,
       "message": "La Convention Collective impose 7 jours calendaires de prévenance. Vous publiez à 4 jours.",
       "requiresMotif": true
     }
     ```
   - Si délai < 7 jours et `forcePublication = true` → `motifModification` **obligatoire** (sinon 400)
   - Si délai < 3 jours → le warning inclut `"severity": "critique"` et le message mentionne le minimum exceptionnel de 3 jours
4. Crée ou met à jour `PlanningWeek` → statut = PUBLIE, publishedAt = now()
5. **Crée un `PlanningSnapshot`** automatiquement :
   - Appelle `PlanningService::getWeekData()` pour obtenir le JSON complet
   - Calcule le SHA-256 du JSON sérialisé
   - Stocke le snapshot avec le motif et le flag `delaiRespect`
6. Retourne le `PlanningWeek` mis à jour

**Côté frontend** — le hook `usePublishWeek` gère le flow en 2 temps :
1. Premier appel avec `forcePublication: false`
2. Si le serveur retourne 422 → affiche une modal d'avertissement avec le message
3. Le manager saisit un motif → deuxième appel avec `forcePublication: true` + motif

**Accès :** ROLE_MANAGER uniquement

### 4.3 POST `/api/planning/duplicate` — Dupliquer une semaine

**Body :**
```json
{
  "sourceWeekStart": "2026-04-13",
  "targetWeekStart": "2026-04-20"
}
```

**Logique :**
1. Récupère tous les postes de la semaine source (via les services de la semaine)
2. Pour chaque jour : crée un service s'il n'existe pas déjà
3. Duplique les postes (user, zone, heureDebut, heureFin, pauseMinutes)
4. La semaine cible est en BROUILLON
5. Si des postes existent déjà sur la cible → erreur 409 (Conflict)

**Accès :** ROLE_MANAGER uniquement

### 4.4 GET `/api/planning/employee` — Vue employé (3 semaines)

**Params :** aucun (userId extrait du JWT)

**Réponse :**
```json
{
  "weeks": [
    {
      "weekStart": "2026-04-13",
      "weekEnd": "2026-04-19",
      "statut": "PUBLIE",
      "shifts": [
        {
          "date": "2026-04-14",
          "zoneNom": "Accueil",
          "zoneCouleur": "#3b82f6",
          "heureDebut": "09:00",
          "heureFin": "17:00",
          "pauseMinutes": 30
        },
        {
          "date": "2026-04-16",
          "zoneNom": "Bar",
          "zoneCouleur": "#a855f7",
          "heureDebut": "14:00",
          "heureFin": "22:00",
          "pauseMinutes": 30
        }
      ],
      "totalHeures": 38.5
    }
  ]
}
```

**Logique :**
- Retourne la semaine en cours + les 2 prochaines semaines **publiées uniquement**
- Si une semaine future n'est pas publiée, elle n'apparaît pas
- Conformité IDCC 1790 : l'employé doit avoir visibilité 7 jours à l'avance minimum

### 4.5 GET `/api/planning/alerts` — Alertes planning

**Params :** `?centreId={id}&weekStart=2026-04-13`

**Types d'alertes :**

#### Alertes métier (existantes)

| Type | Condition | Sévérité |
|---|---|---|
| `DEPASSEMENT_HEURES` | totalHeures > heuresHebdo + 2h | haute |
| `SOUS_PLANIFIE` | totalHeures < heuresHebdo - 4h | moyenne |
| `ZONE_NON_COUVERTE` | aucun poste sur une zone pour un jour avec service | haute |

#### Alertes légales — Code du travail (NOUVELLES)

Ces alertes sont basées sur les **limites absolues du Code du travail** et de la
Convention Collective IDCC 1790. Elles doivent être affichées avec un badge ⚖️
pour les distinguer des alertes métier.

| Type | Condition | Base légale | Sévérité |
|---|---|---|---|
| `MAX_JOURNALIER` | un shift > 10h sur un jour | Art. L3121-18 C. travail | haute |
| `MAX_HEBDO_ABSOLU` | total heures > 48h sur la semaine | Art. L3121-20 C. travail | haute |
| `MAX_HEBDO_MOYENNE` | moyenne > 44h sur 12 semaines glissantes | Art. L3121-22 C. travail | haute |
| `REPOS_QUOTIDIEN` | moins de 11h entre fin d'un shift (jour J) et début du suivant (jour J+1) | Art. L3131-1 C. travail | haute |
| `REPOS_HEBDO` | moins de 35h consécutives de repos dans la semaine (24h + 11h) | Art. L3132-2 C. travail | haute |
| `PAUSE_6H` | shift > 6h continues et pauseMinutes < 20 | Art. L3121-16 C. travail | moyenne |

**Notes d'implémentation :**
- `MAX_HEBDO_MOYENNE` nécessite de regarder les **11 semaines précédentes** + la semaine en cours. Le `PlanningService::getAlerts()` doit appeler `ServiceRepository::findBetween()` sur une plage de 12 semaines pour calculer la moyenne glissante.
- `REPOS_QUOTIDIEN` nécessite de comparer le `heureFin` du dernier shift d'un jour avec le `heureDebut` du premier shift du lendemain pour chaque employé. Si la différence < 11h → alerte.
- `REPOS_HEBDO` : chercher la plus longue plage consécutive sans shift dans la semaine. Si < 35h → alerte.
- Ces alertes doivent aussi s'afficher comme **warnings dans la modal de publication** : si des alertes légales haute sévérité existent, le manager voit un récapitulatif avant de confirmer.

---

## 5. Types TypeScript

```typescript
// types/planning.ts

// ─── Shift (poste avec horaires) ────────────────────────────────────────────

export interface PlanningShift {
  posteId:       number
  serviceId:     number
  date:          string        // 'YYYY-MM-DD'
  zoneId:        number
  zoneNom:       string
  zoneCouleur:   string
  heureDebut:    string        // 'HH:mm'
  heureFin:      string        // 'HH:mm'
  pauseMinutes:  number
}

// ─── Employé dans le planning ────────────────────────────────────────────────

export interface PlanningEmployee {
  id:            number
  nom:           string
  prenom:        string | null
  role:          'MANAGER' | 'EMPLOYE'
  avatarColor:   string | null
  heuresHebdo:   number | null
  typeContrat:   string | null
  shifts:        PlanningShift[]
  totalHeures:   number
  ecartContrat:  number         // positif = surplus, négatif = sous-planifié
}

// ─── Alerte planning ─────────────────────────────────────────────────────────

export type AlerteType =
  // Alertes métier
  | 'DEPASSEMENT_HEURES'
  | 'SOUS_PLANIFIE'
  | 'ZONE_NON_COUVERTE'
  // Alertes légales Code du travail
  | 'MAX_JOURNALIER'
  | 'MAX_HEBDO_ABSOLU'
  | 'MAX_HEBDO_MOYENNE'
  | 'REPOS_QUOTIDIEN'
  | 'REPOS_HEBDO'
  | 'PAUSE_6H'

export type AlerteSeverite = 'haute' | 'moyenne'
export type AlerteCategorie = 'metier' | 'legal'

export interface PlanningAlerte {
  type:        AlerteType
  severite:    AlerteSeverite
  categorie:   AlerteCategorie     // 'legal' → badge ⚖️ dans l'UI
  message:     string
  baseLegale?: string              // ex: "Art. L3121-18 C. travail"
  date?:       string
  zoneId?:     number
  userId?:     number
}

// ─── Zone résumée ────────────────────────────────────────────────────────────

export interface PlanningZone {
  id:       number
  nom:      string
  couleur:  string
}

// ─── Stats résumées ──────────────────────────────────────────────────────────

export interface PlanningStats {
  employesPlanifies:  number
  totalHeures:        number
  creneauxVides:      number
  sousPlanifies:      number
}

// ─── Réponse complète GET /planning/week ─────────────────────────────────────

export interface PlanningWeekData {
  weekStart:   string
  weekEnd:     string
  statut:      'BROUILLON' | 'PUBLIE'
  note:        string | null
  zones:       PlanningZone[]
  employees:   PlanningEmployee[]
  alertes:     PlanningAlerte[]
  stats:       PlanningStats
}

// ─── Vue employé ─────────────────────────────────────────────────────────────

export interface EmployeeShift {
  date:          string
  zoneNom:       string
  zoneCouleur:   string
  heureDebut:    string
  heureFin:      string
  pauseMinutes:  number
}

export interface EmployeeWeek {
  weekStart:    string
  weekEnd:      string
  statut:       'PUBLIE'
  shifts:       EmployeeShift[]
  totalHeures:  number
}

export interface EmployeePlanningData {
  weeks: EmployeeWeek[]
}

// ─── Payloads mutations ──────────────────────────────────────────────────────

export interface CreateShiftPayload {
  serviceId:     number
  zoneId:        number
  userId:        number
  heureDebut:    string      // 'HH:mm'
  heureFin:      string      // 'HH:mm'
  pauseMinutes?: number      // défaut 0
}

export interface UpdateShiftPayload {
  posteId:       number
  zoneId?:       number
  heureDebut?:   string
  heureFin?:     string
  pauseMinutes?: number
}

export interface PublishWeekPayload {
  weekStart:          string          // 'YYYY-MM-DD' (lundi)
  motifModification?: string          // obligatoire si délai < 7j
  forcePublication?:  boolean         // true pour confirmer malgré délai < 7j
}

// Réponse 422 quand délai de prévenance non respecté
export interface PublishWarningResponse {
  warning:       'DELAI_PREVENANCE_NON_RESPECTE'
  delaiJours:    number
  message:       string
  severity:      'attention' | 'critique'   // critique si < 3j
  requiresMotif: true
}

export interface DuplicateWeekPayload {
  sourceWeekStart: string
  targetWeekStart: string
}

// ─── Snapshot (archivage légal) ─────────────────────────────────────────────

export interface PlanningSnapshotSummary {
  id:                 number
  weekStart:          string
  publishedAt:        string           // ISO datetime
  publishedByNom:     string
  motifModification:  string | null
  delaiRespect:       boolean          // false = publié à moins de 7j
}

export interface PlanningSnapshotDetail extends PlanningSnapshotSummary {
  data:     PlanningWeekData           // copie complète du planning
  checksum: string                     // SHA-256
}
```

---

## 6. Hooks React Query

```typescript
// hooks/usePlanning.ts

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type {
  PlanningWeekData,
  EmployeePlanningData,
  PlanningAlerte,
  CreateShiftPayload,
  UpdateShiftPayload,
  PublishWeekPayload,
  DuplicateWeekPayload,
} from '@/types/planning'

// ─── Planning hebdo (vue Manager) ────────────────────────────────────────────

export function usePlanningWeek(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningWeekData>({
    queryKey: ['planning', 'week', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/week', { params: { centreId, weekStart } })
        .then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Planning employé (vue 3 semaines) ───────────────────────────────────────

export function useEmployeePlanning() {
  return useQuery<EmployeePlanningData>({
    queryKey: ['planning', 'employee'],
    queryFn:  () => api.get('/planning/employee').then(r => r.data),
  })
}

// ─── Alertes planning ────────────────────────────────────────────────────────

export function usePlanningAlerts(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningAlerte[]>({
    queryKey: ['planning', 'alerts', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/alerts', { params: { centreId, weekStart } })
        .then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Créer un shift (poste avec horaires) ────────────────────────────────────

export function useCreateShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateShiftPayload) =>
      api.post('/postes/create', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Modifier un shift ───────────────────────────────────────────────────────

export function useUpdateShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ posteId, ...data }: UpdateShiftPayload) =>
      api.patch(`/postes/${posteId}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
    },
  })
}

// ─── Supprimer un shift ──────────────────────────────────────────────────────

export function useDeleteShift() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (posteId: number) =>
      api.delete(`/postes/${posteId}`).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'alerts', centreId] })
      queryClient.invalidateQueries({ queryKey: ['service', 'today', centreId] })
    },
  })
}

// ─── Publier une semaine (avec garde-fou délai de prévenance) ────────────────

export function usePublishWeek() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PublishWeekPayload) =>
      api.post('/planning/publish', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'employee'] })
      queryClient.invalidateQueries({ queryKey: ['planning', 'snapshots', centreId] })
    },
    // Note : le composant appelant doit gérer onError avec status 422
    // pour afficher la modal de confirmation avec saisie du motif.
    // Flow : 1er appel (forcePublication: false) → 422 → modal → 2e appel (forcePublication: true + motif)
  })
}

// ─── Historique des snapshots (archivage légal) ──────────────────────────────

export function usePlanningSnapshots(weekStart: string) {
  const centreId = useAuthStore(s => s.centreId)

  return useQuery<PlanningSnapshotSummary[]>({
    queryKey: ['planning', 'snapshots', centreId, weekStart],
    queryFn:  () =>
      api.get('/planning/snapshots', { params: { centreId, weekStart } })
        .then(r => r.data),
    enabled: !!centreId && !!weekStart,
  })
}

// ─── Dupliquer une semaine ───────────────────────────────────────────────────

export function useDuplicateWeek() {
  const centreId    = useAuthStore(s => s.centreId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DuplicateWeekPayload) =>
      api.post('/planning/duplicate', payload).then(r => r.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning', 'week', centreId] })
    },
  })
}
```

---

## 7. Composants React — Arbre

```
app/(app)/planning/
  └── page.tsx                      ← PlanningPage (routeur Manager / Employé)

components/planning/
  ├── PlanningManagerView.tsx        ← Vue complète Manager
  │   ├── WeekNavigator.tsx          ← Navigation semaine (← S15 →) + boutons actions
  │   ├── PlanningGrid.tsx           ← Grille employés × jours
  │   │   ├── PlanningRow.tsx        ← Ligne d'un employé (7 cases + total heures)
  │   │   │   └── ShiftBlock.tsx     ← Bloc shift coloré par zone (cliquable)
  │   │   └── DayHeader.tsx          ← En-tête jour (Lun 14, Mar 15…)
  │   ├── StatsBar.tsx               ← Barre stats en bas (employés, heures, alertes)
  │   ├── AlertPanel.tsx             ← Panneau latéral d'alertes (métier + légales avec badge ⚖️)
  │   ├── PublishModal.tsx           ← NOUVEAU — Modal de publication avec garde-fou délai
  │   │   └── DelaiWarning.tsx       ← NOUVEAU — Avertissement 7j/3j + champ motif
  │   ├── SnapshotPanel.tsx          ← NOUVEAU — Historique des versions publiées
  │   └── ShiftModal.tsx             ← Modal création / édition d'un shift
  │       ├── TimeRangePicker.tsx    ← Sélection heure début / fin
  │       └── ZoneSelector.tsx       ← Choix de la zone
  │
  └── PlanningEmployeeView.tsx       ← Vue 3 semaines pour l'employé
      ├── WeekCard.tsx               ← Carte d'une semaine
      └── EmployeeShiftRow.tsx       ← Ligne d'un jour avec shift(s)
```

### Détail des composants clés

**PlanningPage** (`page.tsx`)
- Vérifie le rôle via `useAuthStore`
- Manager → `PlanningManagerView`
- Employé → `PlanningEmployeeView`
- 3 états : loading / error / empty

**WeekNavigator**
- Affiche "Semaine 16 — 13 au 19 avril 2026"
- Boutons ← → pour naviguer
- Badge statut (BROUILLON orange / PUBLIÉ vert)
- Boutons : "Publier" / "Dupliquer semaine" / "Ajouter un shift"

**PlanningGrid**
- Grille CSS : colonne fixe (nom employé 200px) + 7 colonnes jours flex
- Scroll horizontal sur mobile
- Chaque cellule peut contenir 0-N `ShiftBlock`
- Click sur cellule vide → ouvre `ShiftModal` en mode création

**ShiftBlock**
- Bloc coloré avec la couleur de la zone
- Affiche : "09:00 – 17:00" + nom zone
- Click → ouvre `ShiftModal` en mode édition
- Bouton × pour supprimer (avec ConfirmModal)

**ShiftModal**
- Mode création : choisir employé (si ouvert depuis cellule vide), zone, heures, pause
- Mode édition : modifier zone, heures, pause
- Validation Zod : heure début < heure fin (sauf shift de nuit), pause ≤ durée shift

**StatsBar**
- Barre fixe en bas de la grille
- 4 métriques : employés planifiés, total heures, créneaux vides, sous-planifiés
- Couleurs sémantiques (vert/jaune/rouge selon seuils)

**AlertPanel**
- Panneau latéral (desktop) ou bottom sheet (mobile)
- Liste des alertes triées par sévérité
- Icônes : 🔴 haute, 🟡 moyenne
- **Deux sections** : "Alertes métier" et "Alertes légales ⚖️"
- Les alertes légales affichent la base légale (ex: "Art. L3121-18 C. travail")
- Click sur alerte → scroll vers la ligne/cellule concernée

**PublishModal** (NOUVEAU)
- S'ouvre quand le manager clique "Publier"
- Affiche le récapitulatif : nombre d'employés, total heures, alertes en cours
- **Si alertes légales haute sévérité** → section warning rouge avec liste des infractions
- **Si délai < 7j** (réponse 422 du serveur) → affiche `DelaiWarning`
- Boutons : "Confirmer la publication" / "Annuler"

**DelaiWarning** (NOUVEAU)
- Texte d'avertissement CC IDCC 1790 avec nombre de jours restants
- Si < 3j → style critique (fond rouge, texte "minimum exceptionnel dépassé")
- Champ textarea obligatoire "Motif de la publication hors délai"
- Le motif est envoyé au serveur et archivé dans le PlanningSnapshot

**SnapshotPanel** (NOUVEAU)
- Accessible via un bouton "Historique" dans le WeekNavigator
- Liste les snapshots de la semaine sélectionnée (date, heure, qui, motif)
- Badge rouge si `delaiRespect = false`
- Click sur un snapshot → vue en lecture seule du planning tel qu'il était à cette date

**PlanningEmployeeView**
- 3 cartes semaines empilées verticalement
- Chaque `WeekCard` : en-tête semaine + liste des shifts par jour
- Jours sans shift affichés en gris "Repos"
- Total heures par semaine en bas de chaque carte

---

## 8. Navigation — Modifications

### 8.1 Ajout de l'item "Planning" dans `navigation.ts`

```typescript
// Nouvel item à ajouter dans ALL_NAV_ITEMS (après Dashboard, avant Service du jour)
{ href: '/planning', label: 'Planning', icon: '📅', managerOnly: false, showOnMobile: true, mobileOrder: 1 }
```

> Note : l'icône Services (📅) actuelle devra être changée pour éviter le doublon.
> Suggestion : Services → '📊' ou '🗓️', Planning garde '📅'

### 8.2 Ordre mobile mis à jour

```
MANAGER  : Dashboard(0) · Planning(1) · Service(2) · Services(3) · Postes(4) · Staff(5) · Tutoriels(6) · Réglages(7)
EMPLOYE  : Planning(1) · Service(2) · Postes(4) · Staff(5) · Tutoriels(6) · Réglages(7)
```

### 8.3 Sidebar desktop — sections

Ajouter "Planning" dans la section principale, entre Dashboard et Service du jour.

---

## 9. Backend Symfony — Controller & Service

### 9.1 PlanningController

```
src/Controller/PlanningController.php

Routes :
  GET  /api/planning/week       → week()
  POST /api/planning/publish    → publish()       ← inclut garde-fou délai + snapshot auto
  POST /api/planning/duplicate  → duplicate()
  GET  /api/planning/employee   → employee()
  GET  /api/planning/alerts     → alerts()
  GET  /api/planning/snapshots  → snapshots()     ← NOUVEAU — historique des publications
  GET  /api/planning/export-pdf → exportPdf()     ← NOUVEAU — export PDF légal
```

Chaque route est sécurisée :
- `week`, `publish`, `duplicate`, `alerts`, `snapshots`, `export-pdf` → `ROLE_MANAGER`
- `employee` → `ROLE_USER` (tout employé connecté)

Le `centreId` est extrait du JWT pour toutes les routes (multi-tenant).

### 9.2 PlanningService

```
src/Service/PlanningService.php

Méthodes principales :
  getWeekData(Centre, DateTimeImmutable weekStart): array
  getEmployeeWeeks(User): array
  publishWeek(Centre, DateTimeImmutable weekStart, User publisher, ?string motif, bool force): PlanningWeek
  duplicateWeek(Centre, DateTimeImmutable source, DateTimeImmutable target): void
  getAlerts(Centre, DateTimeImmutable weekStart): array
  calculateShiftDuration(Poste): float  // en heures décimales
  createSnapshot(Centre, DateTimeImmutable weekStart, User publisher, ?string motif): PlanningSnapshot
  getSnapshots(Centre, DateTimeImmutable weekStart): array
  calculateDelaiPrevenance(DateTimeImmutable weekStart): int  // jours calendaires
  generatePdf(Centre, DateTimeImmutable weekStart): string    // retourne le chemin du PDF
  getLegalAlerts(Centre, DateTimeImmutable weekStart): array   // alertes Code du travail
```

**Logique `getWeekData`** :
1. Récupère les 7 services de la semaine (lundi → dimanche)
2. Pour chaque service : récupère les postes avec user + zone
3. Regroupe par employé
4. Calcule les heures totales par employé
5. Calcule l'écart vs contrat (heuresHebdo)
6. Génère les alertes
7. Calcule les stats agrégées

**Logique `duplicateWeek`** :
1. Vérifie qu'aucun poste n'existe sur la semaine cible
2. Pour chaque jour de la source :
   - Si un service source existe avec des postes → crée le service cible si manquant
   - Duplique chaque poste (user, zone, heureDebut, heureFin, pauseMinutes)
3. Flush en une seule transaction

**Logique `calculateShiftDuration`** :
```php
public function calculateShiftDuration(Poste $poste): float
{
    $debut = $poste->getHeureDebut();
    $fin   = $poste->getHeureFin();
    if (!$debut || !$fin) return 0.0;

    $minutes = ($fin->getTimestamp() - $debut->getTimestamp()) / 60;
    if ($minutes < 0) $minutes += 1440; // shift de nuit (+24h)

    $minutes -= $poste->getPauseMinutes();
    return round(max(0, $minutes) / 60, 2);
}
```

---

## 10. Entité PlanningWeek — Doctrine

```php
// src/Entity/PlanningWeek.php

#[ORM\Entity(repositoryClass: PlanningWeekRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_pw_centre_week', columns: ['centre_id', 'week_start'])]
class PlanningWeek
{
    const STATUT_BROUILLON = 'BROUILLON';
    const STATUT_PUBLIE    = 'PUBLIE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $weekStart = null;

    #[ORM\Column(length: 20)]
    private string $statut = self::STATUT_BROUILLON;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $publishedBy = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $note = null;

    // Getters / Setters ...
}
```

---

## 11. Entité PlanningSnapshot — Doctrine

```php
// src/Entity/PlanningSnapshot.php

#[ORM\Entity(repositoryClass: PlanningSnapshotRepository::class)]
#[ORM\Index(name: 'idx_ps_centre_week', columns: ['centre_id', 'week_start'])]
class PlanningSnapshot
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $weekStart = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $publishedBy = null;

    #[ORM\Column(type: 'json')]
    private array $data = [];

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motifModification = null;

    #[ORM\Column(length: 64)]
    private string $checksum = '';

    #[ORM\Column]
    private bool $delaiRespect = true;

    // Getters / Setters ...
}
```

**PlanningSnapshotRepository** :
```php
public function findByWeek(int $centreId, \DateTimeImmutable $weekStart): array
{
    return $this->createQueryBuilder('ps')
        ->andWhere('ps.centre = :centreId')
        ->andWhere('ps.weekStart = :weekStart')
        ->setParameter('centreId', $centreId)
        ->setParameter('weekStart', $weekStart)
        ->orderBy('ps.publishedAt', 'DESC')
        ->getQuery()
        ->getResult();
}
```

---

## 12. Ordre d'implémentation

### Phase A — Base (priorité 1)

1. **Migration SQL** : ALTER poste + ALTER user + CREATE planning_week
2. **Entité PlanningWeek** : Doctrine entity + repository
3. **Modifier Poste.php** : ajouter heureDebut, heureFin, pauseMinutes + groups
4. **Modifier User.php** : ajouter heuresHebdo, typeContrat + groups
5. **PlanningService** : getWeekData + calculateShiftDuration
6. **PlanningController** : GET /planning/week
7. **Types TypeScript** : types/planning.ts
8. **Hook usePlanningWeek** : query de base
9. **PlanningPage** : page.tsx avec routage Manager/Employé
10. **PlanningGrid** + PlanningRow + ShiftBlock + DayHeader
11. **WeekNavigator** : navigation entre semaines

### Phase B — Indicateurs + Alertes légales (priorité 2)

12. **StatsBar** : métriques en bas de grille
13. **AlertPanel** : panneau d'alertes (métier + légales avec badge ⚖️)
14. **Hook usePlanningAlerts**
15. **PlanningController::alerts()**
16. **PlanningService::getAlerts()** — inclut les 3 alertes métier
17. **PlanningService::getLegalAlerts()** — 6 alertes Code du travail (MAX_JOURNALIER, MAX_HEBDO_ABSOLU, MAX_HEBDO_MOYENNE, REPOS_QUOTIDIEN, REPOS_HEBDO, PAUSE_6H)
18. Barre de progression heures par employé (dans PlanningRow)

### Phase C — Publication, conformité et export (priorité 3)

19. **ShiftModal** : création / édition shift (React Hook Form + Zod)
20. **useCreateShift + useUpdateShift + useDeleteShift**
21. **Entité PlanningSnapshot** + migration SQL + PlanningSnapshotRepository
22. **PlanningController::publish()** avec garde-fou délai de prévenance (flow 422 + motif)
23. **PlanningService::createSnapshot()** — archivage automatique à chaque publication
24. **PublishModal + DelaiWarning** — modal de confirmation avec avertissements légaux
25. **SnapshotPanel + usePlanningSnapshots** — historique des versions publiées
26. **PlanningController::duplicate()** + useDuplicateWeek
27. **GET /planning/employee** + useEmployeePlanning
28. **PlanningEmployeeView** : vue 3 semaines
29. **Export PDF du planning** — `PlanningService::generatePdf()` + `GET /planning/export-pdf` (document légal avec date de publication, horodatage, tableau complet)
30. **Navigation** : ajout item Planning dans sidebar + bottom nav

### Phase D — Avancé (différé)

31. Templates de semaine type
32. Drag & drop (react-beautiful-dnd ou @dnd-kit)
33. Indisponibilités employé
34. Compteurs mensuels / annuels
35. Calcul automatique des coûts (taux horaire × heures)
36. Validation des écarts d'heures (ShiftAdjustment — déclaration salarié + validation manager)
37. Journal d'audit automatique (PlanningAuditLog)
38. Champs contractuels étendus sur User (joursContractuels, plageHoraireContrat, dateEmbauche)
39. Score de conformité globale (indicateur visuel pré-publication)

---

## 13. Pièges à éviter — Notes pour l'implémentation

### 13.1 Poste.php — Ajouter une opération PATCH

L'entité Poste actuelle n'a PAS d'opération Patch dans ses déclarations API Platform.
Le hook `useUpdateShift` utilise `PATCH /postes/{posteId}`. Il faut donc ajouter :

```php
// Dans les operations de Poste.php, ajouter :
use ApiPlatform\Metadata\Patch;

new Patch(
    security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)",
    denormalizationContext: ['groups' => ['poste:write']]
),
```

### 13.2 Groupes de sérialisation des nouveaux champs

**Poste.php** — les 3 nouveaux champs doivent avoir les bons groupes :
```php
#[ORM\Column(type: 'time_immutable', nullable: true)]
#[Groups(['poste:read', 'poste:write'])]
private ?\DateTimeImmutable $heureDebut = null;

#[ORM\Column(type: 'time_immutable', nullable: true)]
#[Groups(['poste:read', 'poste:write'])]
private ?\DateTimeImmutable $heureFin = null;

#[ORM\Column(options: ['default' => 0])]
#[Groups(['poste:read', 'poste:write'])]
private int $pauseMinutes = 0;
```

**User.php** — les 2 nouveaux champs :
```php
#[ORM\Column(nullable: true)]
#[Groups(['user:read', 'user:write'])]
private ?int $heuresHebdo = null;

#[ORM\Column(length: 30, nullable: true)]
#[Groups(['user:read', 'user:write'])]
private ?string $typeContrat = null;
```

### 13.3 Navigation — mobileOrder actuels et conflits

Les `mobileOrder` actuels dans `navigation.ts` sont :
```
Dashboard     → 0 (managerOnly)
Service       → 1
Services      → 1 (managerOnly)
Postes        → 2
Staff         → 3
Tutoriels     → 4
Réglages      → 5
```

Après ajout du Planning, **recaler tous les mobileOrder** :
```typescript
{ href: '/dashboard', label: 'Dashboard',       icon: '⚡',  managerOnly: true,  showOnMobile: true, mobileOrder: 0 },
{ href: '/planning',  label: 'Planning',        icon: '📅',  managerOnly: false, showOnMobile: true, mobileOrder: 1 },
{ href: '/service',   label: 'Service du jour', icon: '📋',  managerOnly: false, showOnMobile: true, mobileOrder: 2 },
{ href: '/services',  label: 'Services',        icon: '🗓️', managerOnly: true,  showOnMobile: true, mobileOrder: 3 },
{ href: '/postes',    label: 'Postes',          icon: '🗂️', managerOnly: false, showOnMobile: true, mobileOrder: 4 },
{ href: '/staff',     label: 'Staff',           icon: '👥',  managerOnly: false, showOnMobile: true, mobileOrder: 5 },
{ href: '/tutoriels', label: 'Tutoriels',       icon: '📖',  managerOnly: false, showOnMobile: true, mobileOrder: 6 },
{ href: '/reglages',  label: 'Réglages',        icon: '⚙️',  managerOnly: false, showOnMobile: true, mobileOrder: 7 },
```

### 13.4 PlanningWeekRepository — méthode requise

```php
// src/Repository/PlanningWeekRepository.php

class PlanningWeekRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanningWeek::class);
    }

    /** Trouve la PlanningWeek pour un centre et un lundi donné */
    public function findByCentreAndWeek(int $centreId, \DateTimeImmutable $weekStart): ?PlanningWeek
    {
        return $this->createQueryBuilder('pw')
            ->andWhere('pw.centre = :centreId')
            ->andWhere('pw.weekStart = :weekStart')
            ->setParameter('centreId', $centreId)
            ->setParameter('weekStart', $weekStart)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** Semaines publiées entre deux dates (pour la vue employé) */
    public function findPublishedBetween(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('pw')
            ->andWhere('pw.centre = :centreId')
            ->andWhere('pw.statut = :statut')
            ->andWhere('pw.weekStart BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('statut', PlanningWeek::STATUT_PUBLIE)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('pw.weekStart', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
```

### 13.5 ServiceRepository::findBetween — déjà existant

`ServiceRepository` a déjà une méthode `findBetween(centreId, from, to)` qui retourne
les services triés par date ASC. Le `PlanningService::getWeekData()` doit l'utiliser
directement — pas besoin de la recréer.

### 13.6 Création de shift — le Service doit exister

Le hook `useCreateShift` appelle `POST /postes/create` (endpoint custom existant).
Cet endpoint doit être **modifié** pour :
1. Accepter les nouveaux champs `heureDebut`, `heureFin`, `pauseMinutes`
2. Créer automatiquement le Service du jour si aucun n'existe encore pour cette date

Vérifier le controller existant qui gère `/postes/create` (probablement dans un
PosteController custom) et l'adapter.

### 13.7 Pattern multi-tenant — à suivre

Suivre le pattern de `DashboardController` pour le guard multi-tenant :
```php
$currentUser = $this->getUser();
if ($currentUser->getCentre()?->getId() !== $centreId) {
    throw $this->createAccessDeniedException('Accès refusé à ce centre.');
}
```

---

## 14. Points d'attention

**Performance** : La requête GET /planning/week fait N+1 si mal optimisée.
Utiliser des JOINs Doctrine (QueryBuilder avec leftJoin + select) pour charger
services → postes → user + zone en une seule requête.

**Fuseau horaire** : Stocker les heures en UTC, afficher en Europe/Paris.
Le service du centre est toujours dans le même fuseau.

**Contrainte UNIQUE poste** : `(service_id, zone_id, user_id)` permet un employé
sur plusieurs zones le même jour (ex: Accueil le matin, Bar l'après-midi)
mais pas deux fois sur la même zone pour le même service.

**Convention collective IDCC 1790** :
- Planning communiqué 7 jours calendaires à l'avance minimum (3 jours en cas exceptionnel)
- Repos hebdomadaire : 2 jours consécutifs ou non (selon accord d'entreprise)
- Durée maximale journalière : 10h (alerte si shift > 10h)
- Pause obligatoire : 20 min après 6h de travail continu

**Conformité juridique — implémentée dans ce module** :
- **Archivage légal** : chaque publication crée un PlanningSnapshot immuable (JSON + SHA-256). Conservation 3 ans minimum (prescription prud'homale). Preuve en cas de litige sur les heures sup ou le délai de prévenance.
- **Garde-fou publication** : le endpoint POST /publish retourne 422 si le délai < 7 jours calendaires. Le manager doit confirmer avec un motif écrit qui est archivé dans le snapshot.
- **Alertes Code du travail** : 6 alertes supplémentaires basées sur les limites légales absolues (art. L3121-16/18/20/22, L3131-1, L3132-2). Différenciées visuellement des alertes métier par un badge ⚖️.
- **Export PDF** : document horodaté avec date de publication, servant de preuve pour l'inspection du travail (obligation L3171-1 de décompte du temps de travail).

**Compatibilité Service du Jour** : Le module Planning crée des Services + Postes
qui sont ensuite utilisés par la page Service du Jour. Les deux modules partagent
les mêmes entités — pas de duplication de données.
