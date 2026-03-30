# ENTITIES.md — Shiftly
# Référence complète des entités Doctrine

> Ce fichier documente les 12 entités du projet, leurs propriétés, contraintes et relations.
> Mettre à jour à chaque modification du schéma (nouvelle colonne, nouvelle contrainte).

---

## Sommaire

1. [Centre](#1-centre)
2. [User](#2-user)
3. [Zone](#3-zone)
4. [Mission](#4-mission)
5. [Service](#5-service)
6. [Poste](#6-poste)
7. [Completion](#7-completion)
8. [Competence](#8-competence)
9. [StaffCompetence](#9-staffcompetence)
10. [Incident](#10-incident)
11. [Tutoriel](#11-tutoriel)
12. [TutoRead](#12-tutoread)

---

## 1. Centre

**Description :** Le centre de loisirs (Bowling Central, etc.). Racine du multi-tenancy — chaque entité est isolée par `centre_id`.

| Propriété      | Type                   | Nullable | Contraintes                        |
|----------------|------------------------|----------|------------------------------------|
| `id`           | int                    | non      | PK, auto-increment                 |
| `nom`          | string(100)            | non      | NotBlank                           |
| `slug`         | string(120)            | non      | unique, auto-généré depuis `nom`   |
| `openingHours` | json                   | oui      | —                                  |
| `createdAt`    | DateTimeImmutable      | non      | auto-set à la création             |

**Relations :**
- `users` → OneToMany → **User**
- `zones` → OneToMany → **Zone**

**Exemple JSON :**
```json
{
  "id": 1,
  "nom": "Bowling Central",
  "slug": "bowling-central",
  "openingHours": {
    "lundi": "10:00-23:00",
    "mardi": "10:00-23:00",
    "samedi": "10:00-01:00",
    "dimanche": "10:00-22:00"
  },
  "createdAt": "2025-01-15T09:00:00+00:00"
}
```

---

## 2. User

**Description :** Membre du staff (Manager ou Employé). Contient les informations de profil, les tailles de tenue et un système de points de progression.

| Propriété        | Type              | Nullable | Contraintes / Valeurs                     |
|------------------|-------------------|----------|-------------------------------------------|
| `id`             | int               | non      | PK, auto-increment                        |
| `centre`         | Centre            | non      | ManyToOne                                 |
| `nom`            | string(100)       | non      | NotBlank                                  |
| `prenom`         | string(100)       | oui      | —                                         |
| `email`          | string(180)       | non      | unique, format email                      |
| `password`       | string            | non      | hashé (bcrypt)                            |
| `plainPassword`  | string            | —        | non persisté, utilisé uniquement à l'écriture |
| `roles`          | json              | non      | ex: `["ROLE_USER"]` ou `["ROLE_MANAGER"]` |
| `role`           | string(20)        | non      | `MANAGER` \| `EMPLOYE` (défaut: EMPLOYE)  |
| `avatarColor`    | string(20)        | oui      | code couleur hex, ex: `#3b82f6`           |
| `points`         | int               | non      | défaut: 0, incrémenté par StaffCompetence |
| `tailleHaut`     | string(10)        | oui      | ex: `M`, `L`, `XL`                        |
| `tailleBas`      | string(10)        | oui      | ex: `40`, `42`                            |
| `pointure`       | string(10)        | oui      | ex: `42`                                  |
| `actif`          | bool              | non      | défaut: true                              |
| `createdAt`      | DateTimeImmutable | non      | auto-set à la création                    |

**Relations :**
- `staffCompetences` → OneToMany → **StaffCompetence** (cascade remove)
- `tutoReads` → OneToMany → **TutoRead** (cascade remove)

**Exemple JSON :**
```json
{
  "id": 12,
  "nom": "Martin Sophie",
  "prenom": "Sophie",
  "email": "sophie.martin@bowling-central.fr",
  "role": "EMPLOYE",
  "avatarColor": "#3b82f6",
  "points": 240,
  "tailleHaut": "S",
  "tailleBas": "38",
  "pointure": "38",
  "actif": true,
  "createdAt": "2025-02-10T08:30:00+00:00"
}
```

---

## 3. Zone

**Description :** Espace physique du centre (Accueil, Bar, Salle, Manager). Contient les missions et compétences rattachées à cet espace.

| Propriété  | Type        | Nullable | Contraintes                                   |
|------------|-------------|----------|-----------------------------------------------|
| `id`       | int         | non      | PK, auto-increment                            |
| `centre`   | Centre      | non      | ManyToOne                                     |
| `nom`      | string(50)  | non      | NotBlank, unique par centre                   |
| `couleur`  | string(20)  | oui      | code couleur hex, ex: `#3b82f6`               |
| `ordre`    | int         | non      | défaut: 0, utilisé pour le tri d'affichage    |

**Contrainte unique :** `(centre_id, nom)`

**Relations :**
- `missions` → OneToMany → **Mission** (cascade remove)
- `competences` → OneToMany → **Competence** (cascade remove)

**Exemple JSON :**
```json
{
  "id": 3,
  "nom": "Accueil",
  "couleur": "#3b82f6",
  "ordre": 1,
  "centre": "/api/centres/1"
}
```

---

## 4. Mission

**Description :** Tâche à effectuer dans une zone (ex: "Allumer les pistes", "Nettoyer les chaussures"). Peut être fixe (récurrente à chaque service) ou ponctuelle (liée à un service spécifique).

| Propriété   | Type        | Nullable | Contraintes / Valeurs                                         |
|-------------|-------------|----------|---------------------------------------------------------------|
| `id`        | int         | non      | PK, auto-increment                                            |
| `zone`      | Zone        | non      | ManyToOne                                                     |
| `texte`     | string(255) | non      | NotBlank                                                      |
| `categorie` | string(30)  | non      | `OUVERTURE` \| `PENDANT` \| `MENAGE` \| `FERMETURE`          |
| `frequence` | string(20)  | non      | `FIXE` \| `PONCTUELLE` (défaut: FIXE)                        |
| `priorite`  | string(30)  | non      | `vitale` \| `important` \| `ne_pas_oublier` (défaut: ne_pas_oublier) |
| `ordre`     | int         | non      | défaut: 0, utilisé pour le tri dans la liste                  |
| `service`   | Service     | oui      | ManyToOne — renseigné uniquement si `frequence = PONCTUELLE`  |

**Règle métier :** Une mission `FIXE` appartient à la zone et apparaît dans tous les services. Une mission `PONCTUELLE` est rattachée à un service précis via `service`.

**Exemple JSON (mission fixe) :**
```json
{
  "id": 45,
  "texte": "Allumer les pistes 1 à 8",
  "categorie": "OUVERTURE",
  "frequence": "FIXE",
  "priorite": "vitale",
  "ordre": 1,
  "zone": "/api/zones/3",
  "service": null
}
```

**Exemple JSON (mission ponctuelle) :**
```json
{
  "id": 78,
  "texte": "Installer la déco pour l'anniversaire piste 5",
  "categorie": "PENDANT",
  "frequence": "PONCTUELLE",
  "priorite": "important",
  "ordre": 0,
  "zone": "/api/zones/3",
  "service": "/api/services/22"
}
```

---

## 5. Service

**Description :** Session de travail pour une journée donnée (ex: service du samedi 29 mars 2026). Contient les postes affectés et les incidents signalés.

| Propriété       | Type              | Nullable | Contraintes / Valeurs                         |
|-----------------|-------------------|----------|-----------------------------------------------|
| `id`            | int               | non      | PK, auto-increment                            |
| `centre`        | Centre            | non      | ManyToOne                                     |
| `date`          | DateTimeImmutable | non      | type `date_immutable`                         |
| `heureDebut`    | DateTimeImmutable | oui      | type `time_immutable`                         |
| `heureFin`      | DateTimeImmutable | oui      | type `time_immutable`                         |
| `statut`        | string(20)        | non      | `PLANIFIE` \| `EN_COURS` \| `TERMINE` (défaut: PLANIFIE) |
| `tauxCompletion`| float             | non      | 0.0 à 100.0, recalculé après chaque Completion |
| `note`          | text              | oui      | note libre du manager                         |

**Contrainte unique :** `(centre_id, date)` — un seul service par jour et par centre.

**Relations :**
- `postes` → OneToMany → **Poste** (cascade remove)
- `incidents` → OneToMany → **Incident**

**Exemple JSON :**
```json
{
  "id": 22,
  "date": "2026-03-29",
  "heureDebut": "10:00:00",
  "heureFin": "23:00:00",
  "statut": "EN_COURS",
  "tauxCompletion": 67.5,
  "note": "Tournoi samedi soir — prévoir renforts piste 5-8",
  "centre": "/api/centres/1"
}
```

---

## 6. Poste

**Description :** Affectation d'un employé à une zone pour un service donné. C'est le lien entre un User, une Zone et un Service. Les Completions sont rattachées au Poste.

| Propriété | Type    | Nullable | Contraintes              |
|-----------|---------|----------|--------------------------|
| `id`      | int     | non      | PK, auto-increment       |
| `service` | Service | non      | ManyToOne                |
| `zone`    | Zone    | non      | ManyToOne                |
| `user`    | User    | non      | ManyToOne                |

**Contrainte unique :** `(service_id, zone_id, user_id)` — un employé ne peut être affecté qu'une fois par zone par service.

**Relations :**
- `completions` → OneToMany → **Completion** (cascade remove)

**Méthode métier :** `tauxCompletion(int $totalMissions): float` — calcule le pourcentage de missions cochées pour ce poste.

**Exemple JSON :**
```json
{
  "id": 101,
  "service": "/api/services/22",
  "zone": "/api/zones/3",
  "user": "/api/users/12"
}
```

---

## 7. Completion

**Description :** Enregistrement du cochage d'une mission dans un poste. Trace qui a coché quoi et quand.

| Propriété     | Type              | Nullable | Contraintes              |
|---------------|-------------------|----------|--------------------------|
| `id`          | int               | non      | PK, auto-increment       |
| `poste`       | Poste             | non      | ManyToOne                |
| `mission`     | Mission           | non      | ManyToOne                |
| `user`        | User              | oui      | ManyToOne — qui a coché  |
| `completedAt` | DateTimeImmutable | non      | auto-set à la création   |

**Contrainte unique :** `(poste_id, mission_id)` — une mission ne peut être cochée qu'une fois par poste.

**Exemple JSON :**
```json
{
  "id": 512,
  "poste": "/api/postes/101",
  "mission": "/api/missions/45",
  "user": "/api/users/12",
  "completedAt": "2026-03-29T10:42:00+00:00"
}
```

---

## 8. Competence

**Description :** Compétence référentielle rattachée à une zone (ex: "Maîtriser le logiciel de scoring" dans la zone Accueil). Elle peut être acquise par un membre du staff.

| Propriété     | Type        | Nullable | Contraintes / Valeurs                              |
|---------------|-------------|----------|----------------------------------------------------|
| `id`          | int         | non      | PK, auto-increment                                 |
| `zone`        | Zone        | non      | ManyToOne                                          |
| `nom`         | string(150) | non      | NotBlank                                           |
| `points`      | int         | non      | défaut: 10, ajoutés au User lors de l'acquisition  |
| `difficulte`  | string(30)  | non      | `simple` \| `avancee` \| `experimente` (défaut: simple) |
| `description` | text        | oui      | description longue de la compétence                |

**Relations :**
- `staffCompetences` → OneToMany → **StaffCompetence** (cascade remove)

**Exemple JSON :**
```json
{
  "id": 8,
  "nom": "Maîtriser le logiciel de scoring",
  "difficulte": "avancee",
  "points": 25,
  "description": "Savoir créer une partie, gérer les scores et imprimer le récapitulatif en fin de session.",
  "zone": "/api/zones/3"
}
```

---

## 9. StaffCompetence

**Description :** Liaison entre un User et une Competence qu'il a acquise. Déclenche automatiquement l'ajout de points au User (PostPersist) et leur retrait (PostRemove).

| Propriété    | Type              | Nullable | Contraintes            |
|--------------|-------------------|----------|------------------------|
| `id`         | int               | non      | PK, auto-increment     |
| `user`       | User              | non      | ManyToOne              |
| `competence` | Competence        | non      | ManyToOne              |
| `acquiredAt` | DateTimeImmutable | non      | auto-set à la création |

**Contrainte unique :** `(user_id, competence_id)` — un employé ne peut acquérir une compétence qu'une seule fois.

**Lifecycle callbacks :**
- `PostPersist` → `onAcquire()` : ajoute `competence.points` à `user.points`
- `PostRemove` → `onRevoke()` : retire `competence.points` de `user.points`

**Exemple JSON :**
```json
{
  "id": 34,
  "user": "/api/users/12",
  "competence": "/api/competences/8",
  "acquiredAt": "2026-02-14T14:20:00+00:00"
}
```

---

## 10. Incident

**Description :** Signalement d'un problème pendant un service (casse matériel, client difficile, incident technique). Suit un cycle de vie : OUVERT → EN_COURS → RESOLU.

| Propriété    | Type              | Nullable | Contraintes / Valeurs                          |
|--------------|-------------------|----------|------------------------------------------------|
| `id`         | int               | non      | PK, auto-increment                             |
| `centre`     | Centre            | non      | ManyToOne                                      |
| `service`    | Service           | oui      | ManyToOne — service durant lequel l'incident a eu lieu |
| `titre`      | string(255)       | non      | NotBlank                                       |
| `severite`   | string(20)        | non      | `haute` \| `moyenne` \| `basse` (défaut: basse) |
| `statut`     | string(20)        | non      | `OUVERT` \| `EN_COURS` \| `RESOLU` (défaut: OUVERT) |
| `user`       | User              | oui      | ManyToOne — employé qui a signalé l'incident   |
| `createdAt`  | DateTimeImmutable | non      | auto-set à la création                         |
| `resolvedAt` | DateTimeImmutable | oui      | auto-set quand `statut` passe à `RESOLU`       |

**Exemple JSON :**
```json
{
  "id": 7,
  "titre": "Boule de piste 3 fissurée — risque de blessure",
  "severite": "haute",
  "statut": "EN_COURS",
  "service": "/api/services/22",
  "user": "/api/users/12",
  "createdAt": "2026-03-29T14:05:00+00:00",
  "resolvedAt": null
}
```

---

## 11. Tutoriel

**Description :** Contenu pédagogique structuré en blocs (intro, étapes, conseils). Peut être rattaché à une zone ou être général. Accessible à tout le staff.

| Propriété   | Type              | Nullable | Contraintes / Valeurs                               |
|-------------|-------------------|----------|-----------------------------------------------------|
| `id`        | int               | non      | PK, auto-increment                                  |
| `centre`    | Centre            | non      | ManyToOne                                           |
| `titre`     | string(200)       | non      | NotBlank                                            |
| `zone`      | Zone              | oui      | ManyToOne, `onDelete: SET NULL` — null = tutoriel général |
| `niveau`    | string(20)        | non      | `debutant` \| `intermediaire` \| `avance` (défaut: debutant) |
| `dureMin`   | int               | oui      | durée estimée en minutes                            |
| `contenu`   | json              | non      | tableau de blocs structurés (voir format ci-dessous) |
| `createdAt` | DateTimeImmutable | non      | auto-set à la création                              |

**Relations :**
- `lectures` → OneToMany → **TutoRead** (cascade remove)

**Format du champ `contenu` (tableau de blocs) :**

| Type de bloc | Champs obligatoires           | Description                          |
|--------------|-------------------------------|--------------------------------------|
| `intro`      | `type`, `text`                | Paragraphe d'introduction            |
| `step`       | `type`, `text`, `number`, `title` | Étape numérotée avec titre       |
| `tip`        | `type`, `text`                | Conseil / astuce mise en valeur      |

**Exemple JSON :**
```json
{
  "id": 3,
  "titre": "Prise en main du logiciel de scoring",
  "niveau": "debutant",
  "dureMin": 10,
  "zone": "/api/zones/3",
  "contenu": [
    {
      "type": "intro",
      "text": "Ce tutoriel t'explique comment démarrer une partie et gérer les scores en temps réel."
    },
    {
      "type": "step",
      "number": 1,
      "title": "Ouvrir le logiciel",
      "text": "Double-clique sur l'icône 'Scoring' sur le bureau de la caisse Accueil."
    },
    {
      "type": "step",
      "number": 2,
      "title": "Créer une nouvelle partie",
      "text": "Clique sur 'Nouvelle partie', sélectionne la piste et renseigne les noms des joueurs."
    },
    {
      "type": "tip",
      "text": "Si le logiciel ne répond plus, utilise Ctrl+Alt+Suppr et relance-le — les données sont sauvegardées automatiquement."
    }
  ],
  "createdAt": "2026-01-20T11:00:00+00:00"
}
```

---

## 12. TutoRead

**Description :** Marqueur de lecture — indique qu'un User a lu un Tutoriel. Permet d'afficher l'indicateur "Lu" sur les cartes tutoriels.

| Propriété   | Type              | Nullable | Contraintes            |
|-------------|-------------------|----------|------------------------|
| `id`        | int               | non      | PK, auto-increment     |
| `user`      | User              | non      | ManyToOne              |
| `tutoriel`  | Tutoriel          | non      | ManyToOne              |
| `readAt`    | DateTimeImmutable | non      | auto-set à la création |

**Contrainte unique :** `(user_id, tutoriel_id)` — un tutoriel ne peut être marqué "lu" qu'une fois par utilisateur.

**Exemple JSON :**
```json
{
  "id": 89,
  "user": "/api/users/12",
  "tutoriel": "/api/tutoriels/3",
  "readAt": "2026-03-15T16:30:00+00:00"
}
```

---

## Carte des relations

```
Centre
 ├── User[]             (staff)
 ├── Zone[]
 │    ├── Mission[]     (tâches de la zone)
 │    └── Competence[]  (compétences de la zone)
 │         └── StaffCompetence[]  ──→ User
 ├── Service[]
 │    ├── Poste[]        ──→ Zone + User
 │    │    └── Completion[]  ──→ Mission + User
 │    └── Incident[]     ──→ User (signaleur)
 └── Tutoriel[]          ──→ Zone (nullable)
      └── TutoRead[]      ──→ User
```

---

## Enums de référence

| Entité        | Champ        | Valeurs possibles                               |
|---------------|--------------|-------------------------------------------------|
| User          | `role`       | `MANAGER` \| `EMPLOYE`                          |
| Service       | `statut`     | `PLANIFIE` \| `EN_COURS` \| `TERMINE`           |
| Mission       | `categorie`  | `OUVERTURE` \| `PENDANT` \| `MENAGE` \| `FERMETURE` |
| Mission       | `frequence`  | `FIXE` \| `PONCTUELLE`                          |
| Mission       | `priorite`   | `vitale` \| `important` \| `ne_pas_oublier`     |
| Competence    | `difficulte` | `simple` \| `avancee` \| `experimente`          |
| Incident      | `severite`   | `haute` \| `moyenne` \| `basse`                 |
| Incident      | `statut`     | `OUVERT` \| `EN_COURS` \| `RESOLU`              |
| Tutoriel      | `niveau`     | `debutant` \| `intermediaire` \| `avance`       |
