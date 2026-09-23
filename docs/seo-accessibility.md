# SEO and accessibility: randy-donny.com

| | |
|---|---|
| Status | Draft for review |
| Last update | 2026-09-23 |
| Applies to | Public site (all pages, newsletter email). Admin: §B11 only |
| Related | `docs/Specification.md` (PUB-MISC-4, NFR-A11Y-1, NFR-PERF-*), `docs/public-design-system.md`, skill `seo-accessibility` |

**Implementation status.** Part B (accessibility) is mandatory now: every existing and every new public page and component MUST meet it before it is considered done. Part A (SEO) is the target specification but is implemented in one dedicated pass once all public pages exist; until then, do not add SEO tags, JSON-LD, sitemap or robots routes piecemeal.

Conventions are the same as in the specification: **MUST** = required for launch, **SHOULD** = expected, **MAY** = optional. Requirements have IDs (`SEO-HEAD-3`, `A11Y-KB-2`, …) to reference in tickets and tests. Items marked **(added)** are new proposals to validate. UI strings are quoted in their final French form.

Two goals:

1. **SEO**: every public page is crawlable, indexable, fast, and described precisely to search engines and social networks. No site can guarantee a first-place ranking; ranking also depends on content quality, freshness and backlinks. This document covers everything the site controls, so nothing technical holds the content back.
2. **Accessibility**: the blog is fully usable by a blind person with a screen reader, by keyboard-only users, by people with low vision (zoom, high contrast), and by people with motor or cognitive disabilities. Target: **WCAG 2.2 level AA** in full. The French reference framework RGAA 4.1 is based on WCAG and is used as a checklist where it is more precise.

Good accessibility and good SEO overlap: semantic HTML, one clear `h1`, descriptive titles and links, alt text, fast pages. When in doubt, the accessible choice is also the SEO choice.

---

## Part A — SEO

### A1. Crawling and indexing

- **SEO-CRAWL-1** Every public page MUST be server-side rendered (Inertia SSR): the full content, the `<head>` tags and the JSON-LD are in the initial HTML response. Nothing that matters for search is added only by client-side JavaScript.
- **SEO-CRAWL-2** `robots.txt` (served by a route, not a static file, so the sitemap URL uses `APP_URL`):
  ```
  User-agent: *
  Disallow: /admin
  Disallow: /abonnement/
  Disallow: /recherche

  Sitemap: https://randy-donny.com/sitemap.xml
  ```
  In any non-production environment, `robots.txt` MUST return `Disallow: /` and every response MUST carry `X-Robots-Tag: noindex, nofollow`.
- **SEO-CRAWL-3** Indexing per page type:

  | Page | `<meta name="robots">` | In sitemap |
  |---|---|---|
  | Home `/` | `index, follow, max-image-preview:large` | yes |
  | Article `/articles/{slug}` (published) | `index, follow, max-image-preview:large` | yes |
  | Author `/profil/{slug}` | `index, follow` | yes |
  | Privacy policy | `index, follow` | yes |
  | Search `/recherche` | `noindex, follow` (PUB-SRCH-7) | no |
  | Subscription confirm / expired / unsubscribed | `noindex, nofollow` | no |
  | Article preview (draft/archived, author only) | `noindex, nofollow` | no |
  | 404, 500, 503 | `noindex` | no |
  | Admin `/admin/*` | `noindex, nofollow` plus header `X-Robots-Tag: noindex, nofollow` | no |

  `max-image-preview:large` lets Google show the large cover in Discover and results.
- **SEO-CRAWL-4** HTTP status codes MUST be correct: a missing page returns a real `404` (not a 200 with an error message); an article that was published and then archived returns `410 Gone` **(added)**; maintenance returns `503` with `Retry-After`.
- **SEO-CRAWL-5** Redirects are permanent `301`: old article slugs → current slug (§7.7 of the spec), `/profile/{slug}` → `/profil/{slug}`, `http` → `https`, the non-canonical host → the canonical host (see open point O1), and URLs with a trailing slash → without. No redirect chains (at most one hop).
- **SEO-CRAWL-6** Every public URL is reachable through plain `<a href>` links from another page (no link that only exists as a JavaScript handler). The « Tous les articles » « Voir plus » button MUST also have a crawlable fallback: the paginated URL `/?page=2` renders the list server-side, so crawlers find every article without JavaScript.

### A2. URLs

- **SEO-URL-1** Lowercase, hyphenated, without accents, stable: `/articles/je-pense-donc-j-essuie`. Generated from the title, editable until first publication, then frozen (§5.3.5 of the spec); any later change keeps a 301 from the old slug.
- **SEO-URL-2** No IDs, dates or tracking parameters in canonical URLs. Short slugs SHOULD be preferred (drop stop words when the editor shortens it).

### A3. `<head>` per page

- **SEO-HEAD-1** Implementation: one `Seo` React component used by every public page inside Inertia's `<Head>`. Its data is built on the server by one PHP class (e.g. `App\Support\Seo\SeoData`) passed as the `seo` prop, so SSR output is complete and every controller uses the same rules. Every tag carries a `head-key` so client navigations replace tags instead of duplicating them. The root template `resources/views/app.blade.php` keeps only site-wide tags (charset, viewport, icons, fonts).
- **SEO-HEAD-2** `<title>`, unique per page, the most important words first, about 60 characters max before the suffix:

  | Page | Pattern |
  |---|---|
  | Home | `Randy Donny — Je pense, donc j'essuie…` |
  | Article | `{Article title} — Randy Donny` (the admin MAY override with a dedicated SEO title) |
  | Author | `Randy Donny — À propos` |
  | Search | `Résultats pour « {q} » — Randy Donny` |
  | Home page 2+ | `Tous les articles, page {n} — Randy Donny` |
  | 404 | `Page introuvable — Randy Donny` |

- **SEO-HEAD-3** `<meta name="description">`, unique, 140–160 characters, a real sentence: article `description` field, fallback the chapô truncated on a word boundary with « … ». Home: the hero description. Author: the first sentence of the biography.
- **SEO-HEAD-4** `<link rel="canonical">` on every indexable page, absolute `https` URL on the canonical host. Tracking parameters (`utm_*`, `fbclid`, `gclid`) are stripped. Paginated home pages (`/?page=n`) are canonical to themselves, not to `/` (Google's current guidance), and are `index, follow`.
- **SEO-HEAD-5** `<html lang="fr">` (from `APP_LOCALE=fr`, NFR-LANG-4) and `<meta property="og:locale" content="fr_FR">`.
- **SEO-HEAD-6** Open Graph on every indexable page: `og:title`, `og:description`, `og:url` (= canonical), `og:site_name` « Randy Donny », `og:type` (`website` for home, `article` for articles, `profile` for the author page), `og:image` + `og:image:width` + `og:image:height` + `og:image:alt`. Articles also: `article:published_time`, `article:modified_time` (ISO 8601 with timezone), `article:author` (author page URL), `article:section` (first category), one `article:tag` per category.
- **SEO-HEAD-7** Share image: the article cover through a Cloudinary transformation `c_fill,g_auto,w_1200,h_630,f_jpg,q_auto` (JPEG, because some networks still reject WebP/AVIF). Other pages use a default image (1200 × 630, wordmark on white) stored in `public/`. Always absolute URLs.
- **SEO-HEAD-8** Twitter/X: `twitter:card` = `summary_large_image`, `twitter:site` and `twitter:creator` = `@Randydonny` (confirm exact handle: the hero links to `x.com/Randydonny`, the spec says `@randydonny`; handles are case-insensitive but keep one spelling). Title, description and image fall back to Open Graph, so they are not duplicated.
- **SEO-HEAD-9** `<meta name="keywords">` from the article `keywords` field MAY stay (PUB-MISC-4) but has no ranking value for Google or Bing: no effort should go into it.
- **SEO-HEAD-10** Site-wide in `app.blade.php`: favicon set already present, plus `site.webmanifest` and `<meta name="theme-color" content="#FFFFFF">` **(added)**; `<link rel="alternate" type="application/rss+xml">` only once an RSS feed exists (§9 of the spec, recommended later: feeds help discovery and aggregators).

### A4. Structured data (JSON-LD)

One `<script type="application/ld+json">` per page, built on the server with a `@graph` so entities reference each other by `@id`. Output with `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE`, and `<` escaped to prevent a `</script>` injection from article titles.

- **SEO-LD-1** Home: `WebSite` (`@id` `https://randy-donny.com/#website`, `name`, `url`, `inLanguage` `fr-FR`, `publisher` → Person, `potentialAction` `SearchAction` with `target` `https://randy-donny.com/recherche?q={search_term_string}`) and `Person` (`@id` `https://randy-donny.com/#randy-donny`, `name`, `url` = author page, `image`, `sameAs` = Facebook, X, LinkedIn, YouTube, Hautetfort URLs).
- **SEO-LD-2** Article: `BlogPosting` with `headline` (≤ 110 characters), `description`, `image` (array of absolute URLs, at least 1200 px wide, in 16:9, 4:3 and 1:1 through Cloudinary), `datePublished` and `dateModified` (the **real** dates, ISO 8601 with timezone — V1 bug), `author` → Person `@id` (with `url`), `publisher` → Person `@id`, `mainEntityOfPage` = canonical URL, `inLanguage` `fr-FR`, `wordCount`, `articleSection` (categories), `isPartOf` → WebSite `@id`. Plus a `BreadcrumbList`: Accueil → article title.
- **SEO-LD-3** Author page: `ProfilePage` with `mainEntity` → the Person (same `@id`), plus `dateModified`.
- **SEO-LD-4** The spec (PUB-MISC-4) says `NewsArticle`. This document recommends `BlogPosting`: it is a personal opinion blog, not a news publisher, and `BlogPosting` describes it truthfully. Both are eligible for the same article rich results. See open point O2.
- **SEO-LD-5** No markup for content not visible on the page (no fake ratings, FAQ or reviews). Every page type passes Google's Rich Results Test and the Schema.org validator with no error before release.

### A5. Sitemaps

- **SEO-MAP-1** `sitemap.xml`: home, author page, privacy policy, every published article with `<lastmod>` = its real `updated_at` (only content changes should bump it, not view counts). `<changefreq>` and `<priority>` are ignored by Google and SHOULD be omitted. Image entries (`image:image`) for article covers **(added)**.
- **SEO-MAP-2** Cached and invalidated on publish, update, archive (same event as the home cache, NFR-PERF-4). Served with `Content-Type: application/xml`.
- **SEO-MAP-3** `sitemap-news.xml` (spec PUB-MISC-4) only makes sense for sites accepted in Google News. It MAY be kept (only articles from the last 48 hours) but is not a launch requirement. See open point O3.
- **SEO-MAP-4** After launch: verify the domain in Google Search Console and Bing Webmaster Tools (DNS TXT record), submit `sitemap.xml` to both. IndexNow ping to Bing/Yandex on publish MAY be added **(added)**.

### A6. Content and on-page

- **SEO-CONT-1** Exactly one `h1` per page (the article title, the page title). In the article body, headings start at `h2`: TinyMCE's block format list MUST NOT offer « Titre 1 », and the sanitizer downgrades any `h1` in pasted or imported (.docx) content to `h2`.
- **SEO-CONT-2** Headings are not skipped (no `h2` → `h4`). The Word import maps Word heading levels to `h2`–`h4`.
- **SEO-CONT-3** Link text says where it goes (« Lire l'article », the article title), never « cliquez ici ». This is also an accessibility rule (A11Y-LINK-1).
- **SEO-CONT-4** Internal linking: every article links to previous/next, the author page, and the home sections; the author page lists the latest articles; categories rows on the home page. Links between articles inside the body are encouraged in the editor.
- **SEO-CONT-5** Every content image has alt text (A11Y-IMG-2); image file names on Cloudinary use the article slug.
- **SEO-CONT-6** Admin editor **(added, SHOULD)**: an « Aperçu Google » box under the description field showing the title and description as they will appear in results, with character counters (title ≤ 60, description 140–160) and a warning when the description is empty.
- **SEO-CONT-7** Visible dates: the article shows its publication date (PUB-ART-1); when it was updated after publication, the page MAY show « Mis à jour le … », matching `dateModified`.

### A7. Performance (Core Web Vitals)

Core Web Vitals are a ranking signal. Targets are in NFR-PERF-2 (LCP < 2.5 s, CLS < 0.1, INP < 200 ms at the 75th percentile, mobile).

- **SEO-PERF-1** The LCP image (article cover; the lead card on the home page) is not lazy-loaded, has `fetchpriority="high"`, and SHOULD be preloaded through `<link rel="preload" as="image" imagesrcset=… imagesizes=…>` in the `Seo` head.
- **SEO-PERF-2** Every other image: `loading="lazy"`, `decoding="async"`, `srcset` + `sizes` from Cloudinary (`f_auto,q_auto,w_…`), and the ratio class (`aspect-card`, `aspect-cover`) or width/height so nothing shifts on load.
- **SEO-PERF-3** Fonts: Inter self-hosted, roman files preloaded, `font-display: swap` (already the case, §7 of the design system).
- **SEO-PERF-4** The cookie banner and the toast overlay the page (fixed position) and never push content down (no CLS).
- **SEO-PERF-5** Static assets (Vite build) served with `Cache-Control: public, max-age=31536000, immutable`; HTML with short caching; Brotli or gzip compression enabled in FrankenPHP (Caddy `encode`).
- **SEO-PERF-6** Third-party scripts: only GA4, loaded after consent, `async`. No other script on public pages.

### A8. Monitoring

- **SEO-MON-1** Lighthouse SEO score 100 on home, article, author pages (mobile).
- **SEO-MON-2** Weekly look at Search Console after launch: coverage errors, Core Web Vitals report, 404s (fix or 301 anything that had traffic in V1).
- **SEO-MON-3** V1 → V2 migration: crawl the V1 site before switching (every article URL), then check each returns 200 or a single 301 on V2 (§7.8 of the spec, step 6).

---

## Part B — Accessibility

### B1. Principles

- **A11Y-PRIN-1** Native HTML first. A link is `<a href>` (it goes somewhere), an action is `<button type="button">` (it does something), a form field is `<input>`/`<textarea>` with a `<label>`. No `div`/`span` with a click handler.
- **A11Y-PRIN-2** ARIA only when HTML has no equivalent. Never add a `role` that repeats the element's native role (`<button role="button">`, `<nav role="navigation">`). Wrong ARIA is worse than no ARIA: a screen reader believes it.
- **A11Y-PRIN-3** Every piece of information conveyed visually (icon, colour, position, CSS `::before` text) is also available as text to assistive technology.
- **A11Y-PRIN-4** New French strings introduced by this document (skip link, « nouvel onglet », etc.) are added to `resources/js/lib/labels.fr.ts`, not typed in components.

### B2. Page structure and landmarks

- **A11Y-STRUCT-1** Every public page has, in order: skip link, `<header>` (navbar), `<main id="contenu" tabindex="-1">`, `<footer>`. The subscription block and the cookie banner are outside `main` only if they are not page content (the cookie banner is a `region`, see B4).
- **A11Y-STRUCT-2** Skip link **(added)**: the first focusable element of the page, « Aller au contenu », visually hidden until focused (then shown top-left above the navbar), pointing to `#contenu`.
- **A11Y-STRUCT-3** Landmarks are labelled when there is more than one of a kind: the navbar `<nav aria-label="Navigation principale">`, footer links `<nav aria-label="Liens du pied de page">`, pagination `<nav aria-label="Pagination">`, previous/next `<nav aria-label="Articles précédent et suivant">`, breadcrumb (if shown) `<nav aria-label="Fil d'Ariane">`.
- **A11Y-STRUCT-4** One `h1` per page; heading levels are not skipped; each home section is a `<section aria-labelledby="…">` pointing at its `h2` (already the case in `resources/js/pages/home.tsx`). Card titles inside a section are `h3`.
- **A11Y-STRUCT-5** The article is an `<article>` element containing header, body and author byline; dates use `<time datetime="2026-09-19">19 septembre 2026</time>`.
- **A11Y-STRUCT-6** Lists of cards are lists (`<ul role="list">` with `<li>` — the `role="list"` is needed because Safari/VoiceOver drops list semantics when `list-style: none` is set by Tailwind's preflight). A screen reader then announces « liste, 4 éléments ».
- **A11Y-STRUCT-7** Client-side navigation (Inertia visits) **(added)**: after each visit the document `<title>` is updated (A3), focus moves to `<main id="contenu">` (or the `h1`), and a visually hidden `aria-live="polite"` region in the layout announces the new page title. Without this, a screen reader user hears nothing after following a link. Scroll-to-anchor links (« S'abonner » on the home page) move focus to the target section.

### B3. Keyboard and focus

- **A11Y-KB-1** Everything that works with a mouse works with the keyboard alone (Tab, Shift+Tab, Enter, Space, Escape, arrows in native controls), in a logical order that follows the visual order. No positive `tabindex`.
- **A11Y-KB-2** Focus is always visible: the base-layer ring (2 px, offset 2 px, `accent-600`; `primary` on text inputs) MUST NOT be removed or hidden by `overflow: hidden` on a parent.
- **A11Y-KB-3** Focused elements are not hidden under the sticky navbar (WCAG 2.4.11): `scroll-padding-top` is set in the base layer and MUST stay equal to the navbar height.
- **A11Y-KB-4** No keyboard trap, except inside an open modal dialog, which Escape closes; focus then returns to the element that opened it.
- **A11Y-KB-5** Tap/click targets are at least 44 × 44 px (design system), above the WCAG 2.5.8 minimum of 24 × 24. Inline links inside paragraphs are exempt.
- **A11Y-KB-6** Horizontal category scrollers (mobile) are not keyboard traps: each card link is focusable and focusing it scrolls it into view; the scroller itself does not need `tabindex`. It has `aria-label` = the category name only if it is not already inside the labelled section.

### B4. Components: semantics and ARIA

This table is the reference for every public component. « SR » = what a screen reader announces.

| Component | Required semantics | Notes |
|---|---|---|
| **Navbar** | `<header>` › `<nav aria-label="Navigation principale">`. Contextual link is an `<a>`. On mobile, the home-icon-only link has `aria-label="Revenir à la page d'accueil"` and its SVG `aria-hidden="true"`. « S'abonner » is an `<a href="/#abonnement">` styled as a button (it navigates), not a `<button>`. | Current code uses `aria-label="Navigation"`: rename to « Navigation principale ». |
| **Skip link** | `<a href="#contenu" class="sr-only focus:not-sr-only …">Aller au contenu</a>` | First element in `<body>`. |
| **Footer** | `<footer>`; social links in a `<ul>`; each social link `<a href target="_blank" rel="noopener noreferrer">` with visible text « Facebook » plus a visually hidden « (nouvel onglet) ». Icons `aria-hidden="true"`. | Same rule for every external link that opens a new tab (hero description too). |
| **SearchBar** | `<form role="search" action="/recherche" method="get">` (works without JS), `<label for>` visually hidden « Rechercher un article », `<input type="search" name="q" autocomplete="off" enterkeyhint="search">`; the mobile icon-only submit `<button type="submit" aria-label="Rechercher">`, icon `aria-hidden`. | Already mostly done in `search-bar.tsx`. The placeholder is not a label. |
| **Cards** | `<article>` per card. The image link has `tabindex="-1" aria-hidden="true"` and the image `alt=""`; the title link is the only focusable link; date in `<time>`. Category chips are plain text (`<span>` or list), not links or buttons (V2: chips are not clickable). | One Tab stop per card; SR reads « titre, lien ». |
| **« Voir plus »** | `<button type="button">`; while loading `aria-busy="true"` and the label kept; after loading, a visually hidden `aria-live="polite"` region announces « 9 articles supplémentaires chargés » and focus moves to the first new card's title link. When there is nothing left the button is removed and the region says « Tous les articles sont affichés ». | The crawlable `?page=n` link stays in the markup as its href fallback (SEO-CRAWL-6). |
| **Pagination** (search) | `<nav aria-label="Pagination">`; « Précédent » / « Suivant » are links (`<a href="?q=…&page=n">`); the unavailable one is rendered as a `<span aria-disabled="true">` styled disabled (a link cannot be `disabled`); « Page 2 sur 7 » is plain text. | |
| **Section header** | `<h2 id>` referenced by the section's `aria-labelledby`. « Voir plus » link has visible text, arrow `aria-hidden`. If several « Voir plus » links exist on one page, each gets `aria-label="Voir plus : {section}"` or a visually hidden suffix. | WCAG 2.4.4: identical link texts must go to the same place. |
| **SubscriptionBlock** | `<section id="abonnement" aria-labelledby="abonnement-titre">`; `<label for>` « Adresse email » (visible); `<input type="email" name="email" autocomplete="email" inputmode="email" required aria-required="true">`; on error `aria-invalid="true"` and `aria-describedby` → the message (`role="alert"`, icon `aria-hidden`), focus moved back to the input; while submitting the button has `aria-busy="true"` and the input `readonly`; on success the form is replaced by the `role="status"` message and focus moves to it (`tabindex="-1"`). Consent notice is linked with `aria-describedby` to the input as well. Honeypot field: wrapper `aria-hidden="true"`, input `tabindex="-1" autocomplete="off"`, positioned off-screen (not `display:none`, which bots skip). | Most of this exists in `subscription-block.tsx`; check focus management and honeypot. |
| **ShareButtons** | `<ul>` of links (Facebook, X, LinkedIn share URLs, `target="_blank" rel="noopener noreferrer"`); on mobile they are icon-only with `aria-label="Partager sur Facebook (nouvel onglet)"`. « Copier le lien » is a `<button type="button">`; after copying, its visible label becomes « Lien copié » and a polite live region says « Lien copié dans le presse-papiers ». Native share (`navigator.share`) is a `<button>` « Partager ». | Do not rely on the toast alone. |
| **Toast** | A single persistent `<div role="status" aria-live="polite">` in the layout whose text is replaced (a live region must exist before its content changes). Never takes focus, stays at least 5 s, no interactive content, hidden under reduced motion without animation. | |
| **Cookie banner** | Not a modal (the page stays usable): `<section role="region" aria-label="Consentement aux cookies">` placed first in the DOM after the skip link so keyboard users reach it early, but visually at the bottom. « Accepter », « Refuser » are `<button>`s; « Personnaliser » opens a native `<dialog>` with `showModal()` (focus trap and Escape built in), `aria-labelledby` its heading, checkboxes with labels, focus returned to « Personnaliser » on close. After a choice, focus moves to `<main>`. | |
| **ArticleHeader** | Chips (text), meta line with `<time>` and reading time, `<h1>`, chapô `<p>`, byline « Par <a href="/profil/randy-donny">Randy Donny</a> ». | |
| **AudioSlot** (future player) | Play/pause is one `<button>` whose `aria-label` switches between « Écouter l'article » and « Mettre en pause »; progress is `<input type="range">` (seekable) or `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext="1 min 24 sur 6 min"`; speed control, if any, is a `<select>` with a label. No autoplay. | Any third-party player MUST meet this before being adopted (spec Q1). |
| **Cover / figures** | `<figure>` + `<img alt="…">` + `<figcaption>` « Crédit photo : … ». | Alt rules in B5. |
| **Encadré** | `.callout-box` gets `role="note"` and `aria-label="Encadré"` added by the HTML renderer (SafeHtml transform), because the CSS `::before` label is not reliably read. | Editors never type it. |
| **Previous / next** | `<nav aria-label="Articles précédent et suivant">`; each cell is one `<a>` whose accessible name starts with the overline: « Article précédent : {titre} » (overline text is inside the link, arrow `aria-hidden`). | |
| **PreviewBanner** | `<div role="status">`, eye icon `aria-hidden`. | |
| **Search results** | `h1` « Résultats pour « démocratie » »; the result count in a `role="status"` element so it is announced; `<mark>` for highlights (no ARIA); each result an `<article>` in a list. | |
| **Empty state / skeletons** | Empty state `role="status"`. Skeletons `aria-hidden="true"`; their container `aria-busy="true"` until content arrives. | |
| **Error pages** | `h1` « Page introuvable », search form (as above), link home. | |
| **Brand/social icons** | Always `aria-hidden="true" focusable="false"` on the `<svg>`; the name comes from text or `aria-label` on the link. | |

### B5. Images and media

- **A11Y-IMG-1** Every `<img>` has an `alt` attribute. Decorative or redundant images get `alt=""` (card images whose link is hidden and whose title is right next to them; icons).
- **A11Y-IMG-2** Content images in articles: the editor MUST provide alt text. TinyMCE's image dialog makes the « Texte alternatif » field required (or explicitly marks the image as decorative), and the admin shows a warning at publish time when an image lacks it. The .docx import keeps Word's alt text when present.
- **A11Y-IMG-3** Article cover: alt text from a dedicated cover alt field **(added)**; fallback: the article title (NFR-A11Y-1). The photo credit is a caption, not alt text.
- **A11Y-IMG-4** Author avatar: `alt="Randy Donny"`.
- **A11Y-IMG-5** Embedded videos: `<iframe title="Vidéo YouTube : {titre}">`, no autoplay; videos produced by the author SHOULD have French captions on YouTube.
- **A11Y-IMG-6** Text is never rendered as an image (except the logo).

### B6. Article body (TinyMCE HTML)

- **A11Y-BODY-1** The shared sanitizer (spec §7.4) MUST keep the attributes accessibility needs: `alt`, `title` on iframes, `scope`, `colspan`, `rowspan`, `lang`, `aria-label`, `aria-describedby`, `role="note"`, and the elements `caption`, `thead`, `th`, `figure`, `figcaption`, `abbr`.
- **A11Y-BODY-2** Tables: a header row of `<th scope="col">` (TinyMCE table plugin option set so the first row is a header by default) and a `<caption>` when the table has a title. Tables are not used for layout.
- **A11Y-BODY-3** Links in the body that open in a new tab (`target="_blank"`) get a visually hidden « (nouvel onglet) » appended by the renderer, and `rel="noopener noreferrer"`.
- **A11Y-BODY-4** Quotes or passages in another language MAY be marked with `lang` (e.g. `lang="en"`) through a TinyMCE button, so screen readers switch pronunciation.
- **A11Y-BODY-5** TinyMCE's accessibility checker plugin (`a11ychecker`) is premium-only; with the GPL build (spec Q2), the checks above (alt, headings, table headers) are done by the admin on save and shown as warnings.

### B7. Text, colour and motion

- **A11Y-VIS-1** Contrast: the rules in `docs/public-design-system.md` §2 (text ≥ 4.5:1, large text and UI controls ≥ 3:1; `grey-medium` never for small text; alert text in `-700`/`-800` shades).
- **A11Y-VIS-2** Links in running text are underlined (not identified by colour alone).
- **A11Y-VIS-3** Text can be zoomed to 200 % without loss of content; at 320 CSS px wide (400 % zoom on a 1280 screen) everything reflows into one column with no horizontal scroll (WCAG 1.4.10). Sizes in `rem`, never fixed heights on text containers.
- **A11Y-VIS-4** Overriding text spacing (line height 1.5, paragraph spacing 2×, letter spacing 0.12 em, word spacing 0.16 em) does not clip or overlap text (WCAG 1.4.12).
- **A11Y-VIS-5** `prefers-reduced-motion: reduce` disables toast animations, smooth scrolling and skeleton pulses.
- **A11Y-VIS-6** Works in Windows high-contrast / forced-colors mode: focus rings and button borders use real borders/outlines (not only `box-shadow`, which forced colors removes).

### B8. Forms and errors

- **A11Y-FORM-1** Every field has a visible `<label>` (search: visually hidden, since the button and the icon make its purpose obvious).
- **A11Y-FORM-2** Errors are specific, in French, next to the field, linked by `aria-describedby`, announced (`role="alert"`), and focus returns to the first invalid field. The field keeps the typed value.
- **A11Y-FORM-3** No CAPTCHA and no time limit. Abuse is handled by the honeypot and the rate limit (PUB-SUB-3), which keeps WCAG 3.3.8 (accessible authentication) and 2.2.1 (timing) satisfied.
- **A11Y-FORM-4** `autocomplete` tokens on personal data fields (`email`) so browsers and assistive tools can fill them (WCAG 1.3.5).

### B9. Language and readability

- **A11Y-LANG-1** `<html lang="fr">`. Foreign words in UI strings (« Google Analytics ») need no markup; whole foreign passages do (A11Y-BODY-4).
- **A11Y-LANG-2** French typography (non-breaking spaces, « guillemets ») is applied by the formatter; it does not affect screen readers.
- **A11Y-LINK-1** Link and button names make sense out of context (screen reader users often list all links on a page): « Lire l'article », « Revenir à la page d'accueil », not « ici » or « lire plus ».

### B10. Accessibility statement (added)

- **A11Y-DECL-1** SHOULD: a page « Accessibilité » linked from the footer « Informations » column, stating the target (WCAG 2.2 AA), the known limitations, the date of the last check, and a contact email to report a problem. It is not legally required for a personal blog in France, but it is a standard good practice. See open point O4.

### B11. Admin panel

The admin design stays as is (spec §8). It is used by one known person, so only these basics apply: every field has a label, focus is visible, dialogs are real modals with focus management, icon-only buttons have `aria-label`, and the editor enforces the content rules of B5/B6 (alt text, heading levels, table headers) because those end up on the public site.

### B12. Newsletter email

- **A11Y-MAIL-1** `<html lang="fr">`, a `<title>`, layout tables with `role="presentation"`, alt text on the wordmark and the cover, real text (no text in images), link text meaningful (« Lire l'article », « Se désabonner »), contrast as on the site, readable at 200 % on mobile clients. A plain-text alternative part is sent with every email.

---

## Part C — Verification and definition of done

### C1. Automated tests

- **VER-1** Pest feature tests (no new dependency) for the server side of SEO:
  - each public page type returns the expected `<title>`, description, canonical, robots and Open Graph tags in the SSR HTML (or in the `seo` Inertia prop, asserted with `assertInertia`);
  - JSON-LD is valid JSON with the expected `@type` and real dates;
  - `noindex` on search, confirmation, preview and error pages; `X-Robots-Tag` on admin;
  - `robots.txt` content per environment; `sitemap.xml` lists only published articles with correct `lastmod`;
  - 301s for old slugs and `/profile`, 404 for drafts, 410 for archived articles.
- **VER-2** Accessibility checks with axe-core: component tests (`vitest-axe`, alongside Vitest planned in spec §7.1) and page checks (`@axe-core/playwright`, Playwright is already a MAY in §7.1) with **zero serious or critical violations**. These packages are new dependencies and need approval before being added.
- **VER-3** Lighthouse (CI or manual) on home, article, author, search at mobile settings: Accessibility ≥ 95, SEO = 100, Performance ≥ 90.

Automated tools catch about a third of accessibility problems; C2 is not optional.

### C2. Manual checks before each release of a public page

1. Keyboard only: Tab through the whole page; every control reachable, order logical, ring visible, nothing hidden under the navbar, skip link works.
2. Screen readers, in French: NVDA + Firefox (Windows) and VoiceOver + Safari (iOS). Check landmarks list, headings list, links list, form errors, « Voir plus » and « Copier le lien » announcements, page change announcement.
3. Zoom 200 % and a 320 px wide window: no loss, no horizontal scroll.
4. Forced colors (Windows high contrast) and `prefers-reduced-motion`.
5. Rich Results Test and Open Graph preview (Facebook Sharing Debugger, LinkedIn Post Inspector) on one article.

### C3. Per-page checklist

| Page | SEO | Accessibility |
|---|---|---|
| Home | title, description, canonical, OG website, JSON-LD WebSite + Person, `?page=n` crawlable, LCP image priority | skip link, one `h1`, sections labelled, card lists, « Voir plus » announced, search form, subscription form |
| Article | title, description, canonical, OG article + dates, JSON-LD BlogPosting + BreadcrumbList, cover preload | `<article>`, `h1`, headings from `h2`, `<time>`, cover alt, share buttons named, Encadré note, tables with headers, prev/next nav |
| Author | title, description, OG profile, JSON-LD ProfilePage | avatar alt, `h1`, social links named with « nouvel onglet » |
| Search | `noindex, follow`, not in sitemap | `h1`, result count announced, `<mark>`, pagination nav, empty state `role="status"` |
| 404 / errors | real status code, `noindex` | `h1`, search form, link home |
| Confirmations | `noindex, nofollow` | `h1`, focusable message, clear next action |

### C4. Shared accessibility building blocks

Already in place for the home page (commit after `fd62b63`); reuse them on every new public page:

- `resources/js/layouts/public-layout.tsx`: skip link « Aller au contenu », `<main id="contenu" tabindex="-1">`, and `PageAnnouncer` (`resources/js/components/public/page-announcer.tsx`), which moves focus to `main` and announces the page `h1` after each Inertia visit (A11Y-STRUCT-2, A11Y-STRUCT-7). Every public page MUST use this layout.
- `resources/js/components/public/external-link.tsx`: `ExternalLink` for every link to another site (`target="_blank"`, `rel="noopener noreferrer"`, « (nouvel onglet) » for screen readers).
- `StandardCard` renders an `<li>`: put cards in a `<ul role="list">` (A11Y-STRUCT-6).
- « Voir plus » pattern in `resources/js/pages/home.tsx` (`AllArticles`): status region announcing the count, focus on the first new title.
- `SubscriptionBlock`: focus on the input after an error, on the message after success; the consent notice is part of the input's description.
- Screen-reader-only strings live in `labels.a11y` in `resources/js/lib/labels.fr.ts`.

Still missing, deferred with Part A: `<title>`, canonical, Open Graph and JSON-LD on the home page.

---

## Open points

| # | Question | Recommendation |
|---|---|---|
| O1 | Canonical host: `randy-donny.com` or `www.randy-donny.com`? | Keep whatever V1 used, to keep existing rankings; 301 the other. |
| O2 | JSON-LD type for articles: `BlogPosting` or `NewsArticle` (spec PUB-MISC-4)? | `BlogPosting`. |
| O3 | Keep `sitemap-news.xml`? | Drop unless the site is accepted in Google News. |
| O4 | Add an « Accessibilité » statement page? | Yes, small effort, footer link. |
| O5 | Approve new dev dependencies for checks: `vitest-axe`, `@axe-core/playwright`, Lighthouse CI? | Yes for axe; Lighthouse can stay manual at first. |
| O6 | Dedicated SEO title and cover alt fields in the article editor (SEO-HEAD-2, A11Y-IMG-3) need two nullable columns. | Yes, additive migration. |
