# Fix Service du Jour — 5 améliorations UX

> Sur `/service` (vue Manager + Employé) : ajouter pli/déplie des cards zones, réduire la police des horaires en mobile, agrandir la vignette de preuve photo, vérifier le flow upload/affichage photo, et ajouter une étape de confirmation avant décochage d'une mission photo.

## Contexte

Page `/service` (Service du Jour) en prod, plusieurs frictions UX remontées par Kévin :
- Les cards zones sont longues quand il y a beaucoup de missions → besoin de plier toute la card depuis son header.
- Les horaires du service (HeroServiceCard, `text-[22px]`) débordent en mobile sur certains formats (ex : `06h00 → 02h00`).
- La vignette photo de preuve (28×28px actuellement) est trop petite pour reconnaître ce qui a été photographié, surtout en mobile où l'écran est plus grand.
- Le décochage d'une mission photo est un toggle direct → risque de perdre une preuve par tap accidentel.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (notamment Tailwind `tablet:`/`desktop:` uniquement, anim Framer Motion only)
- `shiftly-app/src/components/service/ZoneCard.tsx` — cards par zone (pli/déplie partiel actuel ligne 36 + 113-158)
- `shiftly-app/src/components/service/HeroServiceCard.tsx` — bloc horaires ligne 74-81
- `shiftly-app/src/components/service/MissionItem.tsx` — vignette photo ligne 136-160 + handleClick ligne 48-55
- `shiftly-app/src/components/service/MissionPhotoCaptureModal.tsx` — flow upload (compress + multipart)
- `shiftly-app/src/components/shared/AuthImage.tsx` + `shiftly-api/src/Controller/CompletionController.php` — flow affichage photo (302 vers URL signée R2)
- `shiftly-app/src/components/ui/ConfirmModal.tsx` — modal générique (à étendre OU s'en inspirer pour le nouveau modal de décochage avec photo)

## Décisions actées (ne pas remettre en cause)

- **Pli/déplie** : un seul état booléen `expanded` par card, bouton chevron dans le header (à droite, après le badge `done/total`). Quand replié : on cache la liste missions ET le bouton "+ Ajouter une mission ponctuelle" ET le dégradé de coupure. On garde visible : header, barre progression, staff. **Supprime** le système "X missions de plus" en bas (ligne 144-158) — remplacé par le bouton du header. Par défaut : **toutes les cards dépliées au mount** (preserve l'usage actuel pour les zones courtes).
- **Vignette photo** : `w-[44px] h-[44px]` en mobile (default), `tablet:w-[36px] tablet:h-[36px]`. (Plus grand en mobile, plus compact en tablet/desktop, comme demandé.) Reste cliquable pour ouvrir la lightbox plein écran.
- **Confirmation décochage** : modal dédié `ModalConfirmUncheckPhoto.tsx` (pas `ConfirmModal` générique car on veut afficher la miniature photo + texte mission). Variant danger, bouton confirme = "Décocher la mission". Déclenchée uniquement si `mission.requiresPhoto && completed` au clic.
- **Horaires mobile** : `text-[18px] tablet:text-[22px]` sur le bloc numérique, flèche `text-[12px] tablet:text-[14px]`.

## Tâche

1. **Pli/déplie ZoneCard** (`ZoneCard.tsx`) :
   - Ajouter un bouton chevron dans le header (ligne 42-56) à droite du badge `%`. Icône `▼` quand déplié, `▶` quand replié. Tap → toggle `expanded`.
   - Refacto du state : `expanded` initialisé à `true` (au lieu de `false`). Quand `!expanded` : ne pas render le bloc missions (ligne 102-159) du tout (ou render avec `height: 0` via motion).
   - Supprimer le toggle "X missions de plus" en bas (ligne 144-158) et le dégradé associé (ligne 138-141).
   - Le bloc staff (ligne 65-99) reste **visible dans tous les cas** (utile pour identifier qui est dans la zone).
   - Animer la transition avec Framer Motion (déjà utilisé dans le fichier).

2. **Horaires mobile** (`HeroServiceCard.tsx` ligne 74-81) :
   - `text-[22px] leading-none` → `text-[18px] tablet:text-[22px] leading-none`.
   - Flèche `text-[14px]` → `text-[12px] tablet:text-[14px]`.
   - Tester sur format long « 06h00 → 02h00 » à 320px de viewport.

3. **Vignette photo plus grande** (`MissionItem.tsx` ligne 137-160) :
   - `w-[28px] h-[28px]` → `w-[44px] h-[44px] tablet:w-[36px] tablet:h-[36px]`.
   - `rounded-[6px]` → `rounded-[8px]` (cohérent avec la nouvelle taille).
   - Vérifie que le `<button>` parent garde `items-start` → la vignette ne fait pas grandir la hauteur de la ligne au-delà du raisonnable. Si nécessaire, ajuster `mt-` pour aligner verticalement avec le texte.

4. **Vérif upload + affichage photo** (PAS de code à écrire, sauf bug réel) :
   - Test fonctionnel local : crée une mission `requiresPhoto = true`, coche-la avec photo, vérifie qu'elle s'affiche en vignette + en lightbox plein écran.
   - Test erreur : coupe le réseau pendant l'upload → toast `"Erreur lors de l'envoi de la photo"` doit s'afficher (déjà géré ligne 102-104 du modal capture).
   - Test affichage : vérifie que `AuthImage` (`shiftly-app/src/components/shared/AuthImage.tsx`) suit bien le 302 R2 retourné par `CompletionController::servePhoto` (ligne 137-159 du contrôleur). Si tu vois ⚠ au lieu de l'image en local : c'est probablement la **config CORS du bucket R2** qui bloque le XHR cross-origin. **Documente la cause** dans le rapport final mais ne corrige pas la conf R2 toi-même (Kévin doit gérer ça via le dashboard Cloudflare).
   - Vérifier que `Authorization` header n'est PAS rejoué sur le redirect vers R2 (axios devrait l'éviter sur cross-origin, mais à confirmer dans l'onglet Network du devtool).

5. **Confirmation décochage mission photo** :
   - Créer `shiftly-app/src/components/service/ModalConfirmUncheckPhoto.tsx` (< 100 lignes) avec : header "Décocher la mission ?", texte de la mission, miniature photo via `<AuthImage>` (~120px), texte d'avertissement "La preuve photo sera supprimée et la mission devra être recochée.", boutons "Annuler" (secondaire) / "Décocher la mission" (variant danger). Réutilise `backdropVariants` + `sheetVariants` de `@/lib/animations`.
   - `MissionItem.tsx` ligne 48-55 : étendre `handleClick` :
     ```ts
     if (mission.requiresPhoto && completed) {
       onConfirmUncheck?.(mission)  // nouvelle prop
       return
     }
     ```
   - Propager `onConfirmUncheck` depuis `ZoneCard.tsx` → `service/page.tsx`.
   - Dans `service/page.tsx` : nouveau state `confirmUncheckTarget: { mission, posteId } | null`, render du modal, et au confirm appeler `handleToggle(missionId, true, zoneId)`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (déroule chaque étape sur localhost)
- [ ] **Pli/déplie** : tap chevron sur card zone → la liste missions disparaît avec animation, le staff reste visible, le compteur done/total reste à jour. Re-tap → réapparition. Reload page → toutes les cards dépliées par défaut.
- [ ] **Horaires** : à 375px (iPhone) avec horaire `06h00 → 02h00`, aucun débordement.
- [ ] **Vignette photo** : à 375px → vignette ~44px clairement reconnaissable. À 1280px → vignette ~36px discrète. Clic sur vignette → lightbox plein écran.
- [ ] **Upload photo** : cocher une mission requiresPhoto → caméra/galerie → preview → valider → toast succès + mission cochée + vignette visible en moins de 2s.
- [ ] **Affichage photo** : reload la page après cochage → la vignette s'affiche (et non pas ⚠). Si ⚠ : documenter la cause (cf. tâche 4).
- [ ] **Confirmation décochage** : taper sur une mission photo cochée → modal de confirmation avec miniature + texte mission. Tap "Annuler" → rien ne se passe, la mission reste cochée. Tap "Décocher" → mission décochée, photo supprimée côté BDD (vérifier en re-cochant : nouvelle photo demandée).
- [ ] **Non-régression** : décocher une mission **sans** requiresPhoto reste un toggle direct (pas de modal).

### Critères d'acceptation
- [ ] Aucune classe `sm:`/`md:`/`lg:`/`xl:` introduite (règle CLAUDE.md)
- [ ] Aucun `any` TypeScript ajouté
- [ ] Aucune couleur hardcodée (toujours `var(--…)` ou tokens Tailwind du design system)
- [ ] `ZoneCard.tsx` reste < 150 lignes après refacto (sinon découper)
- [ ] Nouveau `ModalConfirmUncheckPhoto.tsx` < 100 lignes
- [ ] Animations en Framer Motion uniquement (pas de `transition-all` custom pour le pli/déplie)
- [ ] `npm run build` passe sans warning bloquant
- [ ] Aucun `useEffect` introduit pour appel API (règle 5)

### Auto-relecture du diff
`git diff main..HEAD` puis relis en hostile :
- Le `handleClick` de `MissionItem.tsx` a 3 branches maintenant (capture photo / confirm décochage / toggle direct) — bien testées toutes les 3 ?
- Le `expanded=true` par défaut sur `ZoneCard` ne casse pas l'usage actuel (le test "X missions de plus" en bas a bien été retiré, pas juste caché) ?
- L'augmentation de la vignette photo ne casse pas l'alignement vertical du texte de la mission ?
- Le modal de confirmation passe-t-il bien le `completionId` à `handleToggle` (sinon le DELETE en backend ne supprime rien) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. 5 commits atomiques, format `feat(service): …` / `fix(service): …` / `style(service): …`.
2. Rapport de vérif : 2 captures (mobile 375 / desktop 1280) + checklist cochée + résultat du test photo (OK ou KO avec cause).
3. Note de risque : si la photo ne s'affiche pas en local (⚠), c'est la conf CORS R2 — Kévin doit aller sur le dashboard Cloudflare R2 et autoriser l'origine front. Ne tente pas de fix côté code.
4. Tu push pas. Kévin push.
