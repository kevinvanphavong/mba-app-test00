# Migration complète filesystem → Cloudflare R2

> Bascule définitive de tous les uploads (photos Completion + SupportAttachment) sur R2, puis suppression de tout le système d'upload local.

## Contexte

Aujourd'hui `FileUploadService` stocke les fichiers dans `shiftly-api/public/uploads/` :
- **Photos Completion** : servies via endpoint authentifié `/api/completions/{id}/photo` (acceptable côté sécu, mais Railway = filesystem éphémère).
- **SupportAttachment** : URL brute `/uploads/support/...` retournée au front, **servie en statique sans voter** (faille sécu).

Le `R2StorageService` est déjà en place (utilisé par le module Media) — on l'étend aux deux flows restants puis on supprime l'héritage local. Trois étapes, trois commits atomiques, chacun livrable indépendamment.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment 9, 14, 15)
- `shiftly-api/src/Service/R2StorageService.php` — wrapper R2 générique (à réutiliser tel quel)
- `shiftly-api/src/Service/FileUploadService.php` — méthodes à refactorer puis supprimer
- `shiftly-api/src/Controller/CompletionController.php` — `createWithPhoto` + `servePhoto`
- `shiftly-api/src/Controller/SupportController.php` + `SuperAdminSupportController.php` — flow attachments
- `shiftly-api/src/Security/Voter/MediaVoter.php` — modèle de voter à reproduire
- `shiftly-api/src/EventListener/MediaR2CleanupListener.php` — modèle preRemove R2

## Décisions actées (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Photo Completion — contrat front | `GET /api/completions/{id}/photo` renvoie un `RedirectResponse(302)` vers une URL signée R2 (TTL 1h). `<AuthImage>` côté front INCHANGÉ. |
| SupportAttachment — contrat front | Nouveau endpoint `GET /api/support/attachments/{id}/url` → `{ url, expiresAt }`. Le composant front fait un `useQuery` sur ce endpoint avant d'afficher. |
| Champs BDD | `Completion.photoPath` et `SupportAttachment.storedPath` conservés tels quels — ils stockent désormais la **clé R2** (pas de migration BDD). |
| Path R2 | `completion/{YYYY}/{MM}/{uuid}.{ext}` et `support/{centreId}/{ticketId}/{uuid}.{ext}` |
| Migration de l'existant | On repart à zéro. Anciennes photos sur Railway non migrées. |
| Rétention Completion | 90 jours via commande `app:purge-old-completion-photos` (idempotente, batch 50) |

## Tâche

### Étape 1 — Photos Completion sur R2

1. `FileUploadService::uploadCompletionPhoto` : remplace `mkdir` + `$file->move()` par `R2StorageService::upload($key, $file, $mime)`. Signature retournée inchangée.
2. `CompletionController::servePhoto` : remplace `BinaryFileResponse` par `new RedirectResponse($r2->presignedUrl($completion->getPhotoPath()), 302)`. Conserve auth + voter intacts (lignes existantes).
3. `CompletionPhotoCleanupListener` : appelle `R2StorageService::delete()` à la place de `FileUploadService::deleteCompletionPhoto`.
4. Ajoute `Command/PurgeOldCompletionPhotosCommand.php` (`app:purge-old-completion-photos`) : delete binaires R2 + null `photoPath` / `photoMimeType` / `photoTakenAt` pour `Completion` avec `photoTakenAt < now() - 90 days`. Toujours binaire R2 AVANT BDD.

→ Commit : `refactor(api): completion photos served via R2`

### Étape 2 — SupportAttachment sur R2 + voter

1. `FileUploadService::uploadSupportAttachment` : remplace stockage local par `R2StorageService::upload`. Clé = `support/{centreId}/{ticketId}/{uuid}.{ext}` (centre dérivé du ticket parent).
2. Crée `Security/Voter/SupportAttachmentVoter.php` (attribut `SUPPORT_ATTACHMENT_VIEW`) : autorise si user est l'auteur du ticket parent OU manager du même centre OU super-admin (`ROLE_SUPER_ADMIN`).
3. Crée endpoint `GET /api/support/attachments/{id}/url` (route dédiée dans `SupportController` ou nouveau controller) → renvoie `{ url, expiresAt }` via `R2StorageService::presignedUrl($a->getStoredPath(), 3600)`. Voter requis.
4. Modifie le serializer / controllers Support : ne plus retourner `'url' => '/' . $a->getStoredPath()`. Retourner uniquement `'id' => $a->getId()` (et le filename/mime). Le front appellera `/url` à la demande.
5. Front : adapte les hooks (`useSupport.ts` et équivalents superadmin) + composants qui affichent les attachments. `<a href={data.url} target="_blank">` après le `useQuery` sur `/url`.
6. Crée `EventListener/SupportAttachmentR2CleanupListener.php` (preRemove) sur le modèle `MediaR2CleanupListener` — supprime le binaire R2 avant le DELETE BDD.

→ Commit : `refactor(api): support attachments served via signed R2 URL`

### Étape 3 — Cleanup final

1. `grep -r "FileUploadService" shiftly-api/src/` → 0 résultat avant suppression. Si non, finis le refactor.
2. Supprime `src/Service/FileUploadService.php`.
3. Supprime `src/Command/CleanupOrphanCompletionPhotosCommand.php` (devenu inutile).
4. Supprime le dossier `shiftly-api/public/uploads/` (`git rm -r`). Ajoute au `.gitignore` si Symfony le recrée vide au boot.
5. Mets à jour `ARCHITECTURE.md` : section stockage ne mentionne plus que R2 (Module Media + Completion + Support).
6. Mets à jour `docs/modules/ENTITES.md` si la section `SupportAttachment` mentionnait encore `/uploads/`.

→ Commit : `chore(api): remove legacy filesystem upload system`

## Ce qu'il ne fait PAS

- Pas de migration des fichiers existants (on repart à zéro — confirmé)
- Pas de migration BDD : aucun `make:migration`, aucun changement de schéma
- Pas de configuration Railway / Cloudflare (CORS bucket, cron purge) — note à Kévin si nécessaire
- Ne touche pas au module Media (mission/tutoriel) — déjà sur R2

## Notes techniques

- **Voter SupportAttachment** : 3 cas (owner ticket / manager centre / super-admin). Vérifie comment `ROLE_SUPER_ADMIN` est résolu (`User::getRoles()` ou JWT claim).
- **Anti-régression front Completion** : `<AuthImage>` fait un fetch + blob. Le `RedirectResponse(302)` est suivi automatiquement, sauf si CORS bloque — Kévin configurera la policy R2 si nécessaire.
- **Front Support** : aujourd'hui les attachments s'ouvrent sur `/uploads/support/xxx`. Après refactor, plus jamais d'URL `/uploads/` exposée côté front. Vérifier qu'aucun composant ne reconstruit une URL relative à la main.
- **Logs/Sentry** : ne JAMAIS logger l'URL signée brute (contient signature S3). Logger uniquement la clé R2.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console debug:container R2StorageService
php bin/console debug:router | grep -iE "completion|support"
php bin/console list app                       # cherche app:purge-old-completion-photos après étape 1
cd ../shiftly-app
npm run build
```

### Tests fonctionnels
- [ ] Étape 1 : upload photo via `/service` → mission validée, fichier visible dans dashboard R2 sous `completion/YYYY/MM/...`, vignette `<MissionItem>` s'affiche
- [ ] Étape 1 : `<PhotoLightbox>` ouvre la photo en grand sans erreur console
- [ ] Étape 1 : user d'un autre centre → `GET /api/completions/{id}/photo` renvoie 403
- [ ] Étape 1 : `app:purge-old-completion-photos` sur une Completion truquée à `photoTakenAt = now-100d` → photo disparaît de R2 et `photoPath` est NULL
- [ ] Étape 2 : upload attachment dans un ticket → fichier dans R2 sous `support/{centreId}/{ticketId}/...`
- [ ] Étape 2 : ouverture attachment via UI → `useQuery /url` fetch OK puis fichier ouvert dans nouvel onglet
- [ ] Étape 2 : user qui n'est ni owner ni manager → `GET /api/support/attachments/{id}/url` renvoie 403
- [ ] Étape 2 : `curl -I https://<dev>/uploads/support/...` → 404 (plus servi en statique)
- [ ] Étape 3 : `grep -r "FileUploadService" shiftly-api/src/` → 0 résultat
- [ ] Étape 3 : `ls shiftly-api/public/uploads/` → dossier inexistant
- [ ] Build front et back passent à chaque étape (pas seulement à la fin)

### Critères d'acceptation
- [ ] Aucune valeur réelle de credentials R2 dans `.env.example` ni dans aucun commit (règle 9)
- [ ] Photo Completion : aucun `mkdir`/`move` filesystem dans aucun service
- [ ] SupportAttachment : aucune URL `/uploads/...` retournée par l'API (search dans `Controller/`, `Entity/`, normalizers)
- [ ] `SupportAttachmentVoter` couvre owner + manager + super-admin
- [ ] Listeners preRemove (`CompletionPhotoCleanupListener`, `SupportAttachmentR2CleanupListener`) suppriment binaire R2 AVANT le DELETE BDD
- [ ] `ARCHITECTURE.md` ne mentionne plus de stockage local
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Le voter SupportAttachment couvre-t-il bien le cas "user manager mais centre différent" ?
- L'URL signée s'expire-t-elle correctement (TTL 1h) ?
- La signature S3 fuit-elle dans des logs / Sentry / messages d'erreur exposés au front ?
- Le `CompletionPhotoCleanupListener` supprime-t-il bien le binaire R2 AVANT que la ligne BDD parte ?
- Reste-t-il une référence à `FileUploadService` après l'étape 3 (services.yaml, fixtures, tests) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Trois commits atomiques (un par étape, livrables indépendamment) :
   - `refactor(api): completion photos served via R2`
   - `refactor(api): support attachments served via signed R2 URL`
   - `chore(api): remove legacy filesystem upload system`
2. Rapport de vérification (cases cochées + preuves : screenshot dashboard R2 sous `completion/` et `support/`, output `grep -r FileUploadService`, output `debug:router`).
3. Note à Kévin : (a) configurer CORS bucket R2 si vignettes Completion cassées en prod, (b) ajouter cron Railway sur `app:purge-old-completion-photos` (quotidien 03:00 UTC), (c) supprimer manuellement les fichiers résiduels `public/uploads/*` sur Railway après stabilisation.
4. Tu push pas. Kévin push.
