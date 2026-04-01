# ENTITES.md — Shiftly
> Référence complète des entités Symfony + données réelles pour les fixtures.
> Source : entités Doctrine + AppFixtures.php (Mars 2026 — Family Games Center)
> Fichier temporaire — à supprimer après génération des fixtures.

---

## Sommaire

1. [Centre](#1-centre)
2. [User](#2-user)
3. [Zone](#3-zone)
4. [Mission](#4-mission)
5. [Service](#5-service)
6. [Assignation](#6-assignation) ← anciennement Poste
7. [Competence](#7-competence)
8. [StaffCompetence](#8-staffcompetence)
9. [Tutoriel](#9-tutoriel)
10. [TutoRead](#10-tutoread)
11. [Incident](#11-incident)
12. [TaskCompletion](#12-taskcompletion) ← anciennement Completion
13. [Données de fixtures](#13-données-de-fixtures)

---

## 1. Centre

Représente un centre de loisirs. Entité racine du multi-tenancy.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `nom` | string(100) | non | Nom du centre |
| `slug` | string(120) | non | Auto-généré depuis `nom` (unique) |
| `adresse` | string(255) | oui | |
| `telephone` | string(30) | oui | |
| `siteWeb` | string(255) | oui | |
| `typeActivite` | string(255) | oui | Ex : "Bowling, Billards, Karaoké, Arcade, VR" |
| `couleurPrincipale` | string(20) | oui | Code couleur CSS principale |
| `openingHours` | json | oui | Horaires d'ouverture structurés |
| `createdAt` | DateTimeImmutable | non | Auto-set à la création |

**Relations :**
- `users` → OneToMany → User
- `zones` → OneToMany → Zone

**Contraintes uniques :** `slug`

---

## 2. User

Membre du staff rattaché à un centre.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `nom` | string(100) | non | Prénom ou nom affiché |
| `email` | string(180) | non | Unique |
| `password` | string | non | Hashé (défaut fixtures : `shiftly2026`) |
| `roles` | json | non | Tableau de rôles Symfony |
| `role` | string(20) | non | `MANAGER` ou `EMPLOYE` (défaut: `EMPLOYE`) |
| `avatarCouleur` | string(20) | oui | Gradient CSS (ex : `linear-gradient(135deg,#f97316,#fb923c)`) |
| `pointsTotal` | int | non | Total de points compétences (défaut: 0) |
| `niveau` | string(20) | non | Calculé depuis `pointsTotal` (voir enum ci-dessous) |
| `heuresHebdo` | int | oui | Heures contractuelles par semaine |
| `vetements` | string(255) | oui | Stock vêtements de travail |
| `actif` | bool | non | Compte actif (défaut: true) |
| `createdAt` | DateTimeImmutable | non | Auto-set à la création |

**Valeurs d'enum — Rôle :**
```
MANAGER   → accès complet (écriture partout)
EMPLOYE   → accès lecture + actions service du jour
```

**Valeurs d'enum — Niveau (calculé depuis pointsTotal) :**
```
DEBUTANT       → 0 – 20 pts
INTERMEDIAIRE  → 21 – 50 pts
AVANCE         → 51 – 100 pts
EXPERIMENTE    → 101+ pts
```

**Relations :**
- `centre` → ManyToOne → Centre
- `staffCompetences` → OneToMany → StaffCompetence (cascade remove)
- `tutoReads` → OneToMany → TutoRead (cascade remove)

**Contraintes uniques :** `email`

---

## 3. Zone

Zone de travail au sein d'un centre.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `nom` | string(50) | non | Nom de la zone |
| `couleur` | string(20) | oui | Code couleur CSS |
| `ordre` | int | non | Ordre d'affichage (défaut: 0) |
| `archivee` | bool | non | Zone archivée ou non (défaut: false) |

**Couleurs par zone (fixtures) :**
```
Accueil  → #3b82f6  (bleu)
Bar      → #a855f7  (violet)
Salle    → #22c55e  (vert)
```

**Relations :**
- `centre` → ManyToOne → Centre
- `missions` → OneToMany → Mission (cascade remove)
- `competences` → OneToMany → Competence (cascade remove)

**Contraintes uniques :** `(centre_id, nom)`

---

## 4. Mission

Tâche à effectuer dans une zone.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `zone` | Zone | non | Zone concernée |
| `texte` | string(255) | non | Description de la mission |
| `categorie` | string(30) | non | Enum catégorie (défaut: `PENDANT`) |
| `frequence` | string(20) | non | Enum fréquence (défaut: `FIXE`) |
| `priorite` | string(30) | non | Enum priorité (défaut: `FAIBLE`) |
| `ordre` | int | non | Ordre d'affichage (défaut: 0) |
| `archivee` | bool | non | Mission archivée ou non (défaut: false) |
| `service` | Service | oui | Uniquement pour les missions `PONCTUELLE` |

**Valeurs d'enum — Catégorie :**
```
OUVERTURE   → tâches à faire à l'ouverture
PENDANT     → tâches pendant le service
MENAGE      → tâches de nettoyage
FERMETURE   → tâches à faire à la fermeture
```

**Valeurs d'enum — Fréquence :**
```
FIXE        → récurrente (présente à chaque service)
PONCTUELLE  → one-shot (liée à un service spécifique)
```

**Valeurs d'enum — Priorité :**
```
HAUTE    → critique, à faire absolument
MOYENNE  → important mais pas bloquant
FAIBLE   → à faire si possible
```

**Relations :**
- `zone` → ManyToOne → Zone
- `service` → ManyToOne → Service (nullable, onDelete: SET NULL)

---

## 5. Service

Représente une journée de service (shift) dans un centre.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `date` | DateTime (date) | non | Date du service |
| `heureOuverture` | DateTime (time) | oui | Heure d'ouverture |
| `heureFermeture` | DateTime (time) | oui | Heure de fermeture |
| `manager` | User | oui | Manager responsable du service |
| `statut` | string(20) | non | Enum statut (défaut: `NOT_STARTED`) |
| `tauxCompletion` | float | non | % de missions complétées (défaut: 0.0) |
| `note` | text | oui | Note du manager visible par l'équipe |

**Valeurs d'enum — Statut :**
```
NOT_STARTED  → service prévu, pas encore commencé
IN_PROGRESS  → service en cours
DONE         → service terminé
```

**Relations :**
- `centre` → ManyToOne → Centre
- `manager` → ManyToOne → User (nullable)
- `assignations` → OneToMany → Assignation (cascade remove)
- `incidents` → OneToMany → Incident

**Contraintes uniques :** `(centre_id, date)` — un seul service par jour par centre

---

## 6. Assignation

> ⚠️ Anciennement nommé **Poste**. Affectation d'un employé à une zone pour un service donné.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `service` | Service | non | Service concerné |
| `zone` | Zone | non | Zone assignée |
| `user` | User | non | Employé assigné |

**Relations :**
- `service` → ManyToOne → Service
- `zone` → ManyToOne → Zone
- `user` → ManyToOne → User
- `completions` → OneToMany → TaskCompletion (cascade remove)

**Contraintes uniques :** `(service_id, zone_id, user_id)` — pas de doublon d'affectation

---

## 7. Competence

Compétence de référence définie par zone.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `zone` | Zone | non | Zone concernée |
| `nom` | string(150) | non | Intitulé de la compétence |
| `points` | int | non | Points accordés à l'acquisition (défaut: 10) |
| `difficulte` | string(30) | non | Enum difficulté (défaut: `simple`) |
| `description` | text | oui | Description détaillée |

**Valeurs d'enum — Difficulté :**
```
simple        → accessible à tous
avancee       → nécessite de l'expérience
experimente   → niveau expert
```

**Relations :**
- `zone` → ManyToOne → Zone
- `staffCompetences` → OneToMany → StaffCompetence (cascade remove)

---

## 8. StaffCompetence

Lien entre un employé et une compétence acquise. Met à jour `pointsTotal` du user automatiquement.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `user` | User | non | Employé concerné |
| `competence` | Competence | non | Compétence acquise |
| `acquiredAt` | DateTimeImmutable | non | Auto-set à la création |

**Relations :**
- `user` → ManyToOne → User
- `competence` → ManyToOne → Competence

**Contraintes uniques :** `(user_id, competence_id)`

**Lifecycle automatique :**
- `PostPersist` → ajoute les points de la compétence à `pointsTotal` du user
- `PostRemove` → retire les points (minimum 0)

---

## 9. Tutoriel

Guide ou procédure consultable par le staff.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `titre` | string(200) | non | Titre du tutoriel |
| `zone` | Zone | oui | Zone concernée (null = général) |
| `niveau` | string(20) | non | Enum niveau (défaut: `debutant`) |
| `dureMin` | int | oui | Durée estimée en minutes |
| `contenu` | json | non | Blocs de contenu (défaut: []) |
| `createdAt` | DateTimeImmutable | non | Auto-set à la création |

**Valeurs d'enum — Niveau :**
```
debutant       → pour les nouveaux
intermediaire  → expérience requise
avance         → niveau expert
```

**Structure du champ `contenu` (JSON) :**
```json
[
  { "type": "intro", "text": "Introduction du tutoriel" },
  { "type": "step", "number": 1, "title": "Étape 1", "text": "Description..." },
  { "type": "tip", "text": "Conseil pratique" }
]
```

**Relations :**
- `centre` → ManyToOne → Centre
- `zone` → ManyToOne → Zone (nullable, onDelete: SET NULL)
- `lectures` → OneToMany → TutoRead (cascade remove)

---

## 10. TutoRead

Marque un tutoriel comme lu par un employé.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `user` | User | non | Employé concerné |
| `tutoriel` | Tutoriel | non | Tutoriel lu |
| `readAt` | DateTimeImmutable | non | Auto-set à la création |

**Relations :**
- `user` → ManyToOne → User
- `tutoriel` → ManyToOne → Tutoriel

**Contraintes uniques :** `(user_id, tutoriel_id)`

---

## 11. Incident

Signalement d'un problème survenu pendant un service.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `service` | Service | oui | Service concerné |
| `description` | string(255) | non | Description de l'incident |
| `severite` | string(20) | non | Enum sévérité (défaut: `BASSE`) |
| `statut` | string(20) | non | Enum statut (défaut: `OUVERT`) |
| `creePar` | User | oui | Auteur du signalement |
| `zone` | Zone | oui | Zone concernée (onDelete: SET NULL) |
| `creeLe` | DateTime | non | Date/heure de création |
| `cloturedLe` | DateTime | oui | Auto-set quand statut → CLOTURE |

**Valeurs d'enum — Sévérité :**
```
HAUTE    → incident critique, action immédiate requise
MOYENNE  → impact modéré
BASSE    → incident mineur
```

**Valeurs d'enum — Statut :**
```
OUVERT    → signalé, pas encore traité
EN_COURS  → en cours de traitement
CLOTURE   → clôturé (cloturedLe auto-renseigné)
```

**Relations :**
- `centre` → ManyToOne → Centre
- `service` → ManyToOne → Service (nullable)
- `creePar` → ManyToOne → User (nullable)
- `zone` → ManyToOne → Zone (nullable)

---

## 12. TaskCompletion

> ⚠️ Anciennement nommé **Completion**. Cocher une mission comme effectuée dans le cadre d'une assignation.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `assignation` | Assignation | non | Assignation concernée |
| `mission` | Mission | non | Mission cochée |
| `user` | User | oui | Qui a coché |
| `completedAt` | DateTimeImmutable | non | Auto-set à la création |

**Relations :**
- `assignation` → ManyToOne → Assignation
- `mission` → ManyToOne → Mission
- `user` → ManyToOne → User (nullable)

**Contraintes uniques :** `(assignation_id, mission_id)`

---

## 13. Données de fixtures

> Source : AppFixtures.php — Family Games Center, Blois (Mars 2026)
> Mot de passe par défaut pour tous : `shiftly2026`

### Centre

| Champ | Valeur |
|---|---|
| `nom` | Family Games Center |
| `adresse` | 25 rue Robert Nau, 41000 Blois |
| `typeActivite` | Bowling, Billards, Karaoké, Arcade, VR, Blind Test, Jeux à lots |
| `couleurPrincipale` | #f97316 |

---

### Staff (12 membres)

| Nom | Email | Rôle | Heures/sem | Points | Niveau | Vêtements |
|---|---|---|---|---|---|---|
| Kévin | kevin@bowlingcentral.fr | MANAGER | 39 | 60 | AVANCE | 2 polo manches longues, 1 sweat |
| Mégane | megane@bowlingcentral.fr | MANAGER | 39 | 10 | DEBUTANT | — |
| Micka | micka@bowlingcentral.fr | MANAGER | 39 | 10 | DEBUTANT | — |
| Erwan | erwan@bowlingcentral.fr | EMPLOYE | 39 | 35 | INTERMEDIAIRE | 2 tshirts, 1 polo manches courtes |
| Patou | patou@bowlingcentral.fr | EMPLOYE | 35 | 75 | AVANCE | 1 veste sans manche |
| Pôl | pol@bowlingcentral.fr | EMPLOYE | 35 | 10 | DEBUTANT | 1 polo manches longues (new) |
| Cynthia | cynthia@bowlingcentral.fr | EMPLOYE | 35 | 10 | DEBUTANT | 2 t-shirts, 2 polaires manches longues |
| Gabin | gabin@bowlingcentral.fr | EMPLOYE | 25 | 65 | AVANCE | 1 polo manches longues + 2 polos |
| Aya | aya@bowlingcentral.fr | EMPLOYE | 15 | 50 | INTERMEDIAIRE | — |
| Agent de sécurité | securite@bowlingcentral.fr | EMPLOYE | 15 | 25 | INTERMEDIAIRE | Badge |
| Hiba | hiba@bowlingcentral.fr | EMPLOYE | 15 | 10 | DEBUTANT | — |
| Daniela | daniela@bowlingcentral.fr | EMPLOYE | 15 | 10 | DEBUTANT | — |

---

### Zones

| Nom | Couleur | Ordre |
|---|---|---|
| Accueil | #3b82f6 | 1 |
| Bar | #a855f7 | 2 |
| Salle | #22c55e | 3 |

---

### Missions — Accueil (44 missions)

| # | Texte | Catégorie | Priorité |
|---|---|---|---|
| 1 | Être en tenue à l'heure | OUVERTURE | HAUTE |
| 2 | Allumer ordinateurs, logiciels et TPE | OUVERTURE | HAUTE |
| 3 | Vérifier le matériel d'accueil (rouleaux CB + imprimantes) | OUVERTURE | MOYENNE |
| 4 | Allumer les lumières extérieures des box karaokés | OUVERTURE | MOYENNE |
| 5 | Vérifier derrière les PC et imprimantes (propreté / câbles) | OUVERTURE | FAIBLE |
| 6 | Nettoyer la poussière du comptoir d'accueil | OUVERTURE | MOYENNE |
| 7 | Nettoyer la poussière des chevalets d'annonce | OUVERTURE | FAIBLE |
| 8 | Vérifier les toilettes après chaque pause | PENDANT | HAUTE |
| 9 | Si anniversaires demain : préparer matériel (feuille bar, médailles, invitations, jetons) | PENDANT | HAUTE |
| 10 | Vérifier propreté des toilettes et quantité de papier (3 fois/jour) | PENDANT | HAUTE |
| 11 | Enregistrer les clients (bowling / billards / karaoké / VR) | PENDANT | HAUTE |
| 12 | Vérifier l'état des sur-chaussures (qualité / usure) | PENDANT | MOYENNE |
| 13 | Vérifier quantité de médailles (environ 10 par couleur) | PENDANT | MOYENNE |
| 14 | Vérifier quantité de chaussettes (environ 2 par taille) | PENDANT | MOYENNE |
| 15 | Vérifier quantité de sur-chaussures | PENDANT | MOYENNE |
| 16 | Vérifier l'état des casiers blancs | PENDANT | MOYENNE |
| 17 | Vérifier quantité de jetons pour la machine Rio Carnival | PENDANT | MOYENNE |
| 18 | Ranger les chaussures de bas en haut (5 à 6 fois/jour) | PENDANT | MOYENNE |
| 19 | Vérifier les embouts des cannes de billard et remplacer si besoin | PENDANT | FAIBLE |
| 20 | Nettoyer les vitres de l'entrée et de l'accueil | MENAGE | MOYENNE |
| 21 | Nettoyer les bornes d'enregistrement (support pied) | MENAGE | FAIBLE |
| 22 | Nettoyer la machine à barbe à papa (mercredi et dimanche) | MENAGE | FAIBLE |
| 23 | Nettoyer l'intérieur des casiers blancs | MENAGE | FAIBLE |
| 24 | Dépoussiérer l'écran de surveillance à l'entrée | MENAGE | FAIBLE |
| 25 | Dépoussiérer les écrans de la liste d'attente | MENAGE | FAIBLE |
| 26 | Nettoyer les distributeurs de gel hydro-alcoolique | MENAGE | FAIBLE |
| 27 | Nettoyer les barrières à l'entrée (zone lumières, panneaux publicitaires) | MENAGE | FAIBLE |
| 28 | Dépoussiérer les écrans de l'accueil | MENAGE | FAIBLE |
| 29 | Nettoyer l'intérieur des meubles à chaussures | MENAGE | FAIBLE |
| 30 | Nettoyer la poussière sur les statues Iron Man et Spider Man | MENAGE | FAIBLE |
| 31 | Nettoyer la poussière et les écrans des jeux de Réalité Virtuelle | MENAGE | FAIBLE |
| 32 | Nettoyer la poussière des meubles à chaussures | MENAGE | FAIBLE |
| 33 | Vider les poubelles de l'accueil | FERMETURE | HAUTE |
| 34 | Mettre à propre le comptoir, ranger le matériel et mettre les TPE en charge | FERMETURE | HAUTE |
| 35 | Ranger les chaussures dans les casiers | FERMETURE | HAUTE |
| 36 | Balayer le sol d'entrée, jeter les mégots et vider les poubelles (entrée) | FERMETURE | HAUTE |
| 37 | Passer l'aspirateur autour de l'accueil, de l'entrée et de la zone chaussures | FERMETURE | HAUTE |
| 38 | Nettoyer les toilettes (fin de service) | FERMETURE | HAUTE |
| 39 | Dépointer puis se changer (fin de service) | FERMETURE | MOYENNE |
| 40 | Vérifier que les casiers blancs sont bien vides (fin de service) | FERMETURE | MOYENNE |
| 41 | Éteindre la climatisation et les télés des pistes et de l'accueil | FERMETURE | MOYENNE |
| 42 | Éteindre les jeux de la zone d'arcade | FERMETURE | MOYENNE |
| 43 | Éteindre les box de karaokés | FERMETURE | MOYENNE |
| 44 | Éteindre les jeux VR et passer l'aspirateur si besoin | FERMETURE | MOYENNE |

---

### Missions — Bar (38 missions)

| # | Texte | Catégorie | Priorité |
|---|---|---|---|
| 1 | Être en tenue à l'heure et pointer son heure d'arrivée | OUVERTURE | HAUTE |
| 2 | Vérifier mise en place snacks (crêpes, gaufres, brioche, pistache, pizza, hot dog, croque, frites) | OUVERTURE | HAUTE |
| 3 | Relever les températures des congélateurs (début de service) | OUVERTURE | HAUTE |
| 4 | Vérifier et changer si besoin les fûts de bière | OUVERTURE | HAUTE |
| 5 | Allumer la machine à café et vérifier le niveau de lait | OUVERTURE | HAUTE |
| 6 | Contrôler le stock des réfrigérateurs et compléter si nécessaire (dont jus) | OUVERTURE | HAUTE |
| 7 | Inspecter la cave du bar et réapprovisionner si besoin (rotation FIFO) | OUVERTURE | HAUTE |
| 8 | Vérifier mise en place citron et feuille de menthe | OUVERTURE | MOYENNE |
| 9 | Vérifier et remplir si besoin (sucre poudre, sucre glace, chocolat, ketchup, moutarde) | OUVERTURE | MOYENNE |
| 10 | Allumer le four | OUVERTURE | MOYENNE |
| 11 | Mettre en service la machine à glace pilée | OUVERTURE | MOYENNE |
| 12 | Remplir les bacs à glaçons | OUVERTURE | MOYENNE |
| 13 | Mettre en marche le lave-verre | OUVERTURE | MOYENNE |
| 14 | Recharger la machine à cocktails (bouteilles de jus pleines) | OUVERTURE | MOYENNE |
| 15 | Activer l'éclairage du bar | OUVERTURE | FAIBLE |
| 16 | Mercredi/jeudi : s'assurer que les snacks sont approvisionnés (gaufres, crêpes, brioches, pizzas, croque, hot dogs, frites) | PENDANT | HAUTE |
| 17 | Mercredi/jeudi : vérifier mise en place (saucissons, chocolat, ketchup, moutarde) | PENDANT | MOYENNE |
| 18 | Terminer les dernières tournées de verres à laver | FERMETURE | HAUTE |
| 19 | Remplir le frigo pour le lendemain | FERMETURE | HAUTE |
| 20 | Balayer et passer la serpillière dans le bar et la zone d'accueil | FERMETURE | HAUTE |
| 21 | Nettoyer pompe à bière et intérieur | FERMETURE | HAUTE |
| 22 | Mettre le lait au réfrigérateur | FERMETURE | HAUTE |
| 23 | Nettoyage et remplissage de la machine à cocktails | FERMETURE | HAUTE |
| 24 | Nettoyer la cuisine (plan de travail, four, micro-ondes, ustensiles) | FERMETURE | HAUTE |
| 25 | Fermer le bar avec autorisation responsable (1h avant la fin) | FERMETURE | HAUTE |
| 26 | Balai + serpillière (cuisine) | FERMETURE | HAUTE |
| 27 | Prévoir des sacs de glaçons pour le lendemain si nécessaire | FERMETURE | MOYENNE |
| 28 | Vider les bacs à glaçons (fin de service) | FERMETURE | MOYENNE |
| 29 | Nettoyer la machine pression pour boissons softs | FERMETURE | MOYENNE |
| 30 | Éteindre la lumière des frigos et le lave-verre (à la fin) | FERMETURE | MOYENNE |
| 31 | Retirer et nettoyer la grille de la machine à café | FERMETURE | MOYENNE |
| 32 | Éteindre le four (fin de service) | FERMETURE | MOYENNE |
| 33 | Lancer nettoyage machine à café avec capsules de nettoyage | FERMETURE | MOYENNE |
| 34 | Éteindre la machine à café | FERMETURE | MOYENNE |
| 35 | Réduire le chauffage (fin de service) | FERMETURE | MOYENNE |
| 36 | Nettoyer le bac à marc du levier puis le remettre | FERMETURE | MOYENNE |
| 37 | Vider et nettoyer le bac à capsules de la machine à café | FERMETURE | MOYENNE |
| 38 | Nettoyer le bas de la machine à café (eau chaude + brosse) | FERMETURE | FAIBLE |

---

### Missions — Salle (16 missions)

| # | Texte | Catégorie | Priorité |
|---|---|---|---|
| 1 | Être en tenue à l'heure et pointer son heure d'arrivée | OUVERTURE | HAUTE |
| 2 | Vérifier fonctionnement des tablettes jusqu'au paiement | OUVERTURE | HAUTE |
| 3 | Vérifier propreté de la salle et des tables | OUVERTURE | HAUTE |
| 4 | Récupérer et vérifier son fond de caisse (25€) | OUVERTURE | HAUTE |
| 5 | Récupérer son matériel de poste (TPE + montre + limonadier) | OUVERTURE | HAUTE |
| 6 | Vérifier la propreté de l'entrée client | OUVERTURE | MOYENNE |
| 7 | Aligner tables, banquettes, fauteuils et poufs | OUVERTURE | MOYENNE |
| 8 | Nettoyer les écrans des tablettes des pistes et billards | OUVERTURE | MOYENNE |
| 9 | Nettoyer les vitres des jeux d'arcades | OUVERTURE | FAIBLE |
| 10 | Vérifier la propreté des toilettes avant chaque pause | PENDANT | HAUTE |
| 11 | Proposer au moins une fois des boissons à chaque client | PENDANT | HAUTE |
| 12 | Vérifier les bornes de gel et remplir si besoin | PENDANT | MOYENNE |
| 13 | Vérifier / nettoyer / dépoussiérer les zones (arcade, fléchettes, machines à lots, machines, billards, micro-ondes libre-service) | PENDANT | MOYENNE |
| 14 | Nettoyer les bornes de désinfection chaussures clients | PENDANT | FAIBLE |
| 15 | Mardi/vendredi (1h avant fin) : rassembler les poubelles (bar, accueil, arcades, pistes) | FERMETURE | HAUTE |
| 16 | Mardi/vendredi : nettoyer toutes les tables en salle et pistes (produit nettoyant) | FERMETURE | HAUTE |

---

### Services (5 services — relatifs à aujourd'hui)

| Décalage | Statut | Manager | Taux | Note |
|---|---|---|---|---|
| J-3 | DONE | Kévin | 94% | Soirée chargée, piste 4 en panne en fin de service. Réparation prévue lundi. |
| J-2 | DONE | Mégane | 87% | RAS. Bon service, équipe au complet. |
| J-1 | DONE | Micka | 72% | — |
| Aujourd'hui | IN_PROGRESS | Kévin | 28% | Vérifier stock bière avant 18h, livraison annulée hier. |
| J+1 | NOT_STARTED | Mégane | 0% | — |

**Heure d'ouverture :** 10:00 — **Heure de fermeture :** 23:00

---

### Assignations (service du jour + J-1)

**Aujourd'hui (IN_PROGRESS) :**
| Employé | Zone |
|---|---|
| Kévin | Accueil |
| Patou | Accueil |
| Erwan | Salle |
| Gabin | Bar |
| Cynthia | Bar |
| Aya | Salle |

**J-1 (DONE) :**
| Employé | Zone |
|---|---|
| Micka | Accueil |
| Pôl | Accueil |
| Hiba | Bar |
| Daniela | Salle |
| Erwan | Salle |

---

### Incidents (4)

| Description | Zone | Sévérité | Statut | Créé par | Date | Service |
|---|---|---|---|---|---|---|
| Panne piste n°4 — retour boules bloqué, mécanisme coincé | Salle | HAUTE | EN_COURS | Kévin | J-3 20:15 | J-3 |
| Climatisation salle — bruit anormal depuis 18h, vibrations sur la grille nord | Salle | MOYENNE | OUVERT | Micka | J-1 18:30 | J-1 |
| Machine à cocktails — fuite au niveau du joint inférieur, serviettes posées en attendant | Bar | HAUTE | CLOTURE | Mégane | J-2 15:00 | J-2 |
| Client ivre refusé à l'entrée, intervention sécurité requise | Accueil | MOYENNE | CLOTURE | Kévin | J-3 22:00 | J-3 |

---

## Schéma des dépendances (ordre de création pour les fixtures)

```
Centre
  └── Zone
        ├── Mission
        └── Competence
  └── User
        ├── StaffCompetence (→ Competence)
        └── TutoRead (→ Tutoriel)
  └── Tutoriel (→ Zone optionnel)
  └── Service (→ User manager)
        └── Assignation (→ Zone, → User)
              └── TaskCompletion (→ Mission)
        └── Incident (→ Zone, → User creePar)
```

**Ordre recommandé pour les fixtures Alice :**
1. Centre
2. Zone
3. User
4. Mission
5. Competence
6. Tutoriel
7. StaffCompetence
8. Service
9. Assignation
10. TutoRead
11. TaskCompletion
12. Incident
