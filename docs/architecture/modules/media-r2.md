# Stockage objets — Cloudflare R2 & module Media

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md)

Tout le stockage de fichiers (images, PDF) passe par **Cloudflare R2** (S3-compatible). Plus aucun fichier n'est servi depuis le filesystem local — Railway = filesystem éphémère, et l'ancien système servait certains fichiers (SupportAttachment) sans contrôle d'accès.

Trois flows aujourd'hui sur R2 :
- **Module Media** (mission/tutoriel/document) — section ci-dessous
- **Photos Completion** (validation mission) — clé `completion/{YYYY}/{MM}/{uuid}.{ext}`, servies via 302 vers URL signée par `GET /api/completions/{id}/photo`
- **SupportAttachment** (pièces jointes ticket) — clé `support/{centreId}/{YYYY}/{MM}/{uuid}.{ext}`, ouvertes via `GET /api/support/attachments/{id}/url` (URL signée + voter `SUPPORT_ATTACHMENT_VIEW`)

`App\Service\R2StorageService` est le seul point d'entrée pour parler à R2 (`upload`, `presignedUrl`, `delete`). Trois uploaders métier au-dessus :
- `App\Service\MediaUploader` (module Media polymorphe)
- `App\Service\Upload\CompletionPhotoUploader` (validation mission)
- `App\Service\Upload\SupportAttachmentUploader` (tickets)

### Module Media — détails

Module générique pour attacher des images (JPEG/PNG/WebP) ou des PDF à n'importe quelle entité parente. Utilisé aujourd'hui par **Mission** et **Tutoriel**, conçu pour être étendu (HACCP, documents, etc.).

### Architecture

- **Stockage** : Cloudflare R2 (S3-compatible), buckets `shiftly-dev` et `shiftly-prod`. Bucket privé, lecture via URL signée TTL 1h.
- **Lib PHP** : `async-aws/s3` (région `auto`, `pathStyleEndpoint: true`).
- **Path R2** : `{centreId}/media/{entityType}/{uuid}.{ext}` — isolation tenant dans la clé.
- **Whitelist** : images max 5 MB, PDF max 20 MB. Tout autre MIME rejeté en 400.

### Backend (`shiftly-api/`)

| Élément | Fichier |
|---|---|
| Entité polymorphe | `src/Entity/Media.php` (champs : centre, entityType, entityId, filename, mimeType, sizeBytes, storagePath, uploadedBy, createdAt) |
| Enum | `src/Enum/MediaEntityType.php` (`mission` \| `tutoriel` \| `document`) |
| Repository | `src/Repository/MediaRepository.php` (`findByEntity` filtre centre, `findAllByEntity` pour les listeners) |
| Wrapper R2 (générique, sans logique métier) | `src/Service/R2StorageService.php` |
| Service métier upload | `src/Service/MediaUploader.php` |
| Controller | `src/Controller/MediaController.php` |
| Voter multi-tenant (`MEDIA_VIEW`, `MEDIA_DELETE`, `MEDIA_UPLOAD`) | `src/Security/Voter/MediaVoter.php` |
| Cleanup binaire R2 sur `Media::preRemove` | `src/EventListener/MediaR2CleanupListener.php` |
| Cleanup en cascade quand Mission/Tutoriel est supprimé | `src/EventListener/MissionMediaCleanupListener.php` + `TutorielMediaCleanupListener.php` |
| Migration | `migrations/Version20260507120000.php` (table `media`, portable MySQL/PostgreSQL/SQLite) |

### Endpoints API

```
POST   /api/media                         multipart : file, entityType, entityId       (manager)
GET    /api/media/{id}/url                renvoie { url, expiresAt } (signée 1h)        (voter VIEW)
DELETE /api/media/{id}                    supprime ligne BDD + binaire R2               (manager + voter DELETE)
GET    /api/missions/{id}/medias          liste les médias d'une mission                (auth user)
GET    /api/tutoriels/{id}/medias         liste les médias d'un tutoriel                (auth user)
```

### Frontend (`shiftly-app/`)

| Élément | Fichier |
|---|---|
| Types | `src/types/media.ts` (`Media`, `MediaEntityType`, `MediaUrlResponse`, `MediaUploadResponse`) |
| Hooks React Query | `src/hooks/useMedias.ts` (`useMedias`, `useMediaUrl`, `useUploadMedia`, `useDeleteMedia`) |
| Composants | `src/components/media/MediaUploader.tsx` (drag&drop), `MediaGallery.tsx` (grid responsive), `MediaThumb.tsx` (vignette + delete), `MediaLightbox.tsx` (image plein écran) |
| Wiring actuel | `ModalAddMission.tsx` et `ModalAddTutoriel.tsx` (section "Médias" en mode édition uniquement) |

### Multi-tenancy

- `MediaVoter` vérifie systématiquement `user.centre === media.centre`.
- Pour `MEDIA_UPLOAD` (la ligne Media n'existe pas encore), le voter remonte sur l'entité parente (Mission via `Zone.centre`, Tutoriel via `Tutoriel.centre`) pour vérifier l'appartenance.
- Le path R2 lui-même contient `{centreId}` en racine — défense en profondeur.

### Variables d'environnement (cf. [`stack.md`](../stack.md))

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`. À configurer aussi dans Railway pour la prod (bucket `shiftly-prod`).

### Limitations connues

- Pas de génération côté serveur de miniatures (Next.js `<Image>` peut s'en charger côté client si besoin).
- CORS du bucket à configurer côté Cloudflare si `<img>` cross-origin pose souci en prod.

### Rétention

- **Photos Completion** : 90 jours via `app:purge-old-completion-photos` (à planifier en cron Railway, quotidien 03:00 UTC). Idempotente, batch 50.
- **Module Media** + **SupportAttachment** : pas de purge automatique aujourd'hui — à ajouter si le volume devient significatif.
