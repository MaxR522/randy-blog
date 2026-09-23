# Randy Donny Blog — V2 Product & Technical Specification

| | |
|---|---|
| Status | Draft for review |
| Last update | 2026-09-23 |
| V1 codebase | `/home/mario/Projects/personal-blog` |
| Previous V2 attempt | `/home/mario/Projects/personal-blog-2` |

Conventions used in this document:

- **MUST** = required for V2 launch. **SHOULD** = expected, may slip if justified. **MAY** = optional.
- Requirements have IDs (`PUB-HOME-3`, `ADM-ART-5`, …) so they can be referenced in tickets and tests.
- Items marked **(added)** were not in the original specification and are proposals to validate.
- The document is written in English, but every UI string quoted here is the **final French label** to display.

---

## 1. Overview

### 1.1 Purpose

Personal blog of Randy Donny, published on his own domain (`randy-donny.com`). A single author writes and publishes articles; visitors read, search, share and subscribe to a newsletter.

### 1.2 Why a V2

V1 works but is hard to maintain: accumulated dead code, Livewire/Volt/WireUI mix, known bugs (see Appendix A), and missing features. A first V2 attempt (`personal-blog-2`) migrated to Inertia + React but added no new features. V2 is therefore **rebuilt from scratch**, reusing only the valuable parts of `personal-blog-2` (admin design, Docker setup).

### 1.3 Goals

1. Improve the public design (home page, article page).
2. Add the newsletter: public subscription with double opt-in, and newsletter composition/sending from the admin.
3. Rebuild the admin panel:
   - Analytics dashboard fed by Google Analytics 4.
   - Better article creation/editing, including **import from a Word (.docx) file**.
   - Better CRUD for categories and profile.
   - Account security (password, 2FA, recovery, sessions).
   - **The entire admin MUST be usable on mobile.**
4. Keep all V1 data (articles, categories, author profile, subscribers) through an additive database migration.

### 1.4 Non-goals

- Multi-author / multi-user accounts, public registration, roles.
- Comments.
- Advertising (AdSense is removed entirely).
- Internationalisation: the site is **French only** (see §6.1).
- RSS feed, category pages, tags (may come later, see §9).

---

## 2. Glossary

| Term | Meaning |
|---|---|
| Article | A blog post. Has a status (below), a slug, a cover image, a lead paragraph, content, categories and SEO fields. |
| Chapô | Lead paragraph shown under the title (`articles.lead_paragraph`). Minimal rich text. |
| Encadré | Highlighted callout block inside article content, a `div.callout-box` created from the TinyMCE "Formats" menu. |
| Article à la une | The featured article, shown in the home hero. |
| Statut | `DRAFT` (« Brouillon »), `PUBLISHED` (« Publié »), `ARCHIVED` (« Archivé »). |
| Abonné | A subscriber: an email address that subscribed to the newsletter. Pending until confirmed. |
| Newsletter | An email composed in the admin and sent to confirmed subscribers. |
| Auteur | The single account; owner of the blog and of the admin panel. |

---

## 3. Users and roles

| Role | Authenticated | Can do |
|---|---|---|
| Visitor | No | Read published articles, search, share, view the author profile, subscribe. |
| Subscriber | No (email only) | Confirm subscription, receive newsletters, unsubscribe via link. |
| Author (admin) | Yes, single account | Everything in the admin panel. |

- There is exactly **one** user account. No registration route exists.
- Admin URLs live under `/admin`. Login is at `/admin/connexion`.

---

## 4. Public site

### 4.1 Layout and navigation bar

- **PUB-NAV-1** The navbar MUST show on every public page.
- **PUB-NAV-2** Left side, contextual link:
  - On the home page (`/`): « A propos de ma pomme », linking to the author profile page.
  - On every other page: « Revenir à la page d'accueil », linking to `/`.
- **PUB-NAV-3** Right side: a « S'abonner » button that navigates to `/#abonnement` and smoothly scrolls to the subscription section (§4.7). If already on `/`, it only scrolls.
- **PUB-NAV-4** The navbar MUST be responsive (collapses cleanly at phone width, no horizontal scroll).
- **PUB-FOOT-1 (added)** A footer with: social links (same as the hero), link to « Politique de confidentialité », copyright « © {année} Randy Donny », and the developer credit kept from V1.

### 4.2 Home page — hero banner

Two columns on desktop, stacked on mobile (text first, then the featured card).

**Left column:**

- **PUB-HERO-1** Main title: « Je pense, donc j'essuie... »
- **PUB-HERO-2** Description, with inline links (URLs from V1):

  > Je ne peux plus accéder à mon blog sur [Hautetfort](http://randydoit.hautetfort.com/). Tant pis, voici le nouveau. Mieux, c'est un site web avec mon propre nom de domaine. Je suis aussi principalement sur [Facebook](https://www.facebook.com/randy.donny), [X](https://x.com/Randydonny) et [LinkedIn](https://mg.linkedin.com/in/randy-donny-9158aa91). Enfin, j'ai une [chaîne YouTube](https://www.youtube.com/channel/UCRZInX-WMUTXHA1N4dz6Uiw).

  External links open in a new tab (`rel="noopener"`).
- **PUB-HERO-3** Call to action: a search bar (placeholder « Rechercher un article… »). Submitting a non-empty query redirects to the search results page `/recherche?q={query}` (§4.4). Empty submit does nothing.

**Right column:**

- **PUB-HERO-4** A card for the featured article: cover image, categories, title, chapô (truncated), publication date. The whole card links to the article.
- **PUB-HERO-5** Featured article selection: the published article with `is_featured = true`. If none, the most recently published article. At most one article is featured at a time (§5.3.5).

### 4.3 Home page — article sections (Wired-inspired)

Inspiration: wired.com front page (grouped sections with strong typography, mixed card sizes). The goal is to give an editorial feel even with a modest publishing rate.

Sections, top to bottom:

| ID | Section title | Content | Count |
|---|---|---|---|
| PUB-HOME-1 | « Dernières publications » | Latest published articles, excluding the featured one. One large card + smaller cards. | 5 |
| PUB-HOME-2 | « Les plus lus » **(added)** | Most viewed published articles over the last 30 days (fallback: all time), numbered list style. | 5 |
| PUB-HOME-3 | One row per category, titled with the category name | Latest published articles in that category. Only categories with ≥ 3 published articles are shown, ordered by most recent publication. | 4 per row, max 4 rows |
| PUB-HOME-4 | « Tous les articles » | Paginated list of all published articles, newest first, with « Voir plus » button (loads the next page in place). | 9 per page |
| PUB-HOME-5 | Subscription block | See §4.7. | — |

- **PUB-HOME-6** An article MUST NOT appear twice among the hero, « Dernières publications » and « Les plus lus ». Category rows and « Tous les articles » may repeat articles.
- **PUB-HOME-7** Every card shows at least: cover image, title, publication date. Large cards also show the chapô and categories.
- **PUB-HOME-8** Responsive: 1 column on phone, 2 on tablet, 3–4 on desktop. Category rows scroll horizontally on phone (the page itself MUST NOT scroll horizontally).
- **PUB-HOME-9** Views: see §7.4 for how `articles.views` is counted.

> Final visual layout to be produced as a mockup before implementation (see §10).

### 4.4 Search results page (added as a dedicated page)

- **PUB-SRCH-1** URL: `/recherche?q={query}&page={n}`. Title: « Résultats pour « {query} » ».
- **PUB-SRCH-2** Full-text search on published articles (title + chapô + content), French stemming, accent-insensitive, ranked by relevance. Reuses the V1 PostgreSQL approach (`search_vector`, `unaccent`, `ts_headline`).
- **PUB-SRCH-3** Each result shows cover, title and an excerpt with the matched terms highlighted.
- **PUB-SRCH-4** The search bar is repeated at the top of the page, pre-filled with the query.
- **PUB-SRCH-5** Pagination: 10 results per page, « Précédent » / « Suivant ».
- **PUB-SRCH-6** No results: message « Aucun article ne correspond à votre recherche. » followed by the latest 3 articles.
- **PUB-SRCH-7** The page is `noindex`.

### 4.5 Article detail page

URL: `/articles/{slug}` (unchanged from V1 to keep existing links and SEO).

Content, top to bottom:

1. **PUB-ART-1** Publication date (format « 19 septembre 2026 »).
2. **PUB-ART-2** Title (`h1`).
3. **PUB-ART-3** Chapô.
4. **PUB-ART-4** « Par Randy Donny » — the name links to the author profile page. Uses the author's display name.
5. **PUB-ART-5** Share buttons: Facebook, X, LinkedIn (opens the network's share URL in a new window). **(added)** A « Copier le lien » button, and on mobile the native share sheet (`navigator.share`) when available.
6. **PUB-ART-6** Cover image with the photo credit as caption (« Crédit photo : … »).
7. **PUB-ART-7** Article content, rendered from sanitized HTML, including « Encadré » blocks, tables, embedded media and image captions.
8. **PUB-ART-8** Bottom navigation: « Article précédent » / « Article suivant » with titles. Order is by `published_date` among published articles.
9. **PUB-ART-9 (added)** Estimated reading time (« 6 min de lecture ») near the date, computed from word count.
10. **PUB-ART-10 (added)** A compact subscription call-to-action at the end of the article, linking to `/#abonnement`.

Differences from V1:

- **PUB-ART-11** No advertising anywhere.
- **PUB-ART-12** No « À lire aussi » sidebar on desktop. The article column is centered with a comfortable reading width.
- **PUB-ART-13** Only `PUBLISHED` articles are publicly accessible. Draft and archived articles return 404 to visitors (V1 bug). The logged-in author can preview any article (with a banner « Aperçu — cet article n'est pas publié »).

Text-to-speech:

- **PUB-ART-14 (added, to be defined)** A « Écouter l'article » feature is wanted on the article page. Implementation is not decided — see open question Q1 (§11). Layout SHOULD reserve a place for the player near the share buttons.

### 4.6 Author profile page

- **PUB-PROF-1** URL: `/profil/randy-donny` (**to confirm**, V1 uses `/profile/randy-donny`; a 301 redirect from the old URL is required either way).
- **PUB-PROF-2** Shows avatar (with credit), display name (fallback: name), and biography (rich text).
- **PUB-PROF-3 (added)** Social links and the latest 3 articles.

### 4.7 Newsletter subscription

Subscription block placed at the bottom of the home page, anchor `#abonnement`.

- **PUB-SUB-1** Block content: title « Restez informé », one sentence of description, an email input, a button « S'abonner », and a short consent notice linking to the privacy policy.
- **PUB-SUB-2** Validation (server-side, French error messages):
  - Valid email format and a domain with MX records (Laravel `email:rfc,dns`).
  - Disposable/temporary email domains are rejected, using a maintained blocklist package, updated by a scheduled task. Message: « Les adresses email temporaires ne sont pas acceptées. »
- **PUB-SUB-3** Anti-abuse **(added)**: rate limit (5 attempts per IP per hour) and a honeypot field.
- **PUB-SUB-4** On valid submission, the subscriber is stored as **pending** and a confirmation email is sent. The page shows: « Merci ! Un email de confirmation vient de vous être envoyé. Cliquez sur le lien qu'il contient pour valider votre abonnement. »
- **PUB-SUB-5** The same message is shown if the email is already subscribed, so the form never reveals whether an address is known. If it is pending, the confirmation email is resent (max once per 10 minutes). If it was unsubscribed, the subscription restarts as pending.
- **PUB-SUB-6** Confirmation link: signed URL, valid 48 hours. Opening it marks the subscriber confirmed and shows the page « Votre abonnement est confirmé ». An expired or invalid link shows a page explaining that and offering to subscribe again.
- **PUB-SUB-7** Only confirmed subscribers receive newsletters.
- **PUB-SUB-8** Every newsletter contains a « Se désabonner » link (signed URL, one click, no login) and the `List-Unsubscribe` / `List-Unsubscribe-Post` headers (one-click unsubscribe required by Gmail/Yahoo). Unsubscribing sets `unsubscribed_at` and shows « Vous êtes désabonné ».
- **PUB-SUB-9** Pending subscriptions never confirmed after 30 days are purged by a scheduled task (GDPR data minimisation).

### 4.8 Other public pages and concerns

- **PUB-MISC-1** « Politique de confidentialité » page (kept from V1, updated: no AdSense, newsletter data, GA4).
- **PUB-MISC-2** Cookie consent banner (opt-in). GA4 only loads after consent. No other trackers.
- **PUB-MISC-3** Custom French error pages: 404 « Page introuvable », 500, 503 (maintenance).
- **PUB-MISC-4** SEO (kept from V1, fixed). Summary below; the full requirements are in `docs/seo-accessibility.md` Part A, which wins if the two differ. SEO is implemented in one pass once all public pages exist:
  - Per-page `<title>`, meta description (article `description`, fallback: chapô), canonical URL.
  - Open Graph + Twitter cards (`@randydonny`), with the article cover as image and a default image for other pages.
  - JSON-LD `BlogPosting` (article pages; `NewsArticle` in the first draft, see `docs/seo-accessibility.md` SEO-LD-4) with the **real** `datePublished` / `dateModified` (V1 bug: always `now()`), `Person` (profile page).
  - `sitemap.xml` and `sitemap-news.xml`, `robots.txt` disallowing `/admin`.
  - Meta keywords from the article `keywords` field.
- **PUB-MISC-5** `ads.txt` is removed.

---

## 5. Admin panel

### 5.1 Common rules

- **ADM-COM-1** Layout and visual design are **kept from `personal-blog-2`**: collapsible sidebar, sticky top bar, minimalist high-contrast style (see `personal-blog-2/docs/DESIGN.md`, `resources/js/layouts/AdminLayout.tsx`, `components/admin/*`).
- **ADM-COM-2** Sidebar items, in order: « Analytique », « Articles », « Catégories », « Abonnements », « Compte ». Plus « Voir le site » and « Se déconnecter ». On phone the sidebar becomes a drawer.
- **ADM-COM-3** **Every admin screen MUST be fully usable on a phone (≥ 360 px wide)**: tables turn into cards, forms are single-column, modals are full-screen, tap targets ≥ 44 px.
- **ADM-COM-4** Standard page header: page title on the left, primary action button on the right (stacks under the title on phone).
- **ADM-COM-5** Standard list ("grid") behaviour for all management screens:
  - Search field above the table (debounced, reflected in the URL `?q=`).
  - Pagination « Précédent » / « Suivant » with « Page x sur y », 15 rows per page, reflected in the URL `?page=`.
  - Default sort is given per screen; column sorting is **(added)** optional.
  - Empty state with a message and the primary action.
- **ADM-COM-6** Feedback: success/error toast after every action (the flash messages that `personal-blog-2` never displayed). Destructive actions require a confirmation modal.
- **ADM-COM-7** Forms: inline French validation errors, submit button disabled while submitting, a warning before leaving a form with unsaved changes.
- **ADM-COM-8** Unauthenticated access to `/admin/*` redirects to the login page (V1 returned 404: to confirm if the "hide admin" behaviour should be kept).

### 5.2 Analytics (« Analytique »)

Default admin page (`/admin`).

- **ADM-ANA-1** Period selector: « 7 derniers jours », « 28 derniers jours » (default), « 90 derniers jours », with comparison to the previous period (percentage up/down).
- **ADM-ANA-2** Key figures (from GA4): users, sessions, page views, average engagement time.
- **ADM-ANA-3** Charts and tables (from GA4):
  - Page views per day (line chart).
  - Top 10 articles by views in the period.
  - Traffic sources (direct, organic search, social, referral…).
  - Devices (desktop / mobile / tablet).
  - Top countries.
- **ADM-ANA-4** Blog figures (from the database): number of published articles, confirmed subscribers (and new ones in the period), last newsletter sent with its recipient count.
- **ADM-ANA-5** GA4 responses are cached (1 hour). If GA4 is unreachable or not configured, the page shows the database figures and a clear message « Les données Google Analytics sont indisponibles pour le moment. »
- **ADM-ANA-6** Responsive: key figures in a 2-column grid on phone, charts full width.

### 5.3 Articles

#### 5.3.1 List

- **ADM-ART-1** Header: « Articles » on the left, button « Créer un article » on the right.
- **ADM-ART-2** Table columns: « Titre », « Date de publication », « Catégories », « Statut » (colored badge), « Actions ».
- **ADM-ART-3** Actions per row: « Modifier », « Voir » (opens the public page or the preview), « Archiver » (only if published) / « Publier » (if draft or archived). **(added)** « Supprimer » for drafts only, with confirmation (soft delete).
- **ADM-ART-4** Default sort: most recent first (by publication date, drafts sorted by creation date at the top).
- **ADM-ART-5** Search by title. **(added)** Filter by status (« Tous », « Brouillons », « Publiés », « Archivés »).
- **ADM-ART-6** Paginated per ADM-COM-5.

#### 5.3.2 Editor (create and edit)

Routes: `/admin/articles/nouveau` and `/admin/articles/{id}/modifier` (by id, so the admin URL doesn't depend on the slug).

Header:

- **ADM-ART-10** Title: « Nouvel article » (create) or « Modifier l'article » (edit).
- **ADM-ART-11** Action buttons on the right, depending on the state:

| Button | Visible when |
|---|---|
| « Importer depuis Word » | Create only (hidden in edit) |
| « Voir l'article » | Edit only (published article: public page; otherwise preview) |
| « Publier » | Article is not published (draft or archived) |
| « Archiver » | Article is published |
| « Enregistrer » | Always (also repeated at the bottom of the form) |

- « Publier » saves then publishes. « Enregistrer » saves without changing the status (a new article is saved as a draft).

Fields, in order:

| ID | Label | Type | Rules |
|---|---|---|---|
| ADM-ART-20 | « Titre » | Text input | Required, max 255. |
| ADM-ART-21 | « Chapô » | Minimal TinyMCE: bold, italic, link | Required. |
| ADM-ART-22 | « Image de couverture » | File upload with preview | Required. JPG, PNG, WebP, max 5 MB. Uploaded to Cloudinary. |
| ADM-ART-23 | « Crédit photo » | Text input | Required, max 255. |
| ADM-ART-24 | « Contenu » | Full TinyMCE (§5.3.4) | Required. |
| ADM-ART-25 | « Catégories » | Multi-select with search | At least one. **(added)** Allows creating a category inline, as in V1. |
| ADM-ART-26 | « Description SEO » | Textarea with a live counter | Required, max 160. Helper text: « Ce champ n'apparaît pas dans l'article mais améliore le référencement. {n}/160 caractères ». |
| ADM-ART-27 | « Mots-clés » | Text input | Required. Helper text: « Séparez les mots-clés par des virgules ». Stored trimmed, deduplicated, comma separated. **(added)** « Générer les mots-clés » button (V1 feature) that suggests keywords from the content. |
| ADM-ART-28 | « Mettre à la une » **(added)** | Toggle | Makes this article the featured one (§5.3.5). Only effective when published. |

- **ADM-ART-29** **All fields are required.** "Required" is enforced when **publishing**. **(added, to confirm)** Saving a draft only requires the title, so the author can save work in progress, especially on mobile.
- **ADM-ART-30** The editor MUST be fully usable on phone (TinyMCE mobile mode, sticky action bar at the bottom of the screen).
- **ADM-ART-31 (added)** Autosave of the form in the browser every 30 s, with restore on reload, to avoid losing work.

#### 5.3.3 Import from Word

- **ADM-ART-40** « Importer depuis Word » opens a modal with a file input accepting `.docx` only (max 20 MB).
- **ADM-ART-41** The document is converted to HTML and pre-fills the form. Nothing is saved automatically: the author reviews and completes the form.
  - The first heading (or the first paragraph if there is no heading) becomes the « Titre ».
  - The rest becomes the « Contenu », keeping: headings, paragraphs, bold, italic, underline, links, bulleted/numbered lists, tables, images.
  - Embedded images are uploaded to Cloudinary and referenced by URL.
  - Unsupported formatting (colors, fonts, sizes) is dropped. The resulting HTML goes through the same sanitizer as the editor.
- **ADM-ART-42** If the form already has content, ask for confirmation before replacing it.
- **ADM-ART-43** Errors (corrupted file, wrong format, too large) are shown in French in the modal: « Le fichier n'a pas pu être importé. Vérifiez qu'il s'agit bien d'un document Word (.docx). »
- The legacy `.doc` format is out of scope.

#### 5.3.4 TinyMCE configuration

Keep TinyMCE as in V1, same tools (V1 config reproduced in Appendix B). Improvements:

- **ADM-ART-50** Content editor toolbar: V1 toolbar + a `styles` button, so « Encadré » is reachable directly (in V1 it was hidden in Format → Formats).
- **ADM-ART-51** Block formats: « Paragraphe » (`p`), « Titre 1 » (`h2`), « Titre 2 » (`h3`), « Titre 3 » (`h4`). `h1` is reserved for the article title.
- **ADM-ART-52** « Encadré » format: `div.callout-box` wrapper, displayed identically in the editor (via `content_css`) and on the public page.
- **ADM-ART-53** Image upload inside the editor goes to an **authenticated** endpoint (V1 endpoint was public), then to Cloudinary. Images support captions.
- **ADM-ART-54** TinyMCE UI language: French.
- **ADM-ART-55** Three configurations: `full` (content), `minimal` (chapô, biography: bold, italic, link), and `newsletter` (§5.5.3).

#### 5.3.5 Status workflow and rules

```
            Publier                Archiver
 DRAFT ──────────────▶ PUBLISHED ──────────────▶ ARCHIVED
                           ▲                         │
                           └─────────  Publier  ─────┘
```

- **ADM-ART-60** New articles start as `DRAFT`.
- **ADM-ART-61** Publishing sets `published_date` to now on the **first** publication only. Re-publishing an archived article keeps its original date. **(Change from V1, which reset the date; to confirm.)**
- **ADM-ART-62** Archiving hides the article from the public site but keeps `published_date`.
- **ADM-ART-63** Publishing no longer automatically makes the article featured (V1 behaviour). The featured article is set explicitly with « Mettre à la une ». Setting it removes the flag from the previous one. Archiving the featured article removes its flag (the home page then falls back to the latest article, PUB-HERO-5).
- **ADM-ART-64** Slug: generated from the title, unique. It is **frozen after first publication** (changing the title no longer changes the URL, V1 bug). **(added)** An optional « Modifier l'URL » field; when the slug changes, the old slug is kept and redirects (301) to the new one.
- **ADM-ART-65** Editing an article never changes its author (V1 bug).
- **ADM-ART-66** Scheduled publication is out of scope for V2 (see §9).

### 5.4 Categories

- **ADM-CAT-1** Header: « Catégories » on the left, button « Créer une catégorie » on the right.
- **ADM-CAT-2** « Créer une catégorie » opens a modal with one field « Nom de la catégorie » (required, max 50, unique case-insensitively) and « Annuler » / « Enregistrer » buttons.
- **ADM-CAT-3** Table columns: « Nom », « Date de création », **(added)** « Articles » (number of linked articles), « Actions » (« Modifier », « Supprimer »).
- **ADM-CAT-4** « Modifier » opens the same modal, pre-filled, titled « Modifier la catégorie ».
- **ADM-CAT-5** « Supprimer » asks for confirmation. If articles use the category, the modal says « Cette catégorie est utilisée par {n} article(s). Elle sera retirée de ces articles. » Deletion is a soft delete that detaches it from its articles. **Articles left without a category stay published** (to confirm).
- **ADM-CAT-6** A deleted name can be reused (V1 bug: unique constraint included deleted rows).
- **ADM-CAT-7** Search by name, sort by name (default) or date, pagination per ADM-COM-5.

### 5.5 Subscriptions and newsletter (« Abonnements »)

#### 5.5.1 Subscriber list

- **ADM-SUB-1** Header: « Abonnements » on the left, button « Créer une newsletter » on the right. **(added)** Two tabs: « Abonnés » and « Newsletters envoyées ».
- **ADM-SUB-2** Subscriber table columns: « Email », « Date d'abonnement », **(added)** « Statut » (« Confirmé », « En attente », « Désabonné »), « Actions » (« Supprimer »).
- **ADM-SUB-3** Search by email, filter by status, default sort most recent first, pagination per ADM-COM-5.
- **ADM-SUB-4** « Supprimer » permanently deletes the email (GDPR erasure), with confirmation.
- **ADM-SUB-5 (added)** « Exporter (CSV) » of the current filtered list.

#### 5.5.2 Sent newsletters

- **ADM-SUB-10 (added)** List of newsletters: subject, status (« Brouillon », « En cours d'envoi », « Envoyée », « Échec partiel »), send date, recipients, delivered/failed counts. A draft can be reopened; a sent newsletter can be viewed and duplicated.

#### 5.5.3 Newsletter composer

The author writes an email, includes articles, previews it, and sends it to all or selected subscribers.

- **ADM-SUB-20** Fields:
  - « Objet » (subject, required, max 150).
  - « Texte d'aperçu » (preheader shown in the inbox, optional, max 150).
  - « Contenu » — TinyMCE with the `newsletter` configuration: headings, bold, italic, links, lists, images, and an « Insérer un article » button.
- **ADM-SUB-21** « Insérer un article » opens a picker (search among published articles) and inserts an **article card** block: cover, title, chapô and a « Lire l'article » button linking to the article (with UTM parameters `utm_source=newsletter&utm_medium=email&utm_campaign={newsletter-slug}`).
- **ADM-SUB-22** Design: a **single fixed, branded email template** (header with the blog name, content, footer with the social links, the reason for receiving the email and the « Se désabonner » link). No drag-and-drop builder. The template MUST render correctly in the main clients (Gmail, Outlook, Apple Mail) and on mobile.
- **ADM-SUB-23** « Aperçu » shows the final email in a desktop/mobile preview.
- **ADM-SUB-24** « Envoyer un test » sends the email to the author's address only.
- **ADM-SUB-25** Recipients: « Tous les abonnés confirmés » (default) or « Sélection » (multi-select among confirmed subscribers). The recipient count is shown before sending.
- **ADM-SUB-26** « Enregistrer le brouillon » and « Envoyer ». Sending requires a confirmation modal: « Envoyer « {objet} » à {n} abonnés ? Cette action est irréversible. »
- **ADM-SUB-27** Sending is done in the background (queue), in batches that respect the provider's rate limit. Each recipient is tracked (sent / failed). Failures are retried 3 times.
- **ADM-SUB-28** Each email is personalised only by its unsubscribe link.
- **ADM-SUB-29** The whole composer MUST be usable on phone.
- **ADM-SUB-30 (added)** An « Envoyer par email aux abonnés » shortcut on the article publish success toast, which opens the composer pre-filled with that article.

### 5.6 Account (« Gestion du compte »)

Page title « Gestion du compte », two tabs: « Profil » and « Sécurité ».

#### 5.6.1 Profile tab

Each field is displayed read-only with a « Modifier » button. Clicking it replaces the display with an **inline editor** with « Annuler » / « Enregistrer ». One field is edited at a time.

- **ADM-ACC-1** « Avatar »: shows the current avatar and credit. Editor: image upload with preview (JPG/PNG/WebP, max 2 MB, square crop **(added)**) and « Crédit photo » text input. The previous image is deleted from Cloudinary after a successful replace.
- **ADM-ACC-2** « Nom d'affichage »: text input, required, max 100. Used everywhere the author name is displayed (« Par … »).
- **ADM-ACC-3** « Biographie »: rendered bio. Editor: minimal TinyMCE (bold, italic, link).
- **ADM-ACC-4 (added)** « Adresse email de connexion »: change requires the current password and confirmation by a link sent to the new address.

#### 5.6.2 Security tab

- **ADM-SEC-1** « Email de récupération »: add/edit. Verified by a link sent to that address before it becomes active. Used for password reset and security alerts.
- **ADM-SEC-2** « Téléphone de récupération »: add/edit, international format. **Verification by SMS requires an SMS provider — see open question Q6.** Until decided, the number is stored and displayed only.
- **ADM-SEC-3** « Modifier le mot de passe »: current password, new password, confirmation. Rules: min 12 characters, mixed case, number, symbol, not found in known data breaches. On success, other sessions are logged out.
- **ADM-SEC-4** « Authentification à deux facteurs (2FA) »:
  - Enable: show a QR code (TOTP, compatible with Google Authenticator, Authy, 1Password…), confirm with a 6-digit code, then show 8 single-use recovery codes to save.
  - When enabled: login asks for the TOTP code (or a recovery code) after the password.
  - Actions: « Régénérer les codes de récupération », « Désactiver la 2FA » (both require the password).
- **ADM-SEC-5** « Appareils connectés »: list of active sessions (browser, OS, device type, IP, approximate location **(added, optional)**, last activity), with « Cet appareil » on the current session. Actions: « Déconnecter » per session, « Déconnecter tous les autres appareils ».
- **ADM-SEC-6 (added)** « Historique des connexions »: the last 50 login events (date, device, IP, success/failure, 2FA used).
- **ADM-SEC-7 (added)** Security email alert on a login from a new device and on password/2FA changes.

#### 5.6.3 Authentication (added)

- **ADM-AUTH-1** Login page `/admin/connexion`: email, password, « Se souvenir de moi ». Rate limited (5 attempts per minute per email+IP).
- **ADM-AUTH-2** « Mot de passe oublié ? »: reset link sent to the login email **and** the recovery email if set. Link valid 60 minutes. (V1 had no password reset.)
- **ADM-AUTH-3** Logout from the sidebar.
- **ADM-AUTH-4** Session lifetime: 120 minutes of inactivity, or 30 days with « Se souvenir de moi ».

---

## 6. Non-functional requirements

### 6.1 Language and locale

- **NFR-LANG-1** **The blog is French only. There is no internationalisation layer.** Every text displayed to users — public site, admin, emails, validation messages, error pages, TinyMCE UI, dates — is in French.
- **NFR-LANG-2** `APP_LOCALE=fr`, `APP_FALLBACK_LOCALE=fr`, Laravel French validation messages in `lang/fr`. French strings are written directly in components (no translation keys).
- **NFR-LANG-3** Dates are displayed in French format (« 19 septembre 2026 », « 19/09/2026 à 14h30 »). Timezone: see Q4.
- **NFR-LANG-4** Pages declare `<html lang="fr">`.

### 6.2 Responsive

- **NFR-RESP-1** Supported widths: 360 px to 1920 px+. No horizontal page scroll at any width.
- **NFR-RESP-2** The admin is a first-class mobile experience (ADM-COM-3), not just "not broken".

### 6.3 Performance

- **NFR-PERF-1** Public pages are server-side rendered (Inertia SSR) for SEO and first paint. Admin pages are client-rendered.
- **NFR-PERF-2** Targets on a mid-range phone over 4G: LCP < 2.5 s, CLS < 0.1, INP < 200 ms on the home and article pages.
- **NFR-PERF-3** Images served through Cloudinary with automatic format/quality (`f_auto,q_auto`), responsive sizes (`srcset`), explicit width/height, and lazy loading below the fold.
- **NFR-PERF-4** Home page sections are cached and invalidated when an article is published, updated or archived.

### 6.4 Security

- **NFR-SEC-1** All admin routes and every upload endpoint require authentication (V1's `/api/upload` was public).
- **NFR-SEC-2** CSRF protection, secure/HttpOnly/SameSite cookies, HTTPS enforced, security headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, a Content-Security-Policy compatible with TinyMCE, GA4 and Cloudinary).
- **NFR-SEC-3** All stored rich text is sanitized server-side (allowlist) before saving and rendered through a sanitizer on the client.
- **NFR-SEC-4** Rate limiting on login, password reset, subscription and 2FA endpoints.
- **NFR-SEC-5** Secrets (GA4 service account, mail provider, Cloudinary) only in environment variables.

### 6.5 Privacy (GDPR)

- **NFR-PRIV-1** GA4 only after cookie consent; IP anonymisation is handled by GA4.
- **NFR-PRIV-2** Subscribers: only the email and subscription dates are stored; double opt-in proof (confirmation date and IP) is kept; one-click unsubscribe; deletion on request (ADM-SUB-4); pending ones are purged (PUB-SUB-9).
- **NFR-PRIV-3** The privacy policy describes all of the above.

### 6.6 Accessibility

- **NFR-A11Y-1** The public site MUST conform to WCAG 2.2 level AA: usable with a screen reader (NVDA, VoiceOver) and with the keyboard alone, semantic HTML and landmarks, correct ARIA, visible focus, sufficient contrast, `alt` text on images (article cover alt = title if nothing else), labelled form fields, announced dynamic changes, accessible modals.
- **NFR-A11Y-2** The detailed requirements (component-by-component ARIA, images, article body, forms, verification) are in `docs/seo-accessibility.md` Part B and C.

---

## 7. Technical specification

### 7.1 Stack

| Layer | Choice |
|---|---|
| Language / runtime | PHP 8.5 |
| Backend framework | Laravel 13 |
| App server | FrankenPHP + Laravel Octane (as in V1 and `personal-blog-2`) |
| Frontend | Inertia.js (latest) + React (latest) + TypeScript, with SSR for public pages |
| Styling | Tailwind CSS 4 |
| Build | Vite |
| Typed routes | Laravel Wayfinder (as in `personal-blog-2`) |
| Rich text | TinyMCE (latest), via `@tinymce/tinymce-react`. Licensing: see Q2 |
| Database | PostgreSQL 18 |
| Queue / cache / sessions | Database drivers (simple, one less service). Redis MAY be added if needed |
| Media | Cloudinary (kept from V1, existing URLs stay valid) |
| Email | Laravel Mail with a transactional provider (see §7.6 and Q3); Mailpit in development |
| Analytics | Google Analytics 4 (tracking) + GA4 Data API (admin dashboard) |
| Tests | Pest (PHP); Vitest + Testing Library (React) **(added)**; Playwright MAY be used for a few end-to-end smoke tests |
| Quality | Pint, Larastan, ESLint, Prettier, `tsc --noEmit` |

The project is a **new, from-scratch** Laravel 13 application. From `personal-blog-2`, bring over:

- The admin layout, design tokens and components (`resources/js/layouts/AdminLayout.tsx`, `resources/js/components/admin/*`, `resources/js/components/ui/*`, `docs/DESIGN.md`, theme tokens in `resources/css/app.css`), adapted as needed.
- The Docker setup (`Dockerfile`, `Dockerfile.node`, `docker-compose.yml`, Vite HMR config).
- The CI workflows (`.github/workflows/tests.yml`, `lint.yml`), fixed as below.
- `SafeHtml` (DOMPurify + html-react-parser) for rendering article HTML.

### 7.2 Environments and infrastructure

- **INF-1** Docker Compose for development, services:
  - `app` (FrankenPHP/Octane with `--watch`), `queue` (queue worker), `scheduler` **(added)** (`schedule:work`), `ssr` (Inertia SSR server), `vite` (dev server with HMR), `postgres` (18, healthcheck, named volume), `mailpit` **(added)** (catches all dev emails).
- **INF-2** Production: a single Docker image (FrankenPHP + Octane) running the app, queue worker and scheduler under a process manager, plus the SSR server. The start script MUST run `php artisan migrate --force` (V1 did not).
- **INF-3** CI on every push/PR: Pint, Larastan, ESLint, Prettier, type check, Pest **against PostgreSQL** (not SQLite: the migrations use Postgres-only features — this broke `personal-blog-2`'s tests), Vitest, production build.
- **INF-4** CD: build and push the Docker image on tag (as in V1).
- **INF-5** Daily database backup (**to define** where, see Q7).

### 7.3 Data model

**Rule: V1 data is migrated as-is.** Existing tables stay. Changes MUST be additive (new tables, new nullable columns, new indexes) or non-destructive; no existing column is dropped or renamed.

#### 7.3.1 Existing V1 tables (kept)

`users`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | string | |
| email | string, unique | Login email |
| email_verified_at | timestamp, null | |
| password | string | |
| date_birth | date, null | Unused in V2 |
| avatar | text, null | Cloudinary URL |
| avatar_credit | string, null | |
| display_name | string, null | Fallback: `name` |
| bio | text, null | HTML |
| gender | enum, default `PREFER_NOT_TO_SAY` | Unused in V2 |
| slug | string, unique | Profile URL |
| remember_token | string, null | |
| created_at, updated_at, deleted_at | timestamps | |

`articles`

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| title | string(255) | |
| slug | string, unique | Frozen after first publication |
| lead_paragraph | text, null | Chapô (HTML) |
| content | text | HTML |
| raw_content | text | Plain text of chapô + content, feeds search |
| cover_photo | string, null | Cloudinary URL |
| cover_photo_credit | string, null | |
| description | string(255), null | SEO description (max 160 enforced by validation) |
| keywords | text, null | Comma separated |
| status | enum `DRAFT`/`PUBLISHED`/`ARCHIVED` | |
| published_date | timestamp, null | |
| is_featured | boolean, default false | |
| views | int, default 0 | **Now used** (§7.4) |
| shares | int, default 0 | Unused |
| read_duration | int, default 0 | **Now used**: minutes, computed on save |
| origin | string, null | Unused |
| author_id | FK → users, cascade | |
| search_vector | tsvector, GIN index | Maintained by a trigger (`french` + `unaccent`) |
| created_at, updated_at, deleted_at | timestamps | |

`categories`: id, key (unique), value (unique), created_at, updated_at, deleted_at.
`article_categories`: id, article_id (FK), category_id (FK), timestamps.
`subscriptions`: id, email (unique), is_verified, verification_token, verified_at, unsubscribed_at, created_at, updated_at, deleted_at.
Laravel tables: `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`.

#### 7.3.2 Changes (additive)

| Table | Change | Why |
|---|---|---|
| `users` | + `recovery_email` (null), `recovery_email_verified_at` (null), `recovery_phone` (null), `recovery_phone_verified_at` (null) | ADM-SEC-1/2 |
| `users` | + `two_factor_secret` (text, null, encrypted), `two_factor_recovery_codes` (text, null, encrypted), `two_factor_confirmed_at` (null) | ADM-SEC-4 |
| `articles` | + index on (`status`, `published_date`) | Home, prev/next, lists |
| `article_categories` | + unique (`article_id`, `category_id`) after removing duplicates | Data integrity |
| `categories` | replace unique `key`/`value` with **partial** unique indexes `WHERE deleted_at IS NULL` | ADM-CAT-6 |
| `subscriptions` | + `confirmed_ip` (null), `last_confirmation_sent_at` (null) | GDPR proof, resend throttling (`is_verified`/`verified_at` keep their meaning) |
| `article_slug_redirects` (new) | id, article_id (FK), old_slug (unique), created_at | ADM-ART-64 |
| `article_views` (new) | article_id (FK), date, count; unique (`article_id`, `date`) | « Les plus lus » over 30 days |
| `newsletters` (new) | id, subject, preheader, content (HTML), status, audience (`all`/`selection`), scheduled_at (null, future use), sent_at, recipients_count, sent_count, failed_count, timestamps | ADM-SUB |
| `newsletter_recipients` (new) | id, newsletter_id (FK), subscription_id (FK), status (`pending`/`sent`/`failed`), sent_at, error (null) | Per-recipient tracking |
| `login_events` (new) | id, user_id (FK), ip, user_agent, succeeded (bool), two_factor_used (bool), created_at | ADM-SEC-6/7 |
| `sessions` | (unchanged) used for ADM-SEC-5 | |

Code-level fixes (no schema change): `Category::articles()` relation keys (swapped in V1), `Article::$fillable` (`share` typo), `User::articles()` relation, `SoftDeletes` on `User`.

### 7.4 Business logic notes

- **View counting**: one view per article per visitor per 24 hours (keyed by a hashed IP + user agent, cookie-free so it works without consent), bots excluded by user agent, author sessions excluded. Increments `articles.views` and the daily `article_views` row, through a queued job.
- **Reading time**: `ceil(word_count / 200)` minutes, stored in `read_duration` on save.
- **Previous/next**: by `published_date` among `PUBLISHED` articles.
- **Featured**: single `is_featured = true` enforced in a transaction.
- **Search**: `plainto_tsquery('french', unaccent(q))` on `search_vector`, `ts_rank` ordering, `ts_headline` excerpts (V1 approach).
- **Sanitization**: one server-side HTML allowlist shared by articles, bio and newsletters (allows the `callout-box` class, tables, figures, iframes from YouTube only).

### 7.5 Media (Cloudinary)

- All uploads (covers, in-content images, avatars, .docx images) go through one authenticated upload service, stored in folders `articles/`, `avatars/`, `newsletters/`.
- Delivery URLs use `f_auto,q_auto` and width transformations for `srcset`.
- When an image is replaced (cover, avatar), the old asset is deleted from Cloudinary (never done in V1/`personal-blog-2`).

### 7.6 Integrations

**Email provider** (choice open, Q3). Requirements:

- A Laravel mail transport (SMTP or native API driver).
- Free or cheap for the expected volume (a few hundred subscribers, a few newsletters per month) plus transactional emails.
- Deliverability on `randy-donny.com`: SPF, DKIM, DMARC configured.
- Bounce and complaint webhooks: a hard bounce or spam complaint marks the subscriber as unsubscribed.
- Candidates: **Brevo** (EU, free 300 emails/day), **Resend** (first-party Laravel driver, free 3,000/month), **Amazon SES** (cheapest at volume, heavier setup).

Emails sent by the application (all in French, one shared template): subscription confirmation, newsletter, password reset, email/recovery-email verification, security alerts, newsletter test.

**Google Analytics 4**:

- Tracking: GA4 tag (measurement ID from V1 `G-5ZEWQRGZV5`, to confirm), loaded after consent.
- Admin dashboard: GA4 Data API with a service account (JSON key in an env variable), property ID in config, responses cached 1 hour.

**Disposable email detection**: a maintained blocklist package, refreshed weekly by the scheduler.

**Word import**: server-side or client-side .docx → HTML conversion (e.g. `mammoth` on the client, or PHPWord on the server — to be chosen at implementation; mammoth gives cleaner semantic HTML).

### 7.7 Routes summary

Public: `/`, `/recherche`, `/articles/{slug}`, `/profil/{slug}`, `/politique-de-confidentialite`, `/abonnement` (POST), `/abonnement/confirmer/{token}`, `/abonnement/desabonner/{token}`, `/sitemap.xml`, `/sitemap-news.xml`, `/robots.txt`, `/up`.

Admin (`/admin`, authenticated): `/admin` (analytique), `/admin/articles`, `/admin/articles/nouveau`, `/admin/articles/{id}/modifier`, `/admin/categories`, `/admin/abonnements`, `/admin/newsletters/nouvelle`, `/admin/newsletters/{id}`, `/admin/compte`, `/admin/connexion`, `/admin/mot-de-passe-oublie`, `/admin/deux-facteurs`.

Redirects: `/profile/{slug}` → `/profil/{slug}` (if Q5 confirms the rename), old article slugs → current slug.

### 7.8 Data migration V1 → V2

1. Freeze V1 writes (maintenance mode).
2. `pg_dump` the V1 production database; restore it into the V2 database.
3. Mark the V1 migrations as already run in the V2 `migrations` table (V2 keeps the V1 migration files as its baseline, like `personal-blog-2` did).
4. Run the V2 additive migrations.
5. Data cleanup scripts: remove duplicate `article_categories` rows; recompute `read_duration`; verify every article has a slug.
6. Verification checklist: row counts per table match; every published article URL returns 200; images load; the author can log in; the confirmed-subscriber count matches.
7. Switch DNS / deploy; keep V1 dump for rollback.

A rehearsal on a copy of production data MUST be done before the real migration.

### 7.9 Testing and definition of done

- Feature tests (Pest) for every requirement with business rules: status workflow, featured logic, slug freezing and redirects, subscription flow (validation, disposable emails, confirmation, unsubscribe), newsletter sending, auth (login, reset, 2FA), public visibility rules.
- Component tests (Vitest) for the editor form, inline profile editors and the newsletter composer.
- A feature is done when: requirements implemented, tests pass in CI, usable at 360 px wide, French labels only, no console errors.

---

## 8. Design direction

- **Public site**: new editorial design inspired by wired.com — strong typographic hierarchy, clear section headings, mixed card sizes, generous white space, readable article column (~70 characters per line). Mockups (home, article, search, profile, mobile versions) to be validated before implementation.
- **Admin**: design kept from `personal-blog-2` (minimalist, high contrast, primary `#2B2B2B`, Inter font).
- Dark mode: out of scope for V2 (public and admin).

---

## 9. Out of scope for V2 (possible later)

- RSS feed, category pages (`/categories/{slug}`), tags.
- Scheduled publication of articles and newsletters.
- Automatic "new article" newsletter.
- Comments.
- Dark mode.
- Multi-language.
- Share counters.

---

## 10. Deliverables before implementation

1. This specification validated (open questions answered).
2. Mockups: public home, article, search, profile (desktop + mobile); newsletter email template.
3. Choice of email provider and TinyMCE licensing.

---

## 11. Open questions

| # | Question | Options / notes |
|---|---|---|
| Q1 | **Text-to-speech on the article page (« Écouter l'article »)**: how to implement it? | (a) Browser Web Speech API: free, no storage, but voice quality and French voices vary by device. (b) Generate an audio file per article with a cloud TTS service (Google Cloud TTS, Azure, ElevenLabs…) on publish, stored on Cloudinary: consistent quality, has a cost, must regenerate on edit. (c) Third-party embedded player (e.g. a TTS widget): fastest, adds an external script. To decide: quality expectations, budget, whether the player needs speed control / progress. |
| Q2 | TinyMCE licensing: self-hosted GPL build (no API key, like V1's `license_key: 'gpl'`) or Tiny Cloud with an API key? | Self-hosted GPL recommended (no quota, no external dependency). |
| Q3 | Which email provider? | See §7.6. |
| Q4 | Timezone for displayed dates: `Europe/Paris` or `Indian/Antananarivo`? | Storage stays UTC. |
| Q5 | Author profile URL: keep `/profile/randy-donny` or move to `/profil/randy-donny` with a redirect? | |
| Q6 | Recovery phone number: is SMS verification needed (requires an SMS provider, e.g. Twilio / Brevo SMS), or is storing the number enough? | |
| Q7 | Hosting and backups: where is V2 deployed (same host as V1?), and where are daily database backups stored? | |
| Q8 | Drafts: may a draft be saved with only a title (ADM-ART-29)? | Recommended: yes. |
| Q9 | Re-publishing an archived article: keep the original publication date (ADM-ART-61)? | Recommended: yes. |
| Q10 | Unauthenticated `/admin` access: redirect to login or keep V1's 404? | |
| Q11 | Newsletter cadence: will there be a regular rhythm (weekly digest…) that would justify automation later? | Affects §9. |

---

## Appendix A — Known V1 / `personal-blog-2` issues fixed by V2

| Issue | Where | V2 requirement |
|---|---|---|
| Draft and archived articles publicly accessible by URL | V1 `app/Livewire/Articles/Show.php` | PUB-ART-13 |
| Previous/next ordered by id, not date | V1 `ArticleRepository` | PUB-ART-8 |
| Slug regenerated on title change, breaking links | V1 + `personal-blog-2` | ADM-ART-64 |
| JSON-LD dates always `now()` (typo in variable name) | V1 `layouts/app.blade.php` | PUB-MISC-4 |
| Public, unauthenticated image upload endpoint | V1 `routes/api.php` | NFR-SEC-1 |
| Author overwritten on article edit | V1 `ArticleForm` | ADM-ART-65 |
| Archiving the featured article could re-feature it | V1 `ArticleActions` | ADM-ART-63 |
| Category unique constraint blocks re-creating a deleted category | V1 + `personal-blog-2` | ADM-CAT-6 |
| `Category::articles()` pivot keys swapped | V1 `app/Models/Category.php` | §7.3.2 |
| No password reset, no 2FA | V1 + `personal-blog-2` | ADM-AUTH-2, ADM-SEC-4 |
| Mocked analytics dashboard | V1 | §5.2 |
| Flash messages never displayed | `personal-blog-2` | ADM-COM-6 |
| Tests run on SQLite while migrations are Postgres-only | `personal-blog-2` | INF-3 |
| Replaced images never deleted from Cloudinary | V1 + `personal-blog-2` | §7.5 |
| SEO description limit inconsistent (200 vs 160) | `personal-blog-2` | ADM-ART-26 |
| Migrations not run on production start | V1 | INF-2 |

## Appendix B — V1 TinyMCE configuration (reference)

Content editor (`resources/views/livewire/articles/article-form.blade.php` in V1):

```js
{
  height: 600,
  plugins: ['image', 'fullscreen', 'lists', 'advlist', 'link', 'media', 'table'],
  toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | numlist bullist | outdent indent | image media fullscreen | link unlink | table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
  block_formats: 'Paragraph=p; Header 1=h2; Header 2=h3; Header 3=h4',
  style_formats: [{ title: 'Encadré', block: 'div', classes: 'callout-box', wrapper: true }],
  images_file_types: 'jpg,jpeg,png,gif,webp',
  image_caption: true,
  link_default_target: '_blank',
  entity_encoding: 'raw',
}
```

Chapô editor: plugins `link, image, fullscreen`; toolbar `undo redo | bold italic | link unlink | image fullscreen`; no menubar. (V2: remove `image`, keep bold/italic/link.)

« Encadré » public style (V1): `bg-primary-100 p-4 my-4 border-l-4 border-primary-400 flex flex-col gap-4`.
