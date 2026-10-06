# SEO head Worker

Injects server-rendered metadata into database-driven pages so a newly published
blog post or urgent requirement has a correct `<title>`, canonical, description,
Open Graph and JSON-LD in its **raw HTML**, with no rebuild and no upload.

**Not deployed.** The routes in `wrangler.toml` are commented out and the domain
is still on Hostinger DNS. See `docs/cloudflare-dns-migration.md`.

## The problem

Hostinger serves this site as static files. `public/.htaccess` rule 3 serves a
prerendered page when one exists; otherwise rule 5 hands the URL to
`app-shell.html`, which carries a fallback `<title>Siddhivinayak Overseas</title>`
and **no** canonical, description, Open Graph or JSON-LD.

So a post published since the last build:

- Googlebot renders JavaScript and eventually sees what `SeoHead` sets, so the
  cost there is render-budget delay.
- **Social and LLM scrapers do not execute JavaScript.** Sharing a new post to
  WhatsApp, LinkedIn or Facebook produces a card titled "Siddhivinayak Overseas"
  with no description and no image.

## The three paths

| Request | Behaviour | Database calls |
|---|---|---|
| Not `/blog/:slug` or `/urgent-requirements/:slug` | `fetch(request)`, untouched | 0 |
| Prerendered page (`X-App-Shell: 0`) | returned byte-identical | **0** |
| App shell for a live row (`X-App-Shell: 1`) | `<head>` rewritten | 1 |
| App shell, slug missing / draft / expired | 404 + `X-Robots-Tag: noindex`, body unchanged | 1 |

Only two route families are intercepted. `/services`, `/jobs` and `/countries`
are deliberately out of scope — `/services` is a static page, `/jobs` does not
exist, and `/countries/:slug` is retired and 301'd by `.htaccess`.

## Shell detection

Primary signal is the **`X-App-Shell` response header**, set by `.htaccess` and
explicit in both directions. `0` is what lets a prerendered page be returned
without parsing it or querying anything.

Fallback is the `<meta name="x-app-shell">` marker that `scripts/prerender.mjs`
writes into `app-shell.html` only — used when no header survives (local
`vite preview`, or an origin without `mod_headers`). That path buffers the
response, which is why it is the fallback and not the mechanism. The marker sits
immediately after `<meta charset>` so it is parsed before `<title>`, which
matters because HTMLRewriter streams and cannot look ahead.

## Hydration handoff — the duplicate-metadata problem

React 19 **prepends** its hoisted tags rather than replacing matching static
ones. That is the behaviour that once put two `<title>` elements on every
prerendered page here. Left alone, an injected page would end up with two of
everything after hydration.

Resolution: the Worker marks every element it injects with
`data-seo-source="cloudflare"`; `src/lib/seo/server-metadata.ts` removes exactly
those once React has committed its own, called from a `useEffect` in `SeoHead`.

Why this way:

- **After commit, not before render** — the document is never without metadata.
- **By marker, not by tag name** — cannot touch a prerendered page's real tags
  or anything `index.html` owns. On a prerendered page it is a no-op.
- **If JavaScript never runs**, nothing is removed and the injected metadata
  stands. That is the entire point.

The `<title>` is the one element the Worker `replace()`s rather than appends,
since the shell always has exactly one and two titles is never right.

## Never fabricate

This is a YMYL site under India's Emigration Act, and the admin tooling writes
the literal string `Admin input required` into fields an author left blank. Those
values are in the database.

- Every field read goes through `isPlaceholder()`, the Worker's copy of
  `isAdminInputRequired()`. A placeholder is treated as absent.
- A tag with no real value is **omitted**, not emitted empty.
- No image means no `og:image` and `twitter:card` degrades to `summary`.
- `JobPosting` is emitted only when employer, country and `datePosted` are all
  real; otherwise `WebPage`. `baseSalary` needs both amount and currency.
- Dates are omitted rather than defaulted — a hardcoded `datePublished` has
  already been removed from this codebase once.

## Parity with the React pages

`src/metadata.mjs` deliberately duplicates logic that lives in TypeScript under
`src/`, because workerd cannot import it. Each rule is mirrored from a named
source:

| Rule | Source of truth |
|---|---|
| Brand suffix, 60-char title rule, tag set | `src/components/seo/SeoHead.tsx` |
| `meta_title` → `title`, `meta_desc` → `excerpt` | `src/pages/BlogPostPage.tsx` |
| `seo_title` ladder, 155-char description | `src/pages/UrgentRequirementDetailPage.tsx` |
| `Admin input required` sentinel | `src/lib/ai/guardrails.ts` |
| publisher / author shape | `src/lib/seo/schema.ts` |

**If one of those changes, change this too.** The tests in
`test/metadata.test.mjs` assert the shared rules so drift fails a test rather
than appearing in a search result.

Two known, deliberate divergences:

1. The Worker emits `BlogPosting`; `articleSchema` emits `Article`. BlogPosting
   is a valid subtype and the more specific type for a blog post. A JS-less
   crawler sees BlogPosting, Google after render sees Article. Worth aligning
   later; harmless now.
2. The two slug-specific title rewrites in `BlogPostPage.tsx` are not
   reproduced — hardcoding two slugs into edge infrastructure is a maintenance
   trap. For those two posts the raw title is the longer form and React replaces
   it on hydration.

## Tests

```bash
npm run test:worker     # both suites
npm test                # everything, including the sitemap
```

`test/metadata.test.mjs` — pure logic under plain `node --test`: routing, the
placeholder ladder, title/description rules, JobPosting gating, escaping,
visibility.

`test/worker.test.mjs` — the real Worker in the real runtime via
`wrangler unstable_dev`, with local HTTP stubs for Hostinger and Supabase
(`ORIGIN_BASE` and `SUPABASE_URL` point at them). Assertions read the response
body as text — the same bytes `curl` would show, before any JavaScript runs.

## Safety rule

**Any failure returns the origin response unmodified.** A Supabase outage, a
malformed row, a renamed column, an unexpected throw — none may turn a working
page into an error. The worst acceptable outcome is the behaviour the site has
today: metadata rendered client-side. There is a test for each of these paths.

The one exception is a missing or unpublished row, which returns 404 with
`noindex` instead of the origin's soft 200 — an improvement on current behaviour,
with the body passed through so React still renders its own not-found screen.

## Local development

```bash
cp workers/seo-head/.dev.vars.example workers/seo-head/.dev.vars   # gitignored
npx wrangler dev --config workers/seo-head/wrangler.toml
```

Set `ORIGIN_BASE` in `.dev.vars` to point at a real or stubbed origin. Leave it
unset in production.
