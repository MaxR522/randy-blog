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

### 8b. Passkeys

Not in the spec yet: add an ADM-SEC requirement first. Boards: draw a « Clés d'accès » row on `Admin-Compte-Securite` / `-360` and a passkey button on `Admin-Connexion` / `-360` before coding.

Decided (2026-11-11): Fortify's passkeys (`laravel/passkeys`, already installed with Fortify); dependency `@laravel/passkeys` (npm, 0.4.1, pre-1.0) approved. A passkey login skips the TOTP challenge: the passkey is itself a second factor. Passkeys are kept in the password manager.

- [ ] Passkeys migration (`vendor:publish --tag=fortify-migrations`, keep only the passkeys one), enable `Features::passkeys()`, `PasskeyAuthenticatable` and `PasskeyUser` on `User`, routes in `routes/admin.php` with throttles, management guarded by the password inline as in session 8
- [ ] Security tab « Clés d'accès » row: add (name), list (name, added, last used), delete (password required)
- [ ] Login page: « Se connecter avec une clé d'accès » button and conditional UI (autofill from the email field)
- [ ] `RecordLoginEvent` records passkey logins (history shows « Clé d'accès »), security alert on passkey added and deleted

## Article editor helpers

### 9. Word import and editor helpers

Spec §5.3.3, ADM-ART-27. Board: state section of `Admin-Article-Editeur`.

Deferred after the account sessions (decided 2026-11-10).

Dependency: `mammoth` recommended (spec §7.6).

- [ ] `.docx` modal, conversion and pre-fill, embedded images to Cloudinary, replace confirmation, French errors
- [ ] « Générer les mots-clés »
- [ ] Warnings on save for missing alt text, heading levels and table headers (A11Y-BODY-5)

## Subscribers and newsletter

### 10. Subscribers and public subscription

Spec §4.7, §5.5.1, §7.6. Boards: `Admin-Abonnements`, `Admin-Abonnements-360`, `Composants-Abonnement`, `Confirmations`.

Decision: Q3, email provider. Dependencies: provider driver, disposable blocklist package.

- [ ] `Subscription` model and `subscriptions` migration
- [ ] Double opt-in, disposable address check, confirm and unsubscribe pages, shared email template
- [ ] Wire `resources/js/components/public/subscription-block.tsx`, whose submit is a no-op today
- [ ] Admin list: search, status filter, permanent delete with confirmation
- [ ] Remove ADM-SUB-5 from the spec (CSV export dropped on the canvas)

### 11. Newsletter composer

Spec §5.5.2, §5.5.3. Boards: `Admin-Newsletter`, `Admin-Newsletter-360`, « Newsletters envoyées » section of `Admin-Abonnements`, `Newsletter`, `Newsletter-360`.

- [ ] `newsletters` and `newsletter_recipients` migrations
- [ ] Sent list, draft save, reopen, duplicate
- [ ] Composer, article picker and card block with UTM links
- [ ] Branded template, desktop and mobile preview, test send, recipient selection

### 12. Newsletter sending

Spec ADM-SUB-26…30, §7.6.

- [ ] Send confirmation, queued batches within the provider rate limit
- [ ] Per-recipient tracking, 3 retries, statuses, personalised unsubscribe link
- [ ] Bounce and complaint webhooks
- [ ] « Envoyer par email aux abonnés » shortcut on the publish toast

## Analytics

### 13. Analytics dashboard

Spec §5.2, §7.6. Boards: `Admin-Analytique`, `Admin-Analytique-360`.

Dependency: GA4 Data client. Needs the service account and property ID from the user.

- [ ] Blog figures from the database
- [ ] GA4 Data API with service account, 1 hour cache, period selector and comparison, unavailable message
- [ ] KPI tiles, page views line chart (accessible SVG, hover tooltip, table view; load the `dataviz` skill), top 10, sources, devices, countries
- [ ] `/admin` becomes this page; remove the session 1 redirect; add « Analytique » back at the top of `sidebar-nav.tsx`
- [ ] Verify the GA4 tag is actually loaded after consent, otherwise there is no data to show
