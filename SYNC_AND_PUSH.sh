#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Script de synchronisation + push.
# Tente un rebase propre sur origin/main.
# Si conflit → bascule sur merge (toujours fonctionnel).
# Push final si tout passe.
#
# Lance : bash SYNC_AND_PUSH.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock 2>/dev/null || true

echo "════════════════════════════════════════════════════════════"
echo " 1. Fetch origin"
echo "════════════════════════════════════════════════════════════"
git fetch origin main

LOCAL_AHEAD=$(git rev-list --count origin/main..HEAD)
REMOTE_AHEAD=$(git rev-list --count HEAD..origin/main)
echo "  Local en avance de  : $LOCAL_AHEAD commits"
echo "  Remote en avance de : $REMOTE_AHEAD commits"

if [ "$REMOTE_AHEAD" -eq 0 ]; then
  echo ""
  echo "  ✅ Pas besoin de sync, je passe au push."
else
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo " 2. Tentative rebase --autostash sur origin/main"
  echo "════════════════════════════════════════════════════════════"
  if git rebase --autostash origin/main; then
    echo "  ✅ Rebase clean, historique linéaire conservé."
  else
    echo ""
    echo "  ⚠ Conflit pendant le rebase. J'annule et je passe en merge."
    git rebase --abort
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo " 2bis. Fallback : merge origin/main"
    echo "════════════════════════════════════════════════════════════"
    if git merge --no-edit origin/main; then
      echo "  ✅ Merge clean (un commit de merge a été créé)."
    else
      echo ""
      echo "  ❌ Conflit persistant lors du merge. Status :"
      git status --short
      echo ""
      echo "  Résous les conflits manuellement :"
      echo "    1. Ouvre les fichiers marqués UU dans le status"
      echo "    2. Garde la version qui te convient (cherche les <<<<<<<)"
      echo "    3. git add <fichiers>"
      echo "    4. git commit"
      echo "    5. git push"
      exit 1
    fi
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo " 3. Push origin main"
echo "════════════════════════════════════════════════════════════"
git push origin main
echo ""
echo "════════════════════════════════════════════════════════════"
echo " ✅ Terminé. État final :"
echo "════════════════════════════════════════════════════════════"
git log --oneline -10
echo ""
echo "Tu peux supprimer ce script :"
echo "   rm SYNC_AND_PUSH.sh COMMIT_BATCH.sh"
