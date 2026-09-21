# =============================================================================
# Randy Donny Blog — development image (FrankenPHP + Laravel Octane)
# =============================================================================
# Used by docker-compose.yml. The application code is bind-mounted and the
# dependencies are installed by the `setup` service (composer install / npm ci).
#
# Production image: to do (spec INF-2).
# =============================================================================

FROM dunglas/frankenphp:1-php8.5-alpine

LABEL maintainer="Mario Randrianomearisoa <ranjamario@gmail.com>"
LABEL description="Randy Donny blog development environment (Laravel + FrankenPHP + Octane)"

WORKDIR /app

# System packages:
# - postgresql-client: psql / pg_dump (debugging, dumps)
# - nodejs, npm: Vite dev server (the Wayfinder plugin calls `php artisan`,
#   so Node and PHP must live in the same image)
# - curl: debugging
RUN apk add --no-cache \
    postgresql-client \
    nodejs \
    npm \
    curl

# PHP extensions:
# - bcmath, intl: numbers and French date/number formatting
# - gd: image processing
# - pdo_pgsql: PostgreSQL driver
# - zip: .docx handling (Word import) and Composer archives
# - pcntl: signal handling required by Octane and queue workers
# - opcache: opcode cache (disabled by dev.ini)
RUN install-php-extensions \
    bcmath \
    gd \
    intl \
    pdo_pgsql \
    zip \
    pcntl \
    opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# OPcache off, errors displayed, 512M memory, 50M uploads
COPY docker/php/dev.ini /usr/local/etc/php/conf.d/zz-app.ini

# Containers run with the host user's UID/GID so generated files (vendor,
# Wayfinder types, logs) stay owned by the developer.
ARG UID=1000
ARG GID=1000

# node_modules is a named volume (Alpine/musl binaries must not be shared with
# the host): create the mount point with the right owner so the volume
# inherits it. Caddy (FrankenPHP) keeps its data and config under /data and
# /config.
RUN mkdir -p /app/node_modules \
    && chown -R "${UID}:${GID}" /app /data /config

# Writable home for the Composer and npm caches
ENV HOME=/tmp

EXPOSE 8000 5173

# The FrankenPHP image checks Caddy's admin endpoint, which only the app
# container would pass (queue, scheduler and vite share this image).
HEALTHCHECK NONE

CMD ["php", "artisan", "octane:start", "--server=frankenphp", "--host=0.0.0.0", "--port=8000", "--watch"]
