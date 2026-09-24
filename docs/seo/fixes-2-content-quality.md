# Content-quality fixes — 23 September 2026

Addresses findings 7, 8 and §3.4 of [`ranking-diagnosis.md`](./ranking-diagnosis.md): keyword stuffing, 35 near-duplicate work-visa country pages, and `/countries/*` shipping unpopulated Supabase fields as indexed content.

Every measurement below was taken from a real `npm run build`, not estimated.

---

## Measured result

| | Before | After |
|---|---|---|
| Keyword phrases printed on public pages | **7,819** across 56 pages | **0** |
| Phrases on `/work-visa` alone | 616 | 0 |
| `/work-visa` HTML | ~150 KB | **123 KB** |
| Sitemap URLs | 121 (all indexed) | **85 indexed**, 31 live but withheld |
| Work-visa country pages indexed | 40 (35 of them 94–97% identical) | **10** (5 with written content + 5 with live vacancies) |
| `/countries/{slug}` pages | 6 indexed, with empty-state text | **0** — 301'd to the page that answers the query |
| Pages 404ing from the `/countries` hub | every card (`/country/` — a route that never existed) | **0** |

`grep -r "No specific work criteria listed" dist/` → no matches in any HTML.
`grep -rl "See all" dist --include=index.html` → 0 files.

---

## 1. Keyword stuffing removed

`KeywordTopics` rendered `KEYWORD_MAP` chips plus a `<details>` expander containing every keyword mapped to the page. On `/work-visa` that was 616 phrases of the form "Belgium work visa agency · Belgium work visa application · Belgium work visa appointment".

**Removed:** `src/components/seo/KeywordTopics.tsx`, `src/content/keyword-map.generated.ts`, the four render sites (`DestinationPage`, `HomePage`, `WorkVisaPage`, `PostStudyWorkVisaPage`), and the `KEYWORD_MAP` emission in `scripts/build-keyword-map.mjs`.

**Kept, deliberately:** `src/content/keywords/*.json` (all 58 files, byte-identical), `src/content/keyword-files.ts`, `src/lib/seo/keyword-suggest.ts` and the admin `KeywordSuggestPanel`. The keyword research is still valuable *as research* — it now feeds the admin suggestion panel when an editor writes an urgent requirement, instead of being dumped on a page.

Curated internal links are provided by `RelatedLinks`, which already existed. `relatedFor()` had a bug — `WORK_COUNTRIES.filter(...).slice(0, 4)` gave all 40 country pages the same four alphabetically-first neighbours (Albania, Armenia, Austria, Belarus). It now prefers same-region countries that have real content, and cross-links the matching `/study-in-{country}` page where one exists.

### A caveat about the keyword data

`keyword-strategy.csv` has **no search-volume column**. 5,857 of its 7,843 rows are "Location" category — country × modifier permutations — and only 95 mention Surat. It tells you how keywords were *mapped*, not what people actually search. Validate demand in Search Console or a keyword tool before committing to a page.

## 2. Country pages: tiered, not deleted

Every country stays live and reachable. What changed is which ones get submitted to Google.

`WorkCountryMeta` now carries `contentTier: 'urgent' | 'regular' | 'thin'` (`src/content/work-countries.ts`). It is **set by hand**, never inferred from a word count, and it drives two things that used to be able to drift apart:

- the page's own robots tag, via `DestinationContent.noindex` → `SeoHead`
- whether the URL appears in `sitemap.xml`

`getPublicRoutes()` now returns `{ path, lastmod, noindex? }`. The prerenderer renders **everything** — dropping a route would make Apache hard-404 it (`public/.htaccess` rule 6) — while `generate-sitemap.mjs` lists only routes without `noindex`. The 40-slug list is no longer duplicated between `work-countries.ts` and `seo-routes.mjs`; the build script reads it from the content file and throws if it parses fewer than 40.

**A thin country with live vacancies is still indexed.** Real listings are content unique to that country, so the rule is `tier === 'thin' && no active vacancies`. `WorkVisaCountryPage` and `seo-routes.mjs` apply the same rule, so the robots tag and the sitemap always agree. Five countries qualified on this build (Belarus, Israel, Italy, Malta, New Zealand) and are indexed without anyone editing a tier.

## 3. Live vacancies on country pages

New `src/components/seo/CountryVacancies.tsx`, rendered on work-visa country pages. It reads active rows from `urgent_requirements` and shows role, vacancy count, city, salary, working hours and contract type, each linking to its `/urgent-requirements/{slug}` page.

Everything shown is admin-entered operational data. A field that is empty in the database is not rendered — nothing is generated, inferred or padded. The section states one of three things honestly, so a country with no openings never reads as though it has some:

- **openings listed** — live roles plus an eligibility-check CTA
- **none listed** — says so, and invites the visitor to register a profile
- *(loading)* — renders nothing, so no skeleton is baked into the prerendered HTML

Verified on this build: `/work-visa/malta` shows "Current Malta openings — Malta Hospitality Jobs: 40 Urgent Vacancies, Vacancies 40, Location Valletta"; `/work-visa/albania` shows the honest empty state.

This also gives `/urgent-requirements/*` inbound internal links from a topically relevant page, which they did not have.

## 4. Invented processing times removed

`buildWorkCountryContent()` set `processingTime` from a hardcoded ternary: `slug === 'uk' ? 'Approximately 8 weeks' : 'Approximately 5–6 months'` — one unsourced figure asserted on 39 countries, and repeated inside an FAQ answer. `work-destinations.ts` did the same for the five detailed pages.

Both are removed. The FAQ now says the figure varies by route and offers to check the current official processing time for the applicant's case. Set `processingTime` on an individual page only once it has been checked against the government source, with the source in a comment beside it.

## 5. `/countries/{slug}` retired

These pages had no inbound internal link anywhere on the site, duplicated `/study-in-*` and `/work-visa/*` for the same queries, and rendered unpopulated Supabase fields as visible copy ("No specific work criteria listed.", a stray `0` from an `&&` numeric-falsy guard, and untitled program cards reading `program.title` from a view whose column is `name`).

- 301s added to `public/.htaccess`: `/countries/{canada,australia,germany,new-zealand}` → `/study-in-$1`, `/countries/japan` → `/work-visa/japan`, `/countries/united-arab-emirates` → `/study-in-dubai`, and anything else under `/countries/` → the hub.
- Routes and pages removed: `CountryPage.tsx`, `ProgramPage.tsx`, and the orphaned `/countries/:slug/programs/:programSlug` route.
- **The `/countries` hub stays and is now a real directory.** Its cards linked to `/country/{slug}` — singular, a route that has never existed — so every one 404'd. They now link to the actual work-visa and study pages: 51 working destination links, all verified to resolve.

Retiring these pages disposed of the `&&` and `program.title` bugs without separate fixes.

## 6. Smaller fixes

- An unknown `/work-visa/{slug}` returned `<Navigate to="/work-visa">` — a 200 that reads as a soft 404. It now renders the noindex 404, as `PathwayPage` already did.
- The "Typical process time" band rendered *above* `<SeoHead>` and `<SiteHeader>`, outside `<main>`. Moved inside, below the hero.
- Deleted 5 unreferenced wrapper files (`work-visa/{Australia,Canada,Germany,Japan,UK}WorkVisaPage.tsx`); their content is reached through the `DETAILED` map.
- Deleted the stale root `.htaccess` (an old SPA-fallback config; the deployed file is `public/.htaccess`).
- `PUBLIC_SEO_ROUTES` in `src/lib/seo/routes.ts` looked dead but is **not** — `build-keyword-map.mjs` regex-scans that file for `path: '...'`. Documented rather than deleted.

---

## What this did *not* fix

**The thin pages are still near-duplicates.** Similarity between them fell from 0.94–0.97 to 0.78–0.96, which is not a fix — they are simply out of the index now, so Google no longer judges them. Only writing real content fixes that.

Some commercially significant countries are currently noindexed because they have neither written content nor live vacancies — **United States, Ireland, Poland, Portugal, Singapore, Spain, Italy, France, Netherlands** among them. If any of these matter for lead generation, they should be first in the content backlog.

### Content backlog

| Tier | Count | Countries |
|---|---:|---|
| `urgent` | 1 | Australia |
| `regular` | 4 | Canada, Germany, Japan, United Kingdom |
| `thin` | 35 | Africa, Albania, Armenia, Austria, Azerbaijan, Belarus, Croatia, Denmark, Finland, France, Gulf, Hungary, Ireland, Israel, Italy, Kazakhstan, Malaysia, Maldives, Malta, Moldova, Netherlands, New Zealand, Norway, Poland, Portugal, Qatar, Romania, Russia, Saudi Arabia, Singapore, Slovakia, Spain, Sweden, Switzerland, United States |

**To promote a country:** write genuinely country-specific content, then change its `contentTier` to `regular` in `src/content/work-countries.ts`. Nothing else needs touching — the robots tag and the sitemap follow automatically on the next build.

**To make that worth doing,** `WorkCountryMeta` needs per-country `sections`, `faqs` and `processingTime`. Today it carries six fields, and the template generates identical `eligibility`, `documents`, `processSteps`, section 4 and FAQs 6–7 for every country — so adding prose to `summary` alone will not move the duplication meaningfully.

**Do not** promote a country by padding it with generic prose, and do not fill these fields with unverified visa facts. Eligibility rules, salary bands, government fees, document lists and processing times come from official sources, cited beside the content for review.
