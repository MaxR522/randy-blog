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

### SEO checklist for the production launch

Details in [SEO and accessibility](docs/seo-accessibility.md), Part A.

1. Set `APP_ENV=production` and `APP_URL=https://randy-donny.com` (bare domain, `https`): canonical URLs, the sitemap, the feeds and the structured data are built from it.
2. Leave `SEO_INDEXABLE` unset: production is indexable by default. Never set it to `true` on a public staging copy; set it to `false` only to close production to crawlers (maintenance).
3. Set `INDEXNOW_KEY` (8 to 128 letters, digits or dashes, e.g. `openssl rand -hex 16`), so new and changed articles are announced to Bing and the other IndexNow engines.
4. Run the queue worker and the scheduler (`schedule:run` every minute): IndexNow pings are queued, and `seo:ping-scheduled-articles` announces scheduled articles every 15 minutes.
5. Web server: redirect `http` to `https` (the app redirects `www.` and trailing slashes itself, but not the scheme), and let `/robots.txt` reach the app (there is no static file in `public/`).
6. Check `https://randy-donny.com/robots.txt` (no `Disallow: /` line), `/sitemap.xml`, `/feed.xml` and `/llms.txt`, and that pages carry no `X-Robots-Tag` header except under `/admin`.
7. Verify the domain in Google Search Console and Bing Webmaster Tools (DNS TXT record) and submit `https://randy-donny.com/sitemap.xml` to both.
8. Test one article in Google's Rich Results Test and in the Facebook Sharing Debugger / LinkedIn Post Inspector; run Lighthouse on home, article and author pages (target SEO 100).
9. Before switching DNS from V1, crawl every V1 article URL and check that each returns 200 or a single 301 on V2 (SEO-MON-3).

To run a Lighthouse SEO audit on a local copy, add `SEO_INDEXABLE=true` to `.env`, restart the app (`docker compose restart app`), and remove the line afterwards: without it, a non-production copy blocks indexing on purpose.

## Documentation

- [Specification](docs/Specification.md): product and technical specification of the V2.
- [Infrastructure](docs/Infrastructure.md): Docker image, development configuration, environment variables, CI, troubleshooting.
