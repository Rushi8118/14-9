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

## Publishing

Publishing a blog post or urgent requirement in the admin panel makes it reachable for
visitors immediately (Apache serves `app-shell.html`, React fetches from Supabase). It does
**not** give it server-rendered metadata and does **not** put it in `sitemap.xml`. Both need
`npm run build` and a manual upload of all of `dist/` to the web root.

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

`npm run lint` is `eslint .` but eslint is not installed and there is no config. There is no
test runner.

## Known outstanding

- Two vacancies are published as both a blog post and an urgent requirement with identical
  titles (Malta, New Zealand), which fails `validate-seo`. Fix in the admin panel: the
  **Meta title** field, or the **Canonical path** field. These are Supabase rows — the local
  `.env.local` has only the publishable key, so RLS blocks writing them from here.
- 17 pages under 350 words; 5 indexable work-visa pages 82–92% identical (`belarus`,
  `italy`, `malta`, `israel`, `new-zealand`). Needs real facts.
- Unanswered business facts: opening hours, Google Business Profile URL, the Instagram
  handle discrepancy (`siddhivinyak` in schema vs `siddhivinayak` in the brand),
  author/reviewer names, registration numbers, evidence for "6+ years" and "500+ clients".
