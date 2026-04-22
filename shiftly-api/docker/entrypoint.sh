#!/bin/sh
set -e

# Force l'environnement prod — écrase le APP_ENV=dev du .env
export APP_ENV=prod
export APP_DEBUG=0

# Résolution du port — Railway injecte $PORT dynamiquement
ACTUAL_PORT="${PORT:-80}"
echo "Port d'écoute : $ACTUAL_PORT"
sed -i "s/NGINX_PORT/$ACTUAL_PORT/" /etc/nginx/nginx.conf

JWT_DIR="/var/www/html/config/jwt"
mkdir -p "$JWT_DIR"

# Décode les clés JWT depuis les variables d'environnement base64
if [ -n "$JWT_SECRET_KEY_BASE64" ] && [ -n "$JWT_PUBLIC_KEY_BASE64" ]; then
    echo "$JWT_SECRET_KEY_BASE64" | base64 -d > "$JWT_DIR/private.pem" 2>/dev/null || true
    echo "$JWT_PUBLIC_KEY_BASE64" | base64 -d > "$JWT_DIR/public.pem" 2>/dev/null || true
fi

# Génération automatique des clés si absentes (fallback)
if [ ! -s "$JWT_DIR/private.pem" ]; then
    echo "Génération automatique des clés JWT..."
    PASSPHRASE="${JWT_PASSPHRASE:-shiftly_default_passphrase}"
    openssl genpkey -out "$JWT_DIR/private.pem" -aes256 \
        -algorithm rsa -pkeyopt rsa_keygen_bits:2048 \
        -pass "pass:$PASSPHRASE" 2>/dev/null
    openssl pkey -in "$JWT_DIR/private.pem" -out "$JWT_DIR/public.pem" \
        -pubout -passin "pass:$PASSPHRASE" 2>/dev/null
fi

chown www-data:www-data "$JWT_DIR"/*.pem 2>/dev/null || true
chmod 600 "$JWT_DIR/private.pem" 2>/dev/null || true
chmod 644 "$JWT_DIR/public.pem" 2>/dev/null || true

# Init BDD — fail-loud : si une migration casse, on bloque le déploiement.
# Ne JAMAIS rajouter de `|| true` ici : un schéma cassé silencieux (ex. table user droppée
# par une migration auto-generated SQLite appliquée sur MySQL) provoque des 500 sur le
# endpoint de login alors que le container démarre comme si tout allait bien.
echo "Migration du schéma BDD..."
php /var/www/html/bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration --env=prod

# Réensemencement opt-in — à activer avec LOAD_FIXTURES=1 dans les variables Railway
# pour une exécution unique, puis à remettre sur 0 sinon les données sont rechargées
# (et donc écrasées) à chaque redémarrage du container.
if [ "$LOAD_FIXTURES" = "1" ]; then
    echo "LOAD_FIXTURES=1 détecté — purge + rechargement des fixtures Alice..."
    php /var/www/html/bin/console doctrine:fixtures:load --no-interaction --purge-with-truncate --env=prod
    echo "Fixtures rechargées. N'oublie pas de remettre LOAD_FIXTURES=0 sur Railway."
fi

chown -R www-data:www-data /var/www/html/var/ 2>/dev/null || true

echo "Démarrage sur le port $ACTUAL_PORT..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
