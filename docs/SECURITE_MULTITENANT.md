# Sécurité multi-tenant — inventaire & isolation

> Domaine : isolation des données par `centre`. Défense en profondeur sur 2 couches
> (CLAUDE.md règle 9) : **BDD** (`CentreQueryExtension` filtre les collections/items
> API Platform) **+ ressource** (`AbstractCentreVoter` sur les opérations item).
> Prouvé par `tests/Security/CrossTenantTest.php` (rejoué en CI sur Postgres).

## Principe

- Tout user porte un `centre` (FK `user.centre_id` NOT NULL). Toute donnée exposée
  rattachable à un centre est filtrée par ce centre.
- **Centre courant unifié** : `App\Service\CurrentCentreResolver` est la source unique
  du tenant. Ordre : (1) centre du JWT si user authentifié, sinon (2) centre résolu par
  le **domaine** (host) de la requête — `Centre.domaine` unique, contexte public —, sinon
  (3) **aucun**. Le domaine est lu du host réel, jamais d'un paramètre client.
- **Fail-closed** : si `CurrentCentreResolver` ne résout aucun centre, `CentreQueryExtension`
  ramène la requête à un **jeu vide** (`WHERE 1 = 0`), jamais « pas de filtre ». Une requête
  sans tenant ne voit RIEN — pas de fuite par absence de centre.
- **SUPERADMIN** : seule dérogation. `ROLE_SUPERADMIN` opère globalement (sans centre unique)
  et n'est jamais filtré par l'extension.
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
- **Zone publique `^/api/public` (Branche 1, sans JWT)** — `Prestation` (lecture) et
  `Reservation` (écriture B2C invité) : non exposées via API Platform. Le centre est résolu
  par le **host** (`CurrentCentreResolver::resolveByHost`, jamais un paramètre client) et
  l'isolation est **explicite** : `PrestationRepository::findOneActiveForCentre()` filtre
  par le centre résolu, donc une réservation ne peut référencer qu'une prestation **du même
  centre** (sinon 404). Host inconnu → 404. Prouvé par `tests/Web/ReservationTest.php` et
  `tests/Web/PublicSiteTest.php`. Exemptée du header anti-CSRF (firewall `security: false`,
  pas d'autorité ambiante à détourner).

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

## Audit des params résolvant une entité (au-delà du centre_id)

Tout param de route/query/body résolvant une entité (`userId`, `serviceId`, `posteId`,
`zoneId`, `missionId`, `competenceId`, `tutorielId`, `equipementId`, `pointageId`…) a été
vérifié **ligne par ligne** (y compris la couche service). Deux issues sûres, chacune
prouvée par `tests/Security/CrossTenantTest.php` :
- **garde explicite** → 403/404 (`CentreGuardTrait` ou check `getCentre()` inline) ;
- **filtre JWT** → le param est ignoré au profit du centre courant (payload vide pour un
  autre tenant ; ex. `/api/dashboard/completion-history/services/{serviceId}` → `WHERE centre = JWT`).

| Route (param) | Entité | Sûreté |
|---|---|---|
| Validation `detail/valider/devalider/{userId}` | User | **CORRIGÉ** : `assertUserInCentre()` → 404. `validerEmploye()` créait sinon un `ValidationHebdo(centre=A, user=B)` bidon. |
| Pointage `service/{serviceId}`, `cloturer-service/{serviceId}`, `{id}/*` | Service / Pointage | garde inline (centre) → 403 |
| Haccp `proofs/{id}/photo`, `equipements/{id}/sync-missions` | Proof / Equipement | garde inline (centre) → 403 |
| Dashboard `{centreId}`, `completion-history/services/{serviceId}` | Centre / EventLog | garde (centreId) / filtre JWT (events vides) |
| Editeur `staff/{id}`, `staff/{userId}/competences`, zones/missions/competences/tutoriels `/{id}` | User / Zone / Mission / Competence / Tutoriel | garde (centre) → 403/404 |
| PlanningTemplate `{id}/delete\|apply` | PlanningTemplate | `getOwnedTemplateOrFail()` (centre) → 403 |
| Support `mes-tickets/{id}`, `attachments/{id}/url` | Ticket / Attachment | auteur == user / voter → 403 |
| Completion `{id}/photo`, UpdateIncident `{id}`, UpdateServiceHours `{id}`, UpdateCentre `{id}` | Completion / Incident / Service / Centre | garde inline (centre) → 403 |
| Create* (body : serviceId/zoneId/posteId/missionId/staffIds…) | divers | garde inline (centre) sur chaque relation |

**1 fuite réelle trouvée et corrigée** (Validation `validerEmploye`), le reste était déjà sûr.
Note : le bypass `ROLE_SUPERADMIN` de `CentreGuardTrait` est un filet de sécurité — en pratique
un superadmin n'atteint pas ces routes app (il a son propre firewall ; en impersonation il EST
un manager du centre, donc la garde s'applique normalement).

## Preuve

`tests/Security/CrossTenantTest.php` : 2 centres réels (fixtures), pour chaque ressource
exposée → collection (le user A ne voit que A), item B lu par A → 404, écriture (DELETE)
sur item B → 403/404/405. Jamais de fuite ni d'écriture cross-tenant. Vert en CI.

Cas fail-closed / résolution publique (ajoutés avec `CurrentCentreResolver`) :
- `testFailClosedSansCentreCollectionVide` : sans centre résolu (host inconnu, pas de JWT),
  une collection à centre = **0 résultat** alors que la base contient des zones.
- `testResolutionParDomaineLimiteAuCentre` : host = `domaine` d'un centre connu → seules les
  données de ce centre remontent.
- `testSuperAdminNEstPasFiltreParCentre` : le `ROLE_SUPERADMIN` voit les zones de tous les
  centres (jamais filtré ni fail-closed).
