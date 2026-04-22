# Prompt à copier-coller dans une nouvelle session Claude Code

---

## Contexte

Tu travailles sur **Shiftly**, une app SaaS de management opérationnel pour parcs de loisirs (bowling, arcade, laser game). Stack : Symfony 8 + API Platform (backend), Next.js 14 + TypeScript strict + Tailwind (frontend).

Le projet est déjà avancé : auth JWT, entités (Centre, User, Zone, Mission, Service, Poste, etc.), pages service/planning/staff/dashboard fonctionnelles, et un module de conformité légale sur le planning (alertes Code du travail, snapshots, délai de prévenance) déjà livré.

Tu dois maintenant implémenter le **module Pointage** — un système de pointage temps réel où les employés viennent pointer leur arrivée/départ/pause sur un écran unique (tablette ou PC) ouvert sur la session du manager. Chaque employé s'identifie via un **code PIN à 4 chiffres** avant de pointer.

---

## Ton positionnement

- Tu es un **développeur senior fullstack** qui livre du code production-ready.
- Tu respectes **strictement** les conventions du fichier `CLAUDE.md` à la racine du projet (lis-le en premier).
- Tu suis la spec technique du fichier `docs/modules/POINTAGE_MODULE.md` (lis-le en entier avant de coder quoi que ce soit).
- Tu fais des **commits atomiques** : un commit = une seule responsabilité. Pas de commit fourre-tout.
- Tu **testes après chaque commit** (au minimum : le build passe, pas d'erreur TypeScript, pas d'erreur Symfony).
- Si tu rencontres un problème, tu le résous, puis tu **mets à jour `docs/modules/POINTAGE_MODULE.md`** avec la solution retenue (dans une section "Notes d'implémentation" à la fin) pour garder la spec synchronisée avec la réalité du code.

---

## Convention CSS/Styling — TRÈS IMPORTANT

Le projet utilise Tailwind mais avec une **architecture CSS stricte** à respecter :

### Principe : séparer le style du composant et le layout

**Les classes Tailwind dans le JSX ne gèrent QUE le layout et le positionnement** :
- `flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`, `h-*`
- `relative`, `absolute`, `fixed`
- `overflow-*`, `z-*`
- Les breakpoints responsive (`md:`, `lg:`)

**Le style visuel (couleurs, bordures, ombres, typo, animations) est dans `globals.css`** via des classes sémantiques nommées par composant :

```css
/* globals.css — Exemple pour le module Pointage */

/* ── Pointage : PinPad ── */
.pinpad { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
.pinpad-key { 
  background: var(--surface2); 
  border: 1px solid var(--border); 
  border-radius: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  transition: all 0.15s;
}
.pinpad-key:hover { background: var(--surface3); border-color: var(--accent); }
.pinpad-key:active { transform: scale(0.95); }
.pinpad-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--border); }
.pinpad-dot.filled { background: var(--accent); border-color: var(--accent); }
.pinpad-dot.error { background: var(--red); border-color: var(--red); }
.pinpad-shake { animation: shake 0.4s ease-in-out; }

/* ── Pointage : StaffCard ── */
.staff-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; border-left: 4px solid transparent; }
.staff-card[data-status="en-cours"] { border-left-color: var(--green); }
.staff-card[data-status="en-pause"] { border-left-color: var(--yellow); }
.staff-card[data-status="prevu-retard"] { border-left-color: var(--accent); }
.staff-card[data-status="prevu"] { border-left-color: var(--border); }
.staff-card[data-status="termine"] { border-left-color: var(--muted); opacity: 0.6; }
.staff-card[data-status="absent"] { border-left-color: var(--red); opacity: 0.6; }

/* ── Pointage : KPI ── */
.kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
.kpi-icon { width: 46px; height: 46px; border-radius: 12px; }
.kpi-icon.green { background: rgba(34,197,94,0.12); }
.kpi-icon.red { background: rgba(239,68,68,0.12); }
.kpi-icon.blue { background: rgba(59,130,246,0.12); }
.kpi-icon.yellow { background: rgba(234,179,8,0.12); }
.kpi-icon.orange { background: rgba(249,115,22,0.12); }
.kpi-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--muted); }

/* ── Pointage : Timeline ── */
.timeline-dot { width: 8px; height: 8px; border-radius: 50%; }
.timeline-dot.green { background: var(--green); }
.timeline-dot.yellow { background: var(--yellow); }
.timeline-dot.red { background: var(--red); }
.timeline-dot.blue { background: var(--blue); }
.timeline-dot.pulse { animation: pulse 2s infinite; }

/* ── Pointage : Header ── */
.pointage-live-badge { background: rgba(34,197,94,0.15); color: var(--green); font-size: 12px; font-weight: 700; border-radius: 8px; }
.pointage-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
.pointage-clock { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); }

/* ── Pointage : Alert ── */
.alert-item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }
.alert-item.critical { border-left: 3px solid var(--red); }
.alert-item.warning { border-left: 3px solid var(--yellow); }
.alert-item.info { border-left: 3px solid var(--blue); }
.alert-item.success { border-left: 3px solid var(--green); }

/* ── Pointage : Badges statut ── */
.badge-statut { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 8px; }
.badge-statut.en-cours { background: rgba(34,197,94,0.15); color: var(--green); }
.badge-statut.en-pause { background: rgba(234,179,8,0.15); color: var(--yellow); }
.badge-statut.termine { background: rgba(107,114,128,0.15); color: var(--muted); }
.badge-statut.absent { background: rgba(239,68,68,0.15); color: var(--red); }
.badge-statut.retard { background: rgba(249,115,22,0.15); color: var(--accent); }

/* ── Animations ── */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### Ce que ça donne dans un composant :

```tsx
// BON — Tailwind = layout, classes CSS = style
<div className="staff-card p-4 flex items-center gap-4" data-status="en-cours">
  <div className="kpi-icon green flex items-center justify-center">🟢</div>
  <div className="flex-1">
    <h3 className="text-sm font-semibold">Sarah Lemoine</h3>
    <span className="badge-statut en-cours">En service</span>
  </div>
</div>

// MAUVAIS — tout en Tailwind inline
<div className="bg-[#151820] border border-[#252a3a] rounded-[14px] border-l-4 border-l-green-500 p-4 flex items-center gap-4">
```

### Règles concrètes :

1. **Jamais de couleur Tailwind inline** (`bg-[#151820]`, `text-orange-500`, `border-green-500`). Toujours via les variables CSS ou des classes dans `globals.css`.
2. **Un bloc de commentaire par module** dans `globals.css` : `/* ── Pointage : NomComposant ── */`
3. **Nommer les classes par composant** : `.pinpad-*`, `.staff-card-*`, `.kpi-*`, etc. Pas de noms génériques comme `.card` ou `.badge` qui pourraient entrer en conflit.
4. **`data-status` pour les variantes d'état** sur les éléments qui changent de style selon le statut (StaffCard, badges). Ça permet de modifier le style sans toucher au JSX.
5. **Les animations restent dans `globals.css`** via `@keyframes` — pas de CSS keyframes inline ni de Tailwind `animate-*` custom. Exception : les variants Framer Motion définis dans `lib/animations.ts`.
6. **Le CSS globals.css doit être auto-suffisant** pour le style : si tu supprimes toutes les classes Tailwind d'un composant, il doit garder son apparence (couleurs, typo, bordures) et ne perdre que son layout.

Cette architecture permet de **modifier le design system** (couleurs, arrondis, ombres) en ne touchant que `globals.css`, sans ouvrir un seul composant.

---

## Instructions

### Étape 0 — Lecture et compréhension

1. Lis `CLAUDE.md` (conventions du projet, design system, règles absolues).
2. Lis `docs/modules/POINTAGE_MODULE.md` en entier (spec du module, entités, routes, composants, séquence de commits).
3. Lis les fichiers existants pour comprendre les patterns en place :
   - `shiftly-api/src/Entity/Poste.php` (entité de référence)
   - `shiftly-api/src/Entity/Service.php` (statuts, relations)
   - `shiftly-api/src/Entity/User.php` (champs existants, rôles)
   - `shiftly-api/src/Controller/CreatePosteController.php` (pattern controller)
   - `shiftly-api/src/Service/PlanningService.php` (pattern service)
   - `src/hooks/useService.ts` (pattern hooks React Query)
   - `src/types/service.ts` et `src/types/planning.ts` (pattern types)
   - `src/components/planning/` (pattern composants)
4. **Ne code rien tant que tu n'as pas lu ces fichiers.** Tu dois comprendre les patterns avant de les reproduire.

### Étape 1 — Backend : Entités + Migration (commits 1 à 4)

1. Créer `shiftly-api/src/Entity/Pointage.php` — avec les champs et constantes de statut décrits dans la spec (section 2.1).
2. Créer `shiftly-api/src/Entity/PointagePause.php` — entité pause liée au pointage (section 2.2).
3. Ajouter le champ `codePointage` (VARCHAR 4, nullable) sur `User.php` — avec getter/setter (section 2.3). Attention : ne pas exposer ce champ dans les groups de sérialisation publics (pointage:read, poste:read). Uniquement dans `user:read`.
4. Créer la migration SQL qui crée les tables `pointage` et `pointage_pause`, et ajoute `code_pointage` + index unique `(centre_id, code_pointage)` sur `user` (section 3).

**Test :** `php bin/console doctrine:schema:validate` doit passer. La migration doit s'exécuter sans erreur.

**Commit après chaque fichier créé** (4 commits distincts).

### Étape 2 — Backend : Service + Repository (commits 5 à 10)

5. Créer `PointageRepository.php` — méthode `findByService(int $serviceId): array`.
6. Créer `PointageService.php` — méthode `genererPointagesDepuisPostes(Service $service)` (section 6).
7. Ajouter `calculerDureeEffective(Pointage $pointage): int` et `calculerTotalPauses(Pointage $pointage): int` (section 5).
8. Ajouter `estEnRetard`, `minutesRetard`, `calculerStats` (section 5).
9. Ajouter `cloturerService(Service $service): array` (section 5).
10. Ajouter `verifierCodePin(Pointage $pointage, ?string $codePin, bool $managerBypass): bool` — retourne true si OK, lève une exception si PIN incorrect/manquant (section 4.2).

**Test après chaque méthode :** vérifier que le service est injectable (`php bin/console debug:container PointageService`).

### Étape 3 — Backend : Controller (commits 11 à 15)

11. Route `GET /api/pointage/service/{serviceId}` — retourne les pointages (auto-génère si premier appel) + stats (section 4.1).
12. Route `POST /api/pointage/{id}/arrivee` — avec vérification PIN (section 4.2).
13. Route `POST /api/pointage/{id}/depart` — avec vérification PIN (section 4.3).
14. Routes `POST /api/pointage/{id}/pause/start` et `POST /api/pointage/{id}/pause/end` — avec vérification PIN (sections 4.4, 4.5).
15. Routes `POST /api/pointage/{id}/absence` et `POST /api/pointage/cloturer-service/{serviceId}` — manager only, pas de PIN (sections 4.6, 4.7).

**Test après chaque route :** tester avec `curl` ou Postman en local. Vérifier les cas nominaux ET les cas d'erreur (mauvais statut, mauvais PIN, pointage inexistant).

### Étape 4 — Frontend : Types + Hooks (commits 16 à 17)

16. Créer `src/types/pointage.ts` — tous les types décrits en section 7.
17. Créer `src/hooks/usePointage.ts` — tous les hooks décrits en section 8, avec `refetchInterval: 15_000` sur le hook principal.

**Test :** `npm run build` doit passer sans erreur TypeScript.

### Étape 5 — Frontend : Composants (commits 18 à 25)

18. `PointageHeader.tsx` — en-tête avec horloge live (setInterval 1s), badge service, date, indicateur "EN DIRECT" (section 9.1).
19. `PointageKpiRow.tsx` — 5 cartes KPI branchées sur les stats (section 9.2).
20. `PointagePinPad.tsx` — clavier numérique plein écran, 4 cercles, shake animation, verrouillage 3 tentatives, bypass manager (section 9.4). C'est le composant le plus important côté UX.
21. `PointageStaffCard.tsx` — carte employé avec 5 états visuels + bordure colorée + tri (section 9.3).
22. `PointageActionModal.tsx` — confirmation post-PIN, auto-dismiss 2s (section 9.5).
23. `PointageTimeline.tsx` — timeline chronologique des événements (section 9.6).
24. `PointageAlertPanel.tsx` — alertes calculées côté front (section 9.7).
25. `PointageCloturerModal.tsx` — modale clôture service.

**Test après chaque composant :** `npm run build` passe.

### Étape 6 — Frontend : Page + Navigation (commits 26 à 27)

26. Créer `src/app/(app)/pointage/page.tsx` — assembler tous les composants. La page détecte le service EN_COURS du jour via `useServiceToday()`, puis charge les pointages. Si pas de service → état vide. Accès MANAGER uniquement.
27. Ajouter "Pointage" (icône ⏱️) dans la Sidebar et la BottomNav mobile — avec badge dynamique (nombre de retards).

### Étape 7 — Test final (commit 28)

28. Vérifier le flow complet :
   - `npm run build` passe sans erreur
   - `php bin/console doctrine:schema:validate` OK
   - La page `/pointage` s'affiche avec le service du jour
   - Les cartes staff s'affichent avec les assignations de poste
   - Le PinPad s'ouvre au clic sur une carte
   - Les KPIs et la timeline se mettent à jour après chaque action
   - Le bypass manager fonctionne
   - La clôture du service ferme tous les pointages ouverts

---

## Gestion des problèmes

Si tu rencontres un problème pendant l'implémentation :

1. **Résous-le** — ne le contourne pas, ne le commente pas.
2. **Ajoute une section "13. Notes d'implémentation"** à la fin de `docs/modules/POINTAGE_MODULE.md` avec :
   - Le problème rencontré
   - La solution choisie
   - Le fichier/ligne concerné(e)
3. **Continue la séquence** — ne recommence pas depuis le début.

Exemples de problèmes prévisibles :
- **Conflit de migration** : si une migration existante touche déjà la table `user`, créer une migration séparée ou fusionner intelligemment.
- **IRI resolution API Platform** : si API Platform essaie de résoudre des IRI sur Pointage, utiliser un controller custom (comme `CreatePosteController` le fait déjà).
- **Types TypeScript** : si la réponse API ne match pas exactement les types prévus, adapter les types ET documenter l'écart dans la spec.
- **Composant > 150 lignes** : découper en sous-composants et documenter.

---

## Récapitulatif

| Phase | Commits | Quoi | Test |
|-------|---------|------|------|
| Lecture | — | Lire CLAUDE.md + POINTAGE_MODULE.md + fichiers existants | Compréhension |
| Backend entités | 1-4 | Pointage + PointagePause + User.codePointage + migration | `doctrine:schema:validate` |
| Backend service | 5-10 | PointageRepository + PointageService (6 méthodes + PIN) | `debug:container` |
| Backend controller | 11-15 | 7 routes API avec vérif PIN | `curl` sur chaque route |
| Frontend types/hooks | 16-17 | Types TS + hooks React Query | `npm run build` |
| Frontend composants | 18-25 | 8 composants dont PinPad | `npm run build` |
| Frontend page/nav | 26-27 | Page assemblée + navigation | `npm run build` |
| Test final | 28 | Flow complet | Build + schema + navigation |

**28 commits atomiques. Lis la spec avant de coder. Teste après chaque commit. Documente les écarts.**

Vas-y, commence par l'étape 0.
