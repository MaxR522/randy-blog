---
name: seo-accessibility
description: Use when building or changing any public page or component of randy-donny.com, or anything that affects search engines or assistive technology: <head> tags (title, description, canonical, robots, Open Graph), JSON-LD structured data, sitemap and robots.txt, redirects and status codes, image alt text and loading, forms and error messages, ARIA attributes, landmarks, headings, keyboard and focus management, live regions, screen reader support, the article HTML sanitizer and TinyMCE content rules. Not for the admin panel's visual design.
---

# SEO and accessibility

Target: every public page crawlable and fully described to search engines, and fully usable with a screen reader or keyboard alone (WCAG 2.2 AA).

**Status:** the accessibility rules and the definition of done apply to every public change now. The SEO rules are the target spec only: they are implemented in one dedicated pass once all public pages exist. Until then, do not add the `Seo` component, JSON-LD, sitemap or robots routes piecemeal unless the user asks for the SEO pass.

## Before writing code

1. Read `docs/seo-accessibility.md`: Part A (SEO), Part B (accessibility, with the component ARIA table in B4), Part C (verification). Requirement IDs (`SEO-HEAD-2`, `A11Y-STRUCT-7`, …) go in commits and test names.
2. For visual rules, also use the `public-design-system` skill. Both apply to public work.
3. New French strings (skip link, « nouvel onglet », announcements) go in `resources/js/lib/labels.fr.ts`.

## Reuse, do not rebuild

- Every public page uses `resources/js/layouts/public-layout.tsx` (skip link, `main#contenu`, page announcer).
- Links to other sites: `ExternalLink` (`resources/js/components/public/external-link.tsx`).
- Card groups: `StandardCard` renders an `<li>`, so wrap cards in `<ul role="list">`.
- Load-more lists: copy the `AllArticles` pattern in `resources/js/pages/home.tsx` (status announcement + focus on the first new item).
- Screen-reader-only copy: `labels.a11y` in `resources/js/lib/labels.fr.ts`.

## SEO rules (deferred pass)

- Server-rendered: content, head tags and JSON-LD are in the SSR HTML. Nothing search-relevant is added only on the client.
- Every public page renders the shared `Seo` component inside Inertia `<Head>`, fed by a `seo` prop built on the server in one place. Every tag has a `head-key`.
- Each page has a unique `<title>`, a 140–160 character description, an absolute canonical URL, the right `robots` value (search, confirmations, previews, errors are `noindex`), Open Graph and Twitter tags, and JSON-LD (`WebSite` + `Person` on home, `BlogPosting` + `BreadcrumbList` on articles, `ProfilePage` on the author page) with real dates.
- Correct status codes: 404 for missing or unpublished, 410 for archived, 301 for old slugs, one hop only.
- Links are real `<a href>`; paginated content has a crawlable `?page=n` URL behind any « Voir plus » button.
- The LCP image gets `fetchpriority="high"` and no lazy loading; every other image is lazy with `srcset`, `sizes` and a ratio class.

## Accessibility rules

- Native elements first: `<a>` navigates, `<button>` acts, `<input>` has a `<label>`. ARIA only where HTML has nothing; never a redundant `role`.
- Page skeleton: skip link « Aller au contenu », `<header>` › `<nav aria-label="Navigation principale">`, `<main id="contenu" tabindex="-1">`, `<footer>`. One `h1`, no skipped levels, sections `aria-labelledby` their heading, card lists as `<ul role="list">`.
- Icon-only controls have an `aria-label`; decorative SVGs are `aria-hidden="true" focusable="false"`; links opening a new tab say « (nouvel onglet) ».
- Dynamic changes are announced: a persistent polite live region for page changes, « Voir plus » results, « Lien copié », result counts; errors use `role="alert"` + `aria-invalid` + `aria-describedby`, success uses `role="status"`; focus moves to the new content or the first invalid field.
- Images: meaningful `alt` on content images and covers, `alt=""` on decorative or redundant ones (card images inside a hidden link). Iframes have a `title`.
- Focus ring from the base layer is never removed; nothing focusable hides under the sticky navbar; tap targets 44 × 44; no keyboard trap except inside a native `<dialog>`, which Escape closes and which returns focus.
- Respect `prefers-reduced-motion` and forced-colors mode; zoom to 200 % and 320 px width without horizontal scroll.

## Definition of done

- Once the SEO pass is done: Pest tests cover the head output, robots, sitemap, status codes and redirects for the page (Part C, VER-1).
- axe reports zero serious or critical violations (once the dependency is approved, VER-2); otherwise run axe or Lighthouse manually and report the result.
- Keyboard-only pass done; the C3 checklist row for the page is satisfied.
