# PROMPT — Module HACCP MVP

## Objectif
Greffer un module HACCP minimal sur Shiftly en réutilisant les missions du service.
- **Entité HaccpEquipement** (frigo / congélo / vitrine) avec ses seuils, par centre.
- Une **MissionHaccpSpec** liée optionnellement à un équipement, étend une Mission existante.
- Le staff coche une mission HACCP dans `/service` → **modal de saisie** (T° / DLC / photo / réception).
- Page **`/haccp`** = registre filtrable + export PDF mensuel.
- Page **`/haccp/equipements`** = CRUD équipements + bouton "Régénérer les missions".
- **0 modif structurelle** sur Mission et Completion.

## Fichiers de référence à lire **avant tout**
1. `CLAUDE.md` — règles absolues (15 règles, MySQL/PG safe, cascade Doctrine, etc.)
2. `ARCHITECTURE.md` — patterns Symfony + Next.js + naming hooks
3. `DESIGN_SYSTEM.md` — tokens couleur, typo, composants
4. `docs/HACCP_MVP_SCHEMA.md` — **schéma SQL exact + Voters + service HaccpMissionGenerator + auto-seed**
5. `docs/maquettes/haccp-check-modal.html` — UX modal de saisie 4 variantes
6. `docs/maquettes/haccp-registre-v1.html` — UX page `/haccp` (registre)
7. `docs/maquettes/haccp-equipements.html` — UX page `/haccp/equipements`
8. `shiftly-api/src/Entity/Mission.php` + `Completion.php` + `MissionCategorie.php` + `Zone.php`

## Périmètre

### Back-end Symfony
1. **3 entités** : `HaccpEquipement`, `MissionHaccpSpec`, `CompletionHaccpProof` (cf. `HACCP_MVP_SCHEMA.md` §2-§3)
2. Relations inverses cascade `persist`+`remove` sur `Mission` et `Completion`
3. **Voters dédiés** : EDIT/CREATE/DELETE = MANAGER only sur les 3 entités (sauf CREATE de `CompletionHaccpProof` qui suit le Voter Completion existant)
4. Service `App\Service\Haccp\HaccpMissionGenerator` (cf. §5 SCHEMA) :
   - `synchronizeForCentre(Centre $centre): HaccpSyncResult` — idempotent, transactionnel
   - Crée 2 missions T° par équipement actif (moment DEBUT_SERVICE + FIN_SERVICE)
   - Archive (mission.archivee = true) les missions T° liées à un équipement désactivé
   - Appelé automatiquement post-flush sur CRUD HaccpEquipement (Doctrine listener)
5. Service `App\Service\Haccp\HaccpProofConformityChecker` :
   - Listener Doctrine `prePersist` sur `CompletionHaccpProof`
   - Lit les seuils sur `proof.completion.mission.haccpSpec.equipement` si présent, sinon sur `.haccpSpec`
   - Calcule `est_conforme` (NULL si typeReleve ∈ {PHOTO, RECEPTION sans valeur})
6. Migration Doctrine + **vérification compatibilité MySQL/PostgreSQL** avant push (cf. règle 15 + incident 2026-04-25)
7. **Auto-seed à la création d'un centre** (cf. §6 SCHEMA) : catégorie HACCP + 2 équipements types + 3 missions standalone + appel à `HaccpMissionGenerator`
8. API Platform :
   - Exposer `HaccpEquipement` en ressource CRUD
   - Exposer `MissionHaccpSpec` en groupe `mission:read` (inline dans Mission) avec sa relation `equipement`
   - Endpoint POST cascade : `POST /api/completions` accepte un sous-objet `haccpProof: {...}` dans la même transaction
9. Endpoint custom `POST /api/haccp/equipements/{id}/sync-missions` → manuel pour le bouton "Régénérer les missions"
10. Upload photo : `uploads/haccp/YYYY/MM/uuid.jpg` (pattern existant adapté)

### Front Next.js
1. Types `src/types/haccp.ts` — strict, pas de `any`
2. Hooks React Query :
   - `useHaccpEquipements()` / `useCreerEquipement()` / `useModifierEquipement()` / `useSupprimerEquipement()` / `useToggleEquipementActif()`
   - `useRegenererMissions()` — POST sync
   - `useHaccpRegistre({ mois, type, conforme })` — registre filtrable
   - `useCompleterMissionHaccp()` — POST completion + haccpProof en cascade
3. Composants `src/components/haccp/` (chacun ≤ 150 lignes) :
   - **Modal de saisie** : `HaccpCheckModal` (dispatch) + `HaccpModalTemperature` + `HaccpModalDlc` + `HaccpModalPhoto` + `HaccpModalReception`
   - **Registre** : `HaccpRegistreTable` + `HaccpRegistreDayBlock` + `HaccpRegistreRow` + `HaccpRegistreFilters` + `HaccpKpis`
   - **Équipements** : `HaccpEquipementList` + `HaccpEquipementCard` + `HaccpEquipementForm` + `HaccpSyncBanner` + `HaccpTypePicker`
   - **Tabs HACCP** : `HaccpTabsNav` (Registre / Équipements) — partagé entre les 2 pages
4. Pages :
   - `src/app/(app)/haccp/page.tsx` → registre (page par défaut)
   - `src/app/(app)/haccp/equipements/page.tsx` → CRUD équipements
5. Modification `src/app/(app)/service/page.tsx` (ou composant MissionRow) : si `mission.haccpSpec` présent → ouvrir `HaccpCheckModal` au lieu du toggle direct
6. Sidebar : ajouter item HACCP (icône `🍔`, après Staff) — manager **ET** employé (employé saisit, manager consulte)
7. Animations Framer Motion via variants existants (`fadeUp`, `slideUp`)
8. État `loading | error | empty` sur **chaque** composant qui fetch

### Export PDF
- Endpoint `GET /api/haccp/export?mois=2026-06` côté Symfony
- Génération via `dompdf` (ou `wkhtmltopdf` si déjà installé) — vérifier composer.json
- Format A4 paysage, registre groupé par jour, en-tête centre, signature manager en bas

### Multi-tenancy
- `centre_id` dénormalisé sur les 3 nouvelles tables → Voter direct, pas de JOIN
- Test curl multi-tenant obligatoire avant clôture

## Out of scope (NE PAS implémenter)
- ❌ Matrice allergènes (`haccp-allergenes.html`)
- ❌ Plan de nettoyage formel par zone (`haccp-nettoyage.html`)
- ❌ Bibliothèque documents PMS (`haccp-documents.html`)
- ❌ Formations / certifications staff (`haccp-formations.html`)
- ❌ Configuration équipements avancée — sondes IoT (`haccp-config.html`)
- ❌ Dashboard HACCP autonome (`haccp-module.html`)
- ❌ Création d'Incident automatique sur hors-seuil (V2)
- ❌ Logique horaire de bascule début/fin de service (V2) — `moment` est juste un label informatif V1
- ❌ Notifications push / mails aux managers sur non-conformité (V2)

## Mise à jour des docs (obligatoire en fin de chantier)
- [ ] `schema.sql` ← diff `docs/HACCP_MVP_SCHEMA.md` §2 (3 tables dans l'ordre)
- [ ] `ENTITES.md` ← sections §3-§4 de `docs/HACCP_MVP_SCHEMA.md`
- [ ] `ARCHITECTURE.md` ← routes `/haccp` + `/haccp/equipements`, composants `components/haccp/*`, services `HaccpMissionGenerator` + `HaccpProofConformityChecker`
- [ ] `DESIGN_SYSTEM.md` ← modal de saisie HACCP + badge "Non conforme" + composants page Équipements (type picker, switch actif, equip-card)
- [ ] `CLAUDE.md` ← tableau modules : `/haccp` + `/haccp/equipements` statut Production

## Auto-vérification avant livraison
Lance et reporte le résultat de :
1. `cd shiftly-api && php bin/console doctrine:migrations:status` (pas de migration pending non vue)
2. `php bin/console doctrine:schema:validate --skip-sync` (schéma cohérent)
3. `php bin/console lint:container` (pas d'erreur DI sur listeners / services HACCP)
4. `cd shiftly-app && npm run build` (build front sans erreur TS)
5. **Test multi-tenant** : créer 2 centres, vérifier qu'un manager du centre A ne voit pas les équipements ni les preuves du centre B (`GET /api/haccp_equipements` + `GET /api/completion_haccp_proofs` avec JWT centre A)
6. **Test seuil équipement** : créer un frigo seuilMax=4, POST T° = 9.5°C → vérifier `est_conforme=false`
7. **Test sync idempotent** : appeler `synchronizeForCentre` 3 fois de suite, vérifier qu'il n'y a toujours que 2 missions T° par équipement actif
8. **Test sync sur désactivation** : désactiver un équipement, vérifier que ses 2 missions T° sont archivées (`archivee=true`)
9. **Test cascade delete** : supprimer un équipement, vérifier que les missions HACCP T° associées et leurs specs sont bien supprimées
10. **Test E2E** : ouvrir `/service` côté employé, cocher une mission HACCP T°, vérifier que la modal s'ouvre avec le bon label équipement, valider, vérifier que completion + proof sont créées en une transaction
11. **Test export PDF** sur un mois avec ≥ 10 relevés mixtes (T° + DLC + photo)
12. Restart `npm run dev` (`pkill -f "next dev" ; rm -rf .next ; npm run dev`) après chantier ≥ 5 fichiers shiftly-app/ touchés (cf. mémoire `next_dev_restart_after_bulk_changes`)

Si une auto-vérif échoue ou est skippée, **mentionne-le explicitement** dans le message de livraison avec les commandes à relancer manuellement côté Mac (cf. mémoire `feedback_pre_push_checklist`).

## Commits suggérés (1 par modification atomique — règle 14)
1. `feat(haccp): entité HaccpEquipement + Voter + migration`
2. `feat(haccp): entités MissionHaccpSpec + CompletionHaccpProof + migration`
3. `feat(haccp): HaccpMissionGenerator (sync idempotent missions T°)`
4. `feat(haccp): listener HaccpProofConformityChecker (calcul est_conforme)`
5. `feat(haccp): auto-seed à la création centre (équipements types + missions)`
6. `feat(haccp): API Platform — expose haccpSpec inline + cascade haccpProof + endpoint sync`
7. `feat(haccp): types + hooks React Query`
8. `feat(haccp): HaccpCheckModal + 4 variantes (TEMPERATURE/DLC/PHOTO/RECEPTION)`
9. `feat(haccp): intègre HaccpCheckModal dans /service`
10. `feat(haccp): page /haccp registre + KPIs + filtres + export PDF`
11. `feat(haccp): page /haccp/equipements + CRUD + bouton régénérer missions`
12. `feat(sidebar): ajoute item HACCP (manager + employé)`
13. `docs(haccp): mise à jour ARCHITECTURE / ENTITES / schema.sql / DESIGN_SYSTEM / CLAUDE`

**Ne pas push** — Kévin push lui-même.
