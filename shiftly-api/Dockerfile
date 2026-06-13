FROM php:8.4-fpm-alpine

# Dépendances système
RUN apk add --no-cache \
    nginx \
    supervisor \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    postgresql-dev \
    unzip \
    curl \
    bash \
    openssl

# Extensions PHP requises en prod (Postgres : pdo_pgsql)
RUN docker-php-ext-install \
    pdo_pgsql \
    intl \
    zip \
    opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ENV APP_ENV=prod
ENV APP_DEBUG=0
# Autorise les plugins Composer en root (build Docker)
# Sans ça, le plugin symfony/runtime ne génère pas vendor/autoload_runtime.php
# et bin/console explose avec "Symfony Runtime is missing".
ENV COMPOSER_ALLOW_SUPERUSER=1

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
       DATABASE_URL="postgresql://app:secret@localhost:5432/app?serverVersion=16&charset=utf8" \
       CORS_ALLOW_ORIGIN='^.*$' \
       SENTRY_DSN='' \
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

# Module Media — autorise uploads jusqu'à 25 MB côté PHP
# (cohérent avec client_max_body_size de nginx + limites MediaUploader)
RUN echo "upload_max_filesize = 25M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 25M"    >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M"    >> /usr/local/etc/php/conf.d/uploads.ini

# Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint — source de vérité unique dans docker/entrypoint.sh
# (avant, le script était défini inline via printf dans le Dockerfile et ignorait
# le fichier du repo ; désormais les deux sont alignés et le script est auditable.)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Permissions
RUN mkdir -p var/cache var/log config/jwt \
    && chown -R www-data:www-data var/ config/jwt/

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
