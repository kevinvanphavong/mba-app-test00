# HACCP MVP — Schéma de données

> Diff à appliquer sur `schema.sql` et sections à ajouter dans `ENTITES.md`.
> **À valider avant d'éditer les fichiers de référence.**
>
> Architecture : **3 entités** en bounded context HACCP.
> Mission et Completion restent inchangées (zéro pollution des entités centrales).

```
HaccpEquipement       ──┐
  (frigo, congélo,      │
   vitrine — seuils,    │
   par centre)          │
                        ▼
MissionHaccpSpec     1-1 avec Mission
  (typeReleve,          │  + FK nullable vers HaccpEquipement
   moment,              │
   seuils si standalone)│
                        ▼
CompletionHaccpProof 1-1 avec Completion
  (valeur, photo, note, est_conforme)
```

---

## 1. Décisions actées (cadrage du 2026-06-02)

| Sujet | Décision |
|---|---|
| Architecture | 3 tables HACCP isolées, FK + UNIQUE + ON DELETE CASCADE |
| Équipements | Entité dédiée `HaccpEquipement` (frigo / congélateur / vitrine / autre) par centre — porte les seuils min/max |
| Génération missions | Service `HaccpMissionGenerator` : pour chaque équipement actif, sync de 2 missions T° (début + fin de service). Idempotent : ne duplique pas, archive si équipement désactivé |
| Début/fin de service | Juste un label informatif sur la mission (champ `moment` sur la spec). Aucune logique horaire pour V1, le staff coche quand il fait |
| Source de vérité des seuils T° | Sur l'équipement (single source of truth). `MissionHaccpSpec.seuilMin/Max` n'est utilisé que si la spec n'a pas d'équipement (cas RECEPTION standalone) |
| Hors-seuil | Flag `est_conforme = false` uniquement — pas de création d'Incident en V1 |
| Permissions seuils + équipements | Manager uniquement (Voter) |
| Templates HACCP | Auto-seedés à la création d'un nouveau centre (2 équipements types + missions DLC / Étiquetage / Réception) |
| Stockage photos | Local `uploads/haccp/YYYY/MM/uuid.jpg` (cohérent avec `completion.photo_path` existant) |
| Multi-tenancy | `centre_id` dénormalisé sur les 3 tables → Voter sans JOIN |
| Catégorie mission | Slug `HACCP` ajouté dans `mission_categorie` (catalogue existant par centre) |
| Page de config | Sous-route `/haccp/equipements` (onglet HACCP, à côté du registre) |

---

## 2. Diff à ajouter dans `schema.sql`

À insérer après la table `completion` (ligne ~185), dans cet ordre (FK dépendantes) :

### Table 1 — `haccp_equipement`

```sql
-- ============================================================
-- TABLE : haccp_equipement
-- Équipement froid d'un centre (frigo, congélateur, vitrine…)
-- Porte les seuils de température et sert de source au générateur
-- automatique de missions HACCP de relevé (début + fin de service)
-- type : 'FRIGO' | 'CONGELATEUR' | 'VITRINE' | 'AUTRE'
-- ============================================================

CREATE TABLE haccp_equipement (
    id          INT AUTO_INCREMENT NOT NULL,
    centre_id   INT          NOT NULL,
    nom         VARCHAR(120) NOT NULL,                 -- "Frigo bar principal"
    type        VARCHAR(20)  NOT NULL,                 -- enum HACCP_EQUIP_TYPE
    zone_id     INT          DEFAULT NULL,             -- rattachement optionnel à une zone
    seuil_min   DECIMAL(5,2) NOT NULL,                 -- ex: 0.00 °C
    seuil_max   DECIMAL(5,2) NOT NULL,                 -- ex: 4.00 °C
    unite       VARCHAR(10)  NOT NULL DEFAULT '°C',
    ordre       INT          NOT NULL DEFAULT 0,       -- affichage page Équipements
    actif       TINYINT(1)   NOT NULL DEFAULT 1,       -- inactif = pas régénéré
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL,
    INDEX idx_haccp_equip_centre (centre_id, actif),
    INDEX idx_haccp_equip_zone   (zone_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_haccp_equip_centre FOREIGN KEY (centre_id) REFERENCES centre (id),
    CONSTRAINT FK_haccp_equip_zone   FOREIGN KEY (zone_id)   REFERENCES zone   (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table 2 — `mission_haccp_spec`

```sql
-- ============================================================
-- TABLE : mission_haccp_spec
-- Extension HACCP d'une mission : spécification du relevé attendu
-- (température / DLC / photo / réception fournisseur)
-- Relation 1-1 avec mission, supprimée en cascade
-- type_releve : 'TEMPERATURE' | 'DLC' | 'PHOTO' | 'RECEPTION'
-- moment      : 'DEBUT_SERVICE' | 'FIN_SERVICE' | NULL (libre)
-- Si equipement_id est défini → on lit les seuils sur l'équipement
-- Sinon → on lit les seuils sur cette spec (cas RECEPTION standalone)
-- ============================================================

CREATE TABLE mission_haccp_spec (
    id                      INT AUTO_INCREMENT NOT NULL,
    mission_id              INT          NOT NULL,
    centre_id               INT          NOT NULL,        -- dénormalisé pour Voter
    equipement_id           INT          DEFAULT NULL,    -- FK nullable vers haccp_equipement
    type_releve             VARCHAR(20)  NOT NULL,        -- enum HACCP_RELEVE_TYPE
    moment                  VARCHAR(20)  DEFAULT NULL,    -- enum HACCP_MOMENT (label informatif V1)
    seuil_min               DECIMAL(5,2) DEFAULT NULL,    -- utilisé seulement si equipement_id NULL
    seuil_max               DECIMAL(5,2) DEFAULT NULL,
    unite                   VARCHAR(10)  DEFAULT NULL,
    photo_obligatoire       TINYINT(1)   NOT NULL DEFAULT 0,
    commentaire_obligatoire TINYINT(1)   NOT NULL DEFAULT 0,
    created_at              DATETIME     NOT NULL,
    updated_at              DATETIME     NOT NULL,
    UNIQUE KEY uniq_haccp_spec_mission (mission_id),
    INDEX idx_haccp_spec_centre     (centre_id),
    INDEX idx_haccp_spec_equipement (equipement_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_haccp_spec_mission    FOREIGN KEY (mission_id)    REFERENCES mission           (id) ON DELETE CASCADE,
    CONSTRAINT FK_haccp_spec_centre     FOREIGN KEY (centre_id)     REFERENCES centre            (id),
    CONSTRAINT FK_haccp_spec_equipement FOREIGN KEY (equipement_id) REFERENCES haccp_equipement  (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table 3 — `completion_haccp_proof`

```sql
-- ============================================================
-- TABLE : completion_haccp_proof
-- Preuve HACCP attachée à une completion (T° relevée, DLC, photo)
-- Relation 1-1 avec completion, supprimée en cascade
-- est_conforme : calculé à l'insert via HaccpProofConformityChecker
--                qui lit les seuils depuis l'équipement (si lié)
--                ou depuis la spec (sinon)
-- ============================================================

CREATE TABLE completion_haccp_proof (
    id                  INT AUTO_INCREMENT NOT NULL,
    completion_id       INT          NOT NULL,
    centre_id           INT          NOT NULL,            -- dénormalisé pour Voter
    valeur_numerique    DECIMAL(5,2) DEFAULT NULL,        -- T° relevée
    date_releve         DATE         DEFAULT NULL,        -- DLC saisie
    photo_path          VARCHAR(255) DEFAULT NULL,        -- 'uploads/haccp/YYYY/MM/uuid.jpg'
    photo_mime_type     VARCHAR(50)  DEFAULT NULL,
    note                TEXT         DEFAULT NULL,
    est_conforme        TINYINT(1)   DEFAULT NULL,        -- NULL si non applicable
    releve_par_user_id  INT          DEFAULT NULL,        -- qui a saisi (audit)
    created_at          DATETIME     NOT NULL,
    UNIQUE KEY uniq_haccp_proof_completion (completion_id),
    INDEX idx_haccp_proof_centre_date (centre_id, created_at),
    INDEX idx_haccp_proof_releveur    (releve_par_user_id),
    PRIMARY KEY (id),
    CONSTRAINT FK_haccp_proof_completion FOREIGN KEY (completion_id)      REFERENCES completion (id) ON DELETE CASCADE,
    CONSTRAINT FK_haccp_proof_centre     FOREIGN KEY (centre_id)          REFERENCES centre     (id),
    CONSTRAINT FK_haccp_proof_user       FOREIGN KEY (releve_par_user_id) REFERENCES `user`     (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Note compatibilité MySQL/PostgreSQL** (cf. règle 15 + incident 2026-04-25) :
> - `TINYINT(1)` → traduit en `BOOLEAN` par Doctrine, OK les deux SGBD
> - `DECIMAL(5,2)` → numérique standard, OK les deux
> - `ON DELETE CASCADE` + `ON DELETE SET NULL` → syntaxe identique, OK
> - Pas de `__temp__` ni de `"user"` quoté SQLite-style à craindre (aucune modif sur tables existantes)

---

## 3. Sections à ajouter dans `ENTITES.md`

### HaccpEquipement

Équipement froid d'un centre (frigo, congélateur, vitrine). Source de vérité des seuils T°. Le service `HaccpMissionGenerator` se base sur cette table pour générer/synchroniser automatiquement les missions HACCP de relevé.

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `centre` | Centre | non | FK multi-tenancy |
| `nom` | string(120) | non | Ex : "Frigo bar principal" |
| `type` | string(20) | non | Enum (voir ci-dessous) |
| `zone` | Zone | oui | Rattachement optionnel (utile pour le registre) |
| `seuilMin` | decimal(5,2) | non | Seuil minimal autorisé |
| `seuilMax` | decimal(5,2) | non | Seuil maximal autorisé |
| `unite` | string(10) | non | Défaut `°C` |
| `ordre` | int | non | Ordre d'affichage page Équipements (défaut: 0) |
| `actif` | bool | non | Inactif = exclu du générateur (défaut: true) |
| `createdAt` | DateTimeImmutable | non | |
| `updatedAt` | DateTime | non | Auto-update sur modification |

**Valeurs d'enum — type :**
```
FRIGO         → frigo positif, seuils typiques 0 à 4 °C
CONGELATEUR   → congélateur, seuils typiques −22 à −18 °C
VITRINE       → vitrine réfrigérée libre-service (boissons, snacking)
AUTRE         → autre équipement à surveiller (chambre froide, etc.)
```

**Relations :**
- `centre` → ManyToOne → Centre
- `zone` → ManyToOne → Zone (nullable, onDelete: SET NULL)
- `haccpSpecs` → OneToMany → MissionHaccpSpec (cascade remove)

**Voter :**
- `VIEW` : tout utilisateur du centre
- `EDIT` / `CREATE` / `DELETE` : `ROLE_MANAGER` du centre uniquement

---

### MissionHaccpSpec

Extension HACCP optionnelle d'une mission. Présente uniquement pour les missions qui réclament un relevé sanitaire (température, DLC, photo, réception).

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `mission` | Mission | non | FK unique (OneToOne, ON DELETE CASCADE) |
| `centre` | Centre | non | FK multi-tenancy (dénormalisé pour Voter) |
| `equipement` | HaccpEquipement | oui | FK (ON DELETE CASCADE) — défini pour TEMPERATURE liées à un équipement |
| `typeReleve` | string(20) | non | Enum (voir ci-dessous) |
| `moment` | string(20) | oui | Enum label informatif (voir ci-dessous) |
| `seuilMin` | decimal(5,2) | oui | Ignoré si `equipement` est défini (l'équipement fait foi) |
| `seuilMax` | decimal(5,2) | oui | Idem |
| `unite` | string(10) | oui | Idem |
| `photoObligatoire` | bool | non | Photo requise pour valider (défaut: false) |
| `commentaireObligatoire` | bool | non | Commentaire requis pour valider (défaut: false) |
| `createdAt` | DateTimeImmutable | non | |
| `updatedAt` | DateTime | non | Auto-update sur modification |

**Valeurs d'enum — typeReleve :**
```
TEMPERATURE → relevé numérique en °C, seuils sur l'équipement ou la spec
DLC         → date limite de consommation saisie + photo étiquette
PHOTO       → simple photo (étiquetage produit ouvert, conformité visuelle)
RECEPTION   → fournisseur + n° lot + T° à réception + photo BL
```

**Valeurs d'enum — moment :**
```
DEBUT_SERVICE → relevé à l'ouverture du service (label informatif)
FIN_SERVICE   → relevé à la fermeture du service (label informatif)
NULL          → mission "libre" (DLC, RECEPTION, PHOTO ponctuelle)
```

**Relations :**
- `mission` → OneToOne → Mission (côté propriétaire, cascade remove)
- `centre` → ManyToOne → Centre
- `equipement` → ManyToOne → HaccpEquipement (nullable, cascade remove)

**Contraintes uniques :** `mission_id` (1 spec par mission max)

**Voter :**
- `VIEW` : tout utilisateur du centre
- `EDIT` / `CREATE` / `DELETE` : `ROLE_MANAGER` du centre uniquement

---

### CompletionHaccpProof

Preuve HACCP attachée à une completion. Créée en cascade quand une mission HACCP est cochée depuis `/service`. La valeur d'`estConforme` est calculée à l'insert via `HaccpProofConformityChecker` (qui lit les seuils depuis l'équipement s'il existe, sinon depuis la spec).

| Champ | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | non | Auto-généré |
| `completion` | Completion | non | FK unique (OneToOne, ON DELETE CASCADE) |
| `centre` | Centre | non | FK multi-tenancy (dénormalisé pour Voter) |
| `valeurNumerique` | decimal(5,2) | oui | T° relevée (TEMPERATURE / RECEPTION) |
| `dateReleve` | DateTime (date) | oui | DLC saisie (DLC) |
| `photoPath` | string(255) | oui | `uploads/haccp/YYYY/MM/uuid.jpg` |
| `photoMimeType` | string(50) | oui | `image/jpeg | image/png | image/webp` |
| `note` | text | oui | Commentaire libre (obligatoire si spec.commentaireObligatoire) |
| `estConforme` | bool | oui | `NULL` si non applicable, sinon calculé |
| `relevePar` | User | oui | Qui a saisi la preuve (généralement = completion.user) |
| `createdAt` | DateTimeImmutable | non | |

**Relations :**
- `completion` → OneToOne → Completion (côté propriétaire, cascade remove)
- `centre` → ManyToOne → Centre
- `relevePar` → ManyToOne → User (nullable, SET NULL on delete)

**Contraintes uniques :** `completion_id` (1 preuve par completion max)

**Voter :**
- `VIEW` : tout utilisateur du centre
- `CREATE` : tout utilisateur du centre (cascade depuis Completion)
- `EDIT` / `DELETE` : `ROLE_MANAGER` du centre uniquement (correction a posteriori)

---

## 4. Modifications mineures sur entités existantes

### Mission
Relation inverse cascade :
```php
#[ORM\OneToOne(mappedBy: 'mission', targetEntity: MissionHaccpSpec::class, cascade: ['persist','remove'])]
private ?MissionHaccpSpec $haccpSpec = null;
```
Aucune colonne SQL ajoutée sur `mission`.

### Completion
Relation inverse cascade :
```php
#[ORM\OneToOne(mappedBy: 'completion', targetEntity: CompletionHaccpProof::class, cascade: ['persist','remove'])]
private ?CompletionHaccpProof $haccpProof = null;
```
Aucune colonne SQL ajoutée sur `completion`.

### MissionCategorie
Aucune modif structurelle. Au seed initial d'un centre, ajouter le slug `HACCP` au catalogue.

---

## 5. Service Symfony — `HaccpMissionGenerator`

Service métier responsable de la **synchronisation idempotente** des missions HACCP de relevé T° avec les équipements actifs d'un centre.

```php
namespace App\Service\Haccp;

final class HaccpMissionGenerator
{
    public function __construct(
        private EntityManagerInterface $em,
        private MissionCategorieRepository $categories,
    ) {}

    /**
     * Synchronise les missions HACCP T° du centre avec ses équipements actifs.
     *
     * - Pour chaque équipement ACTIF : crée si absentes les 2 missions
     *   "Relevé T° {nom} — début de service" et "— fin de service"
     *   (moment = DEBUT_SERVICE / FIN_SERVICE), liées à l'équipement.
     * - Pour chaque équipement INACTIF : archive les missions T° associées
     *   (mission.archivee = true) sans les supprimer (historique préservé).
     * - N'agit pas sur les missions HACCP non-équipement (DLC, RECEPTION, PHOTO).
     *
     * @return HaccpSyncResult { creees: int, archivees: int, inchangees: int }
     */
    public function synchronizeForCentre(Centre $centre): HaccpSyncResult { /* ... */ }
}
```

**Déclencheurs :**
1. Bouton manuel "🔄 Régénérer les missions" sur `/haccp/equipements` (manager)
2. CRUD sur HaccpEquipement (create / update actif / delete) → appel auto en post-flush
3. Création d'un nouveau centre (auto-seed initial)

**Garanties :**
- Idempotent : appel répété ne duplique pas
- Archive ≠ delete : on garde les missions désactivées pour ne pas perdre l'historique des completions passées
- Transactionnel : si une mission échoue, rollback complet

---

## 6. Auto-seed à la création d'un centre

Le `CentreInitializerService` (à créer ou étendre s'il existe) crée automatiquement :

1. La catégorie de mission `HACCP` dans `mission_categorie`
2. Une zone `Bar` si absente
3. **2 équipements types** :

| Nom | Type | seuilMin | seuilMax | unite |
|---|---|---|---|---|
| Frigo bar principal | FRIGO | 0 | 4 | °C |
| Congélateur cuisine | CONGELATEUR | -22 | -18 | °C |

4. **Appel automatique de `HaccpMissionGenerator::synchronizeForCentre()`** → crée 4 missions T° (2 équipements × début/fin)

5. **3 missions HACCP standalone non liées à un équipement** :

| Texte mission | typeReleve | moment | Photo |
|---|---|---|---|
| Contrôle DLC produits frais | DLC | NULL | obligatoire |
| Étiquetage produit ouvert (date) | PHOTO | NULL | obligatoire |
| Réception fournisseur | RECEPTION | NULL | obligatoire |

Toutes ces missions ont `frequence = FIXE` et `priorite = vitale`. Le manager peut tout éditer/désactiver après coup.

---

## 7. À mettre à jour après implémentation

- [ ] `schema.sql` — coller le diff section 2 (3 tables dans l'ordre)
- [ ] `ENTITES.md` — coller les sections 3 + 4
- [ ] `ARCHITECTURE.md` — ajouter routes `/haccp` + `/haccp/equipements` + composants `src/components/haccp/*` + services `HaccpMissionGenerator` + `HaccpProofConformityChecker`
- [ ] `DESIGN_SYSTEM.md` — modal de saisie HACCP + badge "Non conforme" + composants page Équipements
- [ ] `CLAUDE.md` — ajouter `/haccp` et `/haccp/equipements` dans le tableau des modules (statut "Production" après merge)
