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

Dependency: `laravel/fortify`, because its `two_factor_*` columns match spec §7.3.2 and it also serves session 9. Decided (Q10): guests get the public 404 on `/admin/*`, and `/admin` is not listed in `robots.txt`. Fortify's routes are ignored and redefined in `routes/admin.php`.

- [x] Login, logout, « Se souvenir de moi », rate limit, session lifetimes (`/admin/connexion`)
- [x] Forgotten password and reset (`/admin/mot-de-passe-oublie`, `/admin/reinitialisation/{token}`, card added to the canvas)
- [x] `/admin` route group and guard; `/admin` redirects to `/admin/articles` until session 13; `NoIndexHeader` already covers noindex
- [x] Admin pages excluded from SSR (NFR-PERF-1)
- [x] Admin layout: sidebar expanded, collapsed and remembered, sticky top bar, mobile drawer with focus trap, placeholder page
- [x] `User` fixes from spec §7.3.2 (`articles()` relation, `SoftDeletes`)

### 2. Categories and list primitives

Spec §5.1, §5.4. Boards: `Admin-Categories`, `Admin-Categories-360`, sections 2–9 of `Admin-Composants`.

- [ ] Handle the 419 of an expired form with a flash message, instead of Laravel's default page
- [ ] Primitives: status badge (input done in session 1: `components/admin/text-field.tsx`), data table with mobile cards, search bound to `?q=`, pagination bound to `?page=`, empty state
- [ ] Primitives: modal (full screen on phone), confirm modal, flash toasts
- [ ] Categories CRUD, sort, usage count, delete with the count message
- [ ] Migration: partial unique indexes `WHERE deleted_at IS NULL`, unique `article_categories`
- [ ] `Category::articles()` keys fix, if still swapped

## Articles

### 3. Articles list and status workflow

Spec §5.3.1, §5.3.5. Boards: `Admin-Articles`, `Admin-Articles-360`.

Decision: is « À la une » still used? The home hero card was removed from the design, so check whether anything public reads `is_featured`. If nothing does, drop the badge and the toggle from the canvas and the spec.

- [ ] List: sort, status filter, row actions menu (bottom sheet on phone), « Aperçu »
- [ ] Actions: publish, archive, soft delete drafts, first-publication date only (Q9), single featured article in a transaction
- [ ] Preview route and `PreviewBanner` for the logged-in author (`Seo` already has the noindex case)
- [ ] Check that `ArticleObserver` covers these status changes

### 4. Media and TinyMCE

Spec §5.3.4, §7.5, Appendix B. Reference: `personal-blog-2/resources/js/components/admin/TinyMCEEditor.tsx` and `ImageUploader.tsx`.

Dependencies: `tinymce` and `@tinymce/tinymce-react` (Q2, recommended self-hosted GPL), Cloudinary SDK or signed HTTP.

- [ ] Authenticated Cloudinary upload service and endpoint, folders, delete on replace, with feature tests on the endpoint
- [ ] `ImageUploader` component
- [ ] TinyMCE component with `full`, `minimal` and `newsletter` configs, French UI, block formats, « Encadré » style, `content_css` from the theme, mobile mode

### 5. Article editor

Spec §5.3.2, §5.3.5, rules B5/B6 of `docs/seo-accessibility.md`. Boards: `Admin-Article-Editeur`, `Admin-Article-Editeur-360`.

- [ ] Create and edit, fields ADM-ART-20…28, state-dependent header actions, sticky mobile bar
- [ ] Validation: a draft needs only the title (Q8), publishing needs every field
- [ ] Save through `ArticleHtml::sanitize`, compute `raw_content` and `read_duration`, keep the author on edit
- [ ] Category multi-select with inline create
- [ ] Slug frozen after publication, `article_slug_redirects` migration, 301 from the public route (ADM-ART-64)
- [ ] Unsaved-changes warning, 30 s browser autosave with restore

### 6. Word import and editor helpers

Spec §5.3.3, ADM-ART-27. Board: state section of `Admin-Article-Editeur`.

Dependency: `mammoth` recommended (spec §7.6).

- [ ] `.docx` modal, conversion and pre-fill, embedded images to Cloudinary, replace confirmation, French errors
- [ ] « Générer les mots-clés »
- [ ] Warnings on save for missing alt text, heading levels and table headers (A11Y-BODY-5)

## Account

### 7. Profile tab

Spec §5.6.1. Boards: `Admin-Compte-Profil`, `Admin-Compte-Profil-360`.

- [ ] One-field-at-a-time inline editing
- [ ] Avatar with square crop and credit
- [ ] Display name, biography (TinyMCE `minimal`)
- [ ] Login email change with password and confirmation link

### 8. Security tab, without 2FA

Spec §5.6.2 (ADM-SEC-1, 2, 3, 5, 6, 7). Boards: `Admin-Compte-Securite`, `Admin-Compte-Securite-360`.

Decision: Q6, recommended storing the recovery phone only.

- [ ] Password change with rules and logout of other sessions
- [ ] Recovery email, a second address that must differ from the login email, with verification link; recovery phone
- [ ] Send the reset link to the recovery email too, and restore the board wording on the forgotten password page (ADM-AUTH-2)
- [ ] Connected devices from `sessions`, per-device and global logout
- [ ] `login_events` migration and login history
- [ ] Security alert emails

### 9. Two-factor authentication

Spec ADM-SEC-4, ADM-AUTH-2. Boards: 2FA parts of `Admin-Compte-Securite` and `Admin-Connexion`.

- [ ] Users migration (`vendor:publish --tag=fortify-migrations`, keep only the 2FA one), enable the Fortify feature, `TwoFactorAuthenticatable` on `User`, hide its columns
- [ ] QR enable and confirm, 8 recovery codes, regenerate, disable (password required)
- [ ] Challenge page `/admin/deux-facteurs` with its routes in `routes/admin.php` (Fortify's are ignored), recovery code login, `two_factor_used` in the history

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
