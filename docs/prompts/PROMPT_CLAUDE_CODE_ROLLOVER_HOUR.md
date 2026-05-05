# Prompt Claude Code — Heure de bascule de service configurable par centre

> **Objectif** : remplacer la constante hardcodée `NIGHT_SHIFT_HOUR = 5` (front) par une variable configurable par centre dans `/reglages`, qui détermine à quelle heure le « service en cours » bascule du jour J au jour J+1.

---

## 1. Contexte métier

Tu travailles sur **Shiftly** (SaaS de management opérationnel pour parcs de loisirs — bowling, laser game, arcade). Stack : Symfony 8 + API Platform (back), Next.js 14 + TypeScript strict + Tailwind (front). MySQL en local, PostgreSQL via Docker, déploiement Railway.

Depuis la dernière refonte, **un service n'a plus d'heures de début/fin** : il représente toute une journée d'exploitation (matin → fermeture nocturne). Aujourd'hui, le code détermine quel service est « en cours » via `getEffectiveToday()` dans `shiftly-app/src/lib/serviceUtils.ts`, qui contient une constante hardcodée :

```ts
const NIGHT_SHIFT_HOUR = 5  // avant 5h → service de la veille
```

**Problème** : tous les centres n'ont pas le même rythme. Un bowling qui ferme à 2h n'a pas la même heure de bascule qu'un karaoké qui ferme à 6h. Le manager doit pouvoir paramétrer cette heure pour son centre.

### Comportement attendu — exemple concret

Avec une heure de bascule réglée à **5h** :
- Dimanche 3 mai 12h → service « en cours » = **dimanche 3 mai**
- Dimanche 3 mai 23h59 → service « en cours » = **dimanche 3 mai**
- Lundi 4 mai 04h59 → service « en cours » = **dimanche 3 mai** (encore le service de la veille)
- Lundi 4 mai 05h00 → service « en cours » = **lundi 4 mai** (bascule)
- Lundi 4 mai 14h → service « en cours » = **lundi 4 mai**

La même règle s'applique à tous les services suivants. La valeur est une heure entière (`0`–`23`).

---

## 2. Ton positionnement

- Tu es un **développeur senior fullstack** qui livre du code production-ready.
- Tu respectes **strictement** les **15 règles absolues** du `CLAUDE.md` (lis-le en premier, à la racine du repo).
- Tu fais des **commits atomiques** (règle 14 : un commit par modification, ne PAS push, Kévin pousse lui-même).
- Tu mets à jour `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql`, `ENTITES.md` à chaque modification structurelle (règle 13).
- Tu **vérifies la portabilité MySQL/PostgreSQL** des migrations Doctrine (règle 15 : aucun artefact SQLite, pas de `__temp__`, pas de quotes SQLite-style).
- Tu respectes le **multi-tenancy** : la valeur est par centre, jamais globale.

---

## 3. Lecture obligatoire AVANT de coder

Lis **dans cet ordre**, en intégralité :

1. `CLAUDE.md` — conventions, design system, 15 règles absolues
2. `docs/ARCHITECTURE.md` — structure du projet
3. `docs/DESIGN_SYSTEM.md` — tokens, composants UI, animations
4. `docs/modules/ENTITES.md` — schéma des entités Doctrine
5. `docs/schema.sql` — schéma BDD
6. `shiftly-api/src/Entity/Centre.php` — entité Centre actuelle
7. `shiftly-app/src/lib/serviceUtils.ts` — logique actuelle de bascule (à refactor)
8. `shiftly-app/src/types/index.ts` — types `Centre`, `ServiceListItem`
9. `shiftly-app/src/app/(app)/reglages/page.tsx` (et sous-pages) — module Réglages actuel
10. `shiftly-app/src/hooks/` — patterns React Query existants (`useCentre`, `useReglages`, etc. selon ce qui existe)
11. `shiftly-app/src/store/auth.ts` (ou équivalent Zustand) — store d'auth qui contient le centre courant
12. Tous les fichiers qui importent `getEffectiveToday`, `isTodayService`, `findTodayService` depuis `serviceUtils.ts` (`grep` côté front)
13. Tout endpoint Symfony qui calcule le « service en cours » côté backend (`grep` côté back : `Service`, `EN_COURS`, `aujourdhui`, `today`)

**Ne code rien tant que tu n'as pas lu ces fichiers.** Si un fichier listé n'existe pas, signale-le et propose le chemin réel.

---

## 4. Décisions déjà prises (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Granularité | Heure entière 0–23 (pas de minutes). Plus simple, suffisant en pratique. |
| Portée | **Par centre** (multi-tenant). Champ sur l'entité `Centre`. |
| Valeur par défaut | `5` (préserve le comportement actuel). NOT NULL avec default en BDD. |
| Format API | Champ `serviceRolloverHour` (int) sur la ressource `Centre`, exposé via API Platform. |
| Lecture côté front | Depuis le store Zustand `auth` (qui contient déjà le centre courant). Si non disponible, fallback `5`. |
| UI | Section dans `/reglages` accessible **manager only**. Input numérique + select des heures 00:00 → 23:00. Sauvegarde via `PUT /api/centres/{id}` ou endpoint dédié si pattern existant. |
| Migration | Doctrine, compatible MySQL **et** PostgreSQL. Tester localement avant commit. |
| Backend | Si un endpoint calcule le service en cours côté serveur (ex : DashboardController), il doit utiliser cette valeur aussi. À auditer. |

---

## 5. Implémentation — étapes ordonnées

### 5.1 Backend — Symfony / Doctrine

1. **Ajouter le champ sur `Centre`** :
   - Propriété PHP `?int $serviceRolloverHour = 5`
   - Annotation `#[ORM\Column(type: 'smallint', options: ['default' => 5])]`
   - `#[Assert\Range(min: 0, max: 23)]`
   - `#[Groups(['centre:read', 'centre:write'])]`
   - Getter / setter
2. **Générer la migration Doctrine** :
   - `php bin/console make:migration`
   - **Vérifier le SQL** : pas de `__temp__`, pas de double-quote SQLite. Doit être valide MySQL ET PostgreSQL.
   - Tester `migrate` localement.
3. **Mettre à jour les fixtures Alice** (`fixtures/centres.yaml` ou équivalent) avec une valeur par défaut explicite.
4. **Auditer le backend** : si un service Symfony (ou un controller custom type `DashboardController`) détermine « le service du jour », il doit appeler une méthode utilitaire (ex : `ServiceResolver::getCurrentDate(Centre $centre): \DateTimeImmutable`) qui prend en compte `serviceRolloverHour`. Créer le service si absent.
5. **Mettre à jour les Voters** si besoin (probablement non nécessaire ici, juste lecture/écriture du champ par le manager du centre).

### 5.2 Frontend — Next.js

6. **Mettre à jour le type `Centre`** dans `shiftly-app/src/types/index.ts` : ajouter `serviceRolloverHour: number`.
7. **Refactor `shiftly-app/src/lib/serviceUtils.ts`** :
   - Supprimer la constante hardcodée.
   - Les 3 fonctions (`getEffectiveToday`, `isTodayService`, `findTodayService`) acceptent un paramètre `rolloverHour: number`.
   - Garder un fallback explicite `DEFAULT_ROLLOVER_HOUR = 5` exporté pour les rares cas sans contexte.
   - JSDoc en français mis à jour avec exemple (le scénario du dimanche → lundi 5h).
8. **Créer un hook `useServiceRolloverHour()`** dans `shiftly-app/src/hooks/` :
   - Récupère la valeur depuis le store Zustand `auth.centre.serviceRolloverHour`.
   - Renvoie le fallback `5` si centre absent.
9. **Mettre à jour TOUS les appelants** de `getEffectiveToday` / `isTodayService` / `findTodayService` :
   - Passer la valeur via `useServiceRolloverHour()` (composants React) ou via paramètre explicite (utilitaires purs).
   - Faire un `grep` exhaustif. Aucun appel ne doit rester sans paramètre.
10. **Page `/reglages`** :
    - Ajouter une section « Heure de bascule de service » (ou similaire — copy à proposer puis valider).
    - Composant : `Select` ou `Input number` (réutiliser composants UI existants — pas de nouveau composant si évitable).
    - 3 états : loading | error | empty (règle 6).
    - Mutation React Query (`useUpdateCentre` ou similaire — réutiliser le pattern existant).
    - Toast de confirmation au succès.
    - Texte d'aide explicatif sous le champ : exemple « Si réglé sur 5h, le passage au service du jour suivant se fait à 5h du matin. »
    - Animations via Framer Motion (variants existants `fadeUp` / `slideUp`).
11. **Mobile-first** (règle 4) : maquetter mobile d'abord, puis `md:` / `lg:`.

### 5.3 Documentation

12. Mettre à jour :
    - `docs/modules/ENTITES.md` — entité `Centre` avec le nouveau champ.
    - `docs/schema.sql` — colonne `service_rollover_hour SMALLINT NOT NULL DEFAULT 5`.
    - `docs/ARCHITECTURE.md` — section Réglages : nouvelle option.
    - `docs/DESIGN_SYSTEM.md` — uniquement si nouveau composant UI introduit.

---

## 6. AUTO-VÉRIFICATION ET AUTO-CORRECTION (obligatoire)

> **Tu dois t'auto-corriger.** Ce n'est pas optionnel. À chaque étape, tu vérifies ton propre code et tu corriges les écarts avant de passer à la suivante.

### 6.1 Après CHAQUE commit, exécute systématiquement :

**Backend** (depuis `shiftly-api/`) :
```bash
php bin/console doctrine:schema:validate          # 0 erreur attendue
php bin/console lint:container                     # 0 erreur
php bin/console doctrine:migrations:migrate --dry-run  # vérifier le SQL généré
vendor/bin/phpstan analyse src --level=5           # si configuré
```

**Frontend** (depuis `shiftly-app/`) :
```bash
npm run lint                                       # 0 erreur
npm run type-check  # ou tsc --noEmit              # 0 erreur TypeScript
npm run build                                      # build production sans warning bloquant
```

Si une commande échoue → tu **corriges immédiatement** avant de passer à l'étape suivante. Tu ne laisses jamais une erreur en suspens.

### 6.2 Tests fonctionnels manuels à dérouler en fin d'implémentation

Tu écris dans ta dernière réponse un **rapport de vérification** qui prouve que chaque point ci-dessous a été testé :

1. **Migration BDD** : `php bin/console doctrine:migrations:migrate` passe en local sans erreur. La colonne `service_rollover_hour` existe bien dans la table `centre` avec valeur par défaut `5`.
2. **API GET `/api/centres/{id}`** retourne bien `serviceRolloverHour: 5` (ou la valeur définie).
3. **API PUT `/api/centres/{id}`** avec `{ "serviceRolloverHour": 6 }` met à jour la valeur. Refus si valeur < 0 ou > 23 (validation Symfony).
4. **Multi-tenant** : un manager du centre A ne peut **pas** modifier le centre B (Voter).
5. **UI `/reglages`** : la valeur s'affiche correctement, la modif persiste après refresh.
6. **Logique de bascule** : tester manuellement les 5 scénarios de la section 1 en mockant la date système (ou en passant des dates explicites aux fonctions). Ils retournent tous le bon « jour effectif ».
7. **Fallback** : si `serviceRolloverHour` est absent du centre (cas dégradé), le code retombe sur `5` sans crasher.
8. **Aucun reste de hardcode** : `grep -rn "NIGHT_SHIFT_HOUR\|= 5 //.*shift\|hardcoded.*5"` ne renvoie plus rien dans `shiftly-app/src/`.
9. **Tous les appelants migrés** : `grep -rn "getEffectiveToday\|isTodayService\|findTodayService"` montre que chaque appel passe bien la valeur du centre courant.

### 6.3 Critères d'acceptation finaux (auto-validation)

Avant de déclarer terminé, tu réponds **OUI ou NON** à chacune de ces questions, et tu justifies par un fichier + numéro de ligne :

- [ ] Le champ existe en BDD et la migration est portable MySQL/PostgreSQL ?
- [ ] Le champ est exposé par l'API en lecture ET en écriture ?
- [ ] Le manager peut modifier la valeur depuis `/reglages` ?
- [ ] Le scénario « dimanche 12h / lundi 4h59 / lundi 5h » fonctionne avec l'heure configurée du centre ?
- [ ] Aucun `useEffect` n'a été introduit pour des appels API (règle 5) ?
- [ ] Aucun `any` TypeScript n'a été ajouté (règle 2) ?
- [ ] Aucune couleur hardcodée n'a été ajoutée (règle 1) ?
- [ ] Les 3 états (loading / error / empty) sont présents partout (règle 6) ?
- [ ] Tous les commentaires sont en français (règle 7) ?
- [ ] Les 4 fichiers de référence (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql`, `ENTITES.md`) sont à jour (règle 13) ?
- [ ] `npm run build` passe sans erreur ?
- [ ] `php bin/console doctrine:schema:validate` passe ?

**Si une seule case est NON → tu corriges et tu re-vérifies l'ensemble. Tu ne livres pas tant que tout est OUI.**

### 6.4 Auto-relecture de diff

Avant de marquer terminé, tu fais `git diff main..HEAD` et tu **relis ton propre diff comme un reviewer hostile** :
- Y a-t-il une régression silencieuse sur un appelant que tu aurais oublié ?
- La migration est-elle réversible (`down()` correct) ?
- Le fallback `5` est-il bien partout au cas où le centre serait null ?
- Les tests de bascule passent-ils aussi à minuit pile, à 4h59m59s, à 5h00m00s, à 5h00m01s ?

Si tu trouves un problème → commit de correction. Tu documentes ce que tu as trouvé.

---

## 7. Format de livraison attendu

À la fin, ta dernière réponse contient :

1. La **liste des commits** créés (un par modif atomique).
2. Le **rapport de vérification** (section 6.2 + 6.3 cochée case par case avec preuve).
3. Les **fichiers de référence mis à jour** (liste).
4. Une **note de risque** : ce qui pourrait régresser, ce qu'il faut tester en staging avant push prod.
5. Un **rappel à Kévin** : « Push à toi de jouer » — tu ne push pas toi-même.

---

## 8. Ce que tu ne fais PAS

- Tu **n'introduis pas** de minutes de granularité (heure entière uniquement, décision actée).
- Tu **ne crées pas** de table dédiée (`centre_settings`) — un champ direct sur `Centre` suffit.
- Tu **ne push pas** sur Git. Kévin pousse lui-même.
- Tu **ne supprimes pas** la constante exportée `DEFAULT_ROLLOVER_HOUR = 5` même après refactor — elle sert de fallback explicite.
- Tu **ne touches pas** au pricing, à la sidebar, aux autres modules (scope strictement limité à : Centre / Réglages / serviceUtils + appelants).
