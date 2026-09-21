# Randy Donny Blog

Personal blog of Randy Donny, published on [randy-donny.com](https://randy-donny.com). French only. This is the V2, rebuilt from scratch (see [the specification](docs/Specification.md)).

## Stack

- PHP 8.5, Laravel 13
- FrankenPHP + Laravel Octane
- Inertia.js v3 + React + TypeScript, server-side rendered public pages
- Tailwind CSS 4, Vite (vite-plus), Laravel Wayfinder
- PostgreSQL 18 (database queue, cache and sessions)
- Pest, Pint, Larastan, `vp check` (oxlint + oxfmt), `tsc`

## Quick start (Docker)

Requirements: Docker with Compose v2. Ports 8000, 5173, 5432, 1025 and 8025 must be free (see [port overrides](docs/Infrastructure.md#36-port-overrides)).

```sh
cp .env.example .env
docker compose run --rm setup                                   # composer install + npm ci
docker compose run --rm --no-deps app php artisan key:generate
docker compose up -d
docker compose exec app php artisan migrate
```

| URL                   | Service                           |
| --------------------- | --------------------------------- |
| http://localhost:8000 | Application (FrankenPHP + Octane) |
| http://localhost:5173 | Vite dev server (HMR)             |
| http://localhost:8025 | Mailpit (every email sent in dev) |
| localhost:5432        | PostgreSQL (`randy` / `password`) |

## Common commands

```sh
docker compose exec app php artisan test --compact   # Pest, against PostgreSQL
docker compose exec app vendor/bin/pint --dirty       # PHP code style
docker compose exec app composer types:check          # Larastan
docker compose exec vite npm run check                # lint + format (vite-plus)
docker compose exec vite npm run types:check          # TypeScript
docker compose exec app composer ci:check             # everything CI runs
docker compose logs -f app                            # logs
docker compose exec app sh                            # shell in the app container
```

## Production

Not done yet (spec INF-2).

## Documentation

- [Specification](docs/Specification.md): product and technical specification of the V2.
- [Infrastructure](docs/Infrastructure.md): Docker image, development configuration, environment variables, CI, troubleshooting.
