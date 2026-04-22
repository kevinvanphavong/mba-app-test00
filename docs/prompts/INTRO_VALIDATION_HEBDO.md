# Texte à copier-coller dans Claude Code pour lancer l'implémentation

---

Tu vas implémenter la **page Validation Hebdomadaire** du module Pointage de Shiftly.

Avant de coder quoi que ce soit, lis ces fichiers **dans cet ordre** :

1. `CLAUDE.md` — les règles absolues du projet
2. `docs/modules/POINTAGE_MODULE.md` — la spec du module pointage existant
3. `docs/prompts/PROMPT_VALIDATION_HEBDO.md` — **le prompt complet** avec toute la spécification de la page à implémenter (entités, endpoints, composants, CSS, plan de commits, checklist)
4. `docs/maquettes/pointage-validation.html` — la maquette HTML qui montre le rendu visuel attendu
5. `DESIGN_SYSTEM.md` — le design system
6. `schema.sql` — le schéma BDD actuel
7. `shiftly-api/src/Entity/Pointage.php` et `PointagePause.php` — entités pointage existantes
8. `shiftly-api/src/Entity/Absence.php` — entité absence existante (CP, RTT, maladie, repos...)
9. `shiftly-app/src/app/globals.css` — les styles CSS existants du module pointage

Le fichier `docs/prompts/PROMPT_VALIDATION_HEBDO.md` contient TOUT ce dont tu as besoin : la spec fonctionnelle, la spec technique, les entités à créer, les endpoints API, les composants frontend, les types TypeScript, les classes CSS, le plan de 18 commits atomiques, et la checklist de vérification finale.

Suis le plan commit par commit. Tiens-moi informé de ta progression à chaque phase terminée. Si tu rencontres un blocage, explique-le avant de prendre une décision.
