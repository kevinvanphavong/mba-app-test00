#!/bin/sh
set -e

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
        -algorithm rsa -pkeyopt rsa_keygen_bits:4096 \
        -pass "pass:$PASSPHRASE" 2>/dev/null
    openssl pkey -in "$JWT_DIR/private.pem" -out "$JWT_DIR/public.pem" \
        -pubout -passin "pass:$PASSPHRASE" 2>/dev/null
fi

chown www-data:www-data "$JWT_DIR"/*.pem 2>/dev/null || true
chmod 600 "$JWT_DIR/private.pem" 2>/dev/null || true
chmod 644 "$JWT_DIR/public.pem" 2>/dev/null || true

# Init BDD — schema:create ignore les tables déjà existantes
# On n'utilise PAS doctrine:migrations:migrate (migrations en dialecte SQLite)
php /var/www/html/bin/console doctrine:schema:create --no-interaction --env=prod 2>/dev/null || true
php /var/www/html/bin/console doctrine:migrations:version --add --all --no-interaction --env=prod 2>/dev/null || true

# Permissions var/ pour php-fpm (www-data)
chown -R www-data:www-data /var/www/html/var/ 2>/dev/null || true

echo "Démarrage de l'application..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
