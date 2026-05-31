# Validation hebdo — Refonte du panneau détail employé (V2)

> Refondre `ValidationEmployeeDetail` pour passer de "5 actions par correction" à "2 actions" via inline edit + TimePicker custom + motif chips + historique timeline.

## Contexte
La maquette `docs/maquettes/pointage-validation-detail-v2.html` est la référence visuelle complète, validée par Kévin. Le composant actuel (`ValidationEmployeeDetail.tsx` + `ValidationCorrectionForm.tsx`) oblige le manager à : clic ✏️ → scroll → ouvrir un select → input time clavier → motif libre → valider. C'est trop lent en production sur 10 employés × 2 corrections/semaine. Aucun marquage visuel des jours corrigés, historique tronqué à 3 sans date du jour ni motif. Pour la paie c'est insuffisant en audit.

## Fichiers à lire avant de coder
- `docs/maquettes/pointage-validation-detail-v2.html` — **maquette de référence, source de vérité visuelle**
- `shiftly-app/src/components/validation/ValidationEmployeeDetail.tsx` — composant à refondre
- `shiftly-app/src/components/validation/ValidationCorrectionForm.tsx` — à supprimer / remplacer par popover inline
- `shiftly-app/src/hooks/useValidation.ts` — hooks React Query existants
- `shiftly-app/src/types/validation.ts` — vérifier types `CorrectionPayload`, `ValidationCorrection`
- `shiftly-api/src/Controller/Pointage/CorrectionController.php` (ou équivalent) — endpoint correction
- `POINTAGE_MODULE.md` + `CLAUDE.md` — règles projet (ne pas paraphraser, juste respecter)

## Décisions actées
1. **Pas de nouvelle entité BDD.** Le motif est stocké en `VARCHAR` existant. Les chips sont une liste figée côté front : `Oubli pointage`, `Retard justifié`, `Erreur saisie`, `Pause non scannée`, `Accord verbal`, `Autre…` (→ champ libre).
2. **Annuler une correction** = POST d'une nouvelle correction qui restaure l'ancienne valeur, motif `Annulation de correction`. Pas d'endpoint DELETE, l'audit trail reste intact.
3. **Pointer maintenant** (arrivée manquante) = réutilise l'endpoint `/api/pointages/{id}/arrivee` avec bypass manager. Si le bypass n'existe pas côté back, ajoute-le.
4. **Bulk "Appliquer départ planifié"** = itère côté front sur les pointages `heureDepartAuto=true` et POST la correction `heureDepart` pour chacun. Pas d'endpoint bulk.

## Tâche

### Front (gros du chantier)
1. Découper `ValidationEmployeeDetail.tsx` en sous-composants (règle 150 lignes) :
   - `ValidationDayRow.tsx` — une ligne jour avec pilules cliquables, diff inline, marqueur jour corrigé, menu `⋯`
   - `ValidationTimePill.tsx` — pilule horaire affichant état (ok / late / auto / modified / empty) + diff inline si modifié
   - `ValidationTimePopover.tsx` — popover TimePicker (boutons ±5/±15, raccourcis Maintenant / Heure planifiée / Saisir, chips motif, apply/cancel). Positionné via `floating-ui` ou simple `position: absolute` selon ce qui est déjà installé
   - `ValidationCorrectionTimeline.tsx` — historique complet (plus de troncature à 3), date du jour concerné, motif chip, ancienneté `date-fns/formatDistanceToNow`, bouton `↺ Annuler`
   - `ValidationBulkActions.tsx` — bandeau "Appliquer le départ planifié à tous" (visible seulement si ≥1 jour `auto`)
2. Conserver `ValidationEmployeeDetail.tsx` comme orchestrateur (tête employé + bandeau bulk + liste de `ValidationDayRow` + `ValidationCorrectionTimeline` + footer valider).
3. Ajouter dans `useValidation.ts` un hook `useAnnulerCorrection(dateStr)` qui POST la correction inverse.
4. Supprimer `ValidationCorrectionForm.tsx` une fois le popover en place.
5. Styles : suivre la convention CSS du module pointage (classes sémantiques préfixées `validation-*` dans `globals.css`, Tailwind = layout only). Reprendre les noms de classes de la maquette autant que possible.

### Back (extensions minimales)
6. Si `POST /api/pointages/{id}/arrivee` n'accepte pas de bypass manager (sans PIN), ajouter le bypass : si l'utilisateur authentifié est MANAGER du même centre, on accepte sans PIN.
7. Vérifier que l'endpoint correction accepte bien un champ `motif` (text). Si non, l'ajouter à la requête + persister.

## Ce qu'il ne fait PAS
- Pas de refonte du tableau de gauche (`ValidationTable`)
- Pas de modification des KPIs, du résumé semaine, ni des alertes légales
- Pas de mode hors-ligne, pas de raccourcis clavier (phase 2 si demande)
- Pas de migration BDD (le motif est déjà un VARCHAR existant — à confirmer)

## Notes techniques
- **Règle absolue 15** : si une migration s'avère nécessaire (peu probable ici), vérifier compatibilité MySQL/PostgreSQL avant commit. Pas de génération SQLite.
- **Multi-tenant** : tout passe par les Voters existants. L'endpoint d'annulation n'introduit aucun nouveau chemin → reste filtré par `centre_id`.
- **Fuseau** : conversion locale (Europe/Paris) → ISO UTC déjà gérée dans `ValidationCorrectionForm.tsx:51-58`, reprendre la logique dans le popover.
- **Popover** : si `floating-ui` n'est pas déjà installé, ne pas l'ajouter — utiliser un `position: absolute` simple avec gestion du `Escape` et du clic-extérieur dans un `useEffect` minimal.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
cd shiftly-api && php bin/console doctrine:schema:validate && php bin/console lint:container
# Frontend
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (à valider en local sur la page `/pointage/validation`)
- [ ] Clic sur la pilule "Arrivée 09:02" → popover s'ouvre au-dessus de la ligne, focus sur l'affichage gros
- [ ] Bouton `−5` → l'affichage passe à 08:57, ligne "Original 09:02 · −5 min" visible
- [ ] Bouton `Heure plan.` → l'affichage passe à l'heure du poste planifié
- [ ] Chip `Erreur saisie` sélectionné → mise en orange
- [ ] Clic `Appliquer` → popover se ferme, pilule affiche le diff `09:02 → 09:00`, marqueur orange à gauche de la ligne, toast succès
- [ ] Timeline en bas : nouvelle ligne en haut, date du jour, motif chip, "à l'instant", bouton `↺ Annuler`
- [ ] Clic `↺ Annuler` → confirmation, puis pilule revient à `09:02`, nouvelle ligne timeline `Annulation de correction`
- [ ] Sur un jour sans arrivée pointée → bouton `⚠ Pointer arrivée maintenant (plan. XX:XX)` visible, clic → POST sans PIN (bypass manager)
- [ ] Si ≥1 pilule `auto` → bandeau bulk visible, clic → toutes les heures auto deviennent "corrigées" en une seule action utilisateur
- [ ] Clic extérieur ou `Escape` → popover se ferme sans appliquer
- [ ] Mobile (< 500px) : popover reste lisible (peut s'afficher en bottom-sheet si trop étroit)

### Critères d'acceptation
- [ ] Tous les fichiers nouveaux/modifiés respectent la limite 150 lignes (règle 3)
- [ ] Aucune couleur hardcodée (règle 1) — seulement `var(--…)`
- [ ] Aucun `any` TypeScript (règle 2)
- [ ] États loading/error/empty présents (règle 6)
- [ ] Animations Framer Motion uniquement (règle 12)
- [ ] `ValidationCorrectionForm.tsx` supprimé une fois remplacé
- [ ] `npm run build` + `doctrine:schema:validate` passent

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : régression sur le panneau mobile (bottom-sheet) ? le `selectedUserId` toggle marche toujours ? les corrections existantes en BDD s'affichent bien dans la nouvelle timeline ? aucune fuite de styles dans d'autres pages ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par sous-composant : `feat(validation): extract ValidationTimePill`, `feat(validation): add ValidationTimePopover with inline edit`, `feat(validation): timeline corrections with undo`, etc.
2. Si modif back : `feat(pointage): allow manager bypass on arrivee endpoint`
3. Rapport final : cases d'auto-vérification cochées + une capture mobile + une capture desktop du panneau refait
4. Mise à jour `ARCHITECTURE.md` (nouveaux composants) et `DESIGN_SYSTEM.md` (popover TimePicker + chips motif) — règle 13
5. **Tu push pas. Kévin push.**
