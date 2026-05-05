# Prompt Claude Code — Centraliser la logique du « jour actif » via `ActiveDayResolver`

> **Objectif** : éliminer les 3 logiques divergentes qui déterminent actuellement le « jour actif » dans Shiftly, et les remplacer par **un seul résolveur** côté back (`App\Service\ActiveDayResolver`) et **une seule constante** côté front (`NIGHT_SHIFT_HOUR = 5`). Garantir qu'**un service existe toujours en EN_COURS** entre 5h du matin du jour J et 5h du matin du jour J+1, peu importe la page consultée.

---

## 1. Contexte métier et bug observé

Tu travailles sur **Shiftly** (SaaS de management opérationnel pour parcs de loisirs — bowling, laser game, arcade, karaoké, VR). Stack : Symfony 8 + API Platform 3 (back), Next.js 14 + TypeScript strict + Tailwind (front). MySQL en local, PostgreSQL en prod via Railway.

### Le bug constaté en production

Lundi 4 mai 2026, observé par Kévin :
- Page `/services` (planning) → affiche le service du **lundi 4 mai en EN_COURS** ✅
- Page `/service` (Service du Jour) → affiche **« Aucun service en cours »** ❌
- Page `/dashboard` → affiche **« Aucun service planifié aujourd'hui »** ❌

Les 3 pages doivent dire la même chose. Aujourd'hui, **3 logiques différentes coexistent** :

| Endroit | Fichier | Seuil de bascule |
|---|---|---|
| `/service` & `/dashboard` | `shiftly-api/src/Repository/ServiceRepository.php` ligne 28-47 (`findTodayActive`) | **2h** (le commentaire ligne 32 dit 5h, le code ligne 33 fait `H < 2` — incohérent) |
| `/services` (calcul du statut) | `shiftly-api/src/Service/ServiceStatutResolver.php` ligne 33-44 | **0h** (`new \DateTimeImmutable('today')`, aucun seuil) |
| `/services` (filtres frontend) | `shiftly-app/src/lib/serviceUtils.ts` ligne 12-20 (`getEffectiveToday`) | **5h** |

Conséquence : entre 0h et 4h59 du matin, les 3 pages divergent.

### Comportement attendu après le fix

Avec une heure de bascule unique à **5h00** (timezone Europe/Paris), **toutes les pages** doivent répondre :

| Heure réelle (Europe/Paris) | « Jour actif » | Service marqué EN_COURS |
|---|---|---|
| Dimanche 3 mai 12h00 | dimanche 3 mai | Service du dimanche 3 mai |
| Dimanche 3 mai 23h59 | dimanche 3 mai | Service du dimanche 3 mai |
| Lundi 4 mai 00h00 | dimanche 3 mai | Service du dimanche 3 mai |
| Lundi 4 mai 04h59 | dimanche 3 mai | Service du dimanche 3 mai |
| **Lundi 4 mai 05h00** | **lundi 4 mai** | **Service du lundi 4 mai** |
| Lundi 4 mai 14h00 | lundi 4 mai | Service du lundi 4 mai |

**Règle implicite** : si un service existe pour le « jour actif », il est toujours marqué EN_COURS (et un seul à la fois par centre).

---

## 2. Ton positionnement

- Tu es un **développeur senior fullstack** qui livre du code production-ready.
- Tu respectes **strictement** les **15 règles absolues** du `CLAUDE.md` (lis-le en premier, à la racine du repo).
- Tu fais des **commits atomiques** (règle 14 : un commit par modification, ne PAS push, Kévin pousse lui-même).
- Tu mets à jour `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql`, `ENTITES.md` à chaque modification structurelle (règle 13 — ici, probablement seul `ARCHITECTURE.md` est concerné, pas de schéma BDD impacté).
- Tu **vérifies la portabilité MySQL/PostgreSQL** des migrations Doctrine si tu en génères (règle 15). Pour ce ticket, **aucune migration ne devrait être nécessaire** — uniquement du code applicatif.
- Tu respectes le **multi-tenancy** : la logique reste par centre (filtrée par `centre_id`).

---

## 3. Lecture obligatoire AVANT de coder

Lis **dans cet ordre**, en intégralité (aucun skim) :

1. `CLAUDE.md` — conventions, design system, 15 règles absolues
2. `ARCHITECTURE.md` — structure du projet
3. `shiftly-api/src/Service/ServiceStatutResolver.php` — logique actuelle du statut dynamique (à refactor)
4. `shiftly-api/src/Repository/ServiceRepository.php` — méthodes `findToday()` et `findTodayActive()` (à refactor)
5. `shiftly-api/src/Controller/ServiceTodayController.php` — endpoint `/api/service/today`
6. `shiftly-api/src/Controller/DashboardController.php` — endpoint `/api/dashboard/{centreId}`
7. `shiftly-api/src/Controller/ServicesListController.php` — endpoint `/api/services/list`
8. `shiftly-api/src/Service/PlanningGuardService.php` — voir s'il manipule aussi des dates « du jour »
9. `shiftly-app/src/lib/serviceUtils.ts` — `getEffectiveToday`, `isTodayService`, `findTodayService`
10. `shiftly-app/src/lib/serviceFilters.ts` — `getTabBuckets` et son paramètre `today`
11. `shiftly-app/src/components/services/ServicesDesktopView.tsx` — comment `today` est calculé et propagé
12. Tous les appelants de `getEffectiveToday`, `isTodayService`, `findTodayService` côté front (grep exhaustif)
13. Tous les appelants de `findToday()` et `findTodayActive()` côté back (grep exhaustif)
14. Tous les usages de `new \DateTimeImmutable('today')` ou `new \DateTime('today')` côté back (grep exhaustif — il peut y en avoir d'autres planqués)

**Ne code rien tant que tu n'as pas lu ces fichiers et fait les 3 grep.** Si un fichier listé n'existe pas, signale-le.

---

## 4. Décisions déjà prises (ne pas remettre en cause)

| Sujet | Décision |
|---|---|
| Heure de bascule | **5h** (constante hardcodée, pas configurable par centre dans cette v1) |
| Timezone de référence | **Europe/Paris** (forcée explicitement dans `ActiveDayResolver`, ne dépend pas de `date.timezone` du php.ini) |
| Granularité | Heure entière |
| Source de vérité backend | Service Symfony `App\Service\ActiveDayResolver` injectable partout |
| Source de vérité frontend | Constante exportée depuis `shiftly-app/src/lib/serviceUtils.ts` (`NIGHT_SHIFT_HOUR = 5`), avec commentaire explicite « DOIT MATCHER `App\Service\ActiveDayResolver::NIGHT_SHIFT_HOUR` » |
| Statut EN_COURS | Toujours calculé dynamiquement via `ServiceStatutResolver` à partir du « jour actif » du centre. Le champ `statut` BDD n'est jamais utilisé pour EN_COURS (uniquement pour TERMINE manuel). |
| Migration BDD | **Aucune** — uniquement du code applicatif. Le champ `statut` reste tel quel. |
| Configurable par centre | Pas dans cette v1. Si besoin plus tard, on injectera `Centre $centre` dans `ActiveDayResolver` et on lira `$centre->getServiceRolloverHour()`. La signature actuelle doit déjà accepter un paramètre optionnel pour préparer cette évolution. |

---

## 5. Architecture cible

### 5.1 Backend — nouveau service `App\Service\ActiveDayResolver`

```php
<?php

namespace App\Service;

/**
 * Détermine le « jour actif » d'un centre à un instant T.
 *
 * Règle métier : entre 0h et 4h59 du matin, on est encore dans la
 * journée d'exploitation de la veille (service de nuit / fermeture tardive).
 * À partir de 5h, on bascule sur la journée du jour calendaire.
 *
 * Cette logique est la SOURCE DE VÉRITÉ unique côté backend.
 * Toute fonction qui détermine « le service du jour » DOIT passer par ici.
 *
 * Le pendant frontend est `NIGHT_SHIFT_HOUR` dans `shiftly-app/src/lib/serviceUtils.ts`.
 * Les deux constantes DOIVENT rester synchronisées.
 */
class ActiveDayResolver
{
    /** Heure (0-23) à laquelle bascule le « jour actif » sur le jour calendaire suivant. */
    public const NIGHT_SHIFT_HOUR = 5;

    /** Timezone de référence pour tous les centres (Shiftly est franco-français pour l'instant). */
    private const TIMEZONE = 'Europe/Paris';

    /**
     * Retourne la date (à 00:00) du « jour actif » à l'instant donné.
     * `$now` est optionnel pour faciliter les tests (injecter une date fixe).
     */
    public function getActiveDate(?\DateTimeImmutable $now = null): \DateTimeImmutable
    {
        $tz = new \DateTimeZone(self::TIMEZONE);
        $now = $now ? $now->setTimezone($tz) : new \DateTimeImmutable('now', $tz);

        $reference = (int) $now->format('H') < self::NIGHT_SHIFT_HOUR
            ? $now->modify('-1 day')
            : $now;

        // On normalise à 00:00 dans la timezone Paris pour une comparaison
        // d'égalité de date avec le champ `s.date` (DATE en BDD, sans heure).
        return $reference->setTime(0, 0, 0);
    }

    /**
     * Variante string YYYY-MM-DD pour les payloads JSON exposés au front.
     */
    public function getActiveDateString(?\DateTimeImmutable $now = null): string
    {
        return $this->getActiveDate($now)->format('Y-m-d');
    }
}
```

### 5.2 Frontend — `serviceUtils.ts` réécrit

```ts
import { format } from 'date-fns'
import type { ServiceListItem } from '@/types/index'

/**
 * Heure (0-23) de bascule du « jour actif » sur le jour calendaire suivant.
 *
 * DOIT MATCHER `App\Service\ActiveDayResolver::NIGHT_SHIFT_HOUR` (backend).
 * Si tu changes l'une, change l'autre — sinon les pages divergeront à nouveau.
 */
export const NIGHT_SHIFT_HOUR = 5

/**
 * Retourne la date du « jour actif » au format YYYY-MM-DD.
 * Entre 0h et 4h59 → date d'hier (service de nuit en cours).
 * À partir de 5h → date calendaire du jour.
 */
export function getEffectiveToday(): string {
  const now = new Date()
  if (now.getHours() < NIGHT_SHIFT_HOUR) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return format(yesterday, 'yyyy-MM-dd')
  }
  return format(now, 'yyyy-MM-dd')
}

export function isTodayService(date: string): boolean {
  return date === getEffectiveToday()
}

export function findTodayService(services: ServiceListItem[]): ServiceListItem | undefined {
  return services.find(s => isTodayService(s.date))
}
```

---

## 6. Implémentation — étapes ordonnées (un commit par étape)

### Étape 1 — Créer `ActiveDayResolver` + tests
- Créer `shiftly-api/src/Service/ActiveDayResolver.php` (code section 5.1).
- Créer `shiftly-api/tests/Service/ActiveDayResolverTest.php` (PHPUnit) avec **au minimum ces 8 cas** :
  - Lundi 4 mai 04:59:59 Europe/Paris → renvoie 2026-05-03
  - Lundi 4 mai 05:00:00 Europe/Paris → renvoie 2026-05-04
  - Lundi 4 mai 00:00:00 Europe/Paris → renvoie 2026-05-03
  - Lundi 4 mai 12:00:00 Europe/Paris → renvoie 2026-05-04
  - Lundi 4 mai 23:59:59 Europe/Paris → renvoie 2026-05-04
  - Cas timezone : passer une date construite en UTC, vérifier qu'elle est correctement convertie en Europe/Paris avant calcul (ex : 2026-05-04 03:30:00 UTC = 05:30 Paris en heure d'été → renvoie 2026-05-04)
  - Changement d'heure d'été (printemps) : 2026-03-29 02:30 UTC = 04:30 Paris → renvoie 2026-03-28
  - Changement d'heure d'hiver (automne) : 2026-10-25 03:30 UTC = 04:30 Paris → renvoie 2026-10-24
- Lance `vendor/bin/phpunit tests/Service/ActiveDayResolverTest.php` → **tous les tests doivent passer**.
- **Commit** : `feat(active-day): add ActiveDayResolver service with PHPUnit tests`

### Étape 2 — Refactor `ServiceStatutResolver` pour utiliser `ActiveDayResolver`
- Injecter `ActiveDayResolver $activeDayResolver` dans le constructeur.
- Remplacer ligne 33 `$today = new \DateTimeImmutable('today');` par `$today = $this->activeDayResolver->getActiveDate();`
- Mettre à jour le PHPDoc en haut de classe : la règle EN_COURS s'applique maintenant au « jour actif » et plus à « aujourd'hui calendaire ».
- Lancer les tests existants si présents. Si aucun test sur `ServiceStatutResolver`, en créer un minimal couvrant les 3 transitions (PLANIFIE, EN_COURS, TERMINE).
- **Commit** : `refactor(service-statut): use ActiveDayResolver for EN_COURS detection`

### Étape 3 — Refactor `ServiceRepository::findTodayActive` et `findToday`
- Injecter `ActiveDayResolver` via le constructeur du repository (Symfony 6+ supporte l'injection dans les repositories — vérifier le pattern existant ; si problématique, alternative : passer la date en paramètre depuis l'appelant).
- `findTodayActive($centreId)` : remplacer le calcul local du `referenceDate` (lignes 30-35 actuelles) par `$referenceDate = $this->activeDayResolver->getActiveDate();`.
- `findToday($centreId)` : remplacer `new \DateTimeImmutable('today')` (ligne 23) par la même chose. Les deux méthodes deviennent quasi identiques — **propose à Kévin dans ton résumé final si on peut supprimer l'une des deux** (probablement `findToday`, qui semble obsolète).
- Supprimer le commentaire menteur ligne 32 (« Avant 5h » avec un code à 2h).
- **Commit** : `refactor(service-repo): centralize active day calculation via ActiveDayResolver`

### Étape 4 — Vérifier les autres usages de `new DateTimeImmutable('today')`
- Grep exhaustif : `grep -rn "DateTimeImmutable.*today\|DateTime.*today" shiftly-api/src/`
- Pour chaque occurrence trouvée :
  - Si elle concerne « le service du jour » ou « le pointage du jour » ou « EN_COURS » → migrer vers `ActiveDayResolver::getActiveDate()`.
  - Si elle concerne autre chose (date administrative, log, audit) → ne pas toucher, mais **lister dans le rapport final** ce que tu n'as pas migré et pourquoi.
- Audit spécifique de `PlanningGuardService.php` qui contient déjà des références trouvées au grep.
- **Commit** : `refactor(active-day): migrate remaining date calculations to ActiveDayResolver`

### Étape 5 — Frontend : centraliser `NIGHT_SHIFT_HOUR`
- Réécrire `shiftly-app/src/lib/serviceUtils.ts` selon le code section 5.2 (export de `NIGHT_SHIFT_HOUR`, commentaire de synchronisation backend explicite).
- Vérifier que `serviceFilters.ts` continue de fonctionner (il appelle `getTabBuckets(services, today)` où `today` vient de `getEffectiveToday()` — pas de changement nécessaire).
- Aucun autre fichier front ne devrait avoir besoin de changement structurel — uniquement de la cohérence.
- **Commit** : `refactor(service-utils): export NIGHT_SHIFT_HOUR constant for backend sync`

### Étape 6 — Documentation
- Mettre à jour `ARCHITECTURE.md` : ajouter une section « Jour actif » ou « ActiveDayResolver » qui explique :
  - La règle métier (bascule à 5h, timezone Europe/Paris)
  - Que `App\Service\ActiveDayResolver` (back) et `NIGHT_SHIFT_HOUR` (front) doivent rester synchronisés
  - Les fichiers backend qui en dépendent (`ServiceStatutResolver`, `ServiceRepository`, controllers)
- **Commit** : `docs(architecture): document active day resolution`

---

## 7. AUTO-VÉRIFICATION ET AUTO-CORRECTION (obligatoire)

> **Tu dois t'auto-corriger.** À chaque étape, tu vérifies ton propre code et tu corriges les écarts avant de passer à la suivante.

### 7.1 Après CHAQUE commit, exécute systématiquement

**Backend** (depuis `shiftly-api/`) :
```bash
php bin/console doctrine:schema:validate          # 0 erreur attendue (pas de schéma touché)
php bin/console lint:container                    # 0 erreur
vendor/bin/phpunit                                # tous les tests passent
vendor/bin/phpstan analyse src --level=5          # si configuré, 0 erreur
```

**Frontend** (depuis `shiftly-app/`) :
```bash
npm run lint                                      # 0 erreur
npm run type-check  # ou tsc --noEmit             # 0 erreur TypeScript
npm run build                                     # build production sans warning bloquant
```

Si une commande échoue → tu **corriges immédiatement** avant de passer à l'étape suivante.

### 7.2 Tests fonctionnels manuels à dérouler en fin d'implémentation

Tu écris dans ta dernière réponse un **rapport de vérification** qui prouve chaque point :

1. **Tests unitaires `ActiveDayResolverTest`** : les 8 cas listés en étape 1 passent.
2. **Cohérence inter-pages** (test manuel) : démarre l'app, va successivement sur `/service`, `/dashboard`, `/services` → les 3 pages affichent le **même service** comme « en cours / du jour ».
3. **Test du basculement à 5h** (en mockant la date système, ou via les tests PHPUnit avec date injectée) :
   - À 04:59:59 → service de la veille en EN_COURS sur les 3 pages
   - À 05:00:00 → service du jour en EN_COURS sur les 3 pages
4. **Timezone** : vérifie via `date_default_timezone_get()` que même si la conf serveur est en UTC, le résolveur renvoie bien une date en Europe/Paris. Test PHPUnit ou test fonctionnel.
5. **Aucun reste de logique éparpillée** : les commandes suivantes ne renvoient PLUS que des occurrences justifiées (ou rien) :
   ```bash
   grep -rn "DateTimeImmutable.*today\|DateTime.*today" shiftly-api/src/
   grep -rn "format('H') < " shiftly-api/src/
   grep -rn "NIGHT_SHIFT_HOUR" shiftly-app/src/
   ```
   Toute occurrence restante doit pointer soit vers `ActiveDayResolver` (back), soit vers `serviceUtils.ts` (front).
6. **Multi-tenant** : un service du centre A n'apparaît pas comme EN_COURS pour un user du centre B (pas d'impact attendu mais à vérifier).
7. **Pas de régression** sur les compteurs du dashboard (taux de complétion, missions terminées, etc.) liés à la notion de « jour ».

### 7.3 Critères d'acceptation finaux (auto-validation)

Avant de déclarer terminé, tu réponds **OUI ou NON** à chacune de ces questions, et tu justifies par un fichier + numéro de ligne :

- [ ] `ActiveDayResolver` existe et est couvert par PHPUnit (8 cas minimum) ?
- [ ] Le commentaire menteur de `ServiceRepository::findTodayActive` (« Avant 5h » avec code `< 2`) a disparu ?
- [ ] `ServiceStatutResolver` utilise `ActiveDayResolver` au lieu de `new DateTimeImmutable('today')` ?
- [ ] `ServiceRepository::findTodayActive` et `findToday` utilisent tous deux `ActiveDayResolver` ?
- [ ] La constante `NIGHT_SHIFT_HOUR = 5` est exportée depuis `serviceUtils.ts` avec le commentaire de synchronisation backend ?
- [ ] Les 3 pages `/service`, `/dashboard`, `/services` affichent le même service à n'importe quelle heure entre 5h et 4h59 du lendemain ?
- [ ] La timezone Europe/Paris est forcée dans `ActiveDayResolver` (ne dépend pas de la conf serveur) ?
- [ ] Aucun `useEffect` n'a été introduit pour des appels API (règle 5) ?
- [ ] Aucun `any` TypeScript n'a été ajouté (règle 2) ?
- [ ] Tous les commentaires sont en français (règle 7) ?
- [ ] `ARCHITECTURE.md` est à jour (règle 13) ?
- [ ] `npm run build` passe sans erreur ?
- [ ] `php bin/console doctrine:schema:validate` passe ?
- [ ] `vendor/bin/phpunit` passe (incluant les nouveaux tests) ?

**Si une seule case est NON → tu corriges et tu re-vérifies l'ensemble. Tu ne livres pas tant que tout est OUI.**

### 7.4 Auto-relecture de diff

Avant de marquer terminé, fais `git diff main..HEAD` (ou la branche de travail) et **relis ton propre diff comme un reviewer hostile** :
- Y a-t-il un appelant de `findToday()` que tu aurais oublié de vérifier ?
- L'injection de `ActiveDayResolver` dans le repository est-elle propre (pattern Symfony) ou est-ce que tu as pollué le code ?
- Le `setTime(0, 0, 0)` du résolveur est-il bien comparable au champ `s.date` qui est de type DATE en BDD ?
- Les tests couvrent-ils bien les bornes 04:59:59 et 05:00:00 (pas juste 4h et 5h ronds) ?
- Le cas changement d'heure (mars / octobre) est-il vraiment testé ?

Si tu trouves un problème → commit de correction. Documente ce que tu as trouvé.

---

## 8. Format de livraison attendu

À la fin, ta dernière réponse contient :

1. La **liste des commits** créés (un par modif atomique, format conventional commits).
2. Le **rapport de vérification** (section 7.2 + 7.3 cochée case par case avec preuve : fichier + ligne).
3. Les **fichiers de référence mis à jour** (liste).
4. Une **note de risque** : ce qui pourrait régresser, ce qu'il faut tester en staging avant push prod.
5. Une **proposition de cleanup** : `findToday()` est-il devenu redondant avec `findTodayActive()` ? Si oui, tu proposes de le supprimer dans un commit séparé (mais tu ne le fais pas sans validation de Kévin — tu lui demandes).
6. Un **rappel** : « Push à toi de jouer Kévin » — tu ne pushes pas toi-même.

---

## 9. Ce que tu ne fais PAS

- Tu **ne rends pas** la valeur configurable par centre dans cette v1 (ce sera une v2 si Kévin le demande — un design doc existe dans `docs/prompts/PROMPT_CLAUDE_CODE_ROLLOVER_HOUR.md` mais **n'a jamais été exécuté** : c'est uniquement une intention non implémentée, à reprendre seulement si la feature devient prioritaire).
- Tu **ne crées pas** de migration BDD — aucun champ ajouté.
- Tu **ne modifies pas** le frontend autrement que pour la constante `NIGHT_SHIFT_HOUR` exportée et son commentaire de synchronisation. Pas de refonte de `serviceFilters.ts` ni de `ServicesDesktopView.tsx`.
- Tu **ne touches pas** au pricing, à la sidebar, au pointage, au HACCP, ou à tout autre module hors scope.
- Tu **ne push pas** sur Git. Kévin pousse lui-même.
- Tu **ne supprimes pas** le statut `TERMINE` posé manuellement (la logique « si BDD = TERMINE alors TERMINE » de `ServiceStatutResolver` reste prioritaire).
- Tu **ne tentes pas** de mettre à jour le statut en BDD via un cron — la résolution dynamique reste la stratégie. Le champ BDD reste un cache « TERMINE manuel » uniquement.
