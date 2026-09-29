# Full SEO Audit — siddhivinayakoverseas.com

**Audited:** 29 September 2026 · **Pages crawled:** 92 (complete sitemap) · **Health score: 57 / 100**

**Business type:** hybrid local service + informational publisher — overseas education,
study visa and work visa consultancy, single physical office in Surat, Gujarat, targeting
India, Nepal and Bangladesh.

---

## Read this first

Your site is **well engineered and badly signposted.**

The infrastructure is genuinely above average for a business this size: a full security
header set with HSTS preload, single-hop canonical redirects, real 404s instead of soft
ones, valid structured data on every page that has it, alt text on all 150 images, exactly
one `<h1>` per page, and CLS of 0.0005. Somebody made careful decisions here, and the
comments in `.htaccess` and `robots.txt` show the reasoning was sound.

The problems are almost entirely in **what the site tells Google about itself**, and they
cluster into three failures:

1. **27% of your sitemap serves a duplicate-titled shell.** 25 URLs, one identical title.
2. **Your metadata library is dead.** `react-helmet-async` does not work on React 19. Your
   code is correct; the library ignores it.
3. **Your content does not answer the questions it targets.** Zero currency figures across
   17 guide and country pages. Zero tables sitewide. 92% of your FAQ answers are invisible.

None of these is a design flaw or a hosting problem. All three are fixable in about a week.

---

## Score breakdown

| Category | Weight | Score | Verdict |
|---|---|---|---|
| Technical SEO | 22% | **72** | Strong foundation, one self-inflicted wound |
| Content Quality | 23% | **42** | Weakest area — YMYL trust signals largely absent |
| On-Page SEO | 20% | **58** | Good fundamentals, broken on 25 pages |
| Schema / Structured Data | 10% | **55** | Good coverage, one policy violation |
| Performance (CWV) | 10% | **68** | Low confidence — LCP and INP unmeasured |
| AI Search Readiness | 10% | **33** | Cannot be cited: no specifics to quote |
| Images | 5% | **85** | Genuinely good |
| | | **57** | |

---

## Critical findings

### 1. 25 of 92 sitemap URLs serve a 10-word shell with one shared title

`/blog/*` (11 URLs) and `/urgent-requirements/*` (14 URLs) return ~5.8 KB containing 10
words, no `<h1>`, no canonical, no structured data — and on all 25, byte-identical:

```
Title: Overseas Education & Visa Consultants in Surat | Siddhivinayak Overseas   (×25)
Desc:  Siddhivinayak Overseas — study visa and work visa consultants in Surat…   (×25)
Canonical: (absent)
```

The content is real once JavaScript runs — `/urgent-requirements/greece-hospitality-jobs-200-positions`
renders 2,079 words and a correct `<h1>`. Nothing is missing except the signals that decide
indexing.

Two build scripts contradict each other:

- `scripts/prerender.mjs:27` — `SKIP_PREFIXES = ['/blog/', '/urgent-requirements/']`
- `scripts/seo-routes.mjs:200-221` — writes those same URLs into `sitemap.xml`

You are telling Google "these 25 URLs are canonical and important" while serving each one a
copy of the same near-empty document. **Fix: 2–4 hours.**

### 2. react-helmet-async is inert under React 19

`package.json` pins `react@^19` (19.2.8 installed) with `react-helmet-async@^2.0.5` — that
library's final release, peer range capped at React 18.

Verified live. Clicking from `/` to `/study-in-canada`:

| | before | after |
|---|---|---|
| path | `/` | `/study-in-canada` |
| `document.title` | homepage title | **unchanged** |
| canonical | `https://siddhivinayakoverseas.com/` | **`https://siddhivinayakoverseas.com/`** |

The Canada page declares the **homepage** as its canonical. On a blog URL,
`document.head.querySelectorAll('[data-rh]').length` returns `0` — Helmet strips the
prerendered tags and writes nothing back.

Your components are not at fault. `BlogPostPage.tsx:78-91` and
`UrgentRequirementDetailPage.tsx:207-221` both declare correct titles, canonicals and OG
tags. The library never applies them.

**Scope, stated honestly:** Googlebot loads each URL fresh rather than navigating your SPA,
so the 67 prerendered pages still hand Google correct static tags. The indexing damage is
concentrated on the 25 shell URLs. The rest is a correctness and link-preview problem.

**Fix:** React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` natively. Delete
`react-helmet-async` and `HelmetProvider` (`src/main.tsx:34`) and render the tags directly.
That removes an unmaintained dependency rather than replacing it with another.

### 3. 147 of 159 FAQ answers never appear on the page

Across 51 pages carrying `FAQPage` markup, **92% of answers exist only in JSON-LD**. On 43
pages, *no* answer renders. Meanwhile 100% of the questions *are* visible — so a reader sees
questions whose answers exist only in your markup.

`/study-in-germany` and `/visa-consultants-in-surat`: 0 of 2 and 0 of 3 answers present in
visible text.

Google's structured-data policy prohibits marking up content that is not visible to users.
**This is the only finding in this audit carrying a manual-action risk.**

The fix pays twice: rendering those answers as self-contained 40–60 word responses resolves
the policy problem *and* creates exactly the extractable passages the AI-search finding
calls for.

### 4. "Fixed jobs, guaranteed statutory salaries"

Homepage body copy, the homepage meta description, and a navigation label:

> "…transition to lawful work visas with **fixed jobs, guaranteed statutory salaries**, and
> company benefits"

No consultancy can guarantee a foreign employer's salary or a visa grant — both are
third-party decisions. In a YMYL vertical, guarantee claims with no named guarantor and no
evidence are what quality-rater guidelines characterise as untrustworthy.

Separately and more seriously: recruiting Indian nationals for overseas employment is
regulated under the **Emigration Act 1983** via the Protector General of Emigrants, and no
registration number appears anywhere on your site. I am not giving legal advice and have not
established whether you hold a licence — but this is material enough to need a professional
opinion before the copy stays up. If you hold a licence, displaying it is also a strong
trust signal.

### 5. The content cannot be cited because it contains no specifics

All eight guide pages and all nine study-in pages contain **zero currency figures**.
`/study-in-germany` names the blocked account three times without stating its value.
`/study-in-canada` says "Exact figures depend on city and program." There are **zero
`<table>` elements on the entire site**.

The `/guides/*` section averages **201 words** of main content while targeting queries whose
first page is gov.uk and IRCC.

This is why AI search will not cite you and why the guides will not rank: there is nothing
specific enough to quote.

---

## Category detail

### Technical SEO — 72

Everything here is right except one thing.

| check | result |
|---|---|
| Security headers | HSTS preload, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy — full set |
| `http` → `https` | 301, single hop |
| `www` → non-`www` | 301, single hop |
| trailing slash | 301, single hop |
| Unknown URL | Real **404**, not a soft 404 |
| All 92 sitemap URLs | HTTP 200 |
| Viewport | `maximum-scale=5.0` — pinch-zoom permitted |

`robots.txt` deliberately does *not* Disallow `/admin`, `/dashboard`, `/403`, because those
emit `X-Robots-Tag: noindex` and blocking them would prevent crawlers reading that header.
That is correct and a subtlety most sites get backwards — keep it.

The one wound is the sitemap/prerender contradiction above.

### Content Quality — 42

The weakest category, and the one that limits everything else.

- No named authors, credentials, GST, CIN or accreditation anywhere. `/about` is 231 words
  offering "6+ years", "500+ clients", "thousands of families" — unverifiable.
- Nine guides at a 201-word median, eight of them carrying `Article` schema.
- 22 country pages built from one template with the name swapped (not thin — 787-word median
  — but interchangeable).
- No citations to IRCC, UKVI, Home Affairs or BAMF; no "last verified" dates on rules that
  change yearly.

**What is good:** `/visa-consultants-in-surat` is hand-written with real local detail and is
the best page on the site. `/regional-coverage` (3,260 words) and `/reviews` (1,841) are
substantial. The prose is clear, with no keyword stuffing. `/immigration-disclaimer` exists,
which is rare in this vertical.

### On-Page SEO — 58

| | |
|---|---|
| Titles > 60 chars | **50 of 92** (34 over 70, longest 87) |
| Duplicate titles | **25** identical |
| Missing canonicals | **25** |
| Descriptions > 160 chars | 15 (longest 235) |
| Images without alt | **0 of 150** |
| Pages with ≠ 1 `<h1>` | **0** |
| Orphan pages | **1** (`/countries`) |

`SeoHead.tsx:27-31` already drops the brand suffix past 65 characters — the overflowing
pages are the ones calling Helmet directly instead of going through `SeoHead`. The fix is
routing, not new logic.

### Schema — 55

Valid JSON on every block across 67 pages, with a genuinely coherent entity graph: `@id`
values, `parentOrganization` linking, `WebPage.isPartOf`, `WebSite.potentialAction`.

Problems, in order: the hidden-FAQ policy violation (above); no `openingHoursSpecification`
and no opening hours anywhere on the site; **no Google Maps presence at all** — no embed, no
directions link, no GBP URL in `sameAs`; and duplicate injection — 56 pages emit
`Organization`, `WebSite` and `LocalBusiness` twice in raw HTML, three times in the rendered
DOM (19 blocks on `/study-in-canada`), because `JsonLd.tsx` appends without de-duplicating
and `prerender.mjs` snapshots after those effects run.

Also: verify the Instagram URL in `sameAs` — it reads `siddhiv**inyak**overseas`, not
`siddhiv**inayak**overseas`.

### Performance — 68, low confidence

**Read the limitation before acting.** No Google credentials meant no CrUX field data, the
PageSpeed Insights quota was exhausted, and the browser did not surface LCP entries. **LCP
and INP — the two vitals that matter most — are unmeasured.**

Measured: CLS **0.0005** on both pages tested (200× inside threshold — nothing to do here).
TTFB 976 ms on `/` vs 397 ms on `/study-visa`. 18–21 requests. Brotli, gzip, immutable asset
caching and `no-cache` HTML all configured correctly.

One concern: `/study-visa` ships **1,953 KB of decoded JavaScript** against 7 KB of images,
for a page whose content is already in the HTML. Unlikely to hurt LCP; the main suspect for
INP.

### AI Search Readiness — 33

No crawler blocking — every AI and search crawler tested returns 200. The failure is
content, not access: nothing on the site is specific enough to quote, the business is not a
resolvable entity (no Wikidata, two weak `sameAs` entries, no GBP link, three schema nodes
with three different names), and the FAQ answers that *would* be citable are invisible.

Worth knowing: the crawlers named explicitly in `robots.txt` (GPTBot, ClaudeBot,
Google-Extended) govern **model training**. The ones that decide **citability** —
OAI-SearchBot, Claude-SearchBot, PerplexityBot — are permitted only by the wildcard.

### Images — 85

150 of 150 images carry a non-empty alt attribute. AVIF and WebP in use with JPEG fallbacks.
Heavy homepage textures correctly do not load on other routes. The only gap is one generic
`og:image` shared by 90 pages.

---

## Where to start

Full detail and sequencing in **`ACTION-PLAN.md`**. The short version:

1. **Connect Google Search Console** (30 min) — this audit ran blind; do this before anything
2. **Prerender the 25 shell pages** (2–4 h)
3. **Replace react-helmet-async with React 19 native metadata** (4–6 h)
4. **Make the 147 hidden FAQ answers visible** (1 day)
5. **Fix the guarantee copy + get legal advice on Emigration Act registration**

Items 2 and 3 are both required — one fixes what Googlebot sees on first load, the other
stops the canonical pointing at the wrong page everywhere else.

---

## What this audit could not see

Stated plainly, because it bounds how much the score is worth:

- **No Search Console, CrUX or GA4 access.** No indexation status, no query data, no organic
  traffic, no field Core Web Vitals. This is the largest blind spot — you do not currently
  know which of the 92 pages Google has indexed.
- **No Lighthouse scores; LCP and INP unmeasured** (PSI quota exhausted).
- **No backlink data** — no Moz or Ahrefs credentials, so no domain authority, referring
  domains or competitor link-gap analysis.
- **No Google Business Profile access** — every GBP statement is inferred from the site.
- **Six of seven specialist agents terminated on an API rate limit.** The local-SEO, AI-search
  and search-experience reports completed; technical, content, performance and schema were
  reproduced inline with a reduced method and are flagged as such in their files.
- **Blog post content quality was not assessed** — those pages serve no static HTML to read.

One correction made during the audit and noted here for transparency: an early pass reported
the sitewide median at 1,047 words and called content "not thin". That count included nav and
footer on every page. Measured inside `<main>`, the median is 703 and the `/guides/` section
is genuinely thin at 201. The corrected figures are used throughout.

---

## Artifacts

| file | contents |
|---|---|
| `ACTION-PLAN.md` | Prioritised plan with effort estimates and what *not* to do |
| `audit-data.json` | Structured envelope (7 categories, 28 findings) for report generation |
| `onpage.json` | Raw per-URL crawl data for all 92 pages |
| `findings/onpage.md` | On-page SEO — titles, descriptions, canonicals, content depth |
| `findings/technical.md` | Headers, redirects, status codes, `.htaccess` review |
| `findings/content.md` | E-E-A-T and content quality |
| `findings/schema.md` | Structured data, property-level |
| `findings/performance.md` | Core Web Vitals (partial — read the limitations) |
| `findings/geo.md` | AI search readiness, 37 KB, query-level analysis |
| `findings/sxo.md` | Search-experience: SERP read-back per target query, persona scoring |
| `findings/local.md` | Local SEO, NAP, GBP signals (self-marked partial) |
