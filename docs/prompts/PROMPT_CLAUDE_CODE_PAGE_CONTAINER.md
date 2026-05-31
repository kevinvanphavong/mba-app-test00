# Standardisation des conteneurs de page (PageContainer / PageContainerFull)

> Créer deux composants layout réutilisables et migrer toutes les pages `(app)/` dessus pour homogénéiser la largeur max et le padding.

## Contexte
Aujourd'hui chaque page de `src/app/(app)/` réimplémente son propre wrapper (padding + max-width + mx-auto) avec des valeurs incohérentes (`max-w-[1400px]` sur `/postes`, `max-w-2xl` sur `/services`, rien sur `/dashboard`, etc.). Seul `/postes` cadre proprement le contenu en desktop. On veut deux primitives explicites : `PageContainer` (max 1400px, centré — défaut) et `PageContainerFull` (pleine largeur — opt-in pour planning / opérationnel).

## Fichiers à lire avant de coder
- `CLAUDE.md` — règles absolues 1, 3, 4, 13, 14
- `DESIGN_SYSTEM.md` — section conteneurs / spacing (à compléter)
- `shiftly-app/src/app/(app)/postes/page.tsx` — ligne 144, conteneur de référence
- `shiftly-app/src/app/(app)/layout.tsx` — wrapper global (à NE PAS modifier)
- `shiftly-app/src/components/layout/` — emplacement cible des deux composants

## Décisions actées
| Page | Conteneur | Raison |
|---|---|---|
| `/dashboard` | `PageContainer` | KPIs + cards, illisible si trop étiré |
| `/postes` | `PageContainer` | Référence existante |
| `/staff` | `PageContainer` | Liste + détail centrés |
| `/tutoriels` | `PageContainer` | Lecture |
| `/reglages` + sous-pages (`editeur`, `support`, `horaires`, `incidents`) | `PageContainer` | Forms / paramétrage |
| `/service` | `PageContainerFull` | Outil opérationnel temps réel |
| `/services` | `PageContainerFull` | Planning hebdo (aujourd'hui à tort en `max-w-2xl`) |
| `/planning` | `PageContainerFull` | Grille temporelle |
| `/pointage` | **ne pas toucher** | Kiosk mode, layout dédié |
| `/pointage/validation` | `PageContainerFull` | Tableau dense colonnes jours |

Padding standard pour les deux : `px-4 pt-6 pb-28 desktop:px-7 desktop:pt-8 desktop:pb-10`. Différence unique : `desktop:max-w-[1400px] desktop:mx-auto` pour `PageContainer`.

## Tâche
1. Créer `shiftly-app/src/components/layout/PageContainer.tsx` — typage strict, prop `children: ReactNode`, prop optionnelle `className?: string` (mergée via `clsx`/`twMerge` si déjà dispo, sinon template literal). Classe de base : `w-full px-4 pt-6 pb-28 desktop:px-7 desktop:pt-8 desktop:pb-10 desktop:max-w-[1400px] desktop:mx-auto`.
2. Créer `shiftly-app/src/components/layout/PageContainerFull.tsx` — même API. Classe : `w-full px-4 pt-6 pb-28 desktop:px-7 desktop:pt-8 desktop:pb-10`.
3. Migrer chaque page du tableau ci-dessus : remplacer le `<div className="...padding+max-w...">` racine par `<PageContainer>` ou `<PageContainerFull>`. Conserver tout autre wrapper interne (`space-y-*`, etc.) en passant via `className` si pertinent, ou en gardant un `<div>` enfant.
4. Vérifier les **trois états** (loading / error / empty) de chaque page : ils doivent aussi être rendus à l'intérieur du conteneur (sinon le skeleton s'étale en full width par accident).
5. Mettre à jour `DESIGN_SYSTEM.md` : ajouter une section "Conteneurs de page" qui documente les deux composants, leur padding, leur largeur max, et la règle de décision (contained par défaut, full pour planning / opérationnel temps réel / kiosk).
6. Mettre à jour `ARCHITECTURE.md` si la section "Composants layout" liste explicitement les composants — y ajouter `PageContainer` et `PageContainerFull`.

## Ce qu'il ne fait PAS
- Ne touche pas `(app)/layout.tsx` — le wrapping reste page-level pour rester explicite.
- Ne touche pas `/pointage/page.tsx` (kiosk mode plein écran).
- Ne touche pas `/superadmin/*` ni `/login` (layouts distincts).
- Ne change pas les paddings internes des composants enfants (`PosteCard`, `MissionRow`, etc.).
- N'introduit pas de prop `variant` unique sur un composant unique : on garde **deux composants distincts** pour rendre l'intention lisible à la lecture du JSX.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (manuel, desktop ≥ 1600px)
- [ ] `/dashboard` : contenu centré, marges égales à gauche et à droite, max ~1400px
- [ ] `/postes` : aspect identique à l'avant-refacto (régression zéro)
- [ ] `/staff`, `/tutoriels`, `/reglages` : contenu centré 1400px
- [ ] `/service` : contenu prend toute la largeur restante après la Sidebar
- [ ] `/services`, `/planning`, `/pointage/validation` : pleine largeur
- [ ] Mobile (< 500px) : tous padding `px-4`, aucun débordement horizontal
- [ ] Tablet (500–899px) : layout identique au mobile, pas de cassure

### Critères d'acceptation
- [ ] `PageContainer.tsx` et `PageContainerFull.tsx` créés, < 30 lignes chacun
- [ ] Toutes les pages du tableau migrées (recherche `grep -rn "max-w-\[1400px\]" shiftly-app/src/app` ne doit plus rien retourner hors composant)
- [ ] `DESIGN_SYSTEM.md` documente les deux composants
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (notamment : pas de hardcode couleur, pas de `any`, mobile-first)
- [ ] `npm run build` passe sans warning nouveau

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : une page a-t-elle perdu son `space-y-*` ou son `pb-28` mobile ? Un wrapper interne a-t-il été supprimé par erreur ? Le skeleton/empty/error state est-il toujours rendu dans le conteneur ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par étape :
   - `feat(layout): ajoute PageContainer et PageContainerFull`
   - `refactor(pages): migre <page> sur PageContainer[Full]` (un commit par page OU un commit groupé "pages contained" + un commit "pages full")
   - `docs: documente PageContainer dans DESIGN_SYSTEM`
2. Rapport de vérification (cases cochées + capture avant/après desktop si possible)
3. Note de risque : régressions de spacing possibles sur pages avec `space-y-*` racine — à tester visuellement page par page
4. Tu push pas. Kévin push.
