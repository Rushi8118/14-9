# On-Page SEO — findings

Method: every one of the 92 sitemap URLs fetched as raw HTML (no JS), parsed with an
attribute-order-independent parser. Key items re-verified in a real browser with
JavaScript enabled. All 92 URLs returned HTTP 200; no redirects, no 404s, no 5xx.

---

## CRITICAL — 25 of 92 sitemap URLs serve an empty shell with a duplicate title

`/blog/*` (11 URLs) and `/urgent-requirements/*` (14 URLs) return an HTML document of
~5.8 KB containing **10 words**, no `<h1>`, no canonical, no JSON-LD, and — on every one
of the 25 — the *identical* title and meta description:

```
Title: Overseas Education & Visa Consultants in Surat | Siddhivinayak Overseas   (x25)
Desc:  Siddhivinayak Overseas — study visa and work visa consultants in Surat...  (x25)
Canonical: (absent)
```

This is by design in the build, and the two halves of the design contradict each other:

- `scripts/prerender.mjs:27` — `const SKIP_PREFIXES = ['/blog/', '/urgent-requirements/']`
  excludes these routes from prerendering; `.htaccess` serves them `app-shell.html`.
- `scripts/seo-routes.mjs:200-221` — puts those same URLs **into sitemap.xml**, fetched
  live from Supabase.

So the site actively submits 25 URLs to Google that serve a duplicate-titled shell.

The content itself is real and substantial once JavaScript runs — e.g.
`/urgent-requirements/greece-hospitality-jobs-200-positions` renders 2,079 words and a
correct `<h1>`. The problem is not missing content. It is that the indexable signals
(title, description, canonical, schema) never arrive. See the next finding for why
JS rendering does not rescue them.

**Severity: Critical.** Duplicate titles at this scale invite Google to treat the set as
near-duplicates, and with no canonical on any of them Google picks its own.

---

## CRITICAL — react-helmet-async is inert under React 19

`package.json` pins `react@^19` (19.2.8 installed) with `react-helmet-async@^2.0.5`.
Version 2.0.5 is that library's final release and its peer range stops at React 18.
On this deployment it emits nothing at all.

Verified on the live site — SPA navigation from `/` to `/study-in-canada`:

| | before click | after click |
|---|---|---|
| path | `/` | `/study-in-canada` |
| `document.title` | *(homepage title)* | **unchanged** |
| `link[rel=canonical]` | `https://siddhivinayakoverseas.com/` | **`https://siddhivinayakoverseas.com/`** |

The Canada page, reached by in-app navigation, declares the **homepage** as its canonical.
On a blog URL the head ends up with `document.head.querySelectorAll('[data-rh]').length === 0`
— Helmet strips the shell's pre-marked tags and writes no replacements.

The page components are not at fault: `src/pages/BlogPostPage.tsx:78-91` and
`src/pages/UrgentRequirementDetailPage.tsx:207-221` both declare correct `<Helmet>` blocks
with title, canonical and og tags. The library never applies them.

**Scope, stated precisely:** Googlebot fetches each URL fresh rather than navigating the
SPA, so the 67 prerendered pages still hand Google correct static tags — their risk is to
users and to link previews, not to indexing. The indexing damage is concentrated on the
25 app-shell URLs, where a fresh load also yields the wrong tags.

**Fix.** React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the tree
into `<head>` natively. Delete `react-helmet-async` and `HelmetProvider`
(`src/main.tsx:34`) and render those tags directly in the page components. That removes an
unmaintained dependency rather than swapping in another one. Separately, drop
`/blog/` and `/urgent-requirements/` from `SKIP_PREFIXES` so the raw HTML is correct even
before JS — `seo-routes.mjs` already pulls the slugs from Supabase, so the data path exists.

---

## HIGH — 50 of 92 titles exceed the SERP display width

Google truncates around 60 characters / ~580px. Current state: 50 titles over 60 chars,
34 over 70, longest 87.

| chars | URL |
|---|---|
| 87 | `/post-study-work-visa` |
| 83 | `/services` |
| 80 | `/regional-coverage` |
| 78 | `/study-visa` |
| 77 | `/` |
| 72 | `/study-in-singapore`, `/study-in-australia`, `/work-visa/australia` |

The brand suffix `| Siddhivinayak Overseas` costs 24 characters on every page. Dropping it
from long titles, or shortening to `| Siddhivinayak`, recovers most of the overflow.
Truncation is not a ranking penalty, but it cuts the keyword tail off the clickable line.

---

## MEDIUM — 15 meta descriptions over 160 characters

Longest 235 (`/`), then `/pathways/student-visa-to-work-visa-with-job-and-salary` (233),
`/regional-coverage` (217), `/pathways/switch-countries-with-job-and-salary` (203).
Google rewrites over-length descriptions, so the tail is wasted effort rather than harmful.

---

## MEDIUM — one generic og:image sitewide

90 of 92 pages share `https://siddhivinayakoverseas.com/consultant-office.jpg`;
`/privacy` and `/terms` have none. Every shared link — WhatsApp especially, which matters
for this audience — shows the same office photo regardless of destination. Per-page OG
images for the country and urgent-requirement pages would lift click-through on the
channel this business actually gets shared on.

---

## What is already correct

Worth stating plainly, because these are the things most sites this size get wrong:

- **Image alt text: 150/150 images carry an alt attribute, none empty.** Clean.
- **Heading structure: exactly one `<h1>` per prerendered page, zero exceptions.**
- **Canonicals on the 67 prerendered pages are present and all self-referencing** — no
  cross-canonical mistakes.
- **All 92 URLs return 200.** No redirect chains, no soft 404s in the sitemap.
- **Structured data is valid JSON on every page that has it** — zero parse errors across
  67 pages carrying `Organization`, `LocalBusiness`, `EducationalOrganization`,
  `ProfessionalService`, `WebSite`, `WebPage`, plus `BreadcrumbList` on 57 and `Service`
  on 50.
- **Body content is substantial on the money pages**: `/work-visa/*` median 787 words,
  `/pathways/*` median 778, `/regional-coverage` 3,260. (Corrected: an earlier pass here
  put the sitewide median at 1,047 words, but that counted the nav and footer on every
  page. Measured inside `<main>` with chrome stripped, the sitewide median is 703 and one
  section is genuinely thin — see below.)
- `robots.txt` is permissive and deliberately reasoned, including explicit allows for
  GPTBot, ClaudeBot and Google-Extended.

---

## HIGH — the /guides/ section is thin, and it is the section aimed at the hardest queries

Main-content word counts, measured inside `<main>` with nav, header, footer and forms
stripped. Sitewide median 703; range 90–3,260.

| words | page |
|---|---|
| 90 | `/contact` |
| 169 | `/guides/australia-student-visa-requirements` |
| 178 | `/guides/ielts-requirements-for-study-abroad` |
| 186 | `/guides/post-study-work-visa-comparison` |
| 201 | `/guides/uk-student-visa-requirements` |
| 201 | `/guides/visa-rejection-reasons` |
| 211 | `/guides/japan-ssw-visa-guide` |
| 226 | `/guides/canada-study-visa-documents` |
| 231 | `/services`, `/about` |

All nine `/guides/*` pages sit at a median of **201 words**. These are the pages carrying
`Article` schema and targeting queries like "UK student visa requirements" — queries where
Google's first page is gov.uk plus competitor guides running well over 1,500 words. A
200-word page does not compete there; it is the weakest section on the site and also the
one with the highest ambition.

By contrast `/work-visa/*` (median 787) and `/pathways/*` (median 778) are properly built.

`/contact` at 90 words and `/about` at 231 are a separate problem — `/about` is where a
YMYL business establishes who it is, and 231 words cannot carry that load.

---

## Note on FAQPage (hand off to schema findings)

51 pages carry `FAQPage`. Since Google's August 2023 change, FAQ rich results are shown
only for authoritative government and health sites — a private consultancy will not get
them. The markup is not harmful and still aids entity understanding, but it should not be
counted as a rich-result win.
