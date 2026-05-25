#!/usr/bin/env bash
# dev-start.sh — relance propre des serveurs Shiftly en local
# Usage : ./dev-start.sh   (depuis la racine shiftly-saas)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Arrêt des process existants (next dev + symfony serve)"
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
symfony server:stop --dir="$ROOT/shiftly-api" 2>/dev/null || true

echo "==> Nettoyage du cache Next.js (.next)"
rm -rf "$ROOT/shiftly-app/.next"

# BDD dev = MySQL 8.0 (aligné sur la prod Railway).
# Mise en place initiale : voir ./setup-mysql-local.sh
echo "==> Vérification du service MySQL 8.0"
if command -v brew >/dev/null 2>&1 && brew list mysql@8.0 >/dev/null 2>&1; then
  export PATH="$(brew --prefix mysql@8.0)/bin:$PATH"
  brew services start mysql@8.0 >/dev/null 2>&1 || true
  for i in $(seq 1 20); do
    mysqladmin ping --silent 2>/dev/null && break
    sleep 1
  done
  mysqladmin ping --silent 2>/dev/null \
    && echo "   MySQL OK" \
    || echo "   ⚠️  MySQL ne répond pas — lance ./setup-mysql-local.sh"
else
  echo "   ⚠️  MySQL 8.0 absent — lance ./setup-mysql-local.sh d'abord"
fi

echo "==> Démarrage de l'API Symfony sur http://127.0.0.1:8000"
( cd "$ROOT/shiftly-api" && symfony server:start -d )

echo "==> Démarrage du front Next.js sur http://localhost:3000"
( cd "$ROOT/shiftly-app" && npm run dev )
