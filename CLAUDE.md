# Siddhivinayak Overseas — siddhivinayakoverseas.com

Overseas education, study visa and work visa consultancy based in Surat, Gujarat. Serves
India, Nepal, Bangladesh, Pakistan and Sri Lanka.

Vite 6 + React 19 + TypeScript + React Router 7 SPA, Supabase backend (Postgres, RLS, Edge
Functions), Tailwind. Static Apache hosting, deployed by **manual upload** — no CI, no
deployment automation.

## The rule that matters most

**Never invent a business fact.** Not prices, fees, timelines, proof-of-funds amounts,
licences, registrations, opening hours, authors, reviewers, reviews, ratings, awards,
partnerships, salaries, approval or success rates, or official government requirements.

Where a value is missing, write a clearly marked placeholder and ask. Prefer omitting a
schema property over defaulting it — two fabricated defaults have already been found and
removed here (`articleSchema` hardcoded `datePublished: '2026-08-25'`; `country-seo.ts`
interpolated "high visa success" into meta descriptions whenever the admin `success_rate`
field was empty).

**Never write guaranteed-outcome language** — guaranteed visa, job or salary, 100% approval,
assured placement. Visa decisions rest with the immigration authority; employment terms rest
with the employer.

This is a YMYL site in a sector regulated in India under the Emigration Act. A fabricated
approval rate is both an E-E-A-T problem and a potential regulatory one.

Note: the codebase contains a lot of *correct anti-guarantee copy* ("No fake job
guarantees", "Can you guarantee a job? No."). That is not a violation — leave it.

## Build order is load-bearing

```
vite build → prerender → generate-sitemap → validate-seo
```

Not interchangeable:

- **`/` is prerendered LAST.** `dist/index.html` is the SPA fallback `vite preview` serves
  for every route not yet written, so rendering the homepage first leaves stale homepage
  content in the DOM for every later route and the readiness gate passes against it.
- **`generate-sitemap.mjs` reads only `dist/prerender-manifest.json`.** A URL reaches
  `sitemap.xml` only if it was published, prerendered, verified, self-canonical and not
  `noindex`. Generating it from the intended route list cannot tell a rendered page from a
  failed one — that is how 25 URLs came to serve an empty shell.
- **`validate-seo.mjs` reads the generated files in `dist/`, never a browser DOM.** The two
  differ. The site looked correct in DevTools while shipping duplicate canonicals and
  invisible FAQ answers.

## Metadata

`src/components/seo/SeoHead.tsx` is the only way a page sets metadata, using React 19's
native document metadata hoisting. `react-helmet-async` was removed — it is inert under
React 19 and emitted nothing.

`index.html` deliberately carries **no** canonical, description or Open Graph tags. React
*appends* hoisted tags rather than replacing matching static ones, so anything left there
gives every page two of it. It keeps one `<title>` as the pre-hydration and app-shell
fallback; the prerenderer strips that from written output.

Do not write markup-looking text into `index.html` comments — they are copied into every
prerendered page, and a comment mentioning `<title>` made every page parse as having two.

## Logs: local vs live

Every log row carries an `environment` column — `production` (the live site),
`local` (localhost, a LAN IP, `*.localhost` / `*.local` / `*.test`) or `build` (the
headless browser `scripts/prerender.mjs` drives during `npm run build`, which loads every
route for real and so used to write a page view per page per build).

`src/lib/runtime-env.ts` decides the value and every writer stamps it
(`interactions`, `admin_access_logs`, `activity_logs`, `audit_logs`). A BEFORE INSERT
trigger then re-derives it from the page URL the row already stores, so a stale client
cannot label localhost traffic as production.

Readers default to `production`: the Access Logs, Activity Logs and Audit Logs pages each
have a **Live site / Local & test / All records** switch (URL `?env=local|all` on Access
Logs), and the dashboard figures plus `get_dashboard_analytics()` count production only.
Development activity is kept, never discarded — it is just not counted as real traffic.

Both migrations are applied **by hand**, so the client is written to survive their absence:
the first insert or read the database rejects for a missing column clears a flag and
everything falls back to unseparated logging rather than failing.

## Publishing

Publishing a blog post or urgent requirement in the admin panel makes it reachable for
visitors immediately (Apache serves `app-shell.html`, React fetches from Supabase).

`sitemap.xml` is an index over `sitemap-pages.xml` and `sitemap-content.xml`. The design is
that the content half is served per request from the database by the `sitemap` Edge
Function, so publishing reaches the sitemap in ~60 seconds with no build and no upload.
**That is not what production does.** Verified 2026-10-08: the Edge Function is not
deployed (`/functions/v1/sitemap` → `NOT_FOUND`; no function in the project is deployed),
and `scripts/generate-sitemap.mjs` writes a static `sitemap-content.xml` that the
`RewriteCond %{REQUEST_FILENAME} !-f` rule lets win regardless. So **both halves are
build-time snapshots, and publishing needs a build and an upload to reach the sitemap.**
The restoration steps are at the top of `docs/dynamic-sitemap.md`.

It still does **not** give the page server-rendered metadata. That needs `npm run build`
and a manual upload of all of `dist/`, because per-request HTML needs a runtime in front of
the domain and Hostinger shared hosting has none.

The two sitemap halves must stay disjoint, and the split is derived from `CONTENT_SOURCES`
in `supabase/functions/_shared/sitemap-sources.mjs`. Add a content type there — never to
only one side — or a URL lands in both halves or neither.

`npm run publish` runs the chain and prints what to upload. It uploads nothing — no FTP,
SFTP, SSH, rsync or hosting-API code exists, because hosting access has not been supplied.
`scripts/publish.mjs` has a documented seam. **Do not add deployment code until credentials
are explicitly provided.**

`npm run publish -- --allow-errors` proceeds past SEO errors you have read and judged
non-blocking.

## Commands

| Command | Purpose |
|---|---|
| `npm run build` | Full chain; fails on SEO errors |
| `npm run publish` | Same plus an upload summary |
| `npm run validate:seo` | Check `dist/`; non-zero on errors |
| `npm run seo:report` | Same, never fails |
| `npm run perf` | Lab measurements — **not** field data, never call these Core Web Vitals |
| `npm run check:similarity` | Near-duplicate detection |
| `npx tsc --noEmit` | Typecheck |

`npm run lint` is `eslint .` but eslint is not installed and there is no config.

There **is** a test runner: `npm test` runs `node --test` over `scripts/**/*.test.mjs` and
`workers/**/test/*.test.mjs`. As of 2026-10-07 the 44 script tests pass and
`workers/seo-head/test/worker.test.mjs` fails on `ERR_MODULE_NOT_FOUND: wrangler` — the
package is imported by the test but is not a dependency. Install it or scope the test script
to `scripts/` if the worker tests are not meant to run locally. Use
`node --test "scripts/**/*.test.mjs"` for a green run meanwhile.

## Known outstanding

- ~~Two vacancies published as both a blog post and an urgent requirement with identical
  titles (Malta, New Zealand)~~ — **resolved.** Verified 2026-10-07 against `dist/`: the
  titles now differ ("Malta Hospitality Jobs: 40 Vacancies Guide & Details" vs "…40 Urgent
  Vacancies"; "New Zealand AEWV Warehouse Jobs: NZD 3,000 Guide" vs "…NZD 2,500–3,000"), and
  `validate-seo`'s cross-page uniqueness check reports 0 duplicate titles and 0 duplicate
  descriptions across all 105 indexable pages.
- Thin and near-duplicate content, re-measured 2026-10-07 over the 105 URLs in
  `sitemap-pages.xml` (main-content text only, nav/header/footer stripped — so these numbers
  are lower than `npm run check:similarity`, which scores whole pages including the 29
  noindex work-visa pages):
  - 9 indexable pages under 350 words. Six are legitimately short by type (`/contact` 207,
    `/about` 231, `/services` 231, `/guides` 264, `/immigration-disclaimer` 286,
    `/for-business/contact` 160). Three are guides that should not be:
    `/guides/australia-student-visa-requirements` 287, `/guides/ielts-requirements-for-study-abroad`
    335, `/guides/uk-student-visa-requirements` 344.
  - 4 near-duplicate pairs at or above 0.80, all north-east India state pages:
    `meghalaya`/`mizoram`/`nagaland`/`manipur` (~0.802–0.803, ~1145 words each).
  - The 5 named work-visa pages are **0.69–0.77**, not 82–92%: `belarus`↔`italy` 0.765,
    `malta`↔`belarus` 0.762, `israel`↔`malta` 0.717, `new-zealand`↔`malta` 0.688. Below the
    0.80 fail threshold but still the weakest cluster. Needs real country facts, not rewording.
  - The 396 pairs `npm run check:similarity` fails on are overwhelmingly **noindex** pages,
    which Google never compares. Filter to indexable before treating that count as a problem.
- `supabase/migrations/20261005000001_log_environment_separation.sql` and
  `20261005000002_dashboard_analytics_production_only.sql` have not been run yet. Until they
  are, logs stay mixed and every environment switch shows the same rows.
- Unanswered business facts: opening hours, Google Business Profile URL, the Instagram
  handle discrepancy (`siddhivinyak` in schema vs `siddhivinayak` in the brand),
  author/reviewer names, registration numbers, evidence for "6+ years" and "500+ clients".
