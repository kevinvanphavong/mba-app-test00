# Module Pointage — Spécifications MVP

> Ce document décrit le module de pointage pour Shiftly.
> Il est destiné à être lu par Claude Code avant l'implémentation.

---

## 1. Concept

La page `/pointage` est une **vue manager unique** ouverte sur un device à la réception.
Les employés viennent sur cet écran pour pointer leur arrivée, départ, et pauses.
Le manager peut aussi pointer pour un employé et gérer les corrections.

**Sécurité par code PIN :**
Chaque employé possède un **code à 4 chiffres** (`codePointage` sur l'entité User).
Quand un employé clique sur sa carte dans la page Pointage, il doit **saisir son code PIN**
avant de pouvoir pointer (arrivée, départ, pause). Cela empêche qu'un collègue pointe à la
place d'un autre. Le manager peut bypasser le PIN (il est déjà authentifié).
Le code PIN est modifiable dans `/reglages` (par le manager pour tout le staff, ou par
l'employé lui-même pour son propre code).

**Ce que ce module n'est PAS :**
- Pas d'interface employé individuelle (pas de clock-in depuis leur téléphone)
- Pas de validation hebdomadaire (phase 2)
- Pas d'export paie (phase 2)
- Pas de géolocalisation

---

## 2. Entités

### 2.1 Pointage (nouvelle entité)

```php
#[ORM\Entity(repositoryClass: PointageRepository::class)]
#[ORM\Table(name: 'pointage')]
#[ORM\Index(columns: ['centre_id', 'service_id'], name: 'idx_pointage_centre_service')]
class Pointage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Service $service = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?Poste $poste = null;           // Nullable = pointage sans poste planifié (renfort)

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $heureArrivee = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $heureDepart = null;

    #[ORM\Column(length: 20)]
    private string $statut = self::STATUT_PREVU;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $commentaire = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'pointage', targetEntity: PointagePause::class, cascade: ['persist', 'remove'])]
    private Collection $pauses;

    // Constantes statut
    public const STATUT_PREVU = 'PREVU';           // Créé auto depuis les postes, pas encore pointé
    public const STATUT_EN_COURS = 'EN_COURS';     // Employé a pointé son arrivée
    public const STATUT_EN_PAUSE = 'EN_PAUSE';     // Employé en pause
    public const STATUT_TERMINE = 'TERMINE';       // Employé a pointé son départ
    public const STATUT_ABSENT = 'ABSENT';         // Marqué absent par le manager
}
```

**Logique des statuts :**
```
PREVU → EN_COURS (pointer arrivée)
EN_COURS → EN_PAUSE (démarrer pause)
EN_PAUSE → EN_COURS (reprendre après pause)
EN_COURS → TERMINE (pointer départ)
PREVU → ABSENT (marqué par manager)
```

### 2.2 PointagePause (nouvelle entité)

```php
#[ORM\Entity]
#[ORM\Table(name: 'pointage_pause')]
class PointagePause
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'pauses')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Pointage $pointage = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $heureDebut = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $heureFin = null;       // null = pause en cours

    #[ORM\Column(length: 20)]
    private string $type = 'COURTE';                     // COURTE | REPAS
}
```

### 2.3 Modification de l'entité User — ajout du code PIN

Ajouter un champ `codePointage` à l'entité User :

```php
// Dans User.php — AJOUTER ce champ
#[ORM\Column(length: 4, nullable: true)]
#[Groups(['user:read', 'user:write'])]
private ?string $codePointage = null;

public function getCodePointage(): ?string
{
    return $this->codePointage;
}

public function setCodePointage(?string $codePointage): static
{
    $this->codePointage = $codePointage;
    return $this;
}
```

**Règles du code PIN :**
- 4 chiffres exactement (validation regex `^\d{4}$`)
- Nullable (si null → le manager doit en définir un avant que l'employé puisse pointer)
- Stocké en clair (c'est un PIN de commodité, pas un mot de passe — 4 chiffres ne justifient pas un hash)
- Unique par centre (deux employés du même centre ne peuvent pas avoir le même code)
- Le champ `codePointage` ne doit **JAMAIS** être retourné dans les réponses API publiques (exclure du group `poste:read`, `pointage:read`). Il est uniquement lisible via `user:read` pour le manager dans `/reglages`.

**Autres champs existants exploités (pas de modification) :**
- `Poste.heureDebut / heureFin / pauseMinutes` → horaires prévus
- `Service.statut` → pour savoir si le service est EN_COURS
- `Service.date + heureDebut/heureFin` → pour l'affichage
- `User.nom / prenom / avatarColor / role` → pour les cartes staff

---

## 3. Migration SQL

```sql
CREATE TABLE pointage (
    id INT AUTO_INCREMENT NOT NULL,
    centre_id INT NOT NULL,
    service_id INT NOT NULL,
    poste_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    heure_arrivee DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    heure_depart DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    statut VARCHAR(20) NOT NULL DEFAULT 'PREVU',
    commentaire TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    INDEX idx_pointage_centre_service (centre_id, service_id),
    CONSTRAINT FK_pointage_centre FOREIGN KEY (centre_id) REFERENCES centre (id),
    CONSTRAINT FK_pointage_service FOREIGN KEY (service_id) REFERENCES service (id),
    CONSTRAINT FK_pointage_poste FOREIGN KEY (poste_id) REFERENCES poste (id) ON DELETE SET NULL,
    CONSTRAINT FK_pointage_user FOREIGN KEY (user_id) REFERENCES `user` (id),
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`;

-- Ajout du code PIN sur la table user
ALTER TABLE `user` ADD COLUMN code_pointage VARCHAR(4) DEFAULT NULL;
CREATE UNIQUE INDEX uniq_user_centre_code ON `user` (centre_id, code_pointage);

CREATE TABLE pointage_pause (
    id INT AUTO_INCREMENT NOT NULL,
    pointage_id INT NOT NULL,
    heure_debut DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
    heure_fin DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
    type VARCHAR(20) NOT NULL DEFAULT 'COURTE',
    CONSTRAINT FK_pause_pointage FOREIGN KEY (pointage_id) REFERENCES pointage (id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);
```

---

## 4. API — Routes du PointageController

### 4.1 GET /api/pointage/service/{serviceId}

Retourne tous les pointages d'un service, enrichis avec les données de poste.

```json
{
  "service": {
    "id": 42,
    "date": "2026-04-19",
    "heureDebut": "14:00",
    "heureFin": "23:00",
    "statut": "EN_COURS"
  },
  "pointages": [
    {
      "id": 1,
      "user": { "id": 5, "nom": "Lemoine", "prenom": "Sarah", "avatarColor": "#3b82f6" },
      "poste": { "id": 12, "zone": { "id": 2, "nom": "Bar", "couleur": "#a855f7" }, "heureDebut": "14:00", "heureFin": "22:00", "pauseMinutes": 20 },
      "heureArrivee": "2026-04-19T14:00:00",
      "heureDepart": null,
      "statut": "EN_COURS",
      "pauses": [],
      "dureeEffective": 105,
      "commentaire": null
    }
  ],
  "stats": {
    "total": 8,
    "presents": 6,
    "enPause": 1,
    "absents": 1,
    "termines": 0,
    "prevus": 0,
    "retards": 2,
    "heuresCumulees": 42.5
  }
}
```

**Logique côté `PointageService` :**
- Quand on appelle cette route pour la PREMIÈRE fois sur un service, le service génère automatiquement les pointages `PREVU` à partir des postes assignés
- Si des pointages existent déjà, on les retourne directement
- `dureeEffective` = calcul en temps réel (maintenant - heureArrivee - totalPauses) en minutes
- Les `stats` sont recalculées dynamiquement

### 4.2 POST /api/pointage/{id}/arrivee

Pointer l'arrivée d'un employé.

```json
// Request body
{ "codePin": "1234", "commentaire": "Retard bus" }

// Response 200
{ "id": 1, "statut": "EN_COURS", "heureArrivee": "2026-04-19T14:05:00" }

// Response 403 si code PIN incorrect
{ "error": "Code PIN incorrect" }

// Response 400 si code PIN non défini
{ "error": "Aucun code PIN défini pour cet employé. Le manager doit en définir un dans Réglages." }
```

**Règles :**
- Le pointage doit être en statut `PREVU`
- **Vérification du code PIN** : `codePin` requis dans le body, comparé à `user.codePointage`
- Si `user.codePointage` est null → erreur 400 (le manager doit définir un PIN)
- Si `codePin` ne correspond pas → erreur 403
- **Bypass manager** : si le body contient `"managerBypass": true`, pas besoin de code PIN (le manager est déjà authentifié via JWT)
- `heureArrivee` = `new DateTimeImmutable('now')`
- Si l'heure actuelle > poste.heureDebut → le pointage est un retard (info, pas bloquant)
- Passe le statut à `EN_COURS`

### 4.3 POST /api/pointage/{id}/depart

Pointer le départ d'un employé.

```json
// Request body
{ "codePin": "1234", "commentaire": "Départ anticipé autorisé" }

// Response 200
{ "id": 1, "statut": "TERMINE", "heureDepart": "2026-04-19T22:05:00", "dureeEffective": 460 }
```

**Règles :**
- **Vérification du code PIN** : même logique que pour l'arrivée (codePin requis, managerBypass possible)
- Le pointage doit être en statut `EN_COURS` (pas `EN_PAUSE` → on force la fin de pause d'abord)
- Si une pause est en cours, on la clôture automatiquement avant de clôturer le pointage
- `heureDepart` = `new DateTimeImmutable('now')`
- Passe le statut à `TERMINE`
- Retourne `dureeEffective` en minutes

### 4.4 POST /api/pointage/{id}/pause/start

Démarrer une pause.

```json
// Request body
{ "codePin": "1234", "type": "REPAS" }    // COURTE (défaut) ou REPAS

// Response 200
{ "id": 1, "statut": "EN_PAUSE", "pause": { "id": 3, "heureDebut": "2026-04-19T17:30:00", "type": "REPAS" } }
```

**Règles :**
- **Vérification du code PIN** : même logique (codePin requis, managerBypass possible)
- Le pointage doit être en statut `EN_COURS`
- Crée une nouvelle `PointagePause` avec `heureDebut = now`, `heureFin = null`
- Passe le statut du pointage à `EN_PAUSE`

### 4.5 POST /api/pointage/{id}/pause/end

Terminer une pause.

```json
// Response 200
{ "id": 1, "statut": "EN_COURS", "pause": { "id": 3, "heureFin": "2026-04-19T17:50:00", "duree": 20 } }
```

**Règles :**
- **Vérification du code PIN** : même logique (codePin requis, managerBypass possible)
- Le pointage doit être en statut `EN_PAUSE`
- Trouve la pause en cours (heureFin IS NULL) et la clôture
- Repasse le statut à `EN_COURS`

### 4.6 POST /api/pointage/{id}/absence

Marquer un employé absent.

```json
// Request body (optionnel)
{ "commentaire": "Sans justificatif" }

// Response 200
{ "id": 1, "statut": "ABSENT" }
```

**Règles :**
- Le pointage doit être en statut `PREVU`
- Passe le statut à `ABSENT`

### 4.7 POST /api/pointage/cloturer-service/{serviceId}

Clôturer tous les pointages ouverts d'un service.

```json
// Response 200
{ "clotures": 5, "absents": 1 }
```

**Règles :**
- Tous les pointages `EN_COURS` ou `EN_PAUSE` → `TERMINE` avec `heureDepart = now`
- Toutes les pauses en cours → clôturées
- Tous les pointages `PREVU` restants → `ABSENT`
- **Sécurité : ROLE_MANAGER uniquement**

---

## 5. PointageService — Méthodes métier

```php
class PointageService
{
    // Génère les pointages PREVU à partir des postes d'un service
    public function genererPointagesDepuisPostes(Service $service): array

    // Calcule la durée effective en minutes (temps travaillé - pauses)
    public function calculerDureeEffective(Pointage $pointage): int

    // Calcule le total des pauses en minutes
    public function calculerTotalPauses(Pointage $pointage): int

    // Détermine si l'employé est en retard (arrivée > poste.heureDebut)
    public function estEnRetard(Pointage $pointage): bool

    // Retard en minutes
    public function minutesRetard(Pointage $pointage): int

    // Calcule les stats agrégées pour un service
    public function calculerStats(array $pointages): array

    // Clôture tous les pointages ouverts d'un service
    public function cloturerService(Service $service): array
}
```

**Calcul `dureeEffective` :**
```
Si statut = TERMINE :
    duree = heureDepart - heureArrivee (en minutes)
Si statut = EN_COURS ou EN_PAUSE :
    duree = now() - heureArrivee (en minutes)

totalPauses = somme des pauses terminées (heureFin - heureDebut)
            + pause en cours (now() - heureDebut) si applicable

dureeEffective = duree - totalPauses
```

**Calcul `estEnRetard` :**
```
Si poste != null ET heureArrivee != null :
    serviceDate = service.date (ex: 2026-04-19)
    heureDebutPrevue = serviceDate + poste.heureDebut (ex: 14:00)
    retard = heureArrivee > heureDebutPrevue
```

---

## 6. Génération automatique des pointages

Quand la route `GET /api/pointage/service/{serviceId}` est appelée pour un service qui n'a pas encore de pointages :

1. Récupérer tous les `Poste` du service
2. Pour chaque poste, créer un `Pointage` avec :
   - `centre` = service.centre
   - `service` = service
   - `poste` = poste
   - `user` = poste.user
   - `statut` = PREVU
   - `heureArrivee` = null
   - `heureDepart` = null
   - `createdAt` = now()
3. Flush en base
4. Retourner les pointages créés

Cela garantit que chaque poste planifié a un pointage correspondant dès qu'on ouvre la page.

---

## 7. Types TypeScript

```typescript
// src/types/pointage.ts

export type PointageStatut = 'PREVU' | 'EN_COURS' | 'EN_PAUSE' | 'TERMINE' | 'ABSENT'
export type PauseType = 'COURTE' | 'REPAS'

export interface PointagePause {
  id: number
  heureDebut: string       // ISO datetime
  heureFin: string | null  // null = pause en cours
  type: PauseType
  duree?: number           // minutes (calculé)
}

export interface PointageEntry {
  id: number
  user: {
    id: number
    nom: string
    prenom: string | null
    avatarColor: string | null
    role: 'MANAGER' | 'EMPLOYE'
  }
  poste: {
    id: number
    zone: {
      id: number
      nom: string
      couleur: string
    }
    heureDebut: string | null   // HH:mm prévu
    heureFin: string | null     // HH:mm prévu
    pauseMinutes: number
  } | null
  heureArrivee: string | null   // ISO datetime réel
  heureDepart: string | null    // ISO datetime réel
  statut: PointageStatut
  pauses: PointagePause[]
  dureeEffective: number        // minutes (calculé côté API)
  minutesRetard: number         // 0 si à l'heure (calculé côté API)
  commentaire: string | null
}

export interface PointageStats {
  total: number
  presents: number        // EN_COURS
  enPause: number         // EN_PAUSE
  absents: number         // ABSENT
  termines: number        // TERMINE
  prevus: number          // PREVU (pas encore pointé)
  retards: number         // arrivée > heure prévue
  heuresCumulees: number  // total heures effectives (décimal)
}

export interface PointageServiceData {
  service: {
    id: number
    date: string
    heureDebut: string
    heureFin: string
    statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  }
  pointages: PointageEntry[]
  stats: PointageStats
}
```

---

## 8. Hook React Query

```typescript
// src/hooks/usePointage.ts

// Lecture des pointages d'un service — polling toutes les 15 secondes
export function usePointageService(serviceId: number | null)
  // GET /api/pointage/service/{serviceId}
  // refetchInterval: 15_000 (temps réel)
  // enabled: !!serviceId

// Pointer arrivée
export function usePointageArrivee()
  // POST /api/pointage/{id}/arrivee
  // Invalidates: ['pointage', serviceId]

// Pointer départ
export function usePointageDepart()
  // POST /api/pointage/{id}/depart
  // Invalidates: ['pointage', serviceId]

// Démarrer pause
export function usePointagePauseStart()
  // POST /api/pointage/{id}/pause/start
  // Invalidates: ['pointage', serviceId]

// Terminer pause
export function usePointagePauseEnd()
  // POST /api/pointage/{id}/pause/end
  // Invalidates: ['pointage', serviceId]

// Marquer absent
export function usePointageAbsence()
  // POST /api/pointage/{id}/absence
  // Invalidates: ['pointage', serviceId]

// Clôturer service
export function usePointageCloturerService()
  // POST /api/pointage/cloturer-service/{serviceId}
  // Invalidates: ['pointage', serviceId]
```

**Important :** Le polling `refetchInterval: 15_000` permet de garder les KPIs et durées à jour en temps réel sans WebSocket.

---

## 9. Page `/pointage` — Structure des composants

```
src/app/(app)/pointage/page.tsx          ← Page principale
src/components/pointage/
├── PointageHeader.tsx                    ← En-tête : service, date, heure live, badge EN DIRECT
├── PointageKpiRow.tsx                    ← 5 cartes KPI (présents, en pause, absents, retards, heures)
├── PointageStaffList.tsx                 ← Liste des cartes staff
├── PointageStaffCard.tsx                 ← Carte individuelle d'un employé avec actions
├── PointagePinPad.tsx                   ← Clavier numérique 4 chiffres pour vérification identité
├── PointageActionModal.tsx              ← Modale d'action (arrivée / départ / pause / absence)
├── PointageTimeline.tsx                  ← Timeline chronologique des événements du service
├── PointageAlertPanel.tsx               ← Panneau d'alertes (retards, absences, pauses)
└── PointageCloturerModal.tsx            ← Modale de confirmation de clôture du service
```

### 9.1 PointageHeader

- Titre : "Pointage"
- Badge du service : "Service du soir" ou "Service du matin" (basé sur heureDebut)
- Date : "Samedi 19 avril 2026"
- Heure actuelle : "15:47" mise à jour chaque seconde (setInterval JS, pas d'appel API)
- Badge "EN DIRECT" avec point vert pulsant si service.statut === 'EN_COURS'
- Bouton "Clôturer le service" (ouvre PointageCloturerModal)
- Si aucun service EN_COURS aujourd'hui → afficher un état vide "Aucun service en cours"

### 9.2 PointageKpiRow

5 cartes, valeurs extraites de `stats` :
1. `stats.presents` présents (vert) — sous-texte "sur {stats.total} prévus"
2. `stats.enPause` en pause (jaune) — sous-texte nom de la personne si 1 seul
3. `stats.absents` absents (rouge) — sous-texte nom si 1 seul
4. `stats.retards` retards (orange) — sous-texte "moy. +X min"
5. `stats.heuresCumulees` h cumulées (bleu) — sous-texte "équipe"

### 9.3 PointageStaffCard

Pour chaque `PointageEntry`, afficher une carte avec :

**En-tête :** Avatar (initiales + avatarColor) | Nom complet | Zone badge (nom + couleur)

**Corps (selon statut) :**

| Statut | Affichage |
|--------|-----------|
| `PREVU` | Horaires prévus (HH:mm — HH:mm). Bouton "👋 Pointer arrivée". Si heure actuelle > heureDebut prévue → badge orange "Retard +X min" |
| `EN_COURS` | "En service depuis HH:mm" + durée effective live. Arrivée: HH:mm ✓ (ou ⚠ +Xmin). Boutons : "☕ Pause" et "🚪 Départ" |
| `EN_PAUSE` | "En pause depuis HH:mm" + durée pause live (jaune). Bouton : "▶️ Reprendre" |
| `TERMINE` | Arrivée → Départ. Durée nette. Pauses prises. Grisé. Badge "✓ Terminé" |
| `ABSENT` | Badge rouge "Absent". Commentaire si présent. Grisé. |

**Tri des cartes :**
1. EN_PAUSE en premier (action requise)
2. PREVU avec retard (action requise)
3. EN_COURS (en service)
4. PREVU sans retard (en attente)
5. TERMINE (terminé, en bas)
6. ABSENT (absent, en bas)

**Bordure gauche colorée :**
- Vert = EN_COURS
- Jaune = EN_PAUSE
- Orange = PREVU avec retard
- Gris = PREVU sans retard
- Gris foncé = TERMINE
- Rouge = ABSENT

### 9.4 PointagePinPad — Clavier code PIN

Quand un employé clique sur sa carte (n'importe quelle action : arrivée, départ, pause), la
**première étape** est la saisie du code PIN via un clavier numérique plein écran.

**Structure du composant :**
- Prend toute la largeur du contenu (pas une modale, un écran intermédiaire)
- En haut : avatar + nom de l'employé + zone badge
- Message : "Saisissez votre code à 4 chiffres"
- 4 cercles indicateurs (●●○○ → remplis au fur et à mesure)
- Clavier numérique : grille 3×4 (1-9, vide, 0, ⌫ backspace)
- Les touches sont larges et tactiles (min 64px × 64px) — pensé pour écran tactile
- Bouton "Annuler" en bas
- Animation : shake + cercles rouges si code incorrect
- Feedback haptic-like : les cercles se remplissent avec une micro-animation

**Flow :**
1. Employé clique sur sa carte → affiche PointagePinPad
2. Employé tape son code 4 chiffres
3. Dès le 4e chiffre, envoi automatique à l'API avec `codePin` dans le body
4. Si code correct → l'action est exécutée (arrivée/départ/pause)
5. Si code incorrect → shake animation, message "Code incorrect", réinitialiser les cercles
6. Après 3 tentatives échouées → verrouiller 30 secondes avec countdown

**Bypass manager :**
- En bas du PinPad, petit lien discret "Manager : passer sans code"
- Ce lien envoie `managerBypass: true` au lieu du code PIN
- L'utilisateur connecté (JWT) étant le manager, c'est sécurisé côté API

**Si l'employé n'a pas de code PIN défini :**
- Au lieu du PinPad, afficher un message : "Aucun code PIN défini pour {nom}. Définissez-en un dans Réglages > Staff."
- Bouton "Manager : pointer sans code" (bypass)

### 9.5 PointageActionModal

Le PointageActionModal s'affiche **APRÈS** la validation du PIN (ou après bypass manager).
C'est une modale de confirmation rapide :

- Pour l'arrivée : "✓ Arrivée pointée à HH:mm" — affichage 2 secondes puis fermeture auto
- Pour le départ : "✓ Départ pointé à HH:mm — Durée : Xh Ymin" — affichage 2 secondes
- Pour la pause start : choix "Pause courte" ou "Pause repas" puis confirmation
- Pour la pause end : "✓ Pause terminée — Durée : X min" — affichage 2 secondes
- Pour l'absence (manager only, pas de PIN) : champ commentaire + confirmation
- Pour la clôture service (manager only) : "Cela va clôturer X pointages ouverts et marquer Y employés absents"

Le champ commentaire optionnel est disponible si l'employé ou le manager le souhaite,
accessible via un petit lien "Ajouter un commentaire".

### 9.6 PointageTimeline

Liste chronologique des événements du service, construite à partir des pointages :
- Pour chaque pointage, extraire les événements : arrivée, début/fin pause, départ
- Trier par heure décroissante (plus récent en haut)
- Chaque événement : dot coloré + texte + heure + nom employé
- Point pulsant pour l'événement le plus récent

### 9.7 PointageAlertPanel

Alertes calculées côté front à partir des données :
- 🔴 "{nom}" non pointé(e) depuis X min → si PREVU et heure > heureDebut prévue
- ⚠️ "{nom}" en pause depuis X min → si pause > 30 min
- ⚠️ "{nom}" approche 6h continues sans pause → si dureeEffective > 330 min (5h30) et aucune pause
- ✅ Repos et temps de travail conformes → si aucune alerte

---

## 10. Route Next.js

Ajouter la route dans le layout :
- `/pointage` → accessible uniquement aux MANAGER
- Ajouter "Pointage" dans la sidebar (section SERVICE) et la bottom nav mobile
- Icône : ⏱️ ou 🕐
- Badge dynamique : nombre de PREVU avec retard (orange) si > 0

---

## 11. Séquence de commits atomiques

```
Commit 1  : feat(entity): créer l'entité Pointage avec constantes statut
Commit 2  : feat(entity): créer l'entité PointagePause
Commit 3  : feat(entity): ajouter champ codePointage (VARCHAR 4) sur User
Commit 4  : feat(migration): ajouter migration tables pointage, pointage_pause, et ALTER user
Commit 5  : feat(repo): créer PointageRepository avec findByService
Commit 6  : feat(service): créer PointageService — genererPointagesDepuisPostes
Commit 7  : feat(service): ajouter calculerDureeEffective et calculerTotalPauses
Commit 8  : feat(service): ajouter estEnRetard, minutesRetard, calculerStats
Commit 9  : feat(service): ajouter cloturerService
Commit 10 : feat(service): ajouter verifierCodePin (validation PIN + bypass manager)
Commit 11 : feat(controller): route GET /api/pointage/service/{serviceId}
Commit 12 : feat(controller): route POST /api/pointage/{id}/arrivee (avec vérif PIN)
Commit 13 : feat(controller): route POST /api/pointage/{id}/depart (avec vérif PIN)
Commit 14 : feat(controller): routes POST pause/start et pause/end (avec vérif PIN)
Commit 15 : feat(controller): routes POST absence et cloturer-service (manager only)
Commit 16 : feat(types): créer src/types/pointage.ts
Commit 17 : feat(hooks): créer usePointage.ts avec polling 15s
Commit 18 : feat(component): créer PointageHeader avec horloge live
Commit 19 : feat(component): créer PointageKpiRow (5 KPIs)
Commit 20 : feat(component): créer PointagePinPad (clavier 4 chiffres + shake + verrouillage)
Commit 21 : feat(component): créer PointageStaffCard avec états et actions
Commit 22 : feat(component): créer PointageActionModal (confirmation post-PIN)
Commit 23 : feat(component): créer PointageTimeline
Commit 24 : feat(component): créer PointageAlertPanel
Commit 25 : feat(component): créer PointageCloturerModal
Commit 26 : feat(page): créer src/app/(app)/pointage/page.tsx (assemblage)
Commit 27 : feat(nav): ajouter Pointage dans Sidebar et BottomNav
Commit 28 : test: vérifier build + navigation + flow complet PIN → pointage
```

---

## 12. Points d'attention

1. **Multi-tenancy** : Chaque route vérifie que `centre_id` du JWT correspond au service/pointage
2. **Sécurité** : Toutes les routes sont ROLE_MANAGER (c'est le manager qui gère l'écran)
3. **Code PIN** : Chaque action employé (arrivée, départ, pause) exige le code PIN 4 chiffres
4. **Bypass manager** : Le manager peut bypasser le PIN via `managerBypass: true` dans le body
5. **PIN non défini** : Si `user.codePointage` est null, afficher un message et proposer le bypass manager
6. **Verrouillage PIN** : Après 3 tentatives échouées, bloquer 30 secondes (géré côté front uniquement)
7. **Unicité PIN par centre** : Index unique `(centre_id, code_pointage)` — l'API doit retourner une erreur claire si doublon
8. **Polling** : `refetchInterval: 15_000` sur le hook principal pour les durées live
9. **Horloge** : L'heure affichée dans le header est un `setInterval` JS local (1s), PAS un appel API
10. **Durées live** : Les durées effectives et durées de pause sont recalculées à chaque refetch (15s)
11. **Double-clic** : Désactiver le bouton pendant la mutation pour éviter les doubles pointages
12. **Pas de fetch dans les composants** : Tout passe par les hooks React Query
13. **Pas de useEffect pour les appels API** : Utiliser useQuery et useMutation
14. **3 états par composant** : loading | error | empty
15. **Composants < 150 lignes** : Découper si nécessaire
16. **Commentaires en français**
17. **Pas de couleur hardcodée** : Utiliser les variables CSS du design system
18. **Animations** : Framer Motion pour les transitions de cartes, le PinPad, et les modales
19. **PinPad tactile** : Touches min 64×64px, pensé pour iPad/tablette à la réception
20. **CSS : séparer style et layout** — Les classes Tailwind dans le JSX ne gèrent QUE le layout (flex, grid, gap, padding, margin, width, height, responsive). Le style visuel (couleurs, bordures, ombres, typo, border-radius, animations) est défini dans `globals.css` via des classes sémantiques préfixées par composant (`.pinpad-*`, `.staff-card-*`, `.kpi-*`, `.badge-statut.*`, `.timeline-dot.*`, `.pointage-*`, `.alert-item.*`). Utiliser `data-status` pour les variantes d'état. Jamais de couleur Tailwind inline. Les @keyframes sont dans globals.css, pas inline. Un bloc commenté `/* ── Pointage : NomComposant ── */` par composant dans globals.css.
