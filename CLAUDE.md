# randy-blog

Laravel on PHP 8.5, Octane, Inertia v3 + React + TypeScript, Tailwind v4, Wayfinder, Fortify, Pest. Check installed versions (`composer show <package>`, `package.json`) before relying on a package API. Do not add or change dependencies without approval. Follow sibling files for structure and naming.

## Tools

- Laravel Boost MCP: `search-docs` for Laravel, Inertia, Tailwind, Pest, Wayfinder, Fortify, Octane docs (version-matched; prefer it over ctx7 for these). `database-schema` before migrations, `database-query` for read-only SQL, `last-error` / `read-log-entries` / `browser-logs` for debugging, `get-absolute-url` before sharing a URL.
- Create files with `php artisan make:* --no-interaction` (`make:class` for plain classes, `make:test --pest Name` for tests).
- Use the matching skill when working in its area (inertia-react, wayfinder, tailwindcss, fortify, octane, laravel-best-practices, testing-best-practices).

## PHP

- Constructor property promotion, explicit return and parameter types, curly braces always, TitleCase enum keys, PHPDoc (with array shapes) over inline comments.
- Octane: no request state in singletons or static properties; prefer `scoped()` bindings.
- After PHP changes: `vendor/bin/pint --dirty --format agent`, then PHPStan.

## Frontend

- Inertia pages in `resources/js/pages`. Axios is removed: use Inertia's HTTP client (`useHttp`). `Inertia::lazy()` is gone: use `Inertia::optional()`. Deferred props get a pulsing skeleton.
- Routes in JS come from Wayfinder (`@/actions/`, `@/routes/`), never hardcoded URLs.
- "Unable to locate file in Vite manifest": run `npm run build`.

## Tests

- Add or update Pest tests for behavior changes; none for pure copy or styling. Run the narrowest set: `php artisan test --compact <file> --filter=<name>`. Never delete tests without approval. Use factories and their states.

## Public site design (V2)

The public pages of randy-donny.com follow the V2 design system. Before touching any public page or component, use the `public-design-system` skill and read `docs/public-design-system.md`. Tokens live in `resources/css/theme.css` (Tailwind v4). Exact French copy is in `resources/js/lib/labels.fr.ts`. The visual reference boards are in `docs/design/boards/`. The admin panel is a separate design: do not restyle it.

## SEO and accessibility

Every public page must meet `docs/seo-accessibility.md` (technical SEO, structured data, WCAG 2.2 AA, ARIA per component). Use the `seo-accessibility` skill for any public page, component, head tag, form or article HTML change. Accessibility (Part B) and SEO (Part A) are mandatory for every public page: head tags come from `App\Support\Seo\Seo` through the `seo` prop and the `Seo` component.
