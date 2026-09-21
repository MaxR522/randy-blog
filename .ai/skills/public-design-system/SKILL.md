---
name: public-design-system
description: Use when building or changing anything on the public side of randy-donny.com (home, article, author, search, 404, subscription and confirmation pages, cookie banner, newsletter email, shared components). Applies the V2 design tokens, components, page layouts and accessibility rules. Not for the admin panel.
---

# Public design system (V2)

Build the public site exactly from the approved design. The admin panel is out of scope and must not change.

## Before writing code

1. Read `docs/public-design-system.md` (tokens, type scale, component recipes, page structure, accessibility calls).
2. Open the matching board in `docs/design/boards/` and read the real values (sizes, spacing, copy). The board wins over the summary if they differ:
   - components: `Composants-Navigation`, `Composants-Cartes`, `Composants-Article`, `Composants-Abonnement`, `Confirmations`
   - pages: `Accueil`, `Article`, `Auteur`, `Recherche`, `Recherche-vide`, `Page-404` (each also `-360` for mobile), `Newsletter`, `Newsletter-360`
3. Use exact French copy from `resources/js/lib/labels.fr.ts`. Do not invent or reword labels.

## Rules

- Tailwind v4 with the tokens from `resources/css/theme.css`. Use token utilities (`text-primary`, `bg-accent-50`, `text-h1`, `font-serif`, `aspect-card`, `px-gutter`, `pt-section`), never raw hex values, except the two button greys named in the doc.
- Serif (Newsreader) for headings, chapô and article body; Inter for everything else. Two families only.
- One accent (Bleu encre), used sparingly. Buttons stay monochrome. No gradients; the only shadow is the scrolled navbar.
- Every card image uses `aspect-card w-full rounded-sm object-cover`; the article cover and video use `aspect-cover`; avatars `aspect-avatar rounded-full`.
- Article body HTML (from TinyMCE) goes inside `.article-body`; the Encadré is `<div class="callout-box">`. Do not restyle prose elements individually.
- Server-rendered: layouts must not depend on JavaScript. Use CSS grid, media queries, `aspect-ratio`, scroll-snap.
- Accessibility (WCAG 2.2 AA): real `<button>`, `<a>`, `<input>` with labels, visible focus (do not remove the base-layer ring), tap targets 44 × 44, semantic headings, alt text, `aria-label` on icon-only buttons. Metadata text uses `text-grey-dark`, never `text-grey-medium`. Alert text uses the `-700` shades.
- French typography: non-breaking spaces before `: ; ! ?` and inside « », typographic apostrophes and ellipses, dates like « 19 septembre 2026 ».
- Placeholders that are still open: developer credit, brand icons (Lucide has none), text-to-speech player, tablet layouts. Ask before inventing them.

## Definition of done

- Matches the board at 1440 and 360 (check 768 too: tablet was not drawn, follow `docs/public-design-system.md` section 4).
- No horizontal page scroll from 360 to 1920 px.
- Keyboard: every control reachable in a logical order with a visible ring.
- Contrast: run an automated check (axe or Lighthouse) on each page; no new colour outside the tokens.
- Reduced motion respected (`prefers-reduced-motion`).
