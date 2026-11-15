# Front-end refactor: containers, headless components, custom hooks, pure helpers

How the React code of randy-blog is structured, how a long page or component is split to reach that structure, the ordered sessions that bring the whole front end to that structure, and a ready-to-paste prompt to run the next session. The reference is the article editor split (`resources/js/pages/admin/article-editor.tsx`, 783 lines down to 153).

## Roles

| Layer | Where | Does | Never does |
| --- | --- | --- | --- |
| Container | `resources/js/pages/` (and `resources/js/layouts/` for shell-wide widgets) | Owns the logic and the API calls of the screen: reads the Inertia props and `usePage()`, calls the feature hooks, passes data and callbacks down, mounts modals and panels. | Hold long markup or inline helper functions. |
| Headless component | `resources/js/components/<area>/<feature>/` and `resources/js/components/<area>/` | Renders what it gets through props and reports user intent through callbacks (`onSubmit`, `onArchive`, `onChange`). | Make a request (`useForm`, `useHttp`, `router.*`, Wayfinder calls), read page props, hold domain state. |
| Custom hook | `resources/js/hooks/use-<feature>-form.ts` (or `use-<feature>.ts`, `use-<behaviour>.ts`) | Holds behaviour as far as possible: state, effects, refs, requests, autosave, guards, keyboard and drag handling. Called by the container; a purely visual behaviour hook (open/close, focus trap, drag) may be called by a component. | Render JSX or know class names. |
| Pure helper | `resources/js/helpers/<feature>.ts` | Plain functions and constants with no React: transforms, mapping props to form fields, counts, DOM helpers that run outside render. | Import React or hold state. |

The data flows one way: container calls the hook, the hook talks to the server, the container hands the hook's data and actions to headless components, the components call back.

## Folders

- `resources/js/hooks/`: custom hooks only, one per file, file named after the hook in kebab-case (`use-article-editor-form.ts` exports `useArticleEditorForm`).
- `resources/js/helpers/`: pure functions and constants only, file named after the feature (`article-editor.ts`, `list-url.ts`, `typography.ts`). A module-level store with no React (`cookie-consent.ts`) also lives here; its React binding is a hook (`hooks/use-cookie-consent.ts`).
- `resources/js/lib/`: only what is neither: copy (`labels.fr.ts`, `labels.admin.fr.ts`, `privacy-policy.fr.ts`), `utils.ts` (`cn`), `social.ts` and third-party setup (`cloudinary.ts`, `tinymce-configs.ts`, `google-analytics.ts`). A new hook or helper never goes in `lib/`. Update every import when moving a file.
- Types and constants shared by several features of one domain go in `helpers/<domain>.ts` (`helpers/article.ts`: `ArticleStatus`, `statusVariants`, `PreviewedArticle`), not in the component that first used them.

## The pattern

### 1. Pure helpers in `resources/js/helpers/<feature>.ts`

- Everything that needs no React: constants, types of the form data, value transforms (`slugFromTitle`, `wordCount`, `readingMinutes`, `keywordsFromInput`), mapping server props to form fields (`fieldsOf`, `emptyFiles`), DOM helpers that run outside render (`focusFirstError`).
- Named exports, explicit parameter and return types, a one-line JSDoc saying what the function does and which server rule it mirrors (for example « Same rule as `ArticleSlug::fromTitle` »).
- Reference: `resources/js/helpers/article-editor.ts`, `resources/js/helpers/article-autosave.ts`.

### 2. Custom hooks in `resources/js/hooks/`

- The feature hook is named `use<Feature>Form` / `use<Feature>` and is called by the page. It owns every piece of domain state and every action: `useForm`, `useHttp`, `useState`, refs, effects, other hooks (`useArticleAutosave`, `useUnsavedChangesGuard`), Wayfinder URLs, `router` visits, flash messages.
- Returns data plus intention-named actions (`changeTitle`, `changeCover`, `submit(intent)`, `archive`, `restoreAutosave`, `confirmLeave`, `cancelLeave`). Derived values are computed there (`isPublished`, `words`, `uploadPercentage`, `isLeaving`).
- No JSX, no class names. Export its type: `export type ArticleEditorForm = ReturnType<typeof useArticleEditorForm>;`.
- Behaviour that is purely visual and reusable (open/close, focus trap, keyboard navigation, drag, crop) also goes in a hook rather than in the component body, so the component stays markup.
- Reference: `resources/js/hooks/use-article-editor-form.ts`, `resources/js/hooks/use-article-autosave.ts`.

### 3. Headless components in `resources/js/components/<area>/<feature>/`

- Subfolder named after the feature, like `components/admin/analytics/` and `components/admin/article-editor/`. kebab-case file names, named exports, one component per file.
- Props in, callbacks out. No request, no `useForm`, no `usePage()`, no `router`. A field group may take the hook object (`editor: ArticleEditorForm`) instead of a dozen props, and calls its actions.
- Each file: `const text = adminLabels.<section>;` for copy, a `<Name>Props` type, a JSDoc saying what the block is. Keep the original markup, class names, ARIA, `data-field` attributes and live regions unchanged.
- A component that repeats a pattern gets its own file and is reused (`SidebarSection`, `EditorActionButtons`).
- A piece that is not specific to the feature goes one level up and is generic (`components/admin/text-area-field.tsx`, mirroring `text-field.tsx`).
- Imports use the `@/` alias, never `./`.
- Reference: `resources/js/components/admin/article-editor/`.

### 4. The page is the container

- Keeps the default export, the `layout`, any `key` remount, the props type, and a short composition: call the feature hook, read `usePage()` values (flash, shared props), keep UI toggles for its own modals and panels, lay out the components, pass data and callbacks.
- A component that today makes its own request (see Candidates) gets that request moved into a hook the page calls; the component receives the result and the action as props.
- The page path does not move, so the Inertia component name and the Pest feature tests stay valid.
- Reference: `resources/js/pages/admin/article-editor.tsx`.

### Rules

- Behaviour does not change. Only the requested fix (if any) changes what the user sees.
- No new dependency. Follow `CLAUDE.md`, the `inertia-react-development` and `wayfinder-development` skills, and for public pages the `public-design-system` and `seo-accessibility` skills.
- No hard-wrapped prose in Markdown.

### Verification

- `npm run types:check`, `npm run check` (Vite+ formatter, lint, canonical Tailwind), `npm run build`.
- Pest feature tests of the page in the container: `docker exec randy-blog-app php artisan test --compact tests/Feature/<Area>/<Page>Test.php`.
- Browser at the URL from Boost `get-absolute-url`: the main flows of the page work, no console errors. Clear any test draft left in `localStorage` before closing the tab.

## Sessions

The refactor runs in sessions that each fit one context window. Work through them in order: take the first session with an open box. Features that share a component are grouped in one session so its hook moves once. Line counts are from 2026-11-15.

### Session rules

- Start each session with `/clear`, then read only this document, the reference files and the files listed under the session (plus the pages that use them).
- One branch per session, `refactor/<feature>`. Do not commit unless asked.
- Re-check the files with `wc -l` first; split only where logic and markup are mixed, not files that are long only because of markup.
- A request a component makes moves into a hook called by the page; the component gets the data and the action as props.
- Each session ends with the checks of the Verification section, the Pest tests listed under it, and its boxes ticked here.

### 0. Article editor page

- [x] `pages/admin/article-editor.tsx` split (783 to 153 lines), components in `components/admin/article-editor/`
- [x] Re-check against these rules: hook and helpers moved to `hooks/use-article-editor-form.ts` and `helpers/article-editor.ts`; autosave split into `helpers/article-autosave.ts` and `hooks/use-article-autosave.ts`; `useUnsavedChangesGuard` to `hooks/use-unsaved-changes-guard.ts`; `ArticleStatus` and `statusVariants` out of `article-preview-panel.tsx` into `helpers/article.ts`; `EditorHeader` gets `backUrl` instead of calling Wayfinder; reading minutes and `hasContent` derived in the hook; preview mapping in `previewedArticleOf`

### 1. Folders and `lib/` cleanup

Mechanical moves, no behaviour change. Every later session imports from `hooks/` and `helpers/`. Tests: `tests/Feature/Admin/ArticleEditorTest.php`, `HomePageTest.php`.

- [x] Create `resources/js/hooks/` and `resources/js/helpers/`, move the article editor hook, helpers, autosave and unsaved-changes guard (done in session 0)
- [x] Pure helpers `lib/list-url.ts, `lib/analytics-format.ts`, `lib/phone.ts`, `lib/typography.ts` to `helpers/`
- [x] `lib/cookie-consent.ts` split: store and `setConsent` / `openPreferences` / `closePreferences` to `helpers/cookie-consent.ts`, `useCookieConsent` to `hooks/use-cookie-consent.ts`
- [x] `lib/` keeps only copy (`labels.fr.ts`, `labels.admin.fr.ts`, `privacy-policy.fr.ts`), `utils.ts`, `social.ts` and third-party setup (`cloudinary.ts`, `tinymce-configs.ts`, `google-analytics.ts`); update the Folders section and the reference paths in this document

### 2. Article editor satellites

Tests: `tests/Feature/Admin/ArticleEditorTest.php`, `ArticleSuggestionTest.php`, `WordImportTest.php`, `ArticleTest.php`. Run together with session 3 (shared drop zone, size format and blob URL hooks).

- [x] `components/admin/seo-suggestions.tsx` (133): request to `hooks/use-seo-suggestions.ts`, called inside `useArticleEditorForm` and exposed as `editor.seoSuggestions`
- [x] `components/admin/word-import-modal.tsx` (406): request to `hooks/use-word-import.ts` (called by the page, `reset()` on open and close since the hook outlives the modal content), parsing to `helpers/word-import.ts`, markup in `components/admin/word-import/` (modal, drop zone, file row, report)
- [x] `components/admin/article-preview-panel.tsx` (182): request to `hooks/use-article-preview.ts`, called by both `pages/admin/article-editor.tsx` and `pages/admin/articles.tsx`; `editUrl` prop replaces `isFromEditor` and the Wayfinder call

### 3. Article editor inputs

Tests: `tests/Feature/Admin/ArticleEditorTest.php`, `MediaUploadTest.php`, `CloudinaryTest.php`.

- [x] `components/admin/image-uploader.tsx` (253) and `audio-uploader.tsx` (328): behaviour to `hooks/use-image-upload.ts` and `use-audio-upload.ts`, shared `hooks/use-file-drop.ts`, `hooks/use-object-url.ts`, `helpers/media-upload.ts` (types, limits, `formatSize`, `clock`; `avatar-editor.tsx` imports from it) and the generic `components/admin/file-drop-zone.tsx`
- [x] `components/admin/category-picker.tsx` (260): behaviour to `hooks/use-category-picker.ts`, option list to `helpers/category-picker.ts`, chip to `components/admin/category-chip.tsx`
- [x] `components/admin/tinymce-editor.tsx` (182) and `rich-text-editor.tsx` (99): setup functions and `ToolbarButton` to `helpers/tinymce-editor.ts`, ARIA sync to `hooks/use-tinymce-body-aria.ts`; `rich-text-editor.tsx` is markup only, unchanged

### 4. Articles list and shared list primitives

Tests: `tests/Feature/Admin/ArticleTest.php`.

- [x] `components/admin/list-search.tsx` (68): request to `hooks/use-list-search.ts`, called by the articles, categories and subscriptions pages; `ListSearch` takes `query` / `onQueryChange`
- [x] `components/admin/row-actions-menu.tsx` (354): open and close to `hooks/use-row-actions-menu.ts`, keyboard and outside click to `hooks/use-menu-navigation.ts`, `RowAction`, viewport mode and key moves to `helpers/row-actions-menu.ts`, markup in `components/admin/row-actions-menu/` (menu, items, popover, sheet); `useModalDialog` out of `modal.tsx` into `hooks/use-modal-dialog.ts`
- [x] `pages/admin/articles.tsx` (373 to 122): `hooks/use-articles-list.ts`, `helpers/articles.ts` (`ArticleRow` carries `editUrl`), components in `components/admin/articles/`; generic `hooks/use-row-deletion.ts` (confirm, delete, focus `#contenu`) and `helpers/admin-shell.ts` (`MAIN_ID`, used by `admin-layout.tsx`)

### 5. Categories and subscriptions pages

Tests: `tests/Feature/Admin/CategoryTest.php`, `SubscriptionTest.php`. Reuses the session 4 hooks: `useListSearch` is already wired in both pages; replace their local deletion state and `MAIN_ID` with `useRowDeletion` and `helpers/admin-shell.ts`.

- [x] `pages/admin/categories.tsx` (387 to 116): `hooks/use-categories-list.ts` (sort, form modal, `useRowDeletion`), `hooks/use-category-form.ts` (`useForm` replaces the `<Form>` the modal held), `helpers/categories.ts` (`categorySortOf`), components in `components/admin/categories/`
- [x] `pages/admin/subscriptions.tsx` (270 to 113) and `subscription-tabs.tsx` (90): `useRowDeletion`, `helpers/subscriptions.ts` (types, filters, badge variants, `subscriptionsUrlsOf`), components in `components/admin/subscriptions/`; the tabs move there and take `subscribersUrl` / `newslettersUrl`, `CreateNewsletterLink` takes `href`

### 6. Newsletter pickers and preview

Tests: `tests/Feature/Admin/NewsletterTest.php`.

- [x] `components/admin/article-picker-modal.tsx` (205 to 126) and `subscriber-picker-modal.tsx` (191 to 115) with `picker-search.tsx`: `hooks/use-article-picker.ts` and `use-subscriber-picker.ts` (own `isOpen`, reset and load on `open()`), shared `hooks/use-picker-request.ts` (GET, failure, stale responses ignored) and `hooks/use-picker-search.ts` (debounce), `helpers/article-picker.ts` (`PickedArticle`, `selectionMoveOf`) and `helpers/subscriber-picker.ts`
- [x] `components/admin/newsletter-preview-modal.tsx` (155 to 124): request to `hooks/use-newsletter-preview.ts` (`open(fields)` posts the current fields through `transform`), types in `helpers/newsletter-preview.ts`

### 7. Newsletter pages

Tests: `tests/Feature/Admin/NewsletterTest.php`.

- [x] `pages/admin/newsletter-editor.tsx` (599 to 139): `hooks/use-newsletter-editor-form.ts` (exposes `articlePicker`, `subscriberPicker`, `preview`), `hooks/use-newsletter-sending-poll.ts`, `helpers/newsletter-editor.ts` (`articleCardHtml`, `newsletterFieldsOf`, `selectionErrorOf`), components in `components/admin/newsletter-editor/`; the page keeps two small containers, `SentView` and `Composer`
- [x] `pages/admin/newsletters.tsx` (206 to 77): `helpers/newsletters.ts` (`NewsletterRow` carries `showUrl`), `hooks/use-newsletter-duplicate.ts` (also used by `SentView`), components in `components/admin/newsletters/`

### 8. Account foundation and profile

Tests: `tests/Feature/Admin/AccountProfileTest.php`, `AccountSecurityTest.php`.

- [ ] `components/admin/account-row.tsx` (196) split: `useInlineEditing` and `useFocusOnOpen` to `hooks/`, `AccountTabs`, `AccountRow`, `FieldValue` and `EditorProps` to `components/admin/account/`
- [ ] `EditorActions` and `AvatarPlaceholder` out of `avatar-editor.tsx` into their own files
- [ ] `components/admin/avatar-editor.tsx` (236) and `square-cropper.tsx` (322): crop behaviour to `hooks/use-square-crop.ts`, avatar request to a hook called by the page
- [ ] `pages/admin/account-profile.tsx` (299)

### 9. Account security editors

Tests: `tests/Feature/Admin/AccountSecurityTest.php`.

- [ ] `components/admin/password-editor.tsx` (84), `recovery-email-editor.tsx` (97), `recovery-phone-editor.tsx` (72): requests to hooks called by `pages/admin/account-security.tsx`
- [ ] `components/admin/connected-devices.tsx` (186) and `login-history.tsx` (121)
- [ ] `pages/admin/account-security.tsx` (178)

### 10. Two-factor

Tests: `tests/Feature/Admin/AccountSecurityTest.php`, `TwoFactorAuthenticationTest.php`.

- [ ] `components/admin/two-factor-editor.tsx` (338): `hooks/use-two-factor.ts` called by the security page, markup in `components/admin/account/two-factor/`

### 11. Analytics

Tests: `tests/Feature/Admin/AnalyticsTest.php`.

- [ ] `pages/admin/analytics.tsx` (314) and `components/admin/analytics/line-chart.tsx` (chart behaviour to a hook if mixed)

### 12. Public search and subscription

Use the `public-design-system` and `seo-accessibility` skills. Tests: `HomePageTest.php`, `SearchPageTest.php`, `NotFoundPageTest.php`, `SubscriptionTest.php`.

- [ ] `components/public/search-bar.tsx` (96): request to `hooks/use-search.ts`, called by the home, search and not-found pages
- [ ] `components/public/subscription-block.tsx` (187): request to `hooks/use-subscription.ts`, called by `pages/home.tsx`
- [ ] `pages/home.tsx` (279) and `pages/search.tsx` (118)

### 13. Public article page

Use the `public-design-system` and `seo-accessibility` skills. Tests: `ArticlePageTest.php`.

- [ ] `components/public/image-lightbox.tsx` (489): zoom and pan, keyboard and focus trap to hooks, markup in `components/public/image-lightbox/`
- [ ] `components/public/audio-slot.tsx` (185) and `share-buttons.tsx` (178)
- [ ] `components/public/cookie-consent.tsx` (177) and `pages/article.tsx` (185)

### 14. Sweep

Tests: `tests/Feature/Admin/AuthenticationTest.php`, `AdminShellTest.php`, `SubscriptionTest.php`, `ProfilePageTest.php`.

- [ ] Auth pages: `pages/admin/login.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `two-factor-challenge.tsx`
- [ ] Shell: `layouts/admin-layout.tsx`, `components/admin/flash-toasts.tsx`, `sidebar-nav.tsx`
- [ ] `pages/subscription-status.tsx` and `pages/profile.tsx`
- [ ] No component makes a request: `grep -lE "useHttp|useForm|router\.(post|put|patch|delete|visit|get|reload)" -r resources/js/components` returns nothing
- [ ] Re-run `wc -l`, update the reference paths of this document and the project memory

## Prompt

Paste this in a new session:

```text
Run the next session of docs/frontend-refactor.md: the first session with an open box in the Sessions section (the article editor split is the reference: resources/js/pages/admin/article-editor.tsx, resources/js/components/admin/article-editor/, and the article editor hook and helpers in resources/js/hooks/ and resources/js/helpers/).

Roles: pages are the containers (logic and API calls, through the feature hook they call); components are headless (props in, callbacks out, no request, no usePage, no router); behaviour lives in custom hooks as far as possible; pure functions live in resources/js/helpers/, hooks in resources/js/hooks/.

1. Read docs/frontend-refactor.md and the reference files, then read the files listed under the session in full, and the pages that use them.
2. Plan first: list the pure helpers that move to resources/js/helpers/<feature>.ts, the custom hook(s) in resources/js/hooks/use-<name>.ts with their state and actions, any hook or helper of this feature still in resources/js/lib/ that moves out, the headless components in resources/js/components/<area>/<feature>/, any request a component makes that moves up to a hook called by the page, any generic component worth extracting one level up, and what stays in the page. Reuse existing helpers, hooks and components instead of duplicating them.
3. Implement on a refactor/<feature> branch: no behaviour change, same markup, classes, ARIA, ids and data attributes, same page path, @/ imports, adminLabels/labels for copy, no new dependency.
4. Verify: npm run types:check, npm run check, npm run build, the session's Pest feature tests in the container, and a browser check of the main flows with no console errors.
5. Tick the session's boxes in docs/frontend-refactor.md and report the new file list with line counts and what was checked. Do not commit.
```
