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

# Tuning OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint (décode les clés JWT depuis env vars base64)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Permissions
RUN mkdir -p var/cache var/log config/jwt \
    && chown -R www-data:www-data var/ config/jwt/

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
