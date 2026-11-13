# Admin implementation roadmap

The admin design is on the canvas, page « Administration »: https://claude.ai/artifact/QJJkKbFxwYVEUXE2g3ZGYZ. The behaviour is in `docs/Specification.md` §5. Each session below is sized to fit one context window. Work through them in order: take the first session with an open box.

## Session rules

- Start each session with `/clear`, then read only this roadmap, the listed spec sections and the listed boards. Boards are 15–30 KB each, so never load the whole canvas (Artifact `read` with `path`, for example `project/Admin-Articles.dc.html`).
- Copy comes from the spec and the boards. The canvas wins on visuals, the spec on behaviour.
- Reuse the tokens from `resources/css/theme.css`. Do not restyle public pages.
- Dependencies listed under a session need the user's approval at its start. Open decisions are asked at the start of that session, with the recommendation given.
- Each session ends with Pest tests for its behaviour, `vendor/bin/pint --dirty --format agent`, `npm run check`, `npm run tailwind:canonical`, a browser check at 360 and 1440 against the boards, and its boxes ticked here.

## Foundation

### 1. Auth and admin shell

Spec §5.1, §5.6.3, §7.7. Boards: `Admin-Connexion`, `Admin-Connexion-360`, section 1 of `Admin-Composants`.

Dependency: `laravel/fortify`, because its `two_factor_*` columns match spec §7.3.2 and it also serves session 8. Decided (Q10): guests get the public 404 on `/admin/*`, and `/admin` is not listed in `robots.txt`. Fortify's routes are ignored and redefined in `routes/admin.php`.

- [x] Login, logout, « Se souvenir de moi », rate limit, session lifetimes (`/admin/connexion`)
- [x] Forgotten password and reset (`/admin/mot-de-passe-oublie`, `/admin/reinitialisation/{token}`, card added to the canvas)
- [x] `/admin` route group and guard; `/admin` redirected to `/admin/articles` until session 13; `NoIndexHeader` already covers noindex
- [x] Admin pages excluded from SSR (NFR-PERF-1)
- [x] Admin layout: sidebar expanded, collapsed and remembered, sticky top bar, mobile drawer with focus trap, placeholder page
- [x] `User` fixes from spec §7.3.2 (`articles()` relation, `SoftDeletes`)

### 2. Categories and list primitives

Spec §5.1, §5.4. Boards: `Admin-Categories`, `Admin-Categories-360`, sections 2–9 of `Admin-Composants`.

- [x] Handle the 419 of an expired form with a flash message, instead of Laravel's default page
- [x] Primitives: status badge (input done in session 1: `components/admin/text-field.tsx`), data table with mobile cards, search bound to `?q=`, pagination bound to `?page=`, empty state
- [x] Primitives: modal (full screen on phone), confirm modal, flash toasts
- [x] Categories CRUD, sort, usage count, delete with the count message
- [x] Migration: partial unique indexes `WHERE deleted_at IS NULL`, unique `article_categories`
- [x] `Category::articles()` keys fix, if still swapped

## Articles

### 3. Articles list and status workflow

Spec §5.3.1, §5.3.5. Boards: `Admin-Articles`, `Admin-Articles-360`.

Decided: « À la une » dropped, since nothing public reads `is_featured` (column kept, unused). Preview at `/admin/articles/{id}/apercu`.

- [x] List: sort, status filter, row actions menu (bottom sheet on phone), « Aperçu »
- [x] Actions: publish, archive, soft delete drafts, first-publication date only (Q9); featured article dropped
- [x] Preview route and `PreviewBanner` for the logged-in author (`Seo` already has the noindex case)
- [x] Check that `ArticleObserver` covers these status changes

### 4. Media and TinyMCE

Spec §5.3.4, §7.5, Appendix B. Reference: `personal-blog-2/resources/js/components/admin/TinyMCEEditor.tsx` and `ImageUploader.tsx`.

Dependencies: `tinymce` and `@tinymce/tinymce-react` (Q2, recommended self-hosted GPL), Cloudinary SDK or signed HTTP.

- [x] Authenticated Cloudinary upload service and endpoint, folders, delete on replace, with feature tests on the endpoint (signed HTTP, no SDK; uploads capped at 2400 px with `q_auto:good`, body images served with `f_auto,q_auto` and `srcset`)
- [x] `ImageUploader` component (covers and avatar upload on save, through `Cloudinary::replace`)
- [x] TinyMCE component with `full`, `minimal` and `newsletter` configs, French UI, block formats, « Encadré » style, `content_css` from the theme, mobile mode
- [x] Editor page shell at `/admin/articles/nouveau` (title, chapô, cover, credit, content; no saving yet), completed in session 5

### 5. Article editor

Spec §5.3.2, §5.3.5, rules B5/B6 of `docs/seo-accessibility.md`. Boards: `Admin-Article-Editeur`, `Admin-Article-Editeur-360`.

- [x] Create and edit (replace the `admin.articles.create` / `edit` placeholder routes), fields ADM-ART-20…27, state-dependent header actions, sticky mobile bar
- [x] Validation: a draft needs only the title (Q8), publishing needs every field
- [x] Save through `ArticleHtml::sanitize`, compute `raw_content` and `read_duration`, keep the author on edit
- [x] Category multi-select with inline create
- [x] Slug frozen after publication, `article_slug_redirects` migration, 301 from the public route (ADM-ART-64)
- [x] Unsaved-changes warning, 30 s browser autosave with restore (the picked cover file is not kept by the autosave)

## Account

### 6. Profile tab

Spec §5.6.1. Boards: `Admin-Compte-Profil`, `Admin-Compte-Profil-360`.

- [x] One-field-at-a-time inline editing (unsaved-changes guard moved to `lib/unsaved-changes.ts`; « Sécurité » tab is a placeholder until session 7)
- [x] Avatar with square crop and credit (custom cropper, no dependency, 800 px JPEG upload)
- [x] Display name, biography (TinyMCE `minimal`)
- [x] Login email change with password and confirmation link (signed 60 min URL, no column; the old address is notified)

### 7. Security tab, without 2FA

Spec §5.6.2 (ADM-SEC-1, 2, 3, 5, 6, 7). Boards: `Admin-Compte-Securite`, `Admin-Compte-Securite-360`.

Decided (2026-11-11): Q6 recovery phone stored only; user agent parsed in-house (`App\Support\UserAgent`); « Lieu approximatif » dropped (no GeoIP, removed from the boards); security alerts queued, so production needs a queue worker.

- [x] Password change with rules and logout of other sessions
- [x] Recovery email, a second address that must differ from the login email, with verification link; recovery phone
- [x] Send the reset link to the recovery email too, and restore the board wording on the forgotten password page (ADM-AUTH-2)
- [x] Connected devices from `sessions`, per-device and global logout
- [x] `login_events` migration and login history
- [x] Security alert emails (new device, password change, recovery email change; 2FA changes come with session 8)

### 8. Two-factor authentication

Spec ADM-SEC-4, ADM-AUTH-2. Boards: 2FA parts of `Admin-Compte-Securite` and `Admin-Connexion`.

Decided (2026-11-11): TOTP through Fortify (no email or SMS codes); the password is checked inline in the Security tab, so Fortify's confirm-password page is off (`confirmPassword => false`); the recovery codes are shown once, through Inertia flash data.

- [x] Users migration (`vendor:publish --tag=fortify-migrations`, keep only the 2FA one), enable the Fortify feature, `TwoFactorAuthenticatable` on `User`, hide its columns
- [x] QR enable and confirm, 8 recovery codes, regenerate, disable (password required)
- [x] Challenge page `/admin/deux-facteurs` with its routes in `routes/admin.php` (Fortify's are ignored), recovery code login, `two_factor_used` in the history (`RecordLoginEvent` also records on the challenge route and on `TwoFactorAuthenticationFailed`)
- [x] Security alert on 2FA enable and disable (`TwoFactorEnabled`, `TwoFactorDisabled`, implementing `SecurityAlert`)

## Article editor helpers

### 9. Word import and editor helpers

Spec §5.3.3, ADM-ART-26, ADM-ART-27. Boards: state sections of `Admin-Article-Editeur` and `Admin-Article-Editeur-360`.

Deferred after the account sessions (decided 2026-11-10).

Dependency: `mammoth` (npm, approved 2026-11-13). Gemini is called through Laravel's `Http` client, with no package.

Decided (2026-11-13): the import works from a template, `public/modeles/modele-article.docx`, whose bracket markers split the document: `[Titre]`, `[Chapô]` and `[Corps]` open a section, `[Encadré]` … `[Fin encadré]` wrap an Encadré. Images in the document are not imported (warning only); the author adds them in the editor. The SEO description and the keywords are not in the template: one « Générer avec l’IA » button fills both with Gemini on the free tier (`GEMINI_API_KEY`, model `GEMINI_MODEL`, default `gemini-3.5-flash-lite`), accepting that Google may use the text sent to improve its products. Mammoth converts the file in the browser; `App\Support\WordImport` checks the markers and sanitizes on the server.

- [x] `.docx` modal with the template link, conversion in the browser, marker check on the server, pre-fill, replace confirmation, French errors
- [x] « Générer avec l’IA » for the SEO description and the keywords (Gemini)
- [x] Warnings on save for missing alt text, heading levels and table headers (A11Y-BODY-5)

## Subscribers and newsletter

### 10. Subscribers and public subscription

Spec §4.7, §5.5.1, §7.6. Boards: `Admin-Abonnements`, `Admin-Abonnements-360`, `Composants-Abonnement`, `Confirmations`.

Decided (2026-11-13): Q3 is Brevo through its SMTP relay (`smtp-relay.brevo.com:587`) with Laravel's built-in `smtp` mailer, so no package and a later provider change is `.env` only; webhooks stay in session 12. No disposable blocklist package: a committed snapshot of the CC0 list `disposable-email-domains/disposable-email-domains` (`resources/data/disposable-domains.txt`), refreshed weekly into `storage/app` by a `subscriptions:update-disposable-domains` command (`Http`, keeps the old file when the download looks wrong), matching parent domains too. A valid email is `email:rfc`, a domain with an MX (or A) record checked through a `DnsResolver` class faked in tests, not disposable, then confirmed by the double opt-in click.

- [x] `Subscription` model and additive migration (`confirmed_ip`, `last_confirmation_sent_at`), status enum and scopes, `Prunable` for 30-day pending (PUB-SUB-9), restore soft-deleted rows on resubscribe
- [x] `SubscribeRequest` (format, MX, disposable, honeypot), 5 per hour per IP, same answer for known addresses, no new email for a confirmed one, 10-minute resend for a pending one (PUB-SUB-2…5)
- [x] Double opt-in: queued confirmation email, signed 48 h confirm link, signed unsubscribe link with one-click POST, one `subscription-status` page (confirmed, expired, unsubscribed), branded shared mail template (`vendor:publish --tag=laravel-mail`)
- [x] Wire `resources/js/components/public/subscription-block.tsx` (`useForm`, honeypot, success through the `subscribed` flash)
- [x] Admin list: search, status filter (shared `components/admin/status-filters.tsx`), permanent delete with confirmation; « Newsletters envoyées » tab and « Créer une newsletter » shown disabled until session 11
- [x] Remove ADM-SUB-5 from the spec (CSV export dropped on the canvas)

### 11. Newsletter composer

Spec §5.5.2, §5.5.3. Boards: `Admin-Newsletter`, `Admin-Newsletter-360`, « Newsletters envoyées » section of `Admin-Abonnements`, `Newsletter`, `Newsletter-360`.

Decided (2026-11-13): the « Insérer un article » card is stored as a `<div data-article-card="{id}">` placeholder (kept only by `ArticleHtml::clean(…, allowArticleCards: true)`, non-editable preview in TinyMCE) and `App\Support\Newsletter\NewsletterRenderer` renders the real card from the live article, dropping unpublished ones. « Sélection » opens a modal with a searchable, paginated checkbox list of confirmed subscribers; a draft's selection is stored as pending `newsletter_recipients` rows. `utm_campaign` is `Str::slug(subject)`, with no slug column. The email's CSS is inlined with `tijsverkoyen/css-to-inline-styles`, already installed through `laravel/framework`. The test send goes synchronously to the author, its « Se désabonner » link pointing to the home page. « Envoyer » stays disabled until session 12.

- [x] `newsletters` and `newsletter_recipients` migrations
- [x] Sent list, draft save, reopen, duplicate (sent newsletters open read-only, as the email plus their counts)
- [x] Composer, article picker and card block with UTM links
- [x] Branded template, desktop and mobile preview, test send, recipient selection

### 12. Newsletter sending

Spec ADM-SUB-26…30, §7.6.

Decided (2026-11-13): one queued job per recipient (`SendNewsletterToRecipient`) through the `newsletter` rate limiter, 60 a minute and 250 a day by default (`NEWSLETTER_PER_MINUTE`, `NEWSLETTER_PER_DAY`: Brevo's free plan sends 300 a day, transactional included), so a larger list finishes the next day; a job retries for a week and fails after 3 errors. « Envoyer » freezes the recipients and the email (`newsletters.html`, rendered once with an unsubscribe placeholder that each job replaces). The Brevo webhook (`/webhooks/brevo`, `BREVO_WEBHOOK_TOKEN`) unsubscribes on hard bounce, spam and unsubscribe; a hard bounce also moves its recipient from « remis » to « échec » through `X-Mailin-custom`. The publish toast's link stays 10 s and pauses on hover or focus.

- [x] Send confirmation, queued batches within the provider rate limit
- [x] Per-recipient tracking, 3 retries, statuses, personalised unsubscribe link
- [x] Bounce and complaint webhooks
- [x] « Envoyer par email aux abonnés » shortcut on the publish toast
- [x] « Envoyer un test » also goes to the verified recovery email (ADM-SUB-24, feedback after session 11)

## Analytics

### 13. Analytics dashboard

Spec §5.2, §7.6. Boards: `Admin-Analytique`, `Admin-Analytique-360`.

Dependency: none (decided 2026-11-13): the GA4 Data API is called through Laravel's `Http` client with a service-account JWT signed by `openssl_sign`, no package. A real check needs the service account (added as a Viewer on the GA4 property) and the property ID from the user. The public cookie banner and the GA4 tag do not exist yet, so until session 14 the dashboard has no data to show and displays its « indisponibles » message. Top 10 articles are matched to articles by the slug in `pagePath`, old slugs included. Google takes 3 to 30 seconds to compute a report it has not seen lately (and answers at once to a known one), so the client waits 45 s with one retry, forces IPv4, caches each report on its own for an hour, and `analytics:refresh` (scheduled every 30 minutes) keeps all three periods warm: production needs the scheduler running.

- [x] Blog figures from the database
- [x] GA4 Data API with service account, 1 hour cache, period selector and comparison, unavailable message
- [x] KPI tiles, page views line chart (accessible SVG, hover tooltip, table view; load the `dataviz` skill), top 10, sources, devices, countries
- [x] `/admin` becomes this page; remove the session 1 redirect; add « Analytique » back at the top of `sidebar-nav.tsx`

## Public tracking

### 14. Cookie banner and GA4 tag

Spec PUB-MISC-2, NFR-PRIV-1, `docs/public-design-system.md` §5 (Toast, cookie banner), `docs/seo-accessibility.md`. Labels exist in `labels.cookies`; the privacy policy already mentions the `_ga` cookies. Moved out of session 13 (decided 2026-11-13): nothing loads the tag today.

- [x] Cookie banner (Accepter, Refuser, Personnaliser), consent kept in a 6-month cookie `randy-blog-consent` (as the privacy policy says), same-weight buttons, focus and live region per the accessibility rules, footer « Gérer les cookies » reopens the dialog
- [x] GA4 tag loaded only after consent, from `services.google_analytics.measurement_id` (shared as `analytics.measurementId`, `null` on `/admin`); never loaded on `/admin`
- [x] Privacy policy checked against the tag. No Content-Security-Policy exists, so none was checked: NFR-SEC-2 headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CSP for TinyMCE, GA4 and Cloudinary) are still open, for a later session
- [ ] Verify in the browser that no request to Google leaves before consent, then that data reaches the session 13 dashboard

## Launch

### 15. Production setup

Spec INF-2, INF-4, NFR-SEC-2, NFR-SEC-5, §7.8, `docs/Infrastructure.md` §7, the deploy repository below. Target: production deploy on 2026-11-14.

Decided (2026-11-13): Q7 V2 replaces V1 on the same host. Backups are manual: the user downloads `pg_dump` files from the host to their own computer, so no automated backup is set up (INF-5 dropped). Q5 closed: `/profil/{slug}`, with the 301 from `/profile/{slug}` already in `routes/web.php`. The GA4 measurement ID `G-5ZEWQRGZV5` from V1 is confirmed. The CSP ships as `Content-Security-Policy-Report-Only` at launch, so TinyMCE, GA4 or Cloudinary cannot break on day one, and is enforced in a later session once the reports are clean.

Deployment lives in a separate repository, `/home/mario/Projects/deploy-personal-blog` (private, `MaxR522/deploy-personal-blog`): one Docker Compose file on the host runs Traefik v3.6 (TLS through Let's Encrypt, HTTP → HTTPS, `www` → apex 301), Postgres 16 (`db`), V1 (`blog`, image `maxr522/personal-blog:latest` from Docker Hub, port 8000), Mémoire du monde (`unesco`, built on the host, not touched by this session) and Watchtower (pulls `latest` every 60 s and restarts labelled containers). V2 takes the `blog` service's place in that file; fixes and optimisations to it are part of this session. Found on 2026-11-13:

- Secrets in git: `config.json` (Docker Hub credentials, mounted by Watchtower) is committed, and `.env.example` carries an `APP_KEY`. Remove both from the repository, rotate the Docker Hub token, and keep the real `.env` and `config.json` only on the host.
- Postgres publishes `5432:5432` on the host: drop the port mapping (the apps reach `db` on the Compose network; dumps go through `docker exec`). Postgres 16 there, 18 in development: move production to `postgres:18-alpine` on a new volume, which the cutover's dump and restore does anyway.
- Laravel sits behind Traefik but trusts no proxy: every request looks like it comes from Traefik's IP, so the per-IP rate limits (subscription 5 an hour, login, 2FA) would hit all visitors at once, and `https` URLs depend on `X-Forwarded-Proto`. Add `trustProxies` for the Compose network in `bootstrap/app.php`, with a test.
- The `blog` service lists every variable one by one, so V2's new ones (`GEMINI_*`, `GOOGLE_ANALYTICS_*`, `BREVO_WEBHOOK_TOKEN`, `NEWSLETTER_*`, `INDEXNOW_KEY`, `INERTIA_SSR_*`, `APP_DISPLAY_TIMEZONE`, `SESSION_SECURE_COOKIE`) would be missing: switch to `env_file`.
- V1 paths do not fit V2: the healthcheck calls `/health` (V2: `/up`), volumes mount `/var/www/html/storage` (V2 image: `/app`), and the anonymous `/var/www/html/public` volume can keep serving old Vite assets after an image update: drop it, the assets ship in the image.
- No queue worker and no scheduler run in production, and V2 needs both (mails, newsletter, analytics, pruning, IndexNow). Recommended: `blog-queue` (`queue:work`) and `blog-scheduler` (`schedule:work`) services from the same image instead of a process manager inside one container, so each restarts and logs on its own (asked at the start of the session, since spec INF-2 says process manager: update INF-2 if chosen); the SSR server (`inertia:start-ssr`) runs beside Octane in the `blog` container.
- Watchtower redeploys any new `latest` within a minute, with `migrate --force` at start: push `latest` only from the CD workflow on a `v*` tag (plus the version tag, for rollback). `deploy.replicas` and `update_config` are Swarm-only and ignored by Compose: remove them.
- Loose ends: `conf/fail2ban.yml` is not wired into Traefik (no plugin loaded), the Traefik rate limit is commented out, `/var/log/traefik` has no rotation, and the `www` redirect regex leaves its dots unescaped. Fix what is quick; the rest goes to `to-do-security.md`.

- [ ] V1 dump rehearsed locally first, before anything is deployed (§7.8): restore a fresh `pg_dump` of the V1 production database (`docs/dump-database.md` in the deploy repository) into a local scratch database, mark the V1 migrations as run, run the V2 additive migrations, clean up duplicate `article_categories`, recompute `read_duration`, check every article has a slug, then check the site and the admin on that data (articles, categories, author profile, subscribers, search, images); fix any migration that fails on real data
- [ ] Production image (INF-2): multi-stage `Dockerfile` target, `composer install --no-dev --optimize-autoloader`, `npm ci && npm run build && npm run build:ssr`, no Node dev server, `docker/php/prod.ini` (OPcache on with `validate_timestamps=0`, errors logged not displayed), non-root user, plain HTTP on 8000 (Traefik ends TLS); the same image serves `blog`, `blog-queue` and `blog-scheduler`
- [ ] Start script of `blog`: `migrate --force`, `optimize` (config, routes, views, events), then Octane (FrankenPHP) and `inertia:start-ssr`; `queue:restart` on deploy; healthcheck on `/up`
- [ ] `trustProxies` for Traefik, with a test that the client IP and `https` come from the forwarded headers
- [ ] Security headers (NFR-SEC-2, left open by session 14), set in a Laravel middleware so they are tested: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP in report-only mode allowing TinyMCE (self-hosted), GA4 and Cloudinary, with Pest tests on the headers
- [ ] CD (INF-4): GitHub Actions workflow that builds the production image and pushes it to Docker Hub (`maxr522/personal-blog`, where Watchtower already looks) as `latest` and the version, on a `v*` tag, after the `tests` job passes
- [ ] Deploy repository: V2 `blog`, `blog-queue` and `blog-scheduler` services with `env_file`, Postgres 18 without the published port, the fixes listed above, secrets out of git, `.env.example` rewritten for V2 with placeholder values only (`APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, `LOG_LEVEL=warning`, Brevo SMTP, `CLOUDINARY_URL`, `GEMINI_API_KEY`, GA4 IDs and service account, `BREVO_WEBHOOK_TOKEN`, `INDEXNOW_KEY`) (NFR-SEC-5), README with the deploy and rollback steps
- [ ] Manual backup procedure in `docs/dump-database.md` of the deploy repository: the `pg_dump` command for the V2 database, the `scp` download to this computer, and the restore; drop the `personal-blog-2` lines
- [ ] V1 → V2 cutover on the shared host (§7.8): V1 in maintenance mode, final V1 dump downloaded and kept for rollback (with the V1 compose file and image tag), the steps rehearsed locally replayed on the new Postgres 18 database, V1 stopped and V2 started in its place; `unesco` stays up throughout
- [ ] External services: DNS checked (same host, so normally unchanged); Brevo sender domain with SPF, DKIM and DMARC; Brevo webhook to `https://randy-donny.com/webhooks/brevo` with the token; GA4 service account added as Viewer on the property; Google Search Console with `sitemap.xml` and `sitemap-news.xml`; Cloudinary upload preset and folders checked
- [ ] Launch checks (§7.8 step 6): row counts match V1, every published article URL answers 200, images load, the author logs in with 2FA, the confirmed-subscriber count matches, a test subscription email arrives through Brevo, the queue worker and the scheduler run (`schedule:list`, `analytics:refresh`), `robots.txt` indexable and `X-Robots-Tag` absent, Mémoire du monde still answers, then close session 14's last box in production
- [ ] `docs/Infrastructure.md`: production section (deploy repository, services, deploy, rollback, manual backups and restore), remove the « Production: to do » notes

## Nice to have

Not needed for launch. Take it after session 15.

### 16. Passkeys (nice to have)

Not in the spec yet: add an ADM-SEC requirement first. Boards: draw a « Clés d'accès » row on `Admin-Compte-Securite` / `-360` and a passkey button on `Admin-Connexion` / `-360` before coding.

Decided (2026-11-11): Fortify's passkeys (`laravel/passkeys`, already installed with Fortify); dependency `@laravel/passkeys` (npm, 0.4.1, pre-1.0) approved. A passkey login skips the TOTP challenge: the passkey is itself a second factor. Passkeys are kept in the password manager.

Notes from the 2026-11-13 exploration: Fortify's passkey routes are skipped by `Fortify::ignoreRoutes()`, so redefine them with the `Laravel\Passkeys\Http\Controllers\*` controllers; enable the feature with `Features::passkeys(['confirmPassword' => false])`, since the app has no `password.confirm` route; the app's `fortify.limiters` has no `passkeys` key, so define an admin limiter; passkey login calls `$guard->login()` directly (no Fortify pipeline), so `RecordLoginEvent`'s `routeIs` filter must include the passkey login route, and soft-deleted users need `Passkeys::authorizeLoginUsing`; `@laravel/passkeys` takes per-call `routes` overrides for the French URLs and sends the XSRF token itself.

- [ ] Passkeys migration (`vendor:publish --tag=fortify-migrations`, keep only the passkeys one), enable `Features::passkeys()`, `PasskeyAuthenticatable` and `PasskeyUser` on `User`, routes in `routes/admin.php` with throttles, management guarded by the password inline as in session 8
- [ ] Security tab « Clés d'accès » row: add (name), list (name, added, last used), delete (password required)
- [ ] Login page: « Se connecter avec une clé d'accès » button and conditional UI (autofill from the email field)
- [ ] `RecordLoginEvent` records passkey logins (history shows « Clé d'accès »), security alert on passkey added and deleted
