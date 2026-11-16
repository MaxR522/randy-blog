# End-to-end test roadmap

Browser tests that replace the manual checks done after each change. They run real Chromium against the app through Pest's browser plugin (`pestphp/pest-plugin-browser`, Playwright under the hood), so they are written in Pest and keep factories, `RefreshDatabase`, `actingAs()` and fakes. Each session below is sized to fit one context window. Work through them in order: take the first session with an open box. Sessions 3 to 6 only depend on session 2 and can run in any order.

## Decisions

- Tool: Pest browser testing, not Dusk (ChromeDriver, separate process, no fakes, needs truncation) and not a standalone TypeScript Playwright suite (no factories, a second test stack).
- Environment: the dev image moves from Alpine to Debian, because Playwright's browsers do not support musl. Tests keep running in the container (`docker exec randy-blog-app php artisan test …`).
- Data comes from factories and states, never from the UI of another scenario. Mails and notifications are faked and their links built in the test (signed URLs), not read from Mailpit.
- External services are faked with `Http::fake()` (Cloudinary, Brevo, IndexNow). No test may reach the network.

## Session rules

- Start each session with `/clear`, then read only this roadmap and the files the session lists.
- Check the Pest browser API with Boost `search-docs` (package `pestphp/pest`) before writing tests; do not rely on memory for method names.
- Browser tests live in `tests/Browser`, one file per area (`CategoryTest.php`, `ArticleTest.php`, …), in a `Browser` testsuite in `phpunit.xml`.
- Select elements by accessible name (label, button text, role) taken from `resources/js/lib/labels.fr.ts`. Add a `data-test` attribute only when no accessible name exists, and never change copy or markup to suit a test.
- Every page visited asserts `assertNoJavaScriptErrors()`. Public pages also assert `assertNoAccessibilityIssues()` where the plugin supports it.
- A scenario tests one user journey end to end, then asserts the database state it should leave. Edge cases and validation rules stay in the feature tests.
- Dependencies listed under a session need the user's approval at its start (already given for sessions 1 and 2).
- Each session ends with its tests passing three runs in a row (no flakes), `vendor/bin/pint --dirty --format agent`, PHPStan, `npm run check`, and its boxes ticked here.

## Foundation

### 1. Debian dev image

Files: `Dockerfile`, `docker-compose.yml`, `docker/php/dev.ini`, `docs/Infrastructure.md`.

Decided: move the dev image to Debian. No behaviour change in this session: the app, queue, scheduler and Vite must work exactly as before.

- [ ] `FROM dunglas/frankenphp:1-php8.5` (Debian), `apk` replaced by `apt-get` with `--no-install-recommends` and cleaned lists
- [ ] Node from the official image (`COPY --from=node:<lts>-bookworm-slim`) instead of Debian's old `nodejs`; same major as the host
- [ ] Same PHP extensions, `postgresql-client`, `curl`, UID/GID handling, `HOME=/tmp`, `HEALTHCHECK NONE`
- [ ] Recreate the `node_modules` volume (it holds musl binaries) and update the compose comments that say Alpine
- [ ] Check: `docker compose up` clean, Octane `--watch` reloads, Vite HMR and Wayfinder generation, queue and scheduler, full `php artisan test` green
- [ ] Update `docs/Infrastructure.md` and the dev environment memory (Alpine notes)

### 2. Browser testing setup and smoke test

Files: `composer.json`, `package.json`, `Dockerfile`, `phpunit.xml`, `tests/Pest.php`, `CLAUDE.md`.

Dependencies: `pestphp/pest-plugin-browser` (dev), `playwright` (npm, dev, pinned).

- [ ] Install both packages; Chromium and its system libraries in the image, at the version matching the pinned `playwright` (`PLAYWRIGHT_BROWSERS_PATH` outside `HOME=/tmp`)
- [ ] `Browser` testsuite, `tests/Browser` directory, `RefreshDatabase` and the shared fakes (`Http::preventStrayRequests()`, `Notification::fake()`) in `tests/Pest.php`
- [ ] Assets: decide between `npm run build` before the suite or the running Vite server, and document it
- [ ] Helper to log in as the admin (`actingAs`) and one test that goes through the real login form once
- [ ] Smoke test: home page, an article page and `/admin/articles` load with no JavaScript errors
- [ ] `composer test:browser` (or npm script) and a short "Browser tests" section in `CLAUDE.md`; debug and headed mode noted

## Admin content

### 3. Categories

Routes: `routes/admin.php` (categories). Pages: `resources/js/pages/admin/categories*`.

- [ ] Create a category from the modal, see it in the list
- [ ] Edit its name, see the new name and the old one gone
- [ ] Delete it through the confirm modal, with the usage count message when articles use it
- [ ] Search with `?q=` and the flash toast after each action

### 4. Articles

Routes: `routes/admin.php` (articles). Pages: `resources/js/pages/admin/articles*`. TinyMCE is self-hosted; Cloudinary is faked.

- [ ] Create a draft: title, category, cover upload (faked Cloudinary response), body typed in TinyMCE
- [ ] Edit it: change title and body, save, see the change in the list and the preview
- [ ] Publish it from the row actions menu: status badge changes, the public article page shows it, first-publication date set
- [ ] Archive it: status badge changes, the public page no longer lists it
- [ ] Observers' side effects faked and asserted (IndexNow call, cache), no newsletter actually sent

## Public and subscribers

### 5. Subscription flow

Routes: `/abonnement`, `/abonnement/confirmer/{subscription}`, `/abonnement/desabonner/{subscription}`, `admin/abonnements`. Notification: `App\Notifications\ConfirmSubscription`.

- [ ] Subscribe from the home form: success message, `ConfirmSubscription` sent, subscription pending
- [ ] Confirm through the signed link from the notification: confirmation page, subscription active
- [ ] Unsubscribe through the signed link: confirmation page, subscription inactive
- [ ] Admin deletes a subscription from `admin/abonnements` through the confirm modal
- [ ] Disposable domain lookup and Brevo calls faked so the test stays offline

### 6. Account

Routes: `admin/compte`, `admin/compte/securite`. Fortify two-factor with confirmation is on.

- [ ] Profile: display name, biography, avatar upload (faked Cloudinary), email change request sends the confirmation
- [ ] Security: change password, then log out and log in with the new one
- [ ] Two-factor: enable, confirm with a TOTP code computed in the test, see recovery codes, disable
- [ ] Recovery email set and removed; other devices signed out

### 7. Search and « Voir plus »

Routes: `/recherche`, `/`. Copy: `labels.fr.ts` (`seeMore`).

- [ ] Search by a word in a title: matching articles shown, others not, query kept in the URL
- [ ] No result state
- [ ] « Voir plus » loads the next page of articles without a full reload and hides itself on the last page
- [ ] Same checks at 360 px width (`resize`), with no accessibility issues

## Later

### 8. CI

- [ ] GitHub Actions job running the browser suite on pull requests, with Postgres as a service and Playwright's Chromium cached; screenshots uploaded on failure
