# Palier 4 — Validation serveur systématique

> Plus aucune écriture API sans contrainte côté serveur : 23 entités sans validation
> et des endpoints custom qui consomment du JSON brut.

## Contexte
Seules 11/34 entités portent des contraintes Symfony Validator. Les controllers custom
(Editeur, Pointage, Planning…) décodent le JSON sans validation structurée — le front
(Zod) est aujourd'hui la seule barrière, donc il n'y en a pas. Prérequis : paliers 0-3.

## Fichiers à lire avant de coder
- `shiftly-api/src/Entity/User.php` — référence du style de contraintes existant
- `shiftly-api/src/Entity/` — les 23 entités nues (Absence, Pointage, Poste, Completion, Lead, Media…)
- `shiftly-api/src/Controller/EditeurController.php` — pire cas de JSON brut (~656 LOC)
- `shiftly-api/src/Controller/PointageController.php` + `PlanningTemplateController.php`
- `shiftly-app/src/` (schémas Zod des formulaires clés) — symétrie front/back

## Tâche
1. Contraintes sur les 23 entités nues : `NotBlank`/`Length`/`Range`/`Choice`/
   `GreaterThan` selon le sens métier (lis l'usage réel dans les controllers et le
   front avant de choisir — pas de contraintes décoratives).
2. Endpoints custom les plus exposés (Editeur, Pointage, Planning) : DTO de requête
   + `#[MapRequestPayload]` (ou validation explicite du payload) → erreurs 422
   normalisées, plus de `$data['champ'] ?? null` en cascade.
3. Vérifier la **symétrie Zod ↔ Validator** sur les formulaires clés (création mission,
   pointage, absence) : mêmes bornes, mêmes champs requis. Corriger le côté qui ment.
4. Tests : pour chaque endpoint touché, 1 cas nominal + 2 cas invalides → 422 avec
   le champ fautif dans la réponse.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php vendor/bin/phpunit && vendor/bin/phpstan analyse
docker compose exec php php bin/console doctrine:schema:validate
cd shiftly-app && npm run lint && npm run build
```

- [ ] Zéro entité exposée en écriture sans contrainte (inventaire en tête de rapport)
- [ ] Payload invalide sur Editeur/Pointage/Planning → 422 structuré (testé)
- [ ] Cas nominaux inchangés : fixtures rechargées + parcours manuel (créer mission,
  pointer, poser une absence) OK
- [ ] Symétrie Zod/Validator vérifiée sur les 3 formulaires clés
- [ ] CI verte

## Livraison
1. Commits atomiques (`feat(validation): entité X …`, `refactor(api): DTO editeur …`)
2. Rapport : inventaire entités→contraintes + liste des asymétries Zod corrigées
3. Tu push pas. Kévin push.
