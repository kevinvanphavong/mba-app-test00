# Prompt Claude Code — Module Media (médias polymorphes Cloudflare R2)

> **Objectif** : doter Shiftly d'un module générique de gestion de médias (images JPEG/PNG/WebP, PDF) attachés à n'importe quelle entité parente — mission et tutoriel pour démarrer, document plus tard. Stockage Cloudflare R2, URLs signées TTL 1h, voter multi-tenant, cascade de suppression automatique.

## Contexte

Le module `R2StorageService` existe déjà (cf. `PROMPT_CLAUDE_CODE_R2_MIGRATION.md`) pour les photos de `Completion`. On ne le réécrit pas — on s'appuie dessus pour ce nouveau module **Media** générique.

L'entité `Media` est polymorphe : `entityType` + `entityId` pointent vers la table parente sans FK SQL. La cascade de suppression est gérée par des `EventListener` Doctrine dédiés (un par parent).

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment 9, 14, 15)
- `ARCHITECTURE.md` §5quinquies « Module Media » — vue d'ensemble
- `docs/modules/ENTITES.md` §15 « Media » — schéma d'entité
- `schema.sql` — table `media` (référence MySQL)
- `shiftly-api/src/Service/R2StorageService.php` — wrapper R2 existant
- `shiftly-api/src/Entity/Media.php` — entité (déjà créée)
- `shiftly-api/src/Controller/MediaController.php` — endpoints
- `shiftly-api/src/Security/Voter/MediaVoter.php` — UPLOAD / VIEW / DELETE
- `shiftly-api/src/Service/MediaUploader.php` — validation MIME/taille + push R2
- `shiftly-api/src/EventListener/MediaR2CleanupListener.php`
- `shiftly-api/src/EventListener/MissionMediaCleanupListener.php`
- `shiftly-api/src/EventListener/TutorielMediaCleanupListener.php`
- `shiftly-app/src/types/media.ts`
- `shiftly-app/src/hooks/useMedias.ts`
- `shiftly-app/src/components/media/*` (Uploader, Gallery, Thumb, Lightbox)
- `shiftly-app/src/components/editeur/ModalAddMission.tsx` + `ModalAddTutoriel.tsx` — exemples de wiring

## Décisions actées (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Polymorphisme | `entityType` (string) + `entityId` (int), **pas de FK** vers mission/tutoriel |
| Enum | `App\Enum\MediaEntityType` = `Mission` \| `Tutoriel` \| `Document` (VARCHAR(20) en BDD — règle 15) |
| Stockage | Cloudflare R2 via `R2StorageService` (clé : `{centreId}/media/{type}/{uuid}.{ext}`) |
| URL d'accès | `GET /api/media/{id}/url` → URL signée TTL 1h. Le storage path n'est **jamais** exposé tel quel |
| Listing | Sub-resources uniquement (`/api/missions/{id}/medias`, `/api/tutoriels/{id}/medias`). `GetCollection` désactivé |
| Limites | 5 MB max images, 20 MB max PDF — MIME revérifié serveur |
| Multi-tenant | `MediaVoter` vérifie systématiquement que le user et l'entité parente appartiennent au même centre |
| Cleanup | Cascade automatique via 3 listeners (R2 + Mission + Tutoriel) |
| Front | `MediaUploader` + `MediaGallery` montés dans les modales **uniquement en mode édition** (l'entité parente doit avoir un `id`) |

## Tâche — extension du module à un nouveau parent (ex : Document)

Si tu dois brancher un nouveau parent (ex : `Document`), suis cette checklist :

1. **Backend**
   - Ajouter la valeur dans `App\Enum\MediaEntityType` (ex : `case Document = 'document'`).
   - Ajouter une route sub-resource dans `MediaController` (ex : `GET /api/documents/{id}/medias`) sur le modèle de `listForMission`.
   - Ajouter `resolveParentCentre()` pour le nouveau type (renvoie le `Centre` du parent).
   - Créer un `{Parent}MediaCleanupListener` (preRemove) qui appelle `MediaRepository::findByEntity(...)` puis `EntityManager::remove()` sur chaque Media. Le `MediaR2CleanupListener` se charge ensuite des blobs R2.
   - Étendre `MediaVoter::supports()` / `voteOn()` si la résolution du centre diffère.

2. **Front**
   - Étendre `MediaEntityType` dans `types/media.ts`.
   - Brancher `MediaUploader` + `MediaGallery` dans la modale d'édition correspondante (avec le garde `entity?.id &&` — pas d'upload tant que le parent n'est pas persisté).

3. **Docs**
   - Mettre à jour `ARCHITECTURE.md` (table des endpoints) + `docs/modules/ENTITES.md` §15 (liste des parents supportés).

## Règles à respecter (rappel)

- Jamais de FK SQL Media → parent (la cascade est applicative).
- Jamais d'URL R2 brute renvoyée au front — toujours présigner via `GET /api/media/{id}/url`.
- Jamais faire confiance au MIME envoyé par le client : revalider serveur via `getMimeType()` du `UploadedFile`.
- `GetCollection` Media reste désactivé : pas de listing global.
- Les composants `MediaUploader` / `MediaGallery` ne sont montés qu'en **mode édition** (sinon `entityId` est `null` et l'API ne peut pas accepter l'upload).
- 3 états dans `MediaGallery` : `loading | error | empty`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
```

### Tests fonctionnels
- [ ] Upload d'une image JPEG (3 MB) sur une mission existante → 201, le Media apparaît dans la `MediaGallery`.
- [ ] Upload d'un PDF (15 MB) sur un tutoriel existant → 201, vignette PDF affichée.
- [ ] Upload d'un fichier 6 MB en image → 400 (taille refusée).
- [ ] Upload d'un fichier `.exe` renommé `.jpg` → 400 (MIME refusé serveur).
- [ ] `GET /api/media/{id}/url` → URL signée valide pendant 1h, expire ensuite.
- [ ] User d'un autre centre tente `GET /api/missions/{id}/medias` → 404 (pas de fuite d'existence).
- [ ] User employé tente `POST /api/media` → 403 (manager only).
- [ ] Suppression d'une Mission ayant 3 Media → les 3 blobs R2 disparaissent + lignes Media supprimées.
- [ ] Suppression d'un Media isolé → blob R2 supprimé, ligne Media supprimée.
- [ ] Modale `ModalAddMission` en mode création (pas d'`id`) → `MediaUploader`/`Gallery` **invisibles**.
- [ ] Modale `ModalAddMission` en mode édition → uploader + gallery visibles et fonctionnels.

### Critères d'acceptation
- [ ] Aucune valeur réelle de credentials R2 dans `.env.example` ni dans aucun commit (règle 9).
- [ ] Aucun `any` TypeScript dans le module Media (règle 2).
- [ ] Aucun `useEffect` pour les API côté front (règle 5).
- [ ] `ARCHITECTURE.md`, `schema.sql`, `docs/modules/ENTITES.md` reflètent l'état réel.
- [ ] La migration Doctrine est compatible MySQL/PostgreSQL/SQLite (règle 15).
- [ ] Aucun composant > 150 lignes (règle 10).

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : credentials qui auraient fuité ? Régression sur le multi-tenant guard du voter ? Le storage path serait-il accidentellement exposé dans une réponse JSON ? Le listener cascade supprime-t-il bien les Media **avant** que la transaction Mission/Tutoriel ne commit (sinon orphan blobs R2) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques (cf. ordre actuel sur la branche `claude/clever-davinci-769bad`).
2. Rapport de vérification (cases cochées + preuves d'upload/cleanup R2).
3. Tu push pas. Kévin push.
