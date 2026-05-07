#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Commit + push du switcher de thème.
# Lance : bash COMMIT_THEME_SWITCHER.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "════════════════════════════════════════════════════════════"
echo " Commit : feat(theme): switcher 3 thèmes dans la sidebar"
echo "════════════════════════════════════════════════════════════"
git add \
  shiftly-app/src/hooks/useTheme.ts \
  shiftly-app/src/components/layout/ThemeSwitcher.tsx \
  shiftly-app/src/components/layout/Sidebar.tsx \
  shiftly-app/src/app/layout.tsx

git commit -m "feat(theme): switcher 3 thèmes (Clair / Sombre / Sable) dans la sidebar

- hook useTheme : lecture/écriture data-theme + persistance localStorage,
  SSR-safe (état initial à dark, sync au mount)
- ThemeSwitcher : segment toggle 3 états avec icônes (☀ ☾ ⛱), fidèle au
  pattern V2, intégré dans la sidebar entre nav items et user row
- Sidebar : insertion du bloc « Apparence » juste avant la carte utilisateur
- layout.tsx : script inline anti-FOUC (avant le first paint, lit
  localStorage et applique data-theme sur <html>) — évite le flash
  dark → light/sand au reload pour les utilisateurs ayant choisi un thème clair

Activation :
  - UI    : sidebar > Apparence
  - Code  : <html data-theme=\"light|dark|sand\">
  - Devtools : document.documentElement.setAttribute('data-theme', '…')

Stockage : localStorage clé 'shiftly-theme'."

echo ""
echo "════════════════════════════════════════════════════════════"
echo " Push origin main"
echo "════════════════════════════════════════════════════════════"
git push origin main

echo ""
echo "════════════════════════════════════════════════════════════"
echo " ✅ Terminé — état final :"
echo "════════════════════════════════════════════════════════════"
git log --oneline -5
echo ""
echo "Tu peux supprimer ce script :"
echo "   rm COMMIT_THEME_SWITCHER.sh"
