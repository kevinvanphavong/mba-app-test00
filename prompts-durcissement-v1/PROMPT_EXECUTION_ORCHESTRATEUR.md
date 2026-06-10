# Orchestrateur — Exécuter le durcissement V1, palier par palier

> Tu pilotes l'exécution **séquentielle** des paliers 0→4 du plan
> `PLAN_DURCISSEMENT_V1.md`. Un palier ne démarre que si le précédent est
> **vert, committé et rapporté**.

## Pourquoi séquentiel et pas parallèle (décision actée)
Les paliers partagent les mêmes fichiers (`security.yaml`, `composer.json`, entités,
`ci.yml`) et le palier 0 change la BDD sous tous les autres. Des worktrees parallèles
garantiraient des conflits et des tests menteurs. **Tu n'essaies pas de paralléliser
les paliers.** À l'intérieur d'un palier, tu peux paralléliser ce qui est indépendant
(ex : voters par entité), c'est tout.

## Fichiers à lire avant de commencer
- `CLAUDE.md` — règles absolues (toujours valables)
- `PLAN_DURCISSEMENT_V1.md` — le plan, fait foi sur le layout (v2 gelée, code = racine)
- `prompts-durcissement-v1/PROMPT_CLAUDE_CODE_V1_PALIER<0..4>_*.md` — un par palier

## Boucle d'exécution (pour chaque palier N, dans l'ordre 0→4)
1. Lis le prompt du palier N en entier, puis ses "Fichiers à lire".
2. Exécute la section Tâche, commits atomiques au fil de l'eau.
3. Déroule **toute** la section Auto-vérification du prompt. Une case rouge → tu
   corriges et tu re-déroules tout.
4. Quand tout est vert : ajoute une section au fichier
   `prompts-durcissement-v1/RAPPORT_EXECUTION.md` :
   ```
   ## Palier N — <titre> — <date>
   - Commits : <liste hash + message>
   - Vérifications : <cases cochées, sorties clés (curl, phpunit)>
   - Risques / à retester manuellement : <liste honnête>
   ```
5. Commit du rapport, puis palier suivant.

## Conditions d'arrêt (tu t'arrêtes et tu rapportes, tu ne forces pas)
- Une vérification reste rouge après 3 tentatives de correction sérieuses.
- Docker indisponible et irrécupérable en CLI (action GUI requise).
- Tu découvres un trou de sécurité exploitable en prod → tu le signales **avant** de
  continuer, dans le rapport et en réponse directe.
- Un choix non couvert par les prompts a un impact structurel (schéma BDD, API
  publique) → tu poses la question au lieu de décider.

## Interdits
- Toucher à `v2/`, `docs/archive/`, ou aux maquettes.
- `git push` (Kévin push), `git rebase`/`reset` sur des commits existants.
- Marquer un palier "fait" avec des tests qui ne passent pas ou en skippant des cases.
- Désactiver/affaiblir un test pour le faire passer.

## Livraison finale
À la fin (palier 4 vert ou arrêt) : résumé en réponse — paliers livrés, commits,
ce qui reste, risques prioritaires. Le détail vit dans `RAPPORT_EXECUTION.md`.
