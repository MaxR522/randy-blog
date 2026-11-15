# Front-end refactor: containers, headless components, custom hooks, pure helpers

How the React code of randy-blog is structured, how a long page or component is split to reach that structure, and a ready-to-paste prompt to run the refactor in a new Claude Code session. The reference is the article editor split (`resources/js/pages/admin/article-editor.tsx`, 783 lines down to 153).

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
- `resources/js/helpers/`: pure functions and constants only, file named after the feature (`article-editor.ts`).
- `resources/js/lib/`: what is neither, such as copy (`labels.fr.ts`, `labels.admin.fr.ts`), `utils.ts` (`cn`) and third-party setup (`cloudinary.ts`, `tinymce-configs.ts`, `google-analytics.ts`).
- Hooks and helpers still in `lib/` today move out when their feature is refactored: `lib/article-editor.ts` to `helpers/article-editor.ts`, `lib/article-editor-form.ts` to `hooks/use-article-editor-form.ts`, `useArticleAutosave` out of `lib/article-autosave.ts` (its storage functions to `helpers/`), `useUnsavedChangesGuard` out of `lib/unsaved-changes.ts`. Update every import when moving a file.

## The pattern

### 1. Pure helpers in `resources/js/helpers/<feature>.ts`

- Everything that needs no React: constants, types of the form data, value transforms (`slugFromTitle`, `wordCount`, `readingMinutes`, `keywordsFromInput`), mapping server props to form fields (`fieldsOf`, `emptyFiles`), DOM helpers that run outside render (`focusFirstError`).
- Named exports, explicit parameter and return types, a one-line JSDoc saying what the function does and which server rule it mirrors (for example « Same rule as `ArticleSlug::fromTitle` »).
- Reference: `resources/js/lib/article-editor.ts` (to move to `helpers/article-editor.ts`).

### 2. Custom hooks in `resources/js/hooks/`

- The feature hook is named `use<Feature>Form` / `use<Feature>` and is called by the page. It owns every piece of domain state and every action: `useForm`, `useHttp`, `useState`, refs, effects, other hooks (`useArticleAutosave`, `useUnsavedChangesGuard`), Wayfinder URLs, `router` visits, flash messages.
- Returns data plus intention-named actions (`changeTitle`, `changeCover`, `submit(intent)`, `archive`, `restoreAutosave`, `confirmLeave`, `cancelLeave`). Derived values are computed there (`isPublished`, `words`, `uploadPercentage`, `isLeaving`).
- No JSX, no class names. Export its type: `export type ArticleEditorForm = ReturnType<typeof useArticleEditorForm>;`.
- Behaviour that is purely visual and reusable (open/close, focus trap, keyboard navigation, drag, crop) also goes in a hook rather than in the component body, so the component stays markup.
- Reference: `resources/js/lib/article-editor-form.ts` (to move to `hooks/use-article-editor-form.ts`).

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

## Candidates

Components that make their own requests today, to turn headless (request moved to a hook called by the container): `components/admin/seo-suggestions.tsx`, `word-import-modal.tsx`, `article-preview-panel.tsx`, `article-picker-modal.tsx`, `subscriber-picker-modal.tsx`, `newsletter-preview-modal.tsx`, `list-search.tsx`, `account-row.tsx`, `avatar-editor.tsx`, `password-editor.tsx`, `recovery-email-editor.tsx`, `recovery-phone-editor.tsx`, `two-factor-editor.tsx`, `connected-devices.tsx`, `components/public/search-bar.tsx`, `subscription-block.tsx`. Find the current list with `grep -lE "useHttp|useForm|router\.(post|put|patch|delete|visit|get|reload)" -r resources/js/components`.

Largest files at the time of writing (lines): `pages/admin/newsletter-editor.tsx` (599), `components/public/image-lightbox.tsx` (489), `components/admin/word-import-modal.tsx` (406), `pages/admin/categories.tsx` (387), `pages/admin/articles.tsx` (368), `components/admin/row-actions-menu.tsx` (354), `components/admin/two-factor-editor.tsx` (338), `components/admin/audio-uploader.tsx` (328), `components/admin/square-cropper.tsx` (322), `pages/admin/analytics.tsx` (314), `pages/admin/account-profile.tsx` (299), `pages/home.tsx` (279), `pages/admin/subscriptions.tsx` (270), `components/admin/category-picker.tsx` (260), `components/admin/image-uploader.tsx` (253). Re-check with `wc -l` first; split only files where logic and markup are mixed, not files that are long only because of markup.

## Prompt

Paste this in a new session, replacing `<FILE>`:

```text
Refactor <FILE> following docs/frontend-refactor.md (the article editor split is the reference: resources/js/pages/admin/article-editor.tsx, resources/js/lib/article-editor.ts, resources/js/lib/article-editor-form.ts, resources/js/components/admin/article-editor/; hooks and helpers that still sit in lib/ move to hooks/ and helpers/ as described in the Folders section).

Roles: pages are the containers (logic and API calls, through the feature hook they call); components are headless (props in, callbacks out, no request, no usePage, no router); behaviour lives in custom hooks as far as possible; pure functions live in resources/js/helpers/, hooks in resources/js/hooks/.

1. Read docs/frontend-refactor.md and the reference files, then read <FILE> in full, and the page(s) that use it if <FILE> is a component.
2. Plan first: list the pure helpers that move to resources/js/helpers/<feature>.ts, the custom hook(s) in resources/js/hooks/use-<name>.ts with their state and actions, any hook or helper of this feature still in resources/js/lib/ that moves out, the headless components in resources/js/components/<area>/<feature>/, any request a component makes that moves up to a hook called by the page, any generic component worth extracting one level up, and what stays in the page. Reuse existing helpers, hooks and components instead of duplicating them.
3. Implement: no behaviour change, same markup, classes, ARIA, ids and data attributes, same page path, @/ imports, adminLabels/labels for copy, no new dependency.
4. Verify: npm run types:check, npm run check, npm run build, the page's Pest feature tests in the container, and a browser check of the main flows with no console errors.
5. Report the new file list with line counts and what was checked. Do not commit.
```
