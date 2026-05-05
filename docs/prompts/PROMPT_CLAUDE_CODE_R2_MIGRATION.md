# Prompt Claude Code — Migration des photos de preuve vers Cloudflare R2

> **Objectif** : déporter le stockage des photos de validation de mission depuis le filesystem local de Symfony vers Cloudflare R2 (S3-compatible), avec URL signée pour servir les fichiers et purge automatique > 90 jours.

## Contexte

Aujourd'hui les photos de `Completion` sont stockées dans `shiftly-api/public/uploads/completion/{YYYY}/{MM}/{uuid}.{ext}` et servies via `BinaryFileResponse` dans `CompletionController::servePhoto`. Sur Railway, le filesystem est éphémère (perdu à chaque redeploy) et non scalable horizontalement. On bascule vers Cloudflare R2 : stockage durable, URL signée temporaire, bande passante sortante gratuite.

Le périmètre est volontairement restreint aux **photos de Completion uniquement** — les `SupportAttachment` continuent en filesystem local pour l'instant.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment 9, 14, 15)
- `shiftly-api/composer.json` — pour ajouter la dépendance AsyncAws
- `shiftly-api/src/Service/FileUploadService.php` — la méthode `uploadCompletionPhoto` à refactorer
- `shiftly-api/src/Controller/CompletionController.php` — `createWithPhoto` + `servePhoto` à adapter
- `shiftly-api/src/Entity/Completion.php` — pour info, **aucune modif d'entité** à prévoir
- `shiftly-api/.env` et `shiftly-api/.env.example` — pour les variables R2

## Décisions actées (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Provider | Cloudflare R2 (compatible S3, region `auto`) |
| Bibliothèque PHP | `async-aws/s3` (plus léger que `aws/aws-sdk-php`, recommandé Symfony Flex) |
| Mode service photo | `GET /api/completions/{id}/photo` continue d'exister mais renvoie un **302 redirect vers une URL R2 signée** (TTL 1h). Le contrat front est inchangé, `AuthImage` n'est PAS modifié. |
| Champ `photoPath` (Completion) | Conservé tel quel, contient désormais la **clé R2** (ex : `completion/2026/05/abc123.jpg`). Pas de migration BDD nécessaire. |
| Dev local | Mêmes variables R2. Crée un bucket `shiftly-completion-photos-dev` distinct si besoin. **Pas de fallback filesystem** — on simplifie. |
| Migration de l'existant | **On repart à zéro.** Les anciennes photos sur Railway ne sont pas migrées. |
| Rétention | 90 jours, purgée par commande Symfony nocturne. |

## Tâche

1. **Ajouter la dépendance** : `composer require async-aws/s3` dans `shiftly-api/`.
2. **Variables d'env** : ajouter dans `.env` (placeholders) et `.env.example` :
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`
   - Ne JAMAIS commiter de vraie valeur. `.env.example` avec `your-r2-...` uniquement.
3. **Service `R2StorageService`** dans `shiftly-api/src/Service/R2StorageService.php` :
   - Constructeur reçoit les 5 valeurs via paramètres `%env(...)%` (config dans `services.yaml`).
   - Méthodes : `upload(UploadedFile $file, string $key): void`, `presignedUrl(string $key, int $ttlSeconds = 3600): string`, `delete(string $key): void`.
   - Le client AsyncAws est instancié avec `endpoint`, `accessKeyId`, `accessKeySecret`, `region: 'auto'`, `pathStyleEndpoint: true`.
4. **Refactor `FileUploadService::uploadCompletionPhoto`** :
   - Génère une `key` R2 du type `completion/{YYYY}/{MM}/{uuid}.{ext}` (même schéma qu'avant mais sans préfixe `uploads/`).
   - Délègue l'upload à `R2StorageService::upload()` au lieu de `$file->move()`.
   - Retourne `['storedPath' => $key, 'mime' => $mime]` — signature inchangée.
   - Supprime tout le code `mkdir` / `move` local.
5. **Refactor `CompletionController::servePhoto`** :
   - Conserve auth + voter multi-tenant (lignes 138-144).
   - Remplace le `BinaryFileResponse` par un `RedirectResponse($r2Service->presignedUrl($completion->getPhotoPath()), 302)`.
   - Supprime l'appel à `getCompletionPhotoAbsolutePath` (devenu inutile, à retirer du `FileUploadService`).
6. **Catch large dans `createWithPhoto`** : ajouter un `catch (\Throwable $e)` après l'`InvalidArgumentException` qui log l'erreur et renvoie un `BadRequestHttpException` avec un detail générique. Ça évite les 500 bruts en cas d'échec R2.
7. **Commande de purge** : `php bin/console app:purge-old-completion-photos` dans `shiftly-api/src/Command/PurgeOldCompletionPhotosCommand.php` :
   - Liste toutes les `Completion` avec `photoPath != null` ET `photoTakenAt < now() - 90 days`.
   - Pour chaque : `R2StorageService::delete($completion->getPhotoPath())` puis `setPhotoPath(null)` + `setPhotoMimeType(null)` + `setPhotoTakenAt(null)`.
   - Flush par batch de 50.
   - Output : nombre supprimé.
   - Idempotent (peut être relancée sans risque).
8. **Documentation Railway** : dans le commit final, note dans le message un rappel : « Configurer le cron Railway sur `php bin/console app:purge-old-completion-photos --no-interaction` (quotidien 03:00 UTC) ». Ne pas tenter de configurer Railway depuis le code.
9. **Mettre à jour les docs** : `docs/ARCHITECTURE.md` (section stockage) + `CLAUDE.md` si pertinent (nouvelle dépendance, variables d'env).

## Notes techniques

- AsyncAws + R2 : le `region` doit être `auto`, le `endpoint` doit être l'URL complète (`https://<account>.r2.cloudflarestorage.com`), `pathStyleEndpoint: true` obligatoire sinon les buckets ne sont pas trouvés.
- L'URL signée AsyncAws s'obtient via `$s3Client->presign($command, $expiresAt)` où `$command` est un `GetObjectRequest`.
- Côté front, le `RedirectResponse(302)` est suivi automatiquement par `AuthImage` (qui utilise fetch + blob URL). Si tu rencontres un souci CORS sur le suivi du redirect, il faudra configurer le bucket R2 avec une CORS policy permissive sur le domaine de prod — **à signaler à Kévin, ne pas tenter de configurer R2 depuis le code**.
- Pas de migration BDD nécessaire. Aucun `make:migration` dans ce chantier.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console debug:container R2StorageService
php bin/console list app                     # vérifier que app:purge-old-completion-photos apparaît
```

### Tests fonctionnels
- [ ] Upload d'une photo via le modal `/service` → la mission se valide, aucun fichier n'apparaît dans `shiftly-api/public/uploads/completion/`.
- [ ] La photo est bien présente côté Cloudflare R2 (vérification via dashboard ou `aws s3 ls` avec endpoint R2).
- [ ] La vignette dans `MissionItem` se charge correctement (le `GET /api/completions/{id}/photo` redirect vers R2 et l'image s'affiche).
- [ ] La lightbox `PhotoLightbox` ouvre la photo en grand sans erreur console.
- [ ] Un user d'un autre centre reçoit toujours un 403 sur `GET /api/completions/{id}/photo` (multi-tenant guard intact).
- [ ] `php bin/console app:purge-old-completion-photos --dry-run` (si tu ajoutes l'option) ou exécution réelle sur une `Completion` truquée à `photoTakenAt = now - 100 days` → la photo disparaît de R2 et `photoPath` est mis à NULL.

### Critères d'acceptation
- [ ] Aucun `mkdir`/`move` filesystem n'est plus présent dans `FileUploadService::uploadCompletionPhoto`
- [ ] Aucune valeur réelle de credentials R2 dans `.env.example` ni dans aucun commit (règle 9)
- [ ] La méthode `getCompletionPhotoAbsolutePath` est supprimée si plus utilisée nulle part
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] `npm run build` (front, inchangé en théorie) + `doctrine:schema:validate` passent

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : credentials qui auraient fuité ? Régression sur le multi-tenant guard ? Le `RedirectResponse` casse-t-il le caching côté browser (Cache-Control header conservé) ? La commande de purge supprime-t-elle bien le binaire R2 AVANT de nuller le path en BDD (sinon orphan files) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques : `chore(api): add async-aws/s3 dep`, `feat(api): add R2StorageService`, `refactor(api): upload completion photos to R2`, `refactor(api): serve completion photos via R2 presigned URL`, `feat(api): add purge-old-completion-photos command`, `docs: update architecture for R2 storage`.
2. Rapport de vérification (cases cochées + preuves : output du upload, screenshot du dashboard R2, output de la commande de purge).
3. Note à Kévin : configurer le cron Railway sur la commande de purge + vérifier la CORS policy R2 si vignettes cassées en prod.
4. Tu push pas. Kévin push.
