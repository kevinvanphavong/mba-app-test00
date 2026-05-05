# Fix — Photos de preuve orphelines sur disque

> Quand une `Completion` avec `photoPath` est supprimée (décochage d'une mission `requiresPhoto`), la ligne BDD part mais le fichier physique reste dans `public/uploads/completion/...`. À chaque cycle décocher → recocher, les anciennes photos s'accumulent indéfiniment.

## Contexte

Bug confirmé en lecture du code (mai 2026) :
- `MissionItem.tsx:48-55` : un clic sur une mission photo **déjà cochée** déclenche `onToggle` (DELETE), pas la modale photo. Donc le décochage est facile à atteindre par accident.
- `Completion.php` : aucun lifecycle callback n'efface le fichier physique au remove.
- `CompletionListener.php` (PostRemove) : recalcule juste `taux_completion`, ne touche pas au filesystem.
- `FileUploadService.php` : pas de méthode `deleteCompletionPhoto`, juste `getCompletionPhotoAbsolutePath`.

Conséquences : stockage qui gonfle silencieusement (50–100 missions photo/jour × 12 centres) + photos « supprimées » côté user qui restent indéfiniment sur disque (risque RGPD léger).

## Fichiers à lire avant de coder

- `shiftly-api/src/Entity/Completion.php` — entité concernée, voir `photoPath` et `photoMimeType`
- `shiftly-api/src/Service/FileUploadService.php` — y ajouter la méthode de suppression
- `shiftly-api/src/EventListener/CompletionListener.php` — modèle d'EntityListener Doctrine déjà en place
- `shiftly-api/src/Controller/CompletionController.php` — endpoint qui crée les photos (pour valider la cohérence)
- `shiftly-api/src/Command/CleanupOrphanPointagesCommand.php` — modèle exact à reproduire pour la commande de cleanup

## Tâche

1. Ajouter dans `FileUploadService.php` une méthode `deleteCompletionPhoto(string $relativePath): bool` qui supprime le fichier physique si présent (silencieux si absent, log warning si échec). Réutilise `getCompletionPhotoAbsolutePath` pour résoudre le chemin.
2. Créer `shiftly-api/src/EventListener/CompletionPhotoCleanupListener.php` :
   - Décoré avec `#[AsEntityListener(event: Events::preRemove, entity: Completion::class, method: 'preRemove')]`
   - Injecte `FileUploadService`
   - Si `$completion->getPhotoPath() !== null`, appelle `deleteCompletionPhoto`
   - **PreRemove** (pas PostRemove) : on a encore l'entité hydratée et on évite que le fichier reste si le flush échoue après
3. Créer `shiftly-api/src/Command/CleanupOrphanCompletionPhotosCommand.php` (nom : `completion:cleanup-orphan-photos`) sur le modèle exact de `CleanupOrphanPointagesCommand` :
   - Scanne récursivement `public/uploads/completion/**/*` et liste tous les fichiers présents sur disque
   - Récupère tous les `photoPath` non-null en BDD via DQL
   - Diff les deux ensembles → fichiers présents sur disque mais absents en BDD = orphelins
   - Option `--apply` (sans : dry-run, avec : `unlink` chaque fichier)
   - Affiche le compte + la taille totale libérée
4. Mettre à jour `ARCHITECTURE.md` : section "Listeners Doctrine" + section "Commandes Symfony" pour ajouter les deux nouveautés.

## Notes techniques

- Le `preRemove` Doctrine reçoit l'entité avant le DELETE SQL. Si tu veux un fallback, tu peux aussi écouter `postRemove` mais c'est inutile ici si `preRemove` réussit.
- Pour le scan de `public/uploads/completion/**`, utilise `Symfony\Component\Finder\Finder` (déjà disponible dans Symfony FrameworkBundle) plutôt que glob récursif manuel.
- Pour la requête BDD des `photoPath` actifs : `SELECT c.photoPath FROM App\Entity\Completion c WHERE c.photoPath IS NOT NULL`. Charge en mémoire dans un `Set` PHP (`array_flip`) pour O(1) lookup.
- **Règle 15 du CLAUDE.md** : aucune migration BDD n'est nécessaire ici (pas de schéma touché). Si tu modifies l'entité, vérifie que `doctrine:schema:validate` reste vert.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console debug:event-dispatcher | grep -i completion
```

### Tests fonctionnels
- [ ] Créer une mission `requiresPhoto = true`, la cocher avec photo via l'UI, vérifier le fichier dans `public/uploads/completion/2026/05/<hash>.jpg`
- [ ] Décocher la mission via l'UI (clic sur la case verte) → la ligne `completion` disparaît de la BDD ET le fichier disparaît du disque
- [ ] Recocher avec une nouvelle photo → un seul fichier en BDD, un seul fichier sur disque
- [ ] Créer manuellement un fichier orphelin dans `public/uploads/completion/2026/05/orphan_test.jpg`, lancer `php bin/console completion:cleanup-orphan-photos` (dry-run) → il est listé
- [ ] Relancer avec `--apply` → fichier supprimé, message `1 photo(s) supprimée(s)`, dossier `public/uploads/completion/2026/05/` toujours présent (on ne purge que les fichiers, pas les dossiers)

### Critères d'acceptation
- [ ] `FileUploadService::deleteCompletionPhoto` existe et gère le cas fichier absent sans throw
- [ ] `CompletionPhotoCleanupListener` est bien chargé (visible dans `debug:event-dispatcher`)
- [ ] La commande `completion:cleanup-orphan-photos` existe et a un dry-run par défaut comme le modèle Pointage
- [ ] `ARCHITECTURE.md` mis à jour
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (pas de migration BDD, commentaires en français, pas de logique métier dans le controller)
- [ ] `npm run build` non requis ici (chantier 100 % backend)

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Le listener n'efface-t-il que la photo cible et pas l'ensemble du dossier ?
- La commande gère-t-elle le cas où `public/uploads/completion/` n'existe pas encore (dossier vide → 0 orphelin, pas de crash) ?
- Le `unlink` côté commande loggue-t-il les erreurs (permissions) sans interrompre la boucle ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. 3 commits atomiques :
   - `feat(api): add deleteCompletionPhoto to FileUploadService`
   - `feat(api): auto-delete completion photo file on entity remove`
   - `feat(api): add completion:cleanup-orphan-photos command`
2. Rapport de vérification (cases cochées + sortie de la commande dry-run sur ta BDD locale)
3. Note : à exécuter en prod **une seule fois en `--apply`** après déploiement pour rattraper les fichiers déjà orphelins (incident depuis l'introduction des missions photo).
4. Tu push pas. Kévin push.
