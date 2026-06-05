# MVP — Registre du personnel

> Ajouter un module **Registre du personnel** (Art. L1221-13 et D1221-23 du Code du travail) accessible aux MANAGER depuis Réglages, avec fiche RH enrichie, gestion des sorties (date + motif) et export PDF.

## Contexte

Aujourd'hui l'entité `User` porte déjà l'essentiel pour l'opérationnel
(nom, prénom, email, rôle, contrat, dateEmbauche, équipement, PIN, actif).
Pour pouvoir servir de **registre du personnel** en cas de contrôle
(inspection du travail, URSSAF), il faut compléter avec l'état civil,
l'adresse, l'emploi contractuel et la traçabilité des sorties (date + motif),
puis exposer un **export PDF chronologique** conforme.

Décisions actées avec Kévin (cadrage) :
- **MVP minimum légal** : pas de NIR, pas d'IBAN, pas de documents, pas d'audit trail RH (V2 plus tard).
- **Tout dans `User`** : pas d'entité `EmployeeRecord` séparée pour cette V1 (compromis solo founder).
- **MANAGER only** pour lecture/écriture des nouveaux champs.
- **Sortie gérée via le toggle actif existant** dans `/staff` : désactivation → modale demande date + motif. Réactivation → garde le flow simple actuel + reset des champs sortie.
- **Adresse postale + téléphone + lieu de naissance (commune + département)** inclus dans le MVP.
- **Export PDF template Shiftly maison**, pas Cerfa (n'existe pas).

## Fichiers à lire avant de coder

- `docs/maquettes/registre-personnel.html` — 3 vues : page liste, modale fiche RH, modale sortie
- `docs/maquettes/registre-pdf-export.html` — template PDF cible
- `shiftly-api/src/Entity/User.php` — entité à étendre
- `shiftly-app/src/components/staff/ModalEditStaff.tsx` — patron à reprendre pour la fiche RH
- `shiftly-app/src/app/(app)/staff/page.tsx` — où vit le toggle actif actuel (ConfirmModal à remplacer par ModalSortie quand on désactive)
- `shiftly-app/src/app/(app)/reglages/page.tsx` — où ajouter l'item « Registre du personnel »
- `docs/architecture/modules/staff.md` — à mettre à jour à la fin
- `ENTITES.md` et `schema.sql` — à mettre à jour à la fin

## Tâche

### 1 · Backend — Entité `User` étendue

Ajouter 12 champs nullables à `User.php` (groupes Serializer indiqués entre parenthèses) :

- `dateNaissance` (date_immutable) — `user:read`, `user:write`
- `lieuNaissanceCommune` (string 120) — `user:read`, `user:write`
- `lieuNaissanceDepartement` (string 60) — `user:read`, `user:write`
- `sexe` (string 1, enum app `'M'|'F'`) — `user:read`, `user:write`
- `nationalite` (string 60) — `user:read`, `user:write`
- `emploi` (string 120) — `user:read`, `user:write` — intitulé contractuel, ≠ `role`
- `adresse` (string 255) — `user:read`, `user:write`
- `codePostal` (string 10) — `user:read`, `user:write`
- `ville` (string 120) — `user:read`, `user:write`
- `telephone` (string 20) — `user:read`, `user:write`
- `dateSortie` (date_immutable) — `user:read`, **`user:rh-write`**
- `motifSortie` (string 40) — `user:read`, **`user:rh-write`**

**`motifSortie` enum applicatif** (valeurs strings dans le code, pas d'enum Doctrine) :
`demission`, `rupture_conventionnelle`, `licenciement`, `fin_cdd`, `fin_periode_essai`, `retraite`, `autre`.

**Voter / contrôle d'accès** :
- Tous les nouveaux champs sont **lisibles** par MANAGER + soi-même (un employé peut voir sa propre fiche).
- Les nouveaux champs sont **écrivables uniquement par MANAGER** (`ROLE_MANAGER`). Ajouter une vérif dans le `UserStateProcessor` ou un Voter dédié si nécessaire.
- `dateSortie` / `motifSortie` ne sont **jamais** modifiables par l'employé sur sa propre fiche, même en self-edit.

**Migration Doctrine** : générer la migration sur MySQL local (pas SQLite — rappel règle 15). Vérifier que les colonnes ajoutées sont bien `nullable` pour éviter de casser les fixtures existantes. Mettre à jour `schema.sql` à la main avec le SQL équivalent MySQL.

**Validation** :
- `sexe` ∈ `{M, F, null}` (Assert\Choice)
- `motifSortie` ∈ valeurs de l'enum ou `null`
- `codePostal` : Assert\Regex `/^[0-9A-Z\- ]{2,10}$/` (laxe pour DOM-TOM et étrangers)
- `telephone` : libre, max 20 chars

### 2 · Backend — Endpoint export PDF

`GET /api/registre-personnel/export.pdf`

- Sécurité : `is_granted('ROLE_MANAGER')`
- Filtre automatiquement par `centre_id` du JWT (jamais de cross-tenant)
- Trie les salariés par `dateEmbauche ASC` (ordre chronologique légal)
- Inclut **tous** les salariés du centre, présents et sortis (actifs = true OU dateSortie ≤ 5 ans)
- Génère un PDF via la lib existante du projet (vérifier `composer.json` — `dompdf/dompdf` ou `knplabs/knp-snappy-bundle`). Si aucune n'est installée, installer `dompdf/dompdf` (plus simple, pas de binaire système).
- Template Twig dans `shiftly-api/templates/registre/export.html.twig` qui reproduit `docs/maquettes/registre-pdf-export.html` (HTML/CSS print). Couleurs en dur OK ici (pas la vraie app, c'est un PDF imprimable).
- Headers de réponse : `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="registre-personnel-{centre_slug}-{YYYYMMDD}.pdf"`

### 3 · Frontend — Item Réglages

Dans `shiftly-app/src/app/(app)/reglages/page.tsx`, ajouter un nouvel item de section visible uniquement si `user.role === 'MANAGER'` :

- Titre : « Registre du personnel »
- Sous-titre : « Liste chronologique des salariés · Export PDF conforme »
- Lien vers `/reglages/registre`
- Icône : pictogramme document ou bouclier conformité (cohérent avec le reste de la section)

### 4 · Frontend — Page `/reglages/registre`

Nouvelle route App Router protégée `MANAGER`. Reproduire **Vue 1** de la maquette :

- `Topbar` + bouton « Retour aux réglages »
- Hero avec stats (présents / sortis / total) + bouton « Exporter PDF »
- 3 tabs : **Actifs** (default) / **Tous** / **Sortis**
- Barre de recherche (nom, prénom, emploi, type de contrat)
- Table chronologique colonnes : `#` (rank), Salarié (avatar + nom + sexe + nationalité), Emploi, Contrat, Date entrée, Date sortie, Motif, Actions
- Lignes sortis : `opacity 0.55`
- Pas d'expand : clic sur la ligne ou sur ✎ ouvre `ModalRegistreFiche` (étape 5)
- Bandeau légal bleu en bas : « Conforme Art. L1221-13… »

Data : créer un hook `useRegistre()` qui appelle `GET /api/users?centre=...&pagination=false` (l'endpoint existe déjà), trie par `dateEmbauche ASC`, et expose les compteurs. Pas de nouveau endpoint nécessaire pour la liste.

Mutations : réutiliser `useUpdateStaff` existant. Bouton export : `window.open('/api/registre-personnel/export.pdf', '_blank')` (avec token JWT en query string si nécessaire — vérifier l'auth des routes binaires, sinon créer une fonction `downloadPdfWithAuth` dans `lib/api.ts`).

### 5 · Frontend — `ModalRegistreFiche`

Nouveau composant `shiftly-app/src/components/registre/ModalRegistreFiche.tsx`, copie enrichie de `ModalEditStaff` :

- Même coquille bottom-sheet 720px (cf. `ShiftModal`)
- Mêmes cartes existantes : Identité, Avatar, Contrat, Équipement, Accès
- **Ajouter une carte « État civil & adresse »** (cf. maquette Vue 2) avec :
  - `dateNaissance` (input date), `sexe` (radio-pills M/F)
  - `lieuNaissanceCommune` + `lieuNaissanceDepartement` (2 inputs)
  - `nationalite` (input)
  - `adresse`, `codePostal`, `ville`, `telephone`
- **Enrichir la carte « Contrat »** avec un champ `emploi` en haut (input texte large, label « Emploi (intitulé contractuel) », hint explicatif)
- Découper en sous-composant `StaffFormEtatCivil.tsx` (présentationnel, ≤150 lignes)
- Le contrat `onSave` ajoute les nouveaux champs ; mettre à jour `types/staff.ts` (interface `StaffMember`) en conséquence

### 6 · Frontend — `ModalSortie`

Nouveau composant `shiftly-app/src/components/registre/ModalSortie.tsx` qui **remplace `ConfirmModal`** dans `/staff/page.tsx` **uniquement** quand on désactive (pas en réactivation).

- Bottom-sheet 480px (cf. maquette Vue 3)
- Warning rouge en haut : conservation 5 ans, données préservées
- Champ `dateSortie` (input date, default = aujourd'hui)
- Champ `motifSortie` (radio-pills 7 valeurs)
- Champ note interne libre (optionnel, stockée nulle part en V1 — placeholder UX, on l'implémentera quand on aura l'audit trail)
- Footer : Annuler / Confirmer la sortie (bouton rouge)

Au confirm, mutation `useUpdateStaff` avec `actif: false`, `dateSortie`, `motifSortie`. À la réactivation (toggle ON sur un sorti), reset `dateSortie: null` et `motifSortie: null` automatiquement côté front.

### 7 · Mises à jour docs

À la fin :
- `docs/architecture/modules/staff.md` (ou nouveau `docs/architecture/modules/registre.md` si > 50 lignes ajoutées) — décrire les 12 nouveaux champs, le nouveau endpoint export, le Voter
- `ENTITES.md` — mettre à jour la fiche `User`
- `schema.sql` — ajouter les 12 colonnes
- `CLAUDE.md` — mettre à jour la table des modules/routes avec `/reglages/registre`

## Notes techniques

- Préfixes Tailwind autorisés : **uniquement `tablet:` et `desktop:`**
- Aucune couleur hardcodée — tokens design system (`bg-surface`, `text-accent`, etc.)
- Aucun `any` TypeScript
- Toute fetch via React Query (jamais `useEffect` + `fetch`)
- 3 états par composant (loading | error | empty)
- Commits atomiques en français, **un commit par étape** (1 backend entité, 2 backend export, 3 reglages item, 4 page liste, 5 modale fiche, 6 modale sortie, 7 docs)
- **Ne PAS push** — Kévin push

## Ce que ce prompt ne fait PAS

- Pas de scan / upload de documents (CNI, titre séjour, contrat signé) → V2
- Pas d'audit trail RH (qui a modifié quoi quand) → V2
- Pas de NIR, pas d'IBAN, pas de visite médicale → V2 ou V3
- Pas de notification d'expiration de titre de séjour → V2
- Pas de séparation `EmployeeRecord` vs `User` → V2 si justifié par la complexité

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque étape

```bash
cd shiftly-api && php bin/console doctrine:migrations:status
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels manuels

- [ ] Migration Doctrine s'applique sans erreur sur MySQL local **et** dispose d'un `down()` qui rollback proprement
- [ ] Création d'un User via Modale RH avec tous les nouveaux champs → relecture API renvoie les champs corrects
- [ ] Edit d'un User par un EMPLOYE sur **sa propre** fiche : il ne peut PAS modifier `dateSortie` / `motifSortie` (retour 403 ou champs ignorés)
- [ ] Edit d'un User par un MANAGER : tous les champs OK
- [ ] Désactivation d'un actif depuis `/staff` → `ModalSortie` s'affiche → confirme avec date + motif → ligne passe en grisé dans `/reglages/registre` tab « Sortis »
- [ ] Réactivation : `ConfirmModal` simple, `dateSortie` et `motifSortie` repassent à null
- [ ] Export PDF : ouvre le fichier, vérifier ordre chronologique, présence de tous les salariés, header centre OK, signature en pied
- [ ] Un MANAGER d'un autre centre **ne voit pas** les salariés du premier centre dans l'export PDF (test multi-tenant)
- [ ] La page `/reglages/registre` n'est PAS accessible à un EMPLOYE (redirect ou 403)

### Critères d'acceptation

- [ ] Tous les nouveaux composants ≤ 150 lignes (règle 3)
- [ ] Aucun `any`, aucun `useEffect` pour appels API
- [ ] `npm run build` passe (front), `php bin/console cache:clear --env=prod` passe (back)
- [ ] `schema.sql`, `ENTITES.md`, `CLAUDE.md` et la doc architecture du module sont à jour
- [ ] Migration testée sur MySQL (pas SQLite), pas de `__temp__` table, pas de `"user"` quoté SQLite-style

### Auto-relecture du diff

`git diff` relu en hostile :
- L'ordre `ORDER BY dateEmbauche ASC` est-il bien appliqué dans la query export ?
- Le filtre `centre_id` est-il appliqué côté backend ET front (pas seulement front) ?
- Un employé qui POST sur sa propre fiche avec `dateSortie` dans le body, est-ce bien ignoré par le Voter / serializer ?
- Le PDF supporte-t-il les caractères accentués (UTF-8 dompdf) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. 7 commits atomiques (`feat(registre): ...`, `feat(api): ...`, etc.).
2. Rapport de vérification avec cases cochées + screenshots de la page registre et du PDF.
3. Tu push pas. Kévin push.
