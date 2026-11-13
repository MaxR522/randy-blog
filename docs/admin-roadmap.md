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
- [x] `/admin` route group and guard; `/admin` redirects to `/admin/articles` until session 13; `NoIndexHeader` already covers noindex
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

Dependency: GA4 Data client. Needs the service account and property ID from the user.

- [ ] Blog figures from the database
- [ ] GA4 Data API with service account, 1 hour cache, period selector and comparison, unavailable message
- [ ] KPI tiles, page views line chart (accessible SVG, hover tooltip, table view; load the `dataviz` skill), top 10, sources, devices, countries
- [ ] `/admin` becomes this page; remove the session 1 redirect; add « Analytique » back at the top of `sidebar-nav.tsx`
- [ ] Verify the GA4 tag is actually loaded after consent, otherwise there is no data to show

## Nice to have

Not needed for launch. Take it after session 13.

### 14. Passkeys (nice to have)

Not in the spec yet: add an ADM-SEC requirement first. Boards: draw a « Clés d'accès » row on `Admin-Compte-Securite` / `-360` and a passkey button on `Admin-Connexion` / `-360` before coding.

Decided (2026-11-11): Fortify's passkeys (`laravel/passkeys`, already installed with Fortify); dependency `@laravel/passkeys` (npm, 0.4.1, pre-1.0) approved. A passkey login skips the TOTP challenge: the passkey is itself a second factor. Passkeys are kept in the password manager.

Notes from the 2026-11-13 exploration: Fortify's passkey routes are skipped by `Fortify::ignoreRoutes()`, so redefine them with the `Laravel\Passkeys\Http\Controllers\*` controllers; enable the feature with `Features::passkeys(['confirmPassword' => false])`, since the app has no `password.confirm` route; the app's `fortify.limiters` has no `passkeys` key, so define an admin limiter; passkey login calls `$guard->login()` directly (no Fortify pipeline), so `RecordLoginEvent`'s `routeIs` filter must include the passkey login route, and soft-deleted users need `Passkeys::authorizeLoginUsing`; `@laravel/passkeys` takes per-call `routes` overrides for the French URLs and sends the XSRF token itself.

- [ ] Passkeys migration (`vendor:publish --tag=fortify-migrations`, keep only the passkeys one), enable `Features::passkeys()`, `PasskeyAuthenticatable` and `PasskeyUser` on `User`, routes in `routes/admin.php` with throttles, management guarded by the password inline as in session 8
- [ ] Security tab « Clés d'accès » row: add (name), list (name, added, last used), delete (password required)
- [ ] Login page: « Se connecter avec une clé d'accès » button and conditional UI (autofill from the email field)
- [ ] `RecordLoginEvent` records passkey logins (history shows « Clé d'accès »), security alert on passkey added and deleted
