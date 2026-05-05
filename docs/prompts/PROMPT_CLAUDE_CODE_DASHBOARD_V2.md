# Refonte V2 du Dashboard — Hero, KPIs, Progression équipe

> Refondre 3 zones du dashboard manager : hero "Service en cours", grille KPIs (6 → 4), panneau staff (renommé + condensé).

## Contexte

Le dashboard manager a été retravaillé en maquette V2. Le hero passe d'un bloc minimaliste (horaires + cercle) à un cockpit qui affiche la progression par zone et l'équipe en service. Les KPIs sont réduits à 4 cartes plus actionnables avec tags contextuels. Le panneau "Top Staff" devient "Progression équipe" et n'affiche plus que les 5 premiers.

**Hors scope** : `IncidentsList` (inchangé), section Alertes (futur prompt — les données affichées dans la maquette V2 sont mockées), bloc "Notifications · Bientôt disponible" (à supprimer de la page).

## Décisions actées

- **Progression globale** = `COUNT(missions complétées du service du jour) / COUNT(missions totales du service du jour)`, toutes zones confondues. Affichage en **cercle rempli** (l'élément circulaire actuel du `HeroService.tsx` est conservé, ne le remplace pas par une barre).
- **Tri zones** : `progression ASC` (zone la plus en retard en haut), tie-break `nom ASC`.
- **Layout zones** :
  - mobile (`<768px`) → 1 colonne
  - tablette (`md:` 768-1199) → 2 colonnes
  - desktop (`lg:` 1200+) → 1 zone : 1 col / 2 ou 4 zones : 2 col / 3 ou 5+ zones : 3 col
- **KPIs gardés** : Tâches du jour (5/18) · Staff actifs · Incidents ouverts · Tutos lus équipe.
- **KPIs supprimés** : Moy. complétion services, Points staff actif, Missions du service.
- **Tags KPIs** (coin sup. droit) : `En cours` (Tâches), `+N ce mois` (Staff), `À traiter` (Incidents), `Moy. équipe` (Tutos).
- **Calcul `+N ce mois`** : nombre de `User` du centre dont `createdAt >= start of month` (mois calendaire en cours, fuseau Europe/Paris).
- **Manager responsable** : utiliser la relation existante `Service.managers` (`Collection<User>`, join table `service_manager`). Pas de nouvelle entité, pas de nouveau champ.
- **Progression équipe** : 5 entrées max, plus de toggle Tous/Employés, lien `Voir tout →` vers `/staff`.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment 14 multi-tenancy + 15 migrations)
- `DESIGN_SYSTEM.md` — tokens couleurs zones, animations Framer Motion
- `shiftly-app/src/app/(app)/dashboard/page.tsx` — orchestration page, supprimer le bloc Notifications
- `shiftly-app/src/components/dashboard/HeroService.tsx` — V1 à refondre (le cercle de progression est à conserver tel quel)
- `shiftly-app/src/components/dashboard/KPIGrid.tsx` — grille à passer de 6 à 4 cartes
- `shiftly-app/src/components/dashboard/StaffRanking.tsx` — à renommer/condenser
- `shiftly-api/src/Controller/DashboardController.php` — endpoint à enrichir (zones, manager, staff en service)
- `shiftly-app/src/types/dashboard.ts` — types front à mettre à jour

## Tâche

### Backend
1. Dans `DashboardController.php`, enrichir l'objet `service.today` du payload avec :
   - `zones: { id, nom, couleur, completed, total, pct }[]` triées par `pct ASC` puis `nom ASC`. `pct` est un float arrondi à 1 décimale (ex 17.4). Gérer `total === 0` → `pct = 0`.
   - `managersResponsables: { id, nom, prenom }[]` — issus de `Service::getManagers()` sur le service du jour (relation existante, join table `service_manager`). Vide si aucun assigné.
   - `staffEnService: { id, nom, prenom, avatarColor }[]` — users distincts ayant un `Poste` sur le service du jour (déduplication si plusieurs postes pour le même user).
2. Sur la racine `staff` du payload, ajouter `nouveauxCeMois: number` — `User` du centre avec `createdAt >= first day of current month` (fuseau Europe/Paris).
3. Multi-tenancy : tout requêter via `centre_id` du JWT, jamais de fuite cross-tenant.

### Frontend
4. Refondre `HeroService.tsx` :
   - Layout : badge statut (`LIVE` animé pulse Framer Motion si `EN_COURS`) + libellé "Service du jour"
   - Bloc gauche : nom du jour `font-syne` gros + horaires + ligne `<Prénom(s)> (Manager responsable)` en muted (join `, ` si plusieurs ; rien si vide)
   - **Garder le cercle de progression globale** (déjà implémenté lignes 89-128 du fichier actuel) — repositionne-le si nécessaire mais conserve l'arc SVG, le gradient et le pourcentage centré
   - Section zones triées sous le bloc principal avec layout adaptatif (cf. Décisions actées)
   - Section "En service" en bas du card avec avatars du `staffEnService` + count `N membres actifs`
5. `KPIGrid.tsx` : passer à `grid-cols-2 lg:grid-cols-4`, supprimer les 3 KPIs listés, ajouter la prop `tag` à `StatCard` si elle n'existe pas (ou réutiliser `trend`) pour afficher le tag contextuel en coin sup. droit. Le tag du KPI Staff actifs affiche `+${staff.nouveauxCeMois} ce mois` ou rien si 0.
6. `StaffRanking.tsx` : titre `Progression équipe`, retirer le toggle (lignes ~30-51), `topStaff.slice(0, 5)`, conserver le lien `Voir tout →`.
7. Dans `page.tsx` : supprimer le bloc `<Panel title="Notifications">` (lignes ~136-144) — l'Alertes V2 sera traité dans un prompt séparé.

### Types
8. Mettre à jour `types/dashboard.ts` : ajouter `zones`, `managersResponsables`, `staffEnService` sur le type du service du jour, et `nouveauxCeMois` sur le type staff. Aucun `any`.

### Documentation
9. Mettre à jour `ARCHITECTURE.md` (composants modifiés) et `DESIGN_SYSTEM.md` (layout adaptatif zones documenté).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
php bin/console doctrine:schema:validate
php bin/console lint:container
# Frontend
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Connecté en MANAGER, `/dashboard` affiche le hero V2 avec zones triées par % croissant
- [ ] Test à 1 zone (centre fictif) → layout 1 colonne en desktop
- [ ] Test à 3 zones (Bowling Central) → layout 3 colonnes en desktop, 2 en tablette, 1 en mobile
- [ ] Test à 4 zones → layout 2×2 en desktop
- [ ] Service `EN_COURS` → badge LIVE animé visible. Service `PLANIFIE` → pas de LIVE.
- [ ] KPIs : 4 cartes en ligne sur desktop, tags contextuels visibles, plus de "Points staff actif" ni "Missions du service"
- [ ] Panneau staff : titre "Progression équipe", 5 entrées max, plus de toggle, lien `Voir tout →` fonctionne
- [ ] Bloc Notifications supprimé de la page

### Critères d'acceptation
- [ ] Cercle de progression globale conservé (composant SVG arcGradient inchangé)
- [ ] Aucune couleur hardcodée — `var(--accent)` / `var(--blue)` / etc.
- [ ] Aucun `any`, tous les nouveaux champs typés
- [ ] Loading + error + empty gérés sur le hero (notamment si `today` null)
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] `npm run build` + `doctrine:schema:validate` passent
- [ ] `useDashboard` n'est pas dupliqué — un seul fetch enrichi

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : régression silencieuse sur l'IncidentsList ? scope creep sur la section Alertes ? `staffEnService` qui leak entre tenants ? Calcul `pct` qui divise par zéro si `total === 0` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques au format `type(scope): summary` :
   - `feat(api): enrichir DashboardController avec zones/manager/staffEnService`
   - `feat(dashboard): refonte HeroService V2 avec zones triées et équipe en service`
   - `refactor(dashboard): KPIGrid passe de 6 à 4 cartes avec tags`
   - `refactor(dashboard): renomme Top Staff en Progression équipe (5 entrées max)`
   - `chore(dashboard): supprime bloc Notifications placeholder`
   - `docs: maj ARCHITECTURE et DESIGN_SYSTEM pour V2 dashboard`
2. Rapport de vérif (cases cochées + preuves de tests à 1/3/4 zones).
3. Tu push pas. Kévin push.
