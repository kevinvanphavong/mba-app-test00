#!/bin/sh
set -e

# Décode les clés JWT depuis les variables d'environnement base64
if [ -n "$JWT_SECRET_KEY_BASE64" ]; then
    echo "$JWT_SECRET_KEY_BASE64" | base64 -d > /var/www/html/config/jwt/private.pem
    chmod 600 /var/www/html/config/jwt/private.pem
fi

if [ -n "$JWT_PUBLIC_KEY_BASE64" ]; then
    echo "$JWT_PUBLIC_KEY_BASE64" | base64 -d > /var/www/html/config/jwt/public.pem
    chmod 644 /var/www/html/config/jwt/public.pem
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
