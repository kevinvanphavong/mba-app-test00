# Sécurité multi-tenant — inventaire & isolation

> Domaine : isolation des données par `centre`. Défense en profondeur sur 2 couches
> (CLAUDE.md règle 9) : **BDD** (`CentreQueryExtension` filtre les collections/items
> API Platform) **+ ressource** (`AbstractCentreVoter` sur les opérations item).
> Prouvé par `tests/Security/CrossTenantTest.php` (rejoué en CI sur Postgres).

## Principe

- Tout user porte un `centre` (FK `user.centre_id` NOT NULL). Toute donnée exposée
  rattachable à un centre est filtrée par ce centre.
- **Lecture** (GetCollection + Get item) : `CentreQueryExtension` ajoute le filtre au
  QueryBuilder → un item d'un autre centre est *introuvable* (404), jamais 200.
- **Écriture** (Put/Patch/Delete) : l'item est d'abord lu par le provider (donc filtré
  → 404 cross-tenant) **et** un Voter (`is_granted('EDIT'|'DELETE', object)`) revérifie
  l'appartenance au centre. Double verrou.

## Inventaire des entités exposées (#[ApiResource])

| Entité | Chemin vers centre | Filtrée par l'extension | Voter | Opérations protégées |
|---|---|---|---|---|
| Centre | (lui-même) | ✅ `id = centreId` | — (collection limitée au sien) | Get/GetCollection limités au centre du user |
| Zone | direct | ✅ | ZoneVoter | VIEW/EDIT/CREATE/DELETE |
| Service | direct | ✅ | ServiceVoter | idem |
| Tutoriel | direct | ✅ | TutorielVoter | idem |
| Incident | direct | ✅ | IncidentVoter | idem |
| EventLog | direct | ✅ | EventLogVoter | VIEW (lecture seule) |
| HaccpEquipement | direct | ✅ | HaccpEquipementVoter | VIEW + manager EDIT/CREATE/DELETE |
| MissionHaccpSpec | direct | ✅ | MissionHaccpSpecVoter | idem |
| CompletionHaccpProof | direct | ✅ | CompletionHaccpProofVoter | idem |
| **MissionCategorie** | direct | ✅ *(ajouté palier 2)* | **MissionCategorieVoter** *(palier 2)* | EDIT/DELETE |
| **User** | direct | ✅ | **UserVoter** *(palier 2)* | EDIT (manager même centre) / DELETE ; self-edit conservé |
| Mission | via `zone` | ✅ | **MissionVoter** *(palier 2)* | EDIT/DELETE |
| Competence | via `zone` | ✅ | **CompetenceVoter** *(palier 2)* | CREATE/EDIT/DELETE (le voter manquait → ops cassées avant) |
| Poste | via `service` | ✅ | PosteVoter | VIEW/EDIT/CREATE/DELETE |
| StaffCompetence | via `user` | ✅ | StaffCompetenceVoter | idem |
| TutoRead | via `user` | ✅ | TutoReadVoter | VIEW/CREATE/DELETE |
| Completion | via `poste→service` | ✅ | CompletionVoter | VIEW/EDIT/CREATE/DELETE |
| Media | direct (dénormalisé) | — (voter only) | MediaVoter | MEDIA_VIEW/DELETE/UPLOAD (centre du parent) |

## Cas particuliers (décisions explicites)

- **Centre** : un user n'accède qu'à SON centre. La collection `/api/centres` est
  filtrée sur `id = centreId` (avant le palier 2 elle listait **tous** les tenants — fuite corrigée).
- **Lead**, **AuditLog** : entités globales **SUPERADMIN uniquement** (pas de centre).
  `LeadVoter` = `ROLE_SUPERADMIN`. Hors périmètre multi-tenant tenant.
- **MissionCategorie** : avant le palier 2, absente de l'extension → `/api/mission_categories`
  listait toutes les catégories de tous les centres (fuite corrigée).
- Entités **non exposées via API Platform** (gérées par controllers custom : Pointage,
  PlanningWeek, PlanningTemplate*, SupportTicket/Reply/Attachment, Absence, ValidationHebdo,
  CentreNote, CorrectionPointage) : l'isolation est assurée **dans le controller** (filtre
  explicite par le centre du user courant).

## Controllers custom — garde d'appartenance

Tous les controllers custom prenant un `{id}`/`{centreId}` de centre ou d'entité en
paramètre ont été audités (cf. `tests/Security/CrossTenantTest.php::testRoutesCustomAvecIdCentreSontIsolees`).
Pattern unifié : `App\Controller\Concern\CentreGuardTrait::denyUnlessOwnCentre()` → **403**
si le centre ciblé n'est pas celui du user courant (sauf `ROLE_SUPERADMIN`).

Fuites trouvées et corrigées (2026-06-12) :
- `CentreHorairesController` GET/PUT `/api/centres/{id}/horaires` (lisait/modifiait un autre centre).
- `EditeurController` : 12 endpoints zones/missions/compétences/tutoriels (PUT/DELETE `/{id}`,
  GET `zones/{id}/missions|competences`, POST avec `zoneId`) résolvaient l'entité par ID sans
  vérifier le centre.

Les autres routes custom (Pointage, Planning, Dashboard, Validation, Support, Staff, Incidents,
Completion, Media, Create*) vérifiaient déjà l'appartenance — confirmé par l'audit.

## Preuve

`tests/Security/CrossTenantTest.php` : 2 centres réels (fixtures), pour chaque ressource
exposée → collection (le user A ne voit que A), item B lu par A → 404, écriture (DELETE)
sur item B → 403/404/405. Jamais de fuite ni d'écriture cross-tenant. Vert en CI.
