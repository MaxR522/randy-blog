# Infrastructure

How the project runs in development: Docker image, services, environment variables, tests, CI and common problems. The production setup is not done yet (spec INF-2, INF-4, INF-5).

Related requirements in the [specification](Specification.md): §7.1 (stack), §7.2 (INF-1, INF-3), §6.1 (French only).

---

## 1. Overview

```
 browser ──► :8000  app        FrankenPHP + Octane (reloads on file changes)
         ──► :5173  vite       Vite HMR + server-side rendering in dev
         ──► :8025  mailpit    mail catcher (SMTP on :1025)
                    queue      queue:listen
                    scheduler  schedule:work
                    postgres   PostgreSQL 18 (:5432)
                    setup      one-shot: composer install + npm ci
```

| File | Role |
| --- | --- |
| `Dockerfile` | Development image (PHP 8.5, FrankenPHP, Composer, Node). |
| `docker-compose.yml` | Development services. |
| `docker/php/dev.ini` | PHP settings for development. |
| `docker/postgres/init.sql` | Creates the test database when the Postgres volume is created. |
| `.dockerignore` | Keeps the build context small and local secrets out of the image. |
| `.env.example` | Development environment (copied to `.env`). |
| `.github/workflows/tests.yml` | CI: quality checks and tests against PostgreSQL. |

---

## 2. Docker image

`Dockerfile` builds one image, `randy-blog-dev`, shared by every PHP service. It starts from `dunglas/frankenphp:1-php8.5-alpine` and adds:

- PHP extensions: `bcmath`, `gd`, `intl`, `pdo_pgsql`, `zip`, `pcntl` (required by Octane and the queue worker), `opcache`.
- Composer, Node.js + npm, `postgresql-client`, `curl`. Node lives in the PHP image because the Wayfinder Vite plugin calls `php artisan`.
- `docker/php/dev.ini`: OPcache off, errors displayed, 512M memory, 50M uploads.

No code is copied: docker compose bind-mounts the project. The image is built with the host `UID`/`GID` (default 1000) so files created by the containers (vendor, Wayfinder types, logs) stay owned by the developer. `HOME=/tmp` holds the Composer and npm caches.

---

## 3. Development

### 3.1 First start

```sh
cp .env.example .env
docker compose run --rm setup                                   # composer install + npm ci
docker compose run --rm --no-deps app php artisan key:generate
docker compose up -d
docker compose exec app php artisan migrate
```

Then open http://localhost:8000. Emails are visible in Mailpit at http://localhost:8025.

If your user ID is not 1000, export it before building so file ownership matches: `export UID GID=$(id -g)` then `docker compose build`.

### 3.2 Services

| Service | Command | Port | Purpose |
| --- | --- | --- | --- |
| `setup` | `composer install && npm ci` | — | One-shot. Installs dependencies. Every PHP service waits for it to complete successfully. |
| `app` | `octane:start --server=frankenphp --workers=2 --watch` | 8000 | The application. Octane reloads the workers when PHP files change. |
| `queue` | `queue:listen --tries=3 --timeout=60` | — | Queue worker (database driver). `queue:listen` picks up code changes without restart. |
| `scheduler` | `schedule:work` | — | Runs scheduled tasks every minute. |
| `vite` | `npm run dev` | 5173 | Vite dev server with HMR. Also renders pages server-side (§3.4). |
| `postgres` | `postgres:18-alpine` | 5432 | Database. Data in the `postgres_data` named volume. Healthcheck with `pg_isready`. |
| `mailpit` | `axllent/mailpit` | 1025 (SMTP), 8025 (UI) | Catches every email sent in development. |

All PHP services (`setup`, `app`, `queue`, `scheduler`, `vite`) share the `randy-blog-dev` image, the project bind mount (`.:/app`) and the `node_modules` named volume. The volume holds Alpine (musl) binaries, so they never mix with the host's own `node_modules`.

### 3.3 One `.env` for the host and Docker

`.env` targets the host: `DB_HOST=127.0.0.1`, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`. Inside Docker, `docker-compose.yml` overrides only what differs on the Docker network:

| Variable | Value in containers |
| --- | --- |
| `DB_HOST` / `DB_PORT` | `postgres` / `5432` |
| `MAIL_HOST` / `MAIL_PORT` | `mailpit` / `1025` |
| `INERTIA_SSR_HOT_URL` | `http://vite:5173` |

Docker Compose also reads `.env` for variable substitution, so `DB_DATABASE`, `DB_USERNAME` and `DB_PASSWORD` configure both Laravel and the Postgres container.

### 3.4 Server-side rendering and HMR

With Inertia v3 and the `@inertiajs/vite` plugin, the Vite dev server renders pages itself: no SSR build or SSR server is needed in development.

- `laravel-vite-plugin` writes `public/hot` containing `http://localhost:5173`. The browser uses this URL for assets and HMR (`server.hmr.host: 'localhost'` in `vite.config.ts`).
- Laravel cannot reach `localhost:5173` from the `app` container, so `INERTIA_SSR_HOT_URL=http://vite:5173` (read by `config/inertia.php` → `ssr.hot_url`) makes it call `http://vite:5173/__inertia_ssr` instead.
- Vite rejects unknown `Host` headers, hence `server.allowedHosts: ['vite']` in `vite.config.ts`.
- Vite listens on `0.0.0.0:5173` with `strictPort`, so the published port always matches the URL in `public/hot`.

To check that SSR works, view the page source: the `#app` div has `data-server-rendered="true"` and contains the page markup.

### 3.5 Octane file watching

`--watch` uses Octane's `file-watcher.cjs`, which needs `chokidar` in `node_modules`. It is a dev dependency pinned to `^4`: chokidar 5 is ESM-only and cannot be loaded by Octane's CommonJS watcher.

### 3.6 Port overrides

Set these in your shell or in `.env` to change the host ports:

| Variable | Default | Service |
| --- | --- | --- |
| `APP_PORT` | 8000 | `app` |
| `FORWARD_DB_PORT` | 5432 | `postgres` |
| `FORWARD_MAILPIT_PORT` | 1025 | `mailpit` SMTP |
| `FORWARD_MAILPIT_DASHBOARD_PORT` | 8025 | `mailpit` UI |

Port 5173 is fixed: it must match the URL written in `public/hot`. If you change `APP_PORT`, update `APP_URL` too. If you change `FORWARD_DB_PORT`, update `DB_PORT` in `.env` for commands run from the host (containers keep using 5432).

### 3.7 Everyday commands

```sh
docker compose exec app php artisan <command>      # Artisan
docker compose exec app composer <command>         # Composer
docker compose exec vite npm <command>             # npm (musl node_modules)
docker compose exec app php artisan test --compact # tests
docker compose logs -f app queue                   # logs
docker compose exec postgres psql -U randy randy_blog
docker compose down                                # stop (data kept)
docker compose down -v                             # stop and delete the database and node_modules volumes
```

After `composer.json` or `package.json` changes (for example after a `git pull`), reinstall with `docker compose run --rm setup`. After a `Dockerfile` change, rebuild with `docker compose build`.

### 3.8 Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `port is already allocated` | Another project uses the port (for example `personal-blog-2` on 8000/5173/5432). Stop it, or use the port overrides (§3.6). |
| Pages load without styles or with `ERR_CONNECTION_REFUSED` on `localhost:5173` | `public/hot` is left over from a Vite process that was killed. Delete it, or restart `vite`. |
| No server-side rendering, Vite answers `403 Blocked request` | The hostname used by Laravel is not in `server.allowedHosts`. Keep `INERTIA_SSR_HOT_URL=http://vite:5173` and `allowedHosts: ['vite']` aligned. |
| `Cannot find module ...` or a native binding error in `vite` | The `node_modules` volume is outdated or was installed on the host. Run `docker compose run --rm setup`, or `docker compose down -v` then start again. |
| Larastan crashes with `reached configured PHP memory limit` | Use `composer types:check`, which passes `--memory-limit=1G`. |
| `randy_blog_testing` does not exist | `docker/postgres/init.sql` only runs when the volume is created. Run `docker compose exec postgres createdb -U randy randy_blog_testing`, or `docker compose down -v`. |
| Tests run from the host hit the wrong database | The host `.env` targets `127.0.0.1:5432`. Another Postgres might be listening there. Run tests in the container instead. |

---

## 4. Tests and quality

- Tests always run against **PostgreSQL**, never SQLite: the migrations use Postgres-only features (`tsvector`, `unaccent`, partial indexes). This is what broke `personal-blog-2`'s test suite (spec INF-3).
- `phpunit.xml` sets `DB_CONNECTION=pgsql`, `DB_DATABASE=randy_blog_testing`, `INERTIA_SSR_ENABLED=false`, array cache/session/mail and the `sync` queue. Host, user and password come from `.env` (or from the compose overrides inside Docker).
- `composer ci:check` runs everything CI runs: `npm run check` (vite-plus lint + format), `npm run types:check` (`tsc --noEmit`), then `composer test` (Pint in test mode, Larastan, Pest).

---

## 5. CI

`.github/workflows/tests.yml` runs on every push to `main` and every pull request:

1. Starts a `postgres:18` service with the `randy_blog_testing` database. `DB_*` variables point the whole job to it.
2. Sets up PHP 8.5 and Node 22.
3. `composer setup`: `composer install`, `.env` from `.env.example`, `key:generate`, `migrate`, `npm install`, `npm run build`.
4. `composer ci:check` (see §4).
5. `npm run build:ssr` (checks that the SSR bundle builds).

---

## 6. Environment variables reference

Project-specific variables. The standard Laravel ones (`APP_*`, `DB_*`, `SESSION_*`, `MAIL_*`...) keep their usual meaning.

| Variable | Value | Used by |
| --- | --- | --- |
| `APP_LOCALE`, `APP_FALLBACK_LOCALE` | `fr` | French only (spec §6.1). Translations in `lang/fr`. |
| `APP_FAKER_LOCALE` | `fr_FR` | Factories. |
| `APP_DISPLAY_TIMEZONE` | `Indian/Antananarivo` | `config('app.display_timezone')`: timezone for displayed dates. Storage stays UTC (`app.timezone`). |
| `OCTANE_SERVER` | `frankenphp` | `config/octane.php`. |
| `INERTIA_SSR_ENABLED` | `true` | `false` in `phpunit.xml`. |
| `INERTIA_SSR_HOT_URL` | `http://vite:5173` (set by compose) | Dev SSR endpoint of the Vite server (§3.4). |
| `INERTIA_SSR_URL` | `http://127.0.0.1:13714` | Standalone SSR server (`php artisan inertia:start-ssr`), not used in development. |
| `MAIL_HOST`, `MAIL_PORT` | Mailpit | |
| `CLOUDINARY_URL` | empty | Media uploads (spec §7.5), not wired yet. |
| `GOOGLE_ANALYTICS_MEASUREMENT_ID` | `G-5ZEWQRGZV5` | GA4 tag after consent (spec §7.6), not wired yet. |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | empty | GA4 Data API (admin dashboard), not wired yet. |
| `GOOGLE_ANALYTICS_CREDENTIALS_JSON` | empty | GA4 Data API, not wired yet. |
| `APP_PORT`, `FORWARD_DB_PORT`, `FORWARD_MAILPIT_PORT`, `FORWARD_MAILPIT_DASHBOARD_PORT` | optional | docker compose host ports (§3.6). |
| `UID`, `GID` | optional (1000) | Owner of the files created by the containers. |

---

## 7. Open points

- **Production** (spec INF-2, INF-4, INF-5): production image, deployment, CD on tag and database backups.
- **Email provider** (spec Q3): production `MAIL_*` values depend on the choice (Brevo, Resend or Amazon SES).
- **Hosting and backups** (spec Q7).
