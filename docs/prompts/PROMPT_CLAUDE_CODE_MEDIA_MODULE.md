# Module Media — stockage images & documents sur Cloudflare R2

> Mettre en place un système de médias générique multi-tenant (images + PDF), branché sur **Mission** et **Tutoriel** dès maintenant, extensible pour HACCP / Documents plus tard. Stockage sur Cloudflare R2 via S3-compatible API.

## Contexte

Aujourd'hui Mission et Tutoriel n'ont aucun moyen d'attacher une image (ex : illustration d'une mission de service, photo d'un tutoriel). Le seul système d'upload existant est `FileUploadService` pour les `Completion.photoPath` qui stocke en filesystem local — il reste tel quel sur ce chantier (un autre prompt `PROMPT_CLAUDE_CODE_R2_MIGRATION.md` traite sa bascule).

On crée un module **Media polymorphe** : une seule entité qui peut s'attacher à n'importe quelle ressource (`mission` | `tutoriel` | `document` plus tard) via la combo `entity_type + entity_id`. Bucket Cloudflare R2 déjà créé par Kévin (`shiftly-dev` + `shiftly-prod`).

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment 9, 14, 15)
- `docs/prompts/PROMPT_CLAUDE_CODE_R2_MIGRATION.md` — pattern AsyncAws + R2, à reproduire et factoriser ici
- `shiftly-api/src/Entity/Mission.php` et `shiftly-api/src/Entity/Tutoriel.php` — pour brancher le sub-resource
- `shiftly-api/src/Entity/Centre.php` — relation centre obligatoire
- `shiftly-api/src/Security/Voter/` (lister le dossier) — modèle de Voter multi-tenant existant
- `shiftly-app/src/lib/api.ts` — client axios à réutiliser côté front

## Décisions actées (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Provider | Cloudflare R2 (S3-compatible, region `auto`, `pathStyleEndpoint: true`) |
| Lib PHP | `async-aws/s3` (cohérent avec le futur R2_MIGRATION, pas de Flysystem) |
| Service R2 | **`R2StorageService` générique** dans `shiftly-api/src/Service/R2StorageService.php`. Pas de logique métier dedans. Trois méthodes : `upload(string $key, UploadedFile|string $fileOrContent, string $mime): void`, `presignedUrl(string $key, int $ttl = 3600): string`, `delete(string $key): void`. Conçu pour être réutilisé par le futur R2_MIGRATION des photos Completion. |
| Entité | Polymorphe `Media` (id, centre, entityType, entityId, filename, mimeType, sizeBytes, storagePath, uploadedBy, createdAt). Pas de FK SQL vers Mission/Tutoriel — relation logique gérée par repository. Index sur `(entity_type, entity_id, centre_id)`. |
| Path R2 | `{centreId}/media/{entityType}/{uuid}.{ext}` — isolation tenant dans le bucket lui-même |
| Bucket | **Privé**. Toutes les lectures via URL signée TTL 1h. Pas d'URL publique. |
| Whitelist MIME | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Tailles max | 5 MB pour images, 20 MB pour PDF (vérifié en service avant upload) |
| Sub-resources API Platform | `GET /api/missions/{id}/medias` et `GET /api/tutoriels/{id}/medias` — endpoints custom, pas du sub-resource auto |
| Front | Composant `<MediaUploader>` (drag&drop + preview) + `<MediaGallery>` (grid + lightbox) + 3 hooks. À utiliser dans `/postes` (édition mission) et `/tutoriels` côté manager. |
| Migration de l'existant | Aucune. Module neuf, données vides au départ. |

## Tâche

### Backend

1. **Dépendance** : `cd shiftly-api && composer require async-aws/s3`.
2. **Variables d'env** : ajoute dans `.env` (placeholders) et `.env.example` (`your-r2-...`) : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`. Aucune vraie valeur committée (règle 9).
3. **`R2StorageService`** : voir spec ligne "Décisions actées". Utilise `AsyncAws\S3\S3Client` instancié via DI dans `services.yaml` avec `endpoint`, `accessKeyId`, `accessKeySecret`, `region: auto`, `pathStyleEndpoint: true`. URL signée via `$client->presign($getObjectRequest, new \DateTimeImmutable("+{$ttl} seconds"))`.
4. **Entité `Media`** dans `shiftly-api/src/Entity/Media.php` :
   - Champs : voir "Décisions actées"
   - Enum PHP `MediaEntityType` (`mission`, `tutoriel`, `document`) — `string` backed
   - ApiResource avec `GetCollection` désactivé (jamais de listing global), `Get` activé pour le détail uniquement (avec voter), `Delete` activé (manager only)
   - Groups serialization : `media:read`, `media:write`
   - Génère la migration **sur MySQL local**. Vérifie portabilité PostgreSQL avant commit (règle 15). Aucun `__temp__` SQLite. Index composé `(entity_type, entity_id, centre_id)`.
5. **`MediaUploader`** dans `shiftly-api/src/Service/MediaUploader.php` :
   - `upload(UploadedFile $file, MediaEntityType $type, int $entityId, User $uploader): Media`
   - Valide MIME (whitelist) et taille (5 MB images / 20 MB PDF). `BadRequestHttpException` sinon.
   - Génère `key = "{centreId}/media/{entityType}/{uuid}.{ext}"`
   - Délègue à `R2StorageService::upload`
   - Persiste l'entité Media et flush
6. **`MediaController`** dans `shiftly-api/src/Controller/MediaController.php` :
   - `POST /api/media` (multipart/form-data : `file`, `entityType`, `entityId`) — manager only — délègue à `MediaUploader`
   - `GET /api/media/{id}/url` — renvoie `{ url: "...", expiresAt: "..." }` (URL signée 1h via `R2StorageService::presignedUrl`)
   - `GET /api/missions/{id}/medias` et `GET /api/tutoriels/{id}/medias` — listing filtré par entity, centre, voter
   - Toutes routes protégées par voter (point suivant)
7. **`MediaVoter`** dans `shiftly-api/src/Security/Voter/MediaVoter.php` :
   - Attributs : `MEDIA_VIEW`, `MEDIA_DELETE`, `MEDIA_UPLOAD`
   - Vérifie `$user->getCentre()?->getId() === $media->getCentre()->getId()`
   - Pour `MEDIA_UPLOAD` (action sur entité parente), vérifie aussi que la Mission/Tutoriel ciblée appartient au même centre
8. **Mettre à jour les docs** : `ARCHITECTURE.md` (section stockage + nouvelle entité), `ENTITES.md` (entrée Media), `schema.sql` (table `media`).

### Frontend (Phase 6)

9. **Type TS** dans `shiftly-app/src/types/media.ts` : `Media`, `MediaEntityType`, `MediaUploadResponse`. Strict, pas de `any`.
10. **Hooks** dans `shiftly-app/src/hooks/useMedias.ts` :
    - `useMedias(entityType, entityId)` — `useQuery` GET `/api/{entityType}s/{id}/medias`
    - `useUploadMedia()` — `useMutation` POST `/api/media` (FormData)
    - `useDeleteMedia()` — `useMutation` DELETE `/api/media/{id}`
    - Invalidation des queries concernées au succès. Toast erreur via le système existant.
11. **Composant `<MediaUploader>`** dans `shiftly-app/src/components/media/MediaUploader.tsx` :
    - Drag & drop + clic-pour-uploader, preview avant validation, accepte multi-fichier
    - Props : `entityType`, `entityId`, callback `onUploaded`
    - Mobile-first, max 150 lignes (règle 3)
    - 3 états : loading | error | empty (règle 6). Animations Framer Motion via `lib/animations.ts`.
12. **Composant `<MediaGallery>`** dans `shiftly-app/src/components/media/MediaGallery.tsx` :
    - Grid responsive (2 col mobile → 4 col desktop), pour chaque media : si image → vignette via URL signée, si PDF → icône + lien ouverture nouvel onglet
    - Bouton suppression (manager only, via `useDeleteMedia`)
    - 3 états : loading | error | empty
13. **`next.config.js`** : ajoute le domaine R2 dans `images.remotePatterns` (extrait depuis `R2_ENDPOINT` côté env public NEXT_PUBLIC, ou en dur dans la config si Kévin a un domaine custom plus tard).

## Ce qu'il ne fait PAS

- Ne touche **pas** à `FileUploadService` ni aux photos `Completion` (scope du R2_MIGRATION séparé).
- Ne touche **pas** à `SupportAttachment` (filesystem local, hors scope).
- Pas de génération automatique de miniatures côté serveur (Next.js `<Image>` s'en charge côté client).
- Pas de configuration de domaine custom Cloudflare ni de CORS bucket : note à Kévin si nécessaire.
- Pas de purge automatique : sera ajoutée plus tard si besoin.

## Notes techniques

- **AsyncAws + R2** : cf. notes du R2_MIGRATION — `region: 'auto'`, `pathStyleEndpoint: true` obligatoire.
- **Polymorphisme sans FK** : pas de `ON DELETE CASCADE` automatique. Quand une Mission ou un Tutoriel est supprimé, prévoir un EntityListener (PreRemove) qui delete les Media associés et leurs binaires R2 — à inclure dans ce chantier (`MissionMediaCleanupListener`, `TutorielMediaCleanupListener`, mêmes listeners que `CompletionPhotoCleanupListener` en modèle).
- **Multipart upload** : `MediaController::create` doit récupérer le fichier via `$request->files->get('file')` (pas via API Platform standard JSON).
- **Règle 15** : migration testée en MySQL local, PAS générée sur SQLite. `\App\Enum\MediaEntityType` doit mapper sur un `VARCHAR(20)` portable, pas un type `ENUM` MySQL natif.
- **CORS R2** : si l'affichage des images via URL signée échoue depuis le navigateur (rare avec un `<img>` simple, courant avec `fetch`), Kévin devra configurer une CORS policy permissive sur le bucket. Signaler dans la note finale, ne pas tenter depuis le code.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console debug:container R2StorageService
php bin/console debug:container MediaUploader
php bin/console debug:router | grep -i media
cd ../shiftly-app
npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Upload d'une image PNG 2 MB sur une Mission via `<MediaUploader>` (page `/postes` édition mission) → 201, ligne en BDD, fichier visible dans le bucket Cloudflare R2 dashboard sous `{centreId}/media/mission/...`
- [ ] `GET /api/missions/{id}/medias` retourne la liste filtrée correctement
- [ ] Vignette s'affiche via URL signée dans `<MediaGallery>`. URL valable 1h, refresh OK après expiration.
- [ ] Upload d'un PDF 25 MB → rejet avec 400 et message clair
- [ ] Upload d'un fichier `.exe` → rejet avec 400
- [ ] User d'un autre centre tente `GET /api/media/{id}/url` → 403 (voter intact)
- [ ] User d'un autre centre tente d'uploader sur une Mission qui n'est pas la sienne → 403
- [ ] Suppression d'un Media via UI → ligne BDD supprimée + fichier supprimé du bucket R2
- [ ] Suppression d'une Mission qui a 2 Media → les 2 Media et leurs binaires R2 sont nettoyés (listener)
- [ ] Tutoriel : même cycle complet upload/affichage/suppression
- [ ] `npm run build` passe sans warning

### Critères d'acceptation
- [ ] `R2StorageService` ne contient AUCUNE logique métier (réutilisable par R2_MIGRATION)
- [ ] Aucune valeur réelle de credentials R2 dans `.env.example` ni un commit (règle 9)
- [ ] Migration validée MySQL ET vérifiée portable PostgreSQL (règle 15)
- [ ] Voter MediaVoter testé sur les 3 attributs (VIEW, DELETE, UPLOAD)
- [ ] Aucun composant React > 150 lignes (règle 3) — découpe si dépassement
- [ ] Aucun `any` TS, aucun `useEffect` API, aucune couleur hardcodée (règles 1, 2, 5)
- [ ] `ARCHITECTURE.md`, `ENTITES.md`, `schema.sql` mis à jour
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Le `MediaVoter` couvre-t-il bien le cas "user manager mais centre différent" sur l'upload ?
- Le path R2 contient-il bien `{centreId}` en racine pour l'isolation tenant ?
- L'EntityListener supprime-t-il les binaires R2 AVANT le DELETE BDD (sinon orphelins) ?
- La migration utilise-t-elle un type `VARCHAR` portable et pas un `ENUM` MySQL spécifique ?
- Aucune fuite de credentials dans les logs ou messages d'erreur exposés au front ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques (modèle) :
   - `chore(api): add async-aws/s3 dep`
   - `feat(api): add generic R2StorageService`
   - `feat(api): add Media entity + migration`
   - `feat(api): add MediaUploader service + MediaController + voter`
   - `feat(api): cleanup media R2 binaries on parent entity remove`
   - `feat(app): add media types + hooks (useMedias, useUploadMedia, useDeleteMedia)`
   - `feat(app): add MediaUploader + MediaGallery components`
   - `feat(app): wire media on Mission edit + Tutoriel pages`
   - `docs: update architecture/entites/schema for Media module`
2. Rapport de vérification (cases cochées + preuves : screenshot dashboard R2, output `debug:container`, output `npm run build`).
3. Note à Kévin : (a) configurer la CORS policy R2 si vignettes cassées en prod, (b) ajouter les 5 variables `R2_*` dans Railway (bucket `shiftly-prod`), (c) le `R2StorageService` est prêt à être consommé par le futur PROMPT_CLAUDE_CODE_R2_MIGRATION.
4. Tu push pas. Kévin push.
