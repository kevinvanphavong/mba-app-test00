FROM php:8.4-fpm-alpine

# Dépendances système
RUN apk add --no-cache \
    nginx \
    supervisor \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    unzip \
    curl \
    bash \
    openssl

# Extensions PHP requises en prod
RUN docker-php-ext-install \
    pdo_mysql \
    intl \
    zip \
    opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ENV APP_ENV=prod
ENV APP_DEBUG=0

# Dépendances Composer (couche cachée séparée)
COPY composer.json composer.lock symfony.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Application complète
COPY . .

# Autoloader optimisé + cache pré-compilé
# Les dummy vars permettent au container Symfony de se compiler.
# Les vraies valeurs (Railway) remplacent les placeholders à runtime.
RUN composer dump-autoload --optimize --no-dev \
    && APP_SECRET=buildsecret1234567890abcdef \
       DATABASE_URL="mysql://app:secret@localhost:3306/app?serverVersion=8.0&charset=utf8mb4" \
       CORS_ALLOW_ORIGIN='^.*$' \
       php bin/console cache:warmup --env=prod

# Config Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Config PHP-FPM — Unix socket pour éviter conflit avec PORT Railway
COPY docker/php-fpm-www.conf /usr/local/etc/php-fpm.d/www.conf

# Tuning OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint inline — évite le cache Docker de Railway
RUN printf '#!/bin/sh\nset -e\n\nexport APP_ENV=prod\nexport APP_DEBUG=0\n\nACTUAL_PORT="${PORT:-80}"\necho "Port ecoute : $ACTUAL_PORT"\nsed -i "s/NGINX_PORT/$ACTUAL_PORT/" /etc/nginx/nginx.conf\n\nJWT_DIR="/var/www/html/config/jwt"\nmkdir -p "$JWT_DIR"\n\nif [ -n "$JWT_SECRET_KEY_BASE64" ] && [ -n "$JWT_PUBLIC_KEY_BASE64" ]; then\n    echo "$JWT_SECRET_KEY_BASE64" | base64 -d > "$JWT_DIR/private.pem" 2>/dev/null || true\n    echo "$JWT_PUBLIC_KEY_BASE64" | base64 -d > "$JWT_DIR/public.pem" 2>/dev/null || true\nfi\n\nif [ ! -s "$JWT_DIR/private.pem" ]; then\n    openssl genrsa -out "$JWT_DIR/private.pem" 2048 2>/dev/null\n    openssl rsa -in "$JWT_DIR/private.pem" -pubout -out "$JWT_DIR/public.pem" 2>/dev/null\nfi\n\nchown www-data:www-data "$JWT_DIR"/*.pem 2>/dev/null || true\nchmod 600 "$JWT_DIR/private.pem" 2>/dev/null || true\nchmod 644 "$JWT_DIR/public.pem" 2>/dev/null || true\n\nphp /var/www/html/bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration --env=prod 2>&1 || true\n\nchown -R www-data:www-data /var/www/html/var/ 2>/dev/null || true\n\necho "Demarrage sur le port $ACTUAL_PORT..."\nexec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n' > /entrypoint.sh && chmod +x /entrypoint.sh

# Permissions
RUN mkdir -p var/cache var/log config/jwt \
    && chown -R www-data:www-data var/ config/jwt/

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
