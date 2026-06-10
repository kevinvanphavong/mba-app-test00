# Image PHP du backend Shiftly (dev/CI) — Postgres-ready
FROM php:8.4-fpm

# Paquets système nécessaires à pdo_pgsql (libpq), intl (libicu), et aux outils Composer (git/zip)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libicu-dev \
        git \
        unzip \
        zip \
    && rm -rf /var/lib/apt/lists/*

# Extensions PHP : Postgres (pdo_pgsql), intl, opcache
RUN docker-php-ext-install pdo pdo_pgsql intl opcache

# Composer (depuis l'image officielle, pas de curl pipe)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/api
