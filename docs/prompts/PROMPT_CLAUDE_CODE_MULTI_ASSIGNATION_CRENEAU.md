# Multi-assignation : autoriser plusieurs créneaux d'une même personne dans une même zone

> Permettre d'assigner la même personne plusieurs fois à la même zone d'un service,
> à condition que les **horaires diffèrent** (créneau coupé : Bar 11h-14h puis 18h-22h).

## Contexte
Aujourd'hui `Poste` porte `UNIQUE(service_id, zone_id, user_id)` → un 2ᵉ poste du même
user dans la même zone est rejeté en 409, même avec un horaire différent. On veut le
créneau coupé, **sans** autoriser les doublons exacts (même user, même zone, même heure).
Décision actée : la contrainte devient `UNIQUE(service_id, zone_id, user_id, heure_debut)`.
On ne supprime pas la contrainte (ça laisserait passer les vrais doublons).

## Fichiers à lire avant de coder
- `shiftly-api/src/Entity/Poste.php` (~l.28) — la contrainte `uniq_poste` à modifier
- `shiftly-api/src/Controller/CreatePosteController.php` (~l.100-123) — catch 409, message
- `shiftly-app/src/components/services/ModalAssignerPoste.tsx` (~l.44-46, 157-174) — filtre `assignedUserIds` qui désactive un user déjà dans la zone
- `shiftly-app/src/components/planning/ShiftModal.tsx` (~l.104-150) — submit + gestion 409
- `shiftly-app/src/hooks/usePlanning.ts` (~l.174-195) — `useCopyShift`
- `CLAUDE.md` — règles 13/15 (migration testée Postgres)

## Tâche
1. **Entité** : `Poste.php` — remplacer la contrainte par
   `#[ORM\UniqueConstraint(name: 'uniq_poste', columns: ['service_id', 'zone_id', 'user_id', 'heure_debut'])]`.
2. **`heure_debut` doit être NON NULL** pour que la contrainte ait du sens (en Postgres,
   plusieurs NULL restent distincts → faille). Vérifie le mapping : si `heureDebut` est
   nullable, rends-le requis (entité + validation + front) ; s'il est déjà requis, RAS.
3. **Migration** Doctrine (générée + testée sur Postgres, règle 13) : DROP de l'ancien
   index `uniq_poste`, CREATE du nouveau. Si des données existantes violent le nouvel
   index, c'est qu'il y a déjà des doublons exacts → les logguer, pas les écraser.
4. **`CreatePosteController`** : garder le catch `UniqueConstraintViolationException` (il
   ne se déclenche plus que sur doublon exact même horaire). Message → 
   « Déjà assigné à cette zone sur ce créneau. »
5. **`ModalAssignerPoste.tsx`** (Service du jour) : ne plus désactiver en dur un user déjà
   présent dans la zone. Soit retirer le filtre `assignedUserIds`, soit le conditionner à
   l'horaire — l'objectif : pouvoir ré-ajouter la personne sur un autre créneau. S'assurer
   que ce flux envoie bien `heureDebut`/`heureFin` (sinon la contrainte est inopérante).
6. **`ShiftModal.tsx` / `usePlanning.ts` / `PlanningGrid.tsx`** : la grille hebdo gère déjà
   N shifts ; vérifier que le message 409 reflète « même créneau » et non « déjà assigné ».

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php php bin/console doctrine:migrations:migrate -n
docker compose exec php php bin/console doctrine:schema:validate
docker compose exec php vendor/bin/phpunit && vendor/bin/phpstan analyse
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Assigner Jean à Bar 11h-14h puis Bar 18h-22h (même service) → **les deux passent**, 2 blocs affichés
- [ ] Réassigner Jean à Bar 11h-14h (horaire identique) → **409**, message « ce créneau »
- [ ] Jean sur Accueil + Bar le même jour → toujours OK (non-régression)
- [ ] Migration rejouée sur Postgres vierge sans erreur ; `schema:validate` OK
- [ ] Aucune règle `CLAUDE.md` enfreinte ; `git diff main..HEAD` relu en hostile

## Livraison
1. Commits atomiques (`feat(planning): créneaux multiples même zone`, `fix(migration): uniq_poste + heure_debut`)
2. Rapport : cases cochées + note si des doublons exacts préexistants ont été détectés
3. Tu push pas. Kévin push.
