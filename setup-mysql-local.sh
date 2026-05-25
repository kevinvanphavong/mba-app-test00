#!/usr/bin/env bash
# setup-mysql-local.sh — aligne la BDD de dev sur la prod (MySQL 8.0)
#
# POURQUOI : la prod Railway tourne sur MySQL 8.0 (Dockerfile + pdo_mysql).
# En local, .env.local pointait sur SQLite → `doctrine:migrations:diff`
# générait du SQL SQLite (recréation de table via __temp__) qui casse
# au push sur Railway. En développant sur MySQL, les migrations générées
# sont nativement compatibles MySQL.
#
# À LANCER UNE SEULE FOIS, depuis la racine shiftly-saas : ./setup-mysql-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API="$ROOT/shiftly-api"
ENV="$API/.env.local"

# ── 1. Pré-requis : Homebrew ───────────────────────────────────────────────
if ! command -v brew >/dev/null 2>&1; then
  echo "❌ Homebrew n'est pas installé."
  echo "   Installe-le depuis https://brew.sh puis relance ce script."
  exit 1
fi

# ── 2. MySQL 8.0 ───────────────────────────────────────────────────────────
if ! brew list mysql@8.0 >/dev/null 2>&1; then
  echo "==> Installation de MySQL 8.0 (via Homebrew)"
  brew install mysql@8.0
fi
# mysql@8.0 est keg-only : on l'ajoute au PATH de ce script
export PATH="$(brew --prefix mysql@8.0)/bin:$PATH"

# ── 3. Démarrage du service ────────────────────────────────────────────────
echo "==> Démarrage du service MySQL"
brew services start mysql@8.0
echo "   Attente que MySQL réponde..."
for i in $(seq 1 30); do
  if mysqladmin ping --silent 2>/dev/null; then break; fi
  sleep 1
done
if ! mysqladmin ping --silent 2>/dev/null; then
  echo "❌ MySQL ne répond pas après 30s. Vérifie 'brew services list'."
  exit 1
fi

# ── 4. Mot de passe root MySQL ─────────────────────────────────────────────
# Une install MySQL précédente peut avoir laissé un mot de passe root.
# Saisie masquée : le mot de passe n'est ni affiché ni commité.
echo ""
read -rsp "Mot de passe root MySQL (laisse vide si aucun, puis Entrée) : " MYSQL_ROOT_PW
echo ""
if [ -n "$MYSQL_ROOT_PW" ]; then
  MYSQL_AUTH=(-u root "-p${MYSQL_ROOT_PW}")
else
  MYSQL_AUTH=(-u root)
fi

# Test de connexion
if ! mysql "${MYSQL_AUTH[@]}" -e "SELECT 1;" >/dev/null 2>&1; then
  echo "❌ Connexion refusée — mot de passe root incorrect."
  echo "   Si tu ne le connais pas, demande-moi la procédure de reset."
  exit 1
fi
echo "   Connexion root OK"

# ── 5. Création de la base ─────────────────────────────────────────────────
echo "==> Création de la base 'shiftly'"
mysql "${MYSQL_AUTH[@]}" -e \
  "CREATE DATABASE IF NOT EXISTS shiftly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ── 6. Bascule de .env.local sur MySQL ─────────────────────────────────────
# Réécrit UNIQUEMENT la ligne DATABASE_URL (via Python, pour gérer le mot de
# passe et les caractères spéciaux). Les secrets (Sentry, R2) sont préservés,
# une sauvegarde horodatée est créée.
echo "==> Bascule de .env.local sur MySQL"
MYSQL_ROOT_PW="$MYSQL_ROOT_PW" python3 - "$ENV" <<'PYEOF'
import os, sys, urllib.parse, datetime, shutil
path = sys.argv[1]
pw = urllib.parse.quote(os.environ.get("MYSQL_ROOT_PW", ""), safe="")
url = f'DATABASE_URL="mysql://root:{pw}@127.0.0.1:3306/shiftly?serverVersion=8.0&charset=utf8mb4"'
shutil.copy(path, path + ".bak." + datetime.datetime.now().strftime("%Y%m%d%H%M%S"))
lines = open(path, encoding="utf-8").read().splitlines()
out = [url if l.startswith("DATABASE_URL=") else l for l in lines]
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print("   .env.local mis à jour (sauvegarde .bak créée)")
PYEOF

# ── 7. Schéma + fixtures ───────────────────────────────────────────────────
# On construit le schéma DIRECTEMENT depuis les entités Doctrine, sans
# rejouer les 32 migrations (dont 11 contiennent du SQL SQLite non portable).
# Puis on marque toutes les migrations comme appliquées : le prochain
# `doctrine:migrations:diff` partira d'une base saine et générera du MySQL.
cd "$API"
echo "==> Construction du schéma depuis les entités"
php bin/console doctrine:schema:drop --force --full-database --no-interaction 2>/dev/null || true
php bin/console doctrine:schema:create --no-interaction
echo "==> Marquage des migrations existantes comme appliquées"
php bin/console doctrine:migrations:sync-metadata-storage --no-interaction
php bin/console doctrine:migrations:version --add --all --no-interaction
echo "==> Chargement des fixtures (Hautelook Alice)"
php bin/console hautelook:fixtures:load --no-interaction

echo ""
echo "✅ MySQL 8.0 local prêt. Dev = prod."
echo "   Lance maintenant l'app avec : ./dev-start.sh"
