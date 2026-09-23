# Public site design system (V2): randy-donny.com

Context for anyone (human or LLM) building the **public** side of the blog: home, article, author, search, 404, subscription flows and the newsletter email. The admin panel is a separate, finished design and must not change.

- Stack: React + TypeScript + Tailwind CSS v4, server-side rendered.
- Site language: **French only**. All labels are listed in `resources/js/lib/labels.fr.ts`.
- Visual truth: the boards in `docs/design/boards/` (HTML with inline styles; open them as text, read values from them). This document is the summary; if the two disagree, the board wins.
- Tokens: `resources/css/theme.css` (Tailwind v4 `@theme static` block, responsive overrides, base layer, `.article-body`, `.callout-box`).

## 1. Principles

1. Reading first. Typography does the work, not decoration. No ads, no ad slots, no sidebar on article pages.
2. One brand with the admin: same neutrals, same Inter, same buttons and inputs. The public side adds one accent and a magazine-like layout — still one family (Inter) throughout, no second typeface.
3. No gradients, at most one shadow (sticky navbar once scrolled). Thin rules (1 px grey-light, 2 px primary) do the structuring.
4. The accent (Bleu encre) is rare: links, category labels, active states, focus ring, the Encadré, the subscription block. Buttons stay monochrome.
5. Layouts must be correct on first paint without JavaScript (CSS grid, media queries, `aspect-ratio`, scroll-snap only).

## 2. Tokens

Use tokens, never raw hex values, except for the two one-off button greys noted below.

| Group | Tokens | Tailwind |
|---|---|---|
| Text and UI | `--color-primary #2B2B2B`, `--color-primary-hover #171717` | `text-primary`, `bg-primary`, `hover:bg-primary-hover` |
| Neutrals | `grey-light #D4D4D4` (decorative rules only), `grey-medium #7D7D7D` (input borders, icons, disabled), `grey-dark #636363` (dates, captions, secondary text), `grey-subtle #F4F4F4` (skeletons, hover fill) | `border-grey-light`, `text-grey-dark`, `bg-grey-subtle` |
| Accent | `accent-50 … 900`. 600 `#365AC0` for links and focus (6.2:1 on white). 700 for labels on tint and hover. 50 for Encadré and subscription background, 200 for their hairline | `text-accent-600`, `bg-accent-50`, `border-accent-200` |
| Semantic | Tailwind defaults for red / green / yellow. Alerts: `-50` bg, `-600` border, **`-700` text** (yellow: `-800`) | `bg-red-50 border-red-600 text-red-700` |
| Fonts | `--font-sans` Inter — the only family. `--font-serif` is kept as an alias to Inter (same value) so old markup that still says `font-serif` keeps working | `font-sans` |
| Spacing | `--spacing-gutter` 16/24/32, `--spacing-grid` 16/24, `--spacing-block` 32/48, `--spacing-section` 56/80 | `px-gutter`, `gap-grid`, `mb-block`, `pt-section` |
| Radii | `sm 2px` images and chips, `md 4px` buttons and inputs, `lg 6px` cookie banner and toast. The Encadré has radius 0 | `rounded-sm/md/lg` |
| Shadow | `--shadow-navbar` | `shadow-navbar` |
| Ratios | `--aspect-card 3/2` (every card and thumbnail), `--aspect-cover 16/9` (article cover, video), `--aspect-avatar 1/1` | `aspect-card`, `aspect-cover`, `aspect-avatar` |
| Measures | `--container-article 38rem` (608), `--container-article-header 52.5rem` (840), `--container-article-cover 70rem` (1120) | `max-w-article`, `max-w-article-header`, `max-w-article-cover` |
| Motion | `--duration-fast 120ms`, `--duration-base 200ms`, `--duration-slow 320ms`, `--ease-standard`, `--ease-out` | `duration-(--duration-fast)`, `ease-standard` |
| Focus | 2 px, offset 2 px, on `:focus-visible` (set in the base layer, never remove). `accent-600` on buttons and links; `primary` (near-black) on text inputs via `--focus-ring-color-input`, since accent-600 read as an odd blue on a plain white field | |
| Breakpoints | `tablet 768`, `laptop 1024`, `desktop 1280` (same values as Tailwind `md`, `lg`, `xl`) | `tablet:`, `laptop:`, `desktop:` |

If the admin and the public site share one CSS entry, keep the theme file as is: it does not reset any default breakpoint or colour.

### Accessibility calls that depart from the admin defaults

- `grey-medium` is 4.1:1 on white: never for small text. Metadata uses `grey-dark`.
- `green-600` (3.3:1) and `yellow-600` (2.9:1) fail as text. Alert text uses green-700 / yellow-800 / red-700.
- Input borders use `grey-medium` (controls need 3:1). `grey-light` is decorative only.
- Text inputs (search, subscribe) get a `primary`-coloured focus ring instead of `accent-600`; buttons and links keep `accent-600` so it still shows up against the dark primary button.
- Cookie banner: « Accepter » and « Refuser » have the same style so refusing is as easy as accepting.
- Tap targets are at least 44 × 44 px. Every input has a label (visually hidden if needed). Icon-only buttons have `aria-label`. Heading order is semantic (one `h1` per page).

## 3. Typography

Set the family with `font-sans` (the only family — `font-serif` still resolves, aliased to Inter, but prefer `font-sans` in new markup); the size token sets size, line height, letter spacing and weight together. Mobile / desktop (laptop and up) values:

| Style | Classes | Mobile | Desktop | Notes |
|---|---|---|---|---|
| Display | `font-sans text-display` | 44 / 1.02 | 72 / 1.0 | home banner title. Tablet 56 |
| H1 | `font-sans text-h1` | 34 / 1.12 | 52 / 1.08 | article title, page titles. Tablet 40 |
| H2 | `font-sans text-h2` | 26 / 1.2 | 32 / 1.2 | article body h2 |
| Section title | `font-sans text-section` | 26 | 30 | section headers |
| H3 | `font-sans text-h3` | 21 | 24 | |
| H4 | `font-sans text-h4` | 17 | 17 | Inter 600 |
| Card large | `font-sans text-card-large` | 22 | 26 | no separate hero/featured size — that card was removed |
| Card | `font-sans text-card` | 17 | 18 | `text-card-wide` (20) when the card is wider than about 380 px. Sized down from the first draft: real titles run longer than the sample copy and wrapped to 3–4 lines at the old sizes |
| Card compact | `font-sans text-card-compact` | 17 | 17 | |
| Chapô | `font-sans text-chapo text-grey-dark` | 19 / 1.45 | 22 / 1.45 | weight 400 |
| Article body | `.article-body` | 18 / 1.65 | 20 / 1.7 | Inter 400, column 608 px (about 68 characters) |
| Body (UI) | `font-sans text-body` | 16 / 1.6 | 16 | |
| Body small | `text-body-small` | 14 | 14 | |
| Caption | `text-caption text-grey-dark` | 13 | 13 | |
| Meta | `text-meta font-medium text-grey-dark` | 13 | 13 | dates, reading time |
| Overline | `text-overline font-semibold uppercase` | 12 | 12 | tracking .08em; category labels |
| Button | `text-button font-semibold` | 15 | 15 | |

Article body uses the same Inter family as everything else: one voice throughout, from headings to tables to captions, with no second typeface to load or fall out of sync.

French typography: use non-breaking spaces before `: ; ! ?` and inside « guillemets »; typographic apostrophe (’) and ellipsis (…); dates as « 19 septembre 2026 », « 1er juillet 2026 ». Do this in the content pipeline or a small formatter, not by hand in JSX.

## 4. Layout

- Container: `mx-auto w-full max-w-7xl px-gutter` (content 328 / 720 / 960 / 1216 wide).
- Grid: 4 columns under 768 (gap 16), 8 from 768 (gap 24), 12 from 1024 (gap 24). Use `gap-grid`.
- Sections are separated by `pt-section` (80 px, 56 on mobile). Section header (`SectionHeader`): 2 px primary top rule, 12 px, title, 24 px to the content.
- No horizontal page scroll from 360 to 1920 px. Only in-row scrollers (mobile category rows) may overflow, inside their own box.
- Only 360 and 1440 were drawn. Tablet (768–1023) is specified here: two-column grids where desktop has three or four, and the tablet type overrides from the theme.

## 5. Components

Build these first, in this order. All states are drawn on the boards `Composants-*.dc.html`.

### Button
Height 44 (48 or 52 inside forms), radius 4, Inter 600 15, padding 0 20.
```
base:      inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-button font-semibold whitespace-nowrap
primary:   border-primary bg-primary text-white hover:bg-primary-hover hover:border-primary-hover active:bg-black
secondary: border-primary bg-white text-primary hover:bg-grey-subtle active:bg-[#E8E8E8]
ghost:     border-transparent text-primary hover:underline underline-offset-4 active:bg-grey-subtle
disabled:  primary bg-[#EBEBEB] border-[#EBEBEB] text-grey-medium; secondary border-grey-light text-grey-medium; cursor-not-allowed
loading:   keeps label and width, adds a 18 px spinner (Lucide loader-circle, animate-spin), aria-busy="true", cursor-progress
```

### Input
Height 48–52 depending on context, `rounded-md border border-grey-medium px-4 text-body`, focus = base-layer ring plus `border-primary`. Error: `border-red-600`, inner 1 px red-600 ring, message below with icon (`text-red-700 text-body-small font-medium`, `role="alert"`, `aria-describedby`). The subscribe-form input is the one exception with a fixed height rather than a range — see SubscriptionBlock below: 52 px on both mobile and desktop, never smaller on mobile.

### Category chip
Not clickable in V2. `inline-flex h-6 items-center rounded-sm bg-accent-50 px-2 text-overline font-semibold uppercase text-accent-700`. Plain-label variant for dense lists: same text without background.

### SectionHeader
`border-t-2 border-primary pt-3 mb-6 flex min-h-11 items-center justify-between gap-4`; title `font-sans text-section`; optional link « Voir plus » `inline-flex min-h-11 items-center gap-1.5 text-body-small font-medium text-accent-600 underline underline-offset-4` with a 16 px arrow-right.

### Navbar (sticky)
No wordmark, on any device — the logo was removed from the navbar. It carries only the contextual link and the subscribe button.
Desktop: 68 px, `border-b border-grey-light`, `flex items-center justify-between`. Left: contextual link (`A propos de ma pomme` on the home page → author page; `Revenir à la page d'accueil` with arrow-left elsewhere → home). Right: primary button « S'abonner ». `shadow-navbar` only once scrolled.
Mobile: same single row as desktop — `flex items-center justify-between`, contextual link left, « S'abonner » right. No second row. On the home page the link keeps its full text (« A propos de ma pomme »); everywhere else it collapses to a home-icon-only button (44×44 px tap target, `aria-label="Revenir à la page d'accueil"`, no visible text) so the row stays compact next to « S'abonner ».
« S'abonner » scrolls to `#abonnement` on the home page; elsewhere it links to `/#abonnement`. Set `scroll-padding-top` (already in the base layer).

### Footer
`border-t-2 border-primary`. Desktop: three columns (`1.3fr 1fr 1fr`): wordmark + tagline in `font-sans italic`, « Suivre » (Facebook, X, LinkedIn, YouTube, each 44 px tall), « Informations » (« Politique de confidentialité »). Bottom row after a hairline: « © 2026 Randy Donny » left, developer credit right (`Site conçu et développé par [Nom du développeur]`, a placeholder). Mobile: stacked, socials in two columns. The wordmark stays here — it was only removed from the navbar.

### SearchBar
Large (home banner): 64 px (56 mobile), `border border-primary rounded-md`, leading search icon, input 18 px, attached primary « Rechercher » button on desktop; on mobile the button is a 56 px square icon button with `aria-label`. Compact (results): 48 px, icon leading, no button. Placeholder « Rechercher un article… ». Input has a visually hidden `<label>`.

### Cards (one visual language: 3:2 image, Inter throughout — title and meta)
No featured/hero card in V2.1: it was removed from the home banner (see §6). Every image: `aspect-card w-full rounded-sm object-cover` (always set the ratio, never rely on intrinsic size). Image links are `tabindex="-1" aria-hidden`; the title is the real link.

| Card | Use | Content and sizes |
|---|---|---|
| Large | lead of a group, including the home page | image, chips, title `text-card-large` (22 / 26), chapô 16 (15), date |
| Standard | grids and rows | image, title `text-card` (17 / 18, `text-card-wide` 20 in 3-column grids), date |
| Compact | dense lists, all mobile lists | 96 × 64 thumbnail left, title `text-card-compact`, date; hairline between items |
| Row card | mobile scroll rows | 248 px wide, `snap-start`, standard content |

No numbered/ranking card: « Les plus lus » was removed from the home page and the card had no other use, so it was retired from the system.

Standard card markup:
```tsx
<article className="min-w-0">
  <a href={url} tabIndex={-1} aria-hidden="true" className="block">
    <img src={cover} alt="" className="aspect-card w-full rounded-sm object-cover" />
  </a>
  <h3 className="mt-3.5 font-sans text-card text-primary text-balance"><a href={url}>{title}</a></h3>
  <p className="mt-2 text-meta font-medium text-grey-dark">{date}</p>
</article>
```
Spacing: image → title 14, title → date 8, large: image → chips 20/16, chips → title 12–14, title → chapô 10–12, chapô → date 14–16.

### Skeleton, empty state, pagination, « Voir plus »
- Skeleton: same box as the card (`aspect-card`, two title bars, one date bar) in `bg-grey-subtle`; no animation under reduced motion.
- Empty state: centred, search icon (`text-grey-medium`), Inter 30–34 « Aucun article ne correspond à votre recherche. », `role="status"`.
- Pagination: secondary buttons « Précédent » / « Suivant » around « Page 2 sur 7 » (`text-body-small font-medium text-grey-dark`). Unavailable button is `disabled`, not hidden.
- « Voir plus »: secondary button, centred, appends items in place (announce with an `aria-live="polite"` region); loading state as for buttons.

### SubscriptionBlock (`id="abonnement"`)
Full-width band, `bg-accent-50 border-y border-accent-200`, padding 80 (48 mobile). Desktop: two columns (gap 64), left « Restez informé » (`font-sans` 48 / mobile 34) + « Recevez mes nouveaux articles directement dans votre boîte mail. »; right: label « Adresse email », input + primary « S'abonner » (stacked full-width on mobile, side by side on desktop), consent notice (`text-caption text-grey-dark`, link in `text-accent-700 underline`). Both the input and the button are a fixed **52 px tall on every breakpoint** — this is the one place in the site where the Input component does not use the 48–52 range.

**Mobile flexbox gotcha:** the input+button wrapper is `flex-direction:column` on mobile. If the input also carries `flex-1` (the class it needs on desktop, in the row layout, to share width with the button), that `flex-1` implies `flex-basis: 0%` — and on a column container's main axis, `flex-basis` wins over an explicit height, so the input silently collapses to its content height (~21 px) instead of 52 px. This is exactly the "thinner on mobile" bug. Fix: don't use `flex-1` on the input for the mobile layout — a plain `w-full` (the column's cross-axis; `items-stretch`, the flex default, gives the same full-width result without touching the main-axis size) with an explicit height (`h-13`) keeps it at 52 px. Keep `flex-1` only on the desktop/row variant, where the main axis is width, not height. The email input's focus ring is `primary` (near-black), not `accent-600` — see §2 Focus. States and exact messages:
- Loading: button in loading state, input read-only.
- Success (replaces the form, `role="status"`, `bg-green-50 border-green-600 text-green-700`): « Merci ! Un email de confirmation vient de vous être envoyé. Cliquez sur le lien qu'il contient pour valider votre abonnement. »
- Invalid: « Veuillez saisir une adresse email valide. »
- Disposable: « Les adresses email temporaires ne sont pas acceptées. »

### Article components
- **ArticleHeader**: chips, meta line « 19 septembre 2026 · 6 min de lecture », `h1`, chapô, byline « Par Randy Donny » (name links to the author page). Block max 840, centred from 768, left-aligned on mobile.
- **ShareButtons**: Facebook, X, LinkedIn, « Copier le lien ». 44 px tall, `border-grey-light rounded-md`, icon + label on desktop; 44 × 44 icon squares (with `aria-label`) on mobile. Copied state: green-50 / green-600 border / green-700, « Lien copié », plus the toast and a live region, back to default after 2 s.
- **AudioSlot** (« Écouter l'article »): 54 px bordered box, 44 px square primary play button, label + « Lecture audio · 6 min ». Playing state: pause button, title, `1:24 / 6:00`, 4 px progress bar in accent-600. The feature is undecided: keep it a slot that can host any player.
- **Cover**: `aspect-cover`, max 1120, full-bleed on mobile, caption « Crédit photo : … » (`text-caption text-grey-dark`, right-aligned on desktop).
- **Article body**: wrap the TinyMCE HTML in `<div class="article-body">`. Everything (p, h2–h4, a, ul/ol, blockquote, figure/figcaption, table, `.video`, `.callout-box`) is styled by the theme without extra classes. Wrap YouTube iframes in `<div class="video">`.
- **Encadré**: `<div class="callout-box">…</div>` with any paragraphs, one optional `h4`, lists. The « Encadré » overline is a `::before`, editors never type it. Breaks 32 px out of the 608 column on desktop, edge to edge on mobile.
- **End-of-article CTA**: top 2 px rule, one line « Ce texte vous a plu ? Recevez les prochains directement par email. » + secondary « S'abonner » linking to `/#abonnement`.
- **Previous / next**: two cells side by side (divider between), stacked on mobile; overline « Article précédent » (arrow-left) / « Article suivant » (arrow-right) in accent-700, Inter 26 (21) title, date. Each cell is one link.
- **PreviewBanner** (logged-in author only, above the navbar): `bg-yellow-50 border-b border-yellow-600 text-yellow-800`, eye icon, « Aperçu — cet article n'est pas publié ».

### Toast, cookie banner
- Toast: `bg-primary text-white rounded-md h-12 px-4`, check icon, `role="status"`, 320 ms fade + 8 px rise (none under reduced motion).
- Cookie banner (Google Analytics only): `bg-white border border-grey-light border-t-2 border-t-primary rounded-lg`, bottom of the viewport. Text « Ce site utilise Google Analytics pour mesurer son audience. Aucune donnée n'est utilisée à des fins publicitaires. Vous pouvez accepter, refuser ou choisir. » Buttons: « Accepter » and « Refuser » (both primary), « Personnaliser » (ghost). Stacked full-width on mobile.

## 6. Pages

Drawn at 1440 and 360. Each board name is in `docs/design/boards/`.

1. **Home** (`Accueil*.dc.html`): navbar (home variant, no wordmark) → banner, single text column (`max-w-180`, 720 px), no featured/hero card — display title « Je pense, donc j'essuie… », description with links (Hautetfort, Facebook, X, LinkedIn, chaîne YouTube), large search bar → « Dernières publications » (desktop `laptop:grid-cols-2`: large card left, 2 × 2 standard cards right; below laptop: large card then 4 compact items) → one section per category, e.g. Politique, Culture, Société (`tablet:grid-cols-2 laptop:grid-cols-4` standard cards; on mobile a horizontal scroller with 248 px snap cards bleeding to the screen edge) → « Tous les articles » (`tablet:grid-cols-2 laptop:grid-cols-3`, row gap 48; compact list on mobile; « Voir plus ») → SubscriptionBlock → footer. No « Les plus lus » section — it was removed.
2. **Article** (`Article*.dc.html`): navbar (back variant) → header → tools bar (audio slot left, share right, between hairlines; stacked on mobile) → cover → prose column → end CTA → previous/next → footer. Single centred column, no sidebar.
3. **Author** (`Auteur*.dc.html`): avatar (288 px circle, 160 mobile) with « Crédit photo : … », display name `font-sans` 80 (44), rich-text biography in the article prose style, four outlined social buttons, « Derniers articles » with 3 standard cards.
4. **Search results** (`Recherche*.dc.html`): h1 « Résultats pour « démocratie » », compact search bar pre-filled (black focus ring, see §2), count, list (cover 240 px, chips, Inter 28 title, excerpt with `<mark>` highlights `bg-accent-100`, date · reading time), pagination. Column 880 px. Empty variant `Recherche-vide`.
5. **404** (`Page-404*.dc.html`): « Page introuvable », one witty line, large search bar, link back home.
6. **Confirmation pages** (`Confirmations.dc.html`): « Votre abonnement est confirmé », « Ce lien a expiré » (with « S'abonner à nouveau »), « Vous êtes désabonné ».
7. **Newsletter email** (`Newsletter*.dc.html`): 600 px, table layout, inline styles, single column, `Inter, Arial, Helvetica, sans-serif` (Arial is the real fallback in most clients) — same one family as the site, wordmark header, free text, article card (cover, chips, title, chapô, « Lire l'article » button as a padded `<a>` in a `<td>`), footer with social text links, « Vous recevez cet email car vous êtes abonné à la newsletter de Randy Donny. » and « Se désabonner ». Use the same hex values from the theme (emails cannot use CSS variables).

## 7. Implementation notes

- Fonts: self-hosted by `laravel-vite-plugin/fonts` (`bunny()` in `vite.config.ts`, emitted by `@fonts` in `resources/views/app.blade.php`): Inter 400/500/600/700, roman and italic — the only family, site-wide — `display=swap`, roman files preloaded, fallback system-ui.
- Icons: Lucide at 16–22 px, 1.75 stroke. Current Lucide releases have no brand glyphs: the Facebook, X, LinkedIn and YouTube icons on the boards are stand-ins; use Simple Icons or official SVGs at 20 px.
- Images: always render with the ratio class and `object-fit: cover`; ask editors for 3:2 or wider sources with the subject near the centre (16:9 trims top and bottom, 1:1 trims the sides). The boards use flat placeholders, not real photos.
- Search highlights are server-rendered `<mark>` elements.
- JavaScript is only needed for: copied state and toast, the audio player, « Voir plus », cookie consent, subscription form submission.
- Prototype links on the boards (`Accueil.dc.html` etc.) only illustrate navigation; real routes are up to the app.

## 8. Placeholders and open points

- Developer credit line: `[Nom du développeur]`.
- Author biography, photo credits (« Jean Dupont ») and all article content on the boards are sample text.
- « A propos de ma pomme » is kept exactly as briefed; correct French would be « À propos ».
- Text-to-speech is undecided; the audio slot is only a container.
- Tablet layouts were not drawn; use the rules in section 4.
