# Refonte page Staff (v2) — fusion avec editeur-staff

> Refondre `/staff` en vraie table desktop avec lignes expandables riches, absorber `/reglages/editeur-staff`, supprimer `ModalStaffCompetences` au profit d'un toggle direct, et ajouter les champs BDD manquants (ancienneté + tenue).

## Contexte
Kévin a validé une nouvelle maquette desktop. Aujourd'hui `/staff` (cards mobiles, lecture) et `/reglages/editeur-staff` (CRUD admin) sont deux écrans séparés. La cible : un écran unique `/staff` qui couvre lecture + édition pour le manager, lecture limitée pour l'employé. Maquettes de référence : `docs/maquettes/staff-v2.html` (manager) et `docs/maquettes/staff-v2-employe.html` (employé).

## Décisions actées (à ne pas remettre en cause)
- **Niveau** = calculé front, 4 paliers : `<30% Débutant · 30-60% Intermédiaire · 60-90% Confirmé · ≥90% Avancé` (basé sur `acquises / competencesTotal`).
- **Ancienneté** = calculée front depuis `User.dateEmbauche` (nouveau champ DATE nullable).
- **Tenue** = 3 champs sur `Centre` : `tenueHaut`, `tenueBas`, `tenueChaussures` (VARCHAR(120) nullable).
- **Compétences** = toggle direct au clic sur la ligne expandée (POST/DELETE existants `/editeur/staff/:id/competences`). **Suppression de `ModalStaffCompetences`**.
- **Vue employé** = même page, masquages conditionnels via `isManager` + `isSelf`. Pas de fichier dupliqué.
- **API `/staff`** : pour un employé, **omettre** `typeContrat`, `heuresHebdo`, `dateEmbauche`, `codePointage` des autres membres (renvoi `null`). Garder pour son propre user.
- **Filtre zone** dans les tabs **supprimé**. Tabs : `Tous · Managers · Membres`.
- **Statut de présence** (point vert sur avatar) **retiré**.
- **Date dans la topbar** = décorative (formatée `EEE. d MMM` via date-fns/locale fr).
- **Mobile** = flex-wrap des colonnes (cf maquettes). Pas de redesign card spécifique.

## Fichiers à lire avant de coder
- `CLAUDE.md` — règles 1-15 (multi-tenancy, Voters, **règle 15 migration**).
- `docs/maquettes/staff-v2.html` + `staff-v2-employe.html` — la cible visuelle exacte.
- `shiftly-app/src/app/(app)/staff/page.tsx` — page actuelle à refondre.
- `shiftly-app/src/app/(app)/reglages/editeur-staff/page.tsx` — à supprimer après migration des fonctions.
- `shiftly-app/src/components/staff/*.tsx` — composants existants à réutiliser/refondre.
- `shiftly-api/src/Entity/User.php` + `Centre.php` — entités à étendre.
- `shiftly-api/src/Controller/` (le controller staff) — endpoint `/staff` à ajuster.

## Tâche

### 1 — Backend (Symfony)
1. Ajouter `User.dateEmbauche` (DATE, nullable). Ajouter `Centre.tenueHaut`, `tenueBas`, `tenueChaussures` (VARCHAR(120), nullable).
2. Générer une migration **MySQL** (pas SQLite, cf règle 15). Vérifier la portabilité PostgreSQL (pas de `__temp__` table, pas d'identifiants SQLite-quotés).
3. Étendre l'endpoint `/staff` :
   - Ajouter `dateEmbauche` au payload manager + au payload de soi-même côté employé. **Omettre** sinon (et `typeContrat`, `heuresHebdo`, `codePointage`).
   - Ajouter dans `meta` : `competencesParZone: { [zoneName]: { total: number, couleur: string } }`. Calculer en SQL ou via repository (groupé par zone du centre courant).
   - Garder le filtre Voter par `centre_id`.
4. Mettre à jour les fixtures Alice : ajouter `dateEmbauche` aléatoire (entre -5 ans et -1 mois) sur tous les `User`. Renseigner les 3 champs `tenue*` sur le Centre pilote.
5. Conserver les routes `/editeur/staff` (POST/PATCH/DELETE + compétences) — elles restent appelées par la page refondue.

### 2 — Frontend (Next.js)
6. Étendre `src/types/staff.ts` :
   - `StaffMember` : ajouter `dateEmbauche: string | null`.
   - `StaffMeta` : ajouter `competencesParZone: Record<string, { total: number; couleur: string }>` et `tenueHaut`, `tenueBas`, `tenueChaussures` du centre.
7. Créer `src/components/staff/SkillTag.tsx` (toggle on/off, couleur par zone, appel `POST/DELETE /editeur/staff/:id/competences` via `useMutation`, optimistic update).
8. Créer `src/components/staff/MemberRow.tsx` — ligne table desktop, props `member`, `meta`, `isManager`, `isSelf`, `isExpanded`, `onToggle`. Calcul du niveau (4 paliers) + ancienneté inline.
9. Créer `src/components/staff/MemberPanel.tsx` — panel expandé (skills par zone, contrat conditionnel, tutoriels, tenue, boutons Modifier/Désactiver/Ajouter compétence).
10. Refondre `src/app/(app)/staff/page.tsx` : nouveau layout (topbar + hero + tabs sans zone + table). Réutiliser `ModalEditStaff` pour le bouton "Modifier la fiche". Ajouter `ConfirmModal` pour "Désactiver".
11. **Supprimer** : `MemberCard.tsx`, `MemberCardExpanded.tsx`, `ModalStaffCompetences.tsx`, `StatsRow.tsx` (remplacé par le hero), `FilterTabs.tsx` (remplacé par les nouveaux tabs simplifiés).
12. **Supprimer** la page `src/app/(app)/reglages/editeur-staff/page.tsx`. Retirer le lien "Gestion du staff" dans `ManagerLinks` de `/reglages/page.tsx` (cf `shiftly-app/src/components/reglages/`).
13. Mettre à jour `useStaff.ts` si la signature de réponse change. Pas de nouveau hook si possible.
14. Le bouton "Désactiver" déclenche un `ConfirmModal`. "Ajouter une compétence" scroll vers la grille de skills + applique un highlight 1.5s sur la première skill non acquise.

### 3 — Documentation
15. Mettre à jour `ARCHITECTURE.md` (route editeur-staff supprimée, nouveaux composants).
16. Mettre à jour `DESIGN_SYSTEM.md` (nouveaux composants `MemberRow`, `MemberPanel`, `SkillTag`, dégradés niveau).
17. Mettre à jour `schema.sql` (4 nouveaux champs).
18. Mettre à jour `ENTITES.md` si présent (User + Centre).

## Ce qu'il ne fait PAS
- Pas d'export Excel/PDF du staff.
- Pas d'historique d'évolution des compétences.
- Pas de modification du module `/postes`, `/tutoriels`, `/reglages` (hors retrait du lien staff).
- Pas de nouvelle convention API (REST custom maintenu sur `/editeur/staff/...`).

## Notes techniques
- **Migration** : règle 15 du `CLAUDE.md` impérative. Lance la migration sur MySQL local, jamais en SQLite. Vérifie portabilité PostgreSQL avant push (Railway).
- **Filtrage rôle dans l'API** : ne fais PAS le masquage uniquement côté front. Les champs sensibles doivent être absents du payload pour les non-managers, sinon fuite via DevTools.
- **Optimistic update sur `SkillTag`** : invalider la query `useStaff` après succès pour rafraîchir `staffCompetences[]` et `points` du membre.
- **Niveau** : helper pur dans `lib/staff.ts` → `calculerNiveau(acquises: number, total: number): { palier: 1|2|3|4; label: string }`. Testable.
- **Ancienneté** : helper pur dans `lib/staff.ts` → `calculerAnciennete(dateEmbauche: string | null): string | null` (formatte "X ans" / "X mois" / `null`).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
cd shiftly-api && php bin/console doctrine:schema:validate && php bin/console lint:container
# Frontend
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Login manager → `/staff` charge → header "Staff · Roster, compétences & contrats" + hero orange + tabs visibles.
- [ ] Clic sur une ligne → expand. Clic sur une autre ligne → la précédente se ferme.
- [ ] Clic sur une skill non acquise (ligne expandée) → toggle vers acquise, compteur `X/Y` + `%` mis à jour, points du membre mis à jour, BDD `staff_competence` insérée.
- [ ] Clic sur une skill acquise → toggle vers non acquise, ligne `staff_competence` supprimée.
- [ ] Bouton "Modifier la fiche" → ouvre `ModalEditStaff` avec les valeurs (incl. `dateEmbauche`).
- [ ] Bouton "Désactiver" → `ConfirmModal` → `actif=false` en BDD, ligne grisée.
- [ ] Bouton "+ Ajouter un membre" (hero) → ouvre `ModalEditStaff` vide.
- [ ] Login employé → `/staff` charge → pas de bouton "+ Ajouter", payload réseau **ne contient pas** `typeContrat`/`heuresHebdo`/`dateEmbauche` des autres membres (vérifier dans DevTools Network).
- [ ] Login employé → sa propre ligne a la bordure orange + badge "Vous" + contrat visible + bouton "Modifier mon profil" → `/reglages`.
- [ ] Login employé → clic sur skill d'un autre membre → **rien ne se passe** (lecture seule).
- [ ] `/reglages/editeur-staff` → 404 ou redirige vers `/staff`. Lien "Gestion du staff" disparu de `/reglages`.
- [ ] Resize fenêtre < 980px → sidebar masquée, colonnes empilées via flex-wrap, panel skill en 1 colonne, info-row en 1 colonne.
- [ ] Niveau calculé : créer un user avec 0 compétences → "Débutant", 100% → "Avancé".
- [ ] Ancienneté : `dateEmbauche` à -3 ans → "3 ans" affiché. Null → ligne masquée.

### Critères d'acceptation
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (notamment 1, 2, 5, 8, 12, 14, 15).
- [ ] `MemberCardExpanded.tsx`, `ModalStaffCompetences.tsx`, `editeur-staff/page.tsx` supprimés du repo.
- [ ] `npm run build` + `doctrine:schema:validate` passent.
- [ ] Migration testée sur MySQL local — appliquée sans erreur, rollback `migrate:prev` fonctionne.
- [ ] `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql`, `ENTITES.md` mis à jour dans le même chantier.

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Régression silencieuse sur la modale d'édition (avatar palette, code PIN, mot de passe) ?
- Aucun champ sensible employé fuite côté API ?
- Aucune migration SQLite-style (`__temp__`, identifiants quotés) ?
- Pas de `useEffect` pour les appels API (règle 5) ?
- Restart `npm run dev` recommandé dans la livraison (≥ 5 fichiers shiftly-app touchés).

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par étape : `feat(staff)`, `refactor(staff)`, `chore(reglages)`, `docs(architecture)`. Conventional Commits.
2. Rapport : cases cochées + lien vers les nouveaux fichiers + notes de risque (migration BDD à appliquer manuellement sur Railway).
3. Restart obligatoire : `pkill node; rm -rf shiftly-app/.next; cd shiftly-app && npm run dev` à mentionner dans la livraison.
4. Tu push pas. Kévin push.
