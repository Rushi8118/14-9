# SEO Documentation — Siddhivinayak Overseas

| File | What it is |
|---|---|
| [`technical-audit.md`](./technical-audit.md) | Source-verified audit of this repo: 16 findings, prioritised Critical → Low, each with problem, why it matters, fix, steps, owner, difficulty and how to measure. **Start here.** |
| [`content-plan.md`](./content-plan.md) | Site architecture, page-by-page blueprints (title, meta, H1, H2/H3, words, schema, CTA), and a 12-month publishing calendar. |
| [`growth-plan.md`](./growth-plan.md) | Local SEO, ethical link building, conversion optimisation, measurement stack, monthly report template, 90-day sequence. |
| [`keyword-strategy.md`](./keyword-strategy.md) | Keyword strategy narrative: top 30, page mapping, FAQ, warning list. |
| [`keyword-plan.csv`](./keyword-plan.csv) | 7,843 keywords × 12 columns: intent, target country/city, page, priority, competition estimate, title, meta, slug, internal links, content requirements. |
| [`keyword-strategy.csv`](./keyword-strategy.csv) | Same keywords in the earlier column shape (origin/destination/service oriented). |
| [`keyword-coverage.md`](./keyword-coverage.md) | Generated: which live page each of the 7,843 keywords is assigned to, and which destinations still have no page. Refresh with `npm run keywords`. |

## Status — verified 28 September 2026

The three items previously listed here as "what matters most" have all been
resolved. They are kept below with their current state so nobody acts on the
old version.

| Was listed as critical | Current state |
|---|---|
| "No GA4 tag is installed." | **Fixed.** `G-MDVF551H1C` loads inline from `index.html` with `send_page_view:false`; React Router sends `page_view` per navigation. Verified live. |
| "A 501 KB image loads at highest priority on the homepage." | **Fixed.** Hero is a `<picture>` with AVIF/WebP at 768 px; the preloaded AVIF is 57 KB. See `fixes-applied.md` C2. |
| "`/post-study-work-visa/*` is 301-redirected." | **No longer true.** `/post-study-work-visa` returns 200, is a route in `seo-routes.mjs`, and is in the sitemap. |

## What matters most now

1. **295 near-duplicate page pairs.** 35 of 40 work-visa country pages are one
   template with the country name swapped. This is the reason the site does not
   rank, and it suppresses the whole domain rather than just those pages. Run
   `npm run check:similarity` for the current list. This is the top priority.
2. **19 thin pages (<350 words).** Every `/guides/*` page plus `/about`,
   `/services` and `/contact`. These are core commercial pages, not filler.
3. **`tsc --noEmit` does not run.** It exhausts memory (exit 134) even with a
   6 GB heap, on a clean tree. The project currently has no working typecheck.

## Tooling

| Command | What it does |
|---|---|
| `npm run check:similarity` | Lists near-duplicate page pairs and thin pages. `-- --fail` exits non-zero; not yet in the build because 295 breaches would block it. |
| `npm run content:gen -- --route=<route>` | Generates page content, scores it against every existing page, regenerates on collision, and **rejects** rather than publishing a near-duplicate. |
| `npm run keywords:audit` | Shows where each page's target keywords actually appear, and flags over-use. Writes nothing to any page. |
| `npm run keywords:refresh` | Snapshots Google autocomplete per destination and diffs against the last run. |
| `npm run keywords` | Rebuilds the keyword→page map from the CSVs. |

**On the keyword CSVs:** the 7,843 phrases are research input, not page content.
An earlier version printed them across 56 pages, which is keyword stuffing under
Google's spam policies, and it was reverted in 225c8b1. Do not reintroduce it.
See the warning list in `keyword-strategy.md` before planning any page built from
a location × country × service matrix.

## Read before acting

The audit separates **VERIFIED** (read in the code), **ASSUMPTION** (inference, with what would confirm it) and **NEEDS DATA** (requires Search Console or live measurement). No search volumes, competitor names, rankings or review counts have been invented anywhere in these documents.
