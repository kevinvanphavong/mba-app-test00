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

# BDD dev = PostgreSQL 16 via Docker Compose (runtime Colima), cf. docker-compose.yml.
# DATABASE_URL pointe sur 127.0.0.1:5432 = port du conteneur `db` forwardé par Colima.
echo "==> Vérification de la base Postgres (Docker Compose / Colima)"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ( cd "$ROOT" && docker compose up -d db >/dev/null 2>&1 ) || true
  for i in $(seq 1 20); do
    docker compose -f "$ROOT/docker-compose.yml" exec -T db pg_isready -U shiftly >/dev/null 2>&1 && break
    sleep 1
  done
  docker compose -f "$ROOT/docker-compose.yml" exec -T db pg_isready -U shiftly >/dev/null 2>&1 \
    && echo "   Postgres OK (conteneur db sur 127.0.0.1:5432)" \
    || echo "   ⚠️  Postgres ne répond pas — vérifie 'docker compose ps' (Colima démarré ?)"
else
  echo "   ⚠️  Docker/Colima arrêté — lance 'colima start' puis 'make up'"
fi

echo "==> Démarrage de l'API Symfony sur http://127.0.0.1:8000"
( cd "$ROOT/shiftly-api" && symfony server:start -d )

echo "==> Démarrage du front Next.js sur http://localhost:3000"
( cd "$ROOT/shiftly-app" && npm run dev )
