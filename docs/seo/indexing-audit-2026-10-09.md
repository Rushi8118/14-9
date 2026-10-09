# Non-indexing audit — Search Console + repository

**Date:** 9 October 2026
**Site:** https://siddhivinayakoverseas.com
**Search Console property:** `sc-domain:siddhivinayakoverseas.com` (permission: siteOwner).
The URL-prefix property `https://siddhivinayakoverseas.com/` also exists and is also owned;
every figure below comes from the domain property, which covers both hosts.
**Repository:** this repo at `21bbe8d`, working tree clean at the start of the audit.
**Live build on the server:** the 2026-10-06 build. Verified, not assumed — `robots.txt`,
`sitemap.xml`, `sitemap-pages.xml` and `sitemap-content.xml` fetched from production are
byte-identical to `dist/`.

Every number here came from a Search Console API response, an HTTP request I made, a
headless-Chrome render I ran, or a file in this repo. Where something could not be
retrieved, it says so rather than estimating.

---

## 1. Bottom line

**The site's indexing is in good shape, and the one real defect was not a crawl problem —
it was nine fabricated job adverts reachable at indexable URLs.**

All 130 URLs in the sitemap return 200, are self-canonical, carry a single `<title>`, a
single `<h1>`, a unique description and JSON-LD. Every redirect rule in `.htaccess` is live
and correct. `robots.txt` blocks nothing that should be crawled. There is no `noindex` on a
page that should be indexed, no duplicate canonical, no redirect loop, no 5xx, and no
sitemap error. Search Console reports the sitemap as **Valid, 0 errors, 0 warnings**.

What was wrong:

1. **Nine orphan URLs served invented vacancies as indexable pages.** `useUrgentRequirements.ts`
   carried a ten-row hardcoded placeholder array with invented employers, salaries and
   vacancy counts. The by-slug lookup resolved *any unknown slug* against it, so nine slugs
   with no database row answered 200 with ~800 words and `index, follow`. Google had found
   and indexed one of them. **Fixed in code.**
2. **A filled vacancy stayed indexable.** The detail page set no `noindex` when an opening
   was past its expiry. **Fixed in code.**
3. **A seed file named `RUN_THIS_NOW.sql` would insert those nine invented vacancies into
   the database**, where the next build would submit them for indexing deliberately.
   **Inserts commented out; schema steps left runnable.**

And the finding that is not a defect but matters more than any of them:

4. **30 `/work-visa/*` country pages are deliberately `noindex`, and they were earning
   about a quarter of the site's organic clicks.** This is working exactly as designed. It
   needs your decision, not a code change — see §6.

---

## 2. What Search Console can and cannot tell us

**Stated limitation.** The Search Console API exposes no Page Indexing (Index Coverage)
report. There is no endpoint that returns the URL lists behind "Crawled – currently not
indexed", "Discovered – currently not indexed", "Duplicate without user-selected canonical"
or any other coverage category, and no endpoint that returns their counts. Those lists exist
only in the Search Console web UI.

So the per-category counts the brief asks for **cannot be retrieved through this
integration**. I did not estimate them. What I used instead:

| Source | What it gives | Used for |
|---|---|---|
| Search Analytics API (page dimension) | every URL Google served an impression for | finding indexed URLs outside the sitemap |
| URL Inspection API | per-URL `coverageState`, `robotsTxtState`, `indexingState`, `pageFetchState`, `googleCanonical` vs `userCanonical`, `lastCrawlTime` | the real coverage verdict for 14 specific URLs |
| Sitemaps API | submitted count, errors, warnings, last download | sitemap health |
| Live HTTP + headless Chrome | status, headers, redirect targets, rendered DOM | everything the API cannot answer |

URL Inspection is also rate-limited and metered, so it was spent on the 14 URLs where the
answer changed a conclusion, not sprayed across 130.

`batch_url_inspection` returned a server error at 10 and at 5 URLs per call and succeeded at
3; the 10-URL batch in the brief had to be split. Not a data problem, just a note.

---

## 3. Traffic baseline (Search Analytics API, web, `data_state=all`)

Stable window, 3 trailing days excluded.

| Window | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|
| 90 days to 2026-10-06 | 324 | 11,677 | 2.77% | 14.7 |
| Previous 90 days | 54 | 254 | 21.26% | 8.4 |
| 28 days to 2026-10-06 | 238 | 8,417 | 2.83% | 12.0 |
| Previous 28 days | 48 | 1,880 | 2.55% | 22.3 |
| Year on year | 0 | 0 | — | — |

The site is growing from a near-zero base (first impressions ~April 2026), so the earlier
window's 21% CTR is a small-numbers artefact, not a decline. Impressions step up sharply
from 2026-09-19 onward.

---

## 4. URL inventory

| Set | Count | Source |
|---|---|---|
| Public routes declared in the repo | 169 | `getPublicRoutes()` |
| Routes prerendered in the last build | 170 | `dist/prerender-manifest.json` (169 + `/404`) |
| URLs in `sitemap.xml` | 130 | 105 in `sitemap-pages.xml` + 25 in `sitemap-content.xml` |
| Withheld from the sitemap | 39 | all for "page declares noindex" |
| Distinct URLs with ≥1 impression in 90 days | 139 | Search Analytics API |

130 submitted = 169 declared − 39 noindex. The sitemap and the build agree exactly; there is
no route that should be in the sitemap and is not.

### Crawl of all 130 submitted URLs

Every one: HTTP 200, exactly one `<link rel="canonical">` pointing at itself, exactly one
`<title>`, exactly one `<h1>`, a `<meta name="robots">` with `index, follow`, a meta
description, and at least one JSON-LD block. **Zero** duplicate titles and **zero** duplicate
descriptions across all 130. None was served from the app shell. Main-content word counts
ranged 362 – 3,265 (median 1,289).

---

## 5. Confirmed defects, with evidence

### 5.1 Nine orphan URLs served invented vacancies as indexable pages — FIXED

**Root cause** — `src/hooks/useUrgentRequirements.ts`, `useUrgentRequirementBySlug`:

```ts
if (data) { setRequirement(data as UrgentRequirement) }
else {
  const local = getInitialRequirements()          // → FALLBACK_URGENT_REQUIREMENTS
  const found = local.find(r => r.slug === slug || r.id === slug)
  setRequirement(found || null)                   // → serves a hardcoded placeholder
}
```

`FALLBACK_URGENT_REQUIREMENTS` held ten placeholder openings. Of their ten slugs, only
`uk-nhs-healthcare-assistant-urgent` exists in the database (14 active rows, read via the
REST API). The other nine existed **only in the JavaScript bundle**, and the branch above
resolved them, so each answered a fully indexable page.

**Evidence — rendered as Googlebot (headless Chrome, mobile UA), production, 2026-10-09.**
All ten returned `index, follow` with a self-canonical and 762–820 words:

| Slug | In DB? | Robots | Words |
|---|---|---|---|
| `japan-ssw-caregiver-urgent` | no | `index, follow` | 786 |
| `germany-chancenkarte-it-engineers-urgent` | no | `index, follow` | 786 |
| `croatia-mep-construction-supervisors-urgent` | no | `index, follow` | 773 |
| `poland-manufacturing-workers-urgent` | no | `index, follow` | 762 |
| `dubai-hospitality-restaurant-staff-urgent` | no | `index, follow` | 779 |
| `canada-agriculture-lmia-workers-urgent` | no | `index, follow` | 808 |
| `ireland-it-critical-skills-urgent` | no | `index, follow` | 814 |
| `romania-welders-pipefitters-urgent` | no | `index, follow` | 814 |
| `netherlands-warehouse-logistics-urgent` | no | `index, follow` | 820 |
| `uk-nhs-healthcare-assistant-urgent` | **yes** | `index, follow` | 791 |

The content is specific and invented. `ireland-it-critical-skills-urgent` claimed "18 IT
Professionals", "€42,000 - €65,000 / year (~₹38L - ₹58L)", "Dublin-based tech companies are
hiring", and a "3 months approx" total timeline. Every row carried `status: 'active'` and an
`expires_at` computed as *now + 35 days*, so none could ever expire.

**Evidence — Search Console URL Inspection, 2026-10-09:**

| URL | coverageState | Detail |
|---|---|---|
| `/urgent-requirements/ireland-it-critical-skills-urgent` | **Submitted and indexed** | verdict PASS; last crawled 2026-09-01 (MOBILE); `googleCanonical` = itself; **`userCanonical` = `https://siddhivinayakoverseas.com/`** |
| the other 8 slugs | **URL is unknown to Google** | never discovered |

So the realised exposure was **one** indexed fabricated job advert, with eight more one
crawl away. Search Analytics confirms it was being served: 5 impressions at average position
12.6 over the 90 days to 2026-10-06.

The `userCanonical` of `/` on that row is a useful fossil: at the 2026-09-01 crawl the URL
was still served from `index.html`, which carries the homepage canonical. That is precisely
the failure `app-shell.html` was introduced to stop, and it is now fixed — `dist/app-shell.html`
carries no canonical, no title and no robots tag, only `<meta name="x-app-shell" content="1">`.

**Why it mattered beyond indexing.** `CLAUDE.md` opens with "Never invent a business fact.
Not prices, fees, timelines … salaries". A dormant guard, `isFallbackRequirement`, existed
for exactly this hazard and was applied in `CountryVacancies.tsx` and `WorkVisaCountryPage.tsx`
— but never on the by-slug path, which is the one that produced pages.

A second live hazard from the same array: on any Supabase error, `usePublicUrgentRequirements`
replaced the 14 real openings with these 10 invented ones *and wrote them to `localStorage`*.

**Fix applied** — `src/hooks/useUrgentRequirements.ts` (−387 lines):

- Deleted `FALLBACK_URGENT_REQUIREMENTS` and the dead `FALLBACK_URGENT_REQUIREMENTS_OLD`.
- `getInitialRequirements()` → `getCachedRequirements()`: returns `[]` when there is no
  cache instead of the placeholder array, and **filters out any row whose `id` starts with
  `fallback-`**. That last part matters: a browser that visited before this change may still
  hold placeholder rows in `localStorage`, because the old failure path wrote them there.
  `isFallbackRequirement` is kept and exported for this, and for its two existing callers.
- By-slug lookup: a successful query that finds no row now sets `null`, which renders the
  page's existing `noindex` "Requirement Not Found" branch. The `catch` branch — a transport
  failure, not a verdict on the slug — may still serve a *real* opening from this browser's
  cache, and sets an error.
- `usePublicUrgentRequirements` and `useAdminUrgentRequirements` no longer substitute
  placeholders on failure; they serve the cache or nothing, and surface the error.

**Verified** against the new build, rendered in headless Chrome (`vite preview`, 2026-10-09):

```
NOINDEX | /urgent-requirements/ireland-it-critical-skills-urgent
          title="Requirement Not Found | Siddhivinayak Overseas"  robots="noindex, follow"
NOINDEX | /urgent-requirements/japan-ssw-caregiver-urgent          → "Requirement Not Found"
NOINDEX | /urgent-requirements/netherlands-warehouse-logistics-urgent → "Requirement Not Found"
NOINDEX | /urgent-requirements/canada-agriculture-lmia-workers-urgent → "Requirement Not Found"
index   | /urgent-requirements/uk-nhs-healthcare-assistant-urgent  (real row, unchanged)
index   | /urgent-requirements/hong-kong-restaurant-jobs-indian-workers (real row, unchanged)
index   | /urgent-requirements  → 28 links, all to the 14 real openings
```

The real openings are untouched; only the invented ones changed.

### 5.2 An expired opening stayed indexable — FIXED

`UrgentRequirementDetailPage.tsx` computed `isClosed` (line 167) for the UI badge but passed
no `noindex` to `SeoHead` on the success branch. A row stays `status = 'active'` until
someone closes it, so an opening past its `expires_at` went on answering 200 with
`index, follow` **and JobPosting schema** for a vacancy that had ended. The listing page
already filters on that same expiry check; the detail page did not.

**Fix:** `noindex={isClosed}` on the success-branch `SeoHead`, with a comment explaining why.
The page still renders, so a visitor following an old link still sees why it closed.

### 5.3 `RUN_THIS_NOW.sql` would publish the invented vacancies for real — NEUTRALISED

`supabase/RUN_THIS_NOW.sql` is headed "URGENT: RUN THIS IMMEDIATELY TO FIX EVERYTHING" and
its own step list includes "3. Add all 10 fallback requirements to database". Steps 1–7
(table, 5 indexes, RLS, 2 policies, trigger, grants) are idempotent and already applied in
production. **Step 8 is 10 `INSERT`s of the fabricated openings with `status = 'active'`.**
Running it would move them from "orphan page Google mostly hasn't found" to "row in the
database, in `sitemap-content.xml` at the next build, submitted for indexing deliberately".
The file is referenced from no doc, script or migration.

**Action taken:** step 8 commented out behind a 20-line explanation; steps 1–7 left
runnable, verified by grep (0 live `INSERT`, all 13 schema statements intact). The file was
not deleted — that is your call, §9.

### 5.4 A comment pointed at the wrong mechanism — FIXED

`src/content/regional-pages.ts` said the nine Gujarat city pages' `noindex` "keeps them out
of sitemap.xml automatically (see `scripts/seo-routes.mjs`)". It does keep them out, but not
by that route: `getPublicRoutes()` reports all nine as **indexable**. They are excluded
because `scripts/prerender.mjs:488` reads the robots tag the page actually rendered into
`dist/prerender-manifest.json`, and `generate-sitemap.mjs:105` drops any entry marked
noindex. Outcome correct, mechanism misdescribed — and in a codebase where "build order is
load-bearing", a comment that names the wrong file is how someone later "simplifies"
`generate-sitemap.mjs` to read the route list and silently publishes nine doorway pages.
Comment corrected to describe the real chain and to warn that the route list disagrees.

---

## 6. Needs your decision: 30 `noindex` work-visa pages carrying ~25% of clicks

**Not a defect. Working as designed. The biggest number in this audit.**

`src/content/work-countries.ts` grades each of 40 work-visa countries `urgent`, `regular` or
`thin`. A `thin` country is `noindex` unless it has live vacancies. 5 are `regular`/`urgent`,
5 thin-but-hiring are indexed, and **30 are `noindex`**. Commit `225c8b1`, 2026-09-24,
applied this — 15 days ago.

Those 30 pages accounted for **~80 clicks and ~3,468 impressions** in the 90 days to
2026-10-06: **25% of the site's clicks and 30% of its impressions.** The strongest:

| Page | Clicks | Impressions | Avg position |
|---|---|---|---|
| `/work-visa/moldova` | 17 | 327 | 5.4 |
| `/work-visa/romania` | 9 | 303 | 8.0 |
| `/work-visa/azerbaijan` | 8 | 284 | 6.2 |
| `/work-visa/russia` | 6 | 393 | 7.7 |
| `/work-visa/ireland` (both slash forms) | 10 | 151 | 8.5 / 9.7 |
| `/work-visa/netherlands` | 5 | 164 | 12.6 |
| `/work-visa/maldives` | 4 | 272 | 7.7 |
| `/work-visa/qatar` | 4 | 275 | 8.0 |
| `/work-visa/singapore` | 4 | 241 | 15.7 |

They still earned clicks in the last 7 days of the window (moldova 3, azerbaijan 3,
africa 2, ireland 2), because Google had not finished recrawling. It has now:

> URL Inspection, `/work-visa/moldova`, 2026-10-09 — `coverageState`:
> **"Excluded by 'noindex' tag"**, `indexingState`: `BLOCKED_BY_META_TAG`,
> last crawled 2026-10-01.

So this traffic is in confirmed decay, not hypothetical decay.

The decision is genuinely yours and I have not pre-empted it. The reasoning behind the gate
is sound and documented — 35 of these pages were 94–97% identical, and the named five still
sit at 0.69–0.77 pairwise similarity. `CLAUDE.md` is explicit that padding them with
generic prose is not the fix. But the demand signal is real and the positions (5–8) are
good. Flipping 30 pages to indexable is a mass `noindex` change, so it needs your approval
either way.

Three options, in the order I'd rank them:

1. **Promote the top 6–10 by demand, with real country facts first.** Moldova, Romania,
   Azerbaijan, Russia, Qatar, Maldives, Singapore, Netherlands, Ireland. Each needs genuine,
   country-specific substance — the actual permit name, the real official fee and processing
   time with its government source, the documents that country specifically requires. Then
   set `contentTier: 'regular'` per country. Nothing else needs changing: the next build
   adds them to the sitemap automatically. This converts measured demand into indexable
   pages without reintroducing the doorway pattern.
2. **Leave the gate as it is** and accept that ~80 clicks/90 days decays to zero. Defensible,
   and the honest choice if nobody can source real per-country facts soon.
3. **Flip all 30 back to indexable now.** I'd advise against it: it restores the 94–97%
   duplicate cluster the gate was built to remove.

I can do the `contentTier` edits for option 1 in minutes. What I cannot do is supply the
country facts — fees, processing times and official requirements are exactly what `CLAUDE.md`
forbids inventing, and they need a government source per country.

---

## 7. Legitimate exclusions — verified correct, no action

Each of these looks like a problem in a coverage report and is not one.

| Pattern | Live behaviour (tested 2026-10-09) | Verdict |
|---|---|---|
| `www.siddhivinayakoverseas.com/*` | 301 → non-www, one hop, slash dropped in the same hop | correct |
| Trailing slash (`/contact/`, `/work-visa/germany/`, `/post-study-work-visa/`) | 301 → slash-less | correct |
| `/post-study-work-visa/` specifically | URL Inspection: **"Page with redirect"**, `googleCanonical` = slash-less form | consolidated; its 1,366 impressions were historical |
| `/post-study-work-visa/{country}` | 301 → `/study-in-{country}` | correct |
| `/countries/*` (incl. `.../programs/...`) | 301 → `/countries`, or to the stronger page for canada/australia/germany/new-zealand/japan/uae | correct |
| `/contact?country=…` (14 variants with impressions) | 200, canonical → `/contact` | correct; no action |
| `/contact-us`, `/signup` | 301 → `/contact`, `/register` | correct |
| `/login`, `/register`, `/dashboard`, `/admin`, `/403` | 200 + `X-Robots-Tag: noindex, follow` | correct — and deliberately *not* robots-blocked, so the header can be read |
| `/app-shell.html` | 404 | correct |
| `/services/work-permit` and any unknown path | 404 via `ErrorDocument` → `/404/index.html` | correct, not a soft 404 |
| `/404` | 200 + `noindex, follow` | acceptable |
| `/index.html` | 200, canonical → `/` | acceptable |
| 9 Gujarat city pages | `noindex`; `/visa-consultants-in-ahmedabad` → **"URL is unknown to Google"** | correct, documented (0.877–0.889 similarity) |
| 30 thin work-visa pages | `noindex` | by design — §6 |

`robots.txt`: live file identical to `public/robots.txt`, `Allow: /` for every agent,
sitemap declared, nothing disallowed. Search Console: sitemap **Valid**, 130 submitted,
0 errors, 0 warnings, last downloaded 2026-10-06.

---

## 8. Build and test results

```
npx tsc --noEmit                     exit 0, no errors
node --test "scripts/**/*.test.mjs"  44 pass, 0 fail
npm run build                        exit 0
  vite build → prerender → generate-sitemap → generate-llms-txt → validate-seo
  Prerender complete: 170/170 routes written
  sitemap.xml: sitemap-pages.xml (105 URLs) + sitemap-content.xml (25 URLs) = 130
  39 URL(s) withheld — every one "page declares noindex"
  llms.txt: 130 pages
  validate-seo: Checked 170 generated pages. No issues found.
```

The sitemap is **unchanged at 130 URLs**, which is the expected result: the fabricated pages
were never in it.

`node --test "workers/**/test/*.test.mjs"` still fails 1 of 33 with
`ERR_MODULE_NOT_FOUND: wrangler`. Pre-existing, documented in `CLAUDE.md`, unrelated to
these changes — confirmed by running it before and after.

`npm run lint` was not run: `package.json` defines it as `eslint .`, but eslint is not
installed and there is no config.

### Files changed

| File | Change |
|---|---|
| `src/hooks/useUrgentRequirements.ts` | −387 lines. Placeholder arrays deleted; cache-only initial state that filters stale `fallback-` rows; by-slug miss → `null`; failure paths no longer fabricate |
| `src/pages/UrgentRequirementDetailPage.tsx` | +10. `noindex={isClosed}` on the success-branch `SeoHead`, with rationale |
| `supabase/RUN_THIS_NOW.sql` | Step 8's 10 inserts commented out behind an explanation; steps 1–7 untouched |
| `src/content/regional-pages.ts` | Comment corrected to name the real noindex→sitemap mechanism |

Nothing was committed, pushed or deployed.

---

## 9. Needs you

1. **Deploy.** Nothing in §5 reaches Google until `dist/` is uploaded. There is no CI and no
   deployment code in this repo — by design, `scripts/publish.mjs` has a documented seam and
   `CLAUDE.md` says not to add deployment code until credentials are explicitly provided. The
   build is ready in `dist/`; `npm run publish` prints what to upload.
2. **§6 — the 30 `noindex` work-visa pages.** Pick option 1, 2 or 3.
3. **`RUN_THIS_NOW.sql`** — delete it, or keep it as a schema reference with step 8 disabled?
   It is referenced nowhere. I left it in place.
4. **Request indexing** for `/urgent-requirements/ireland-it-critical-skills-urgent` after
   deploy, so Google recrawls and drops it sooner. This integration is **read-only** — it has
   no Indexing API or "Request indexing" tool — so you need to do it in the Search Console UI.
   The repo has `npm run seo:ping` (IndexNow) which reaches Bing, not Google.
5. **JobPosting schema warnings.** URL Inspection on
   `/urgent-requirements/malta-hospitality-jobs-40-urgent-vacancies` returns rich-results
   verdict PASS with three warnings: missing `streetAddress`, `addressRegion`, `postalCode`
   on `jobLocation`. Fixing these needs the employers' real addresses. I have not invented
   them. Supply any you have and I will add them; otherwise the warnings are harmless.

---

## 10. Remaining issues, prioritised

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | 30 `noindex` work-visa pages = ~25% of clicks, decaying | High (business) | **Your decision — §6** |
| 2 | Fabricated vacancy pages indexable | High | **Fixed, awaiting deploy** |
| 3 | Expired opening stayed indexable | Medium | **Fixed, awaiting deploy** |
| 4 | `RUN_THIS_NOW.sql` would publish them for real | Medium | **Neutralised**; deletion is your call |
| 5 | `/blog/*` and `/urgent-requirements/*` answer **200** for a slug that does not exist | Medium | **Mitigated, not fixed** — see below |
| 6 | Publishing does not reach the sitemap without a build + upload | Medium | Known; `docs/dynamic-sitemap.md` |
| 7 | 3 thin guides (287/335/344 words) | Low | Open, pre-existing |
| 8 | 4 near-duplicate NE-India state pages (~0.80) | Low | Open, pre-existing |
| 9 | JobPosting `jobLocation` warnings | Low | Needs real addresses |
| 10 | `npm run lint` is a broken script | Trivial | Open |

**On #5.** Apache cannot know which slugs exist, so every `/blog/*` and
`/urgent-requirements/*` URL returns 200 and falls through to `app-shell.html`. Raw HTML is a
6,924-byte shell with no title, canonical or robots tag — which is what a soft 404 looks
like. Under JS rendering, which is how Google indexes this site, it resolves correctly:
verified in headless Chrome that a nonexistent slug renders `noindex, follow` with
"Post Not Found" / "Requirement Not Found". So the directive is right and only the **status
code** is wrong. Returning a real 404 needs something executing per request; `workers/seo-head/`
exists for this and is not deployed. Worth doing, but it is an infrastructure change, not a
code fix, and it is now the only soft-404 surface left — my change closed the one that was
serving 800 words of invented content under it.

**Do not read any of this as "Google has indexed the fix."** The code is correct and the
build is verified, but nothing is live until `dist/` is uploaded, and after that Google
decides and takes its own time. Re-run this audit two to three weeks after deploy and
compare against the figures in §3.
