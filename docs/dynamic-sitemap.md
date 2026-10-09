# Dynamic sitemap

> **STATUS, verified 2026-10-08: not live. This document describes the design,
> not production.** Two things must change before any of it is true:
>
> 1. **The `sitemap` Edge Function is not deployed.**
>    `https://<project>.supabase.co/functions/v1/sitemap` answers
>    `{"code":"NOT_FOUND"}`. (No Edge Function in the project is deployed —
>    `notify-enquiry` answers the same.) Deploy with
>    `supabase functions deploy sitemap`.
> 2. **A static `sitemap-content.xml` shadows it.**
>    `scripts/generate-sitemap.mjs` writes a build-time snapshot into `dist/`,
>    and `public/.htaccess` only redirects to the function when the file is
>    absent (`RewriteCond %{REQUEST_FILENAME} !-f`). The uploaded file always
>    wins, so the function would not be reached even once deployed. Stop writing
>    `CONTENT_SITEMAP` to `outputs` in that script — keep it in the index — to
>    hand the URL back to the function.
>
> Until both are done, the content shard is a **build-time snapshot**: the
> sitemap is valid and complete as of the last build, and a post published in
> the admin panel is reachable for visitors immediately but absent from
> `sitemap.xml` until the next `npm run build` and manual upload. `npm run
> validate:seo` now fails if the index names a shard that no file answers, so
> this cannot regress into a 404 silently.
>
> **Re-verified 2026-10-09.** Both blockers still stand, now with evidence:
> `/functions/v1/sitemap` and `/functions/v1/notify-enquiry` both answer
> `{"code":"NOT_FOUND"}`, and `https://siddhivinayakoverseas.com/sitemap-content.xml`
> answers **HTTP 200 with `Server: hcdn`** — the uploaded static file, not a
> redirect. Step 2 no longer needs a hand edit: build with
> **`SITEMAP_DYNAMIC_CONTENT=1`** and the shard stays in the index while the file
> is not written (and any stale copy is deleted), which is what lets the `!-f`
> rule fire. `validate-seo.mjs` still fails that build unless
> **`SITEMAP_FUNCTION_VERIFIED=1`** is set alongside it, so the file cannot go
> away before someone has confirmed the function answers. See "Switching over".

Publishing a blog post, urgent requirement, service or job listing is *designed*
to reach `sitemap.xml` **without a build and without an upload**. Prerendered
pages still come from the build, because they only exist because a build
produced their HTML.

## Why it is split in two

`sitemap.xml` is a **sitemap index** over two disjoint halves:

| File | Written by | Changes when |
|---|---|---|
| `sitemap-pages.xml` | `scripts/generate-sitemap.mjs`, at build time | A prerendered page is added or changed — which needs a build anyway |
| `sitemap-content.xml` | the `sitemap` Supabase Edge Function, per request | Content is published in the admin panel. No build |

The halves must never overlap or the index counts a URL twice. The split is by
path prefix, read from `CONTENT_SOURCES` in
`supabase/functions/_shared/sitemap-sources.mjs` — the same list the Edge
Function serves — so the build and the function cannot disagree. Add a content
type there and the build stops claiming its URLs automatically.

The index lives at `sitemap.xml` because that is the URL already in `robots.txt`
and already submitted to Search Console. A sitemap index is a valid response
there, so **nothing needs resubmitting**.

### Why the static half is not in the database

Putting the prerendered routes in a table would require the build to write to
Supabase. It cannot: the build environment holds only the publishable key and RLS
rejects the write. Listing them inside the Edge Function by hand would
reintroduce the drift `dist/prerender-manifest.json` exists to prevent — a route
listed but never built is a URL submitted to Google that serves an empty shell,
which has already happened here to 25 URLs.

## Why an Edge Function and not the web host

The site is Hostinger shared hosting serving static files through Apache. There
is no Node runtime there and PHP is ruled out, so Supabase Edge Functions are the
only runtime this project owns that can answer a request.

`public/.htaccess` **redirects** `/sitemap-content.xml` to the function rather
than proxying it, because `mod_proxy` is not available on this plan — a `[P]`
rule would 500. Google follows redirects when fetching a sitemap. The redirect is
a **302**, not a 301: the target moves if a runtime is ever put in front of the
domain, and crawlers cache a 301 hard.

### What this does NOT do

It does not render pages. A newly published post appears in the sitemap within
one cache TTL with no build, but its server-rendered `<title>`, canonical and
JSON-LD still come from the prerendered HTML on Hostinger — so a brand-new post
is crawlable and submitted, while its metadata is whatever
`public/app-shell.html` carries until the next build.

Making metadata live too requires a runtime **in front of the domain**. The only
option that does not move hosting is Cloudflare (free): point the nameservers at
Cloudflare, keep Hostinger as the origin, and add a Worker that rewrites the
`<head>` of a database-driven route from Supabase using `HTMLRewriter`.
`public/cloudflare-setup.md` already documents the DNS and WAF side; it has not
been executed — the domain is still on `ns1/ns2.dns-parking.com`. That is a DNS
change and needs an explicit decision.

## Deploying

### 1. Set the function's environment

```bash
supabase secrets set SITE_URL=https://siddhivinayakoverseas.com
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SITE_URL` | **yes** | none — the function returns 500 without it | Production origin for every `<loc>`. Never defaulted: a wrong host submits the whole site to the wrong place, and a loud 500 is cheaper to notice |
| `SITEMAP_CACHE_TTL` | no | `60` (seconds) | Publish-to-visible delay, and the bound on how stale the sitemap can be |
| `SITEMAP_REVALIDATE_SECRET` | no | unset (feature off) | When set, a request with `X-Sitemap-Revalidate: <secret>` rebuilds immediately instead of waiting for the TTL |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected by the platform.

### 2. Deploy the function

```bash
supabase functions deploy sitemap --no-verify-jwt
```

`--no-verify-jwt` is required: crawlers do not send an `Authorization` header.
The function is read-only, queries through the anon key so RLS applies, and only
ever returns URLs that are already public.

### 3. Build and upload

```bash
npm run publish
```

The build fills `%%SITEMAP_FUNCTION_ORIGIN%%` in `dist/.htaccess` from
`VITE_SUPABASE_URL` and **fails** if that variable is unset — an `.htaccess`
containing the literal token would make `sitemap-content.xml` 404 and drop every
database-driven URL out of the sitemap. The committed `public/.htaccess` keeps
the token so the Supabase project is not baked into git.

Upload all of `dist/` to the web root, `.htaccess` included.

### 4. Verify

```bash
curl -sI https://siddhivinayakoverseas.com/sitemap-content.xml
```

Expect a `302` to the function. Then follow it:

```bash
curl -sL https://siddhivinayakoverseas.com/sitemap-content.xml | head -20
```

Expect `application/xml; charset=utf-8` and a `<urlset>`. For a breakdown of what
was included and what was withheld, with a reason per URL:

```bash
curl -sL "https://siddhivinayakoverseas.com/sitemap-content.xml?debug=1"
```

## Search Console and Bing

`sitemap.xml` is already submitted and does not need resubmitting — it is now an
index, and Google reads the shards from it. To confirm, open Search Console →
Sitemaps and check that `sitemap.xml` reports two child sitemaps.

If Search Console reports **"Couldn't fetch"** on `sitemap-content.xml`, the
cause is almost always the redirect being blocked rather than the XML. Submit the
shard URL directly (`sitemap-content.xml`) as a second sitemap to see the
specific error.

Bing Webmaster Tools reads the same `robots.txt` `Sitemap:` line. Bing also
supports IndexNow, which this project already has wired up as `npm run seo:ping`
— that is the faster path for telling Bing about a single new URL.

## Operations

**Logs.** The function writes one JSON line per build to the Supabase function
log: `{"event":"sitemap.build","ms":…,"urls":…,"withheld":…,"byType":…,"missingTables":[…],"errors":[…]}`.
A `sitemap.partial` line means a source failed and the response was served
uncached. `sitemap.error` means the build threw and a 503 was returned.

**Failure behaviour, and why.** A source that errors costs that one content type
and marks the response `no-store`, so a transient Supabase blip cannot freeze a
truncated sitemap at the edge for a full TTL. A source whose *table does not
exist* is not an error — that is an unapplied migration, a steady state on this
project. A build that throws returns **503, never an empty `<urlset>`**: telling
Google every URL on the site is gone is far more damaging than a fetch it will
retry.

**Cache invalidation.** Publishing is visible within `SITEMAP_CACHE_TTL` (60s by
default). For immediate invalidation, set `SITEMAP_REVALIDATE_SECRET` and have
the admin panel or a database webhook send the header on publish. The in-isolate
cache is not shared between isolates and is not meant to be — correctness comes
from the TTL and the `ETag`, not from cache coherence.

## Tests

```bash
npm test
```

44 tests, no network and no database. `scripts/lib/sitemap.test.mjs` covers the
guarantees that matter: a published post appears, draft/scheduled/archived/
soft-deleted/`noindex`/non-self-canonical content cannot appear, `lastmod` comes
from `updated_at` and is omitted rather than invented when unknown, duplicate and
near-duplicate URLs (trailing slash, uppercase, doubled slash) collapse to one,
splitting above 50,000 URLs preserves every URL exactly once, and the XML is
well-formed and correctly escaped.

`scripts/lib/sitemap-sources.test.mjs` covers the degradation rules — which
failures cost one content type, which make the response uncacheable, and which
must never silently empty the sitemap.

## Switching over

The order is a safety property, not a preference. With the file gone and the
function still missing, `/sitemap-content.xml` 404s while the index still names
it, and every database-driven URL drops out of the sitemap.

```bash
# 1. deploy
supabase functions deploy sitemap --no-verify-jwt

# 2. verify it answers BEFORE the file goes away
curl -s "https://<project>.supabase.co/functions/v1/sitemap" | head -5   # expect <urlset>

# 3. build without the static shard
SITEMAP_DYNAMIC_CONTENT=1 SITEMAP_FUNCTION_VERIFIED=1 npm run publish

# 4. upload dist/, then confirm the redirect and the payload
curl -sI https://siddhivinayakoverseas.com/sitemap-content.xml            # expect 302
curl -sL https://siddhivinayakoverseas.com/sitemap-content.xml | head -5  # expect <urlset>
```

`SITEMAP_DYNAMIC_CONTENT=1` alone makes `npm run build` **fail**: it is the
request, not the confirmation. `SITEMAP_FUNCTION_VERIFIED=1` is the operator
stating step 2 passed. To roll back, build without either variable — the
snapshot returns and shadows the function again.

## Still outstanding

- **`services` does not exist** (`PGRST205`, verified 2026-10-09). **`job_listings`
  does** — the earlier claim here that neither existed was wrong. It holds one
  row with `status: 'active'`.

  Both are nonetheless `serve: false` in `CONTENT_SOURCES`, because **no route
  exists for either prefix**: `/services/<slug>` and `/jobs/<slug>` both answer
  **404** in production (verified). A sitemap that submits URLs which do not
  resolve is a generator of crawl errors.

  `jobs` had three faults that happened to cancel out: its filter asks for
  `status=eq.published` while the table uses `active` (so it read 0 rows and
  looked empty), there is no `/jobs` route, and its one row's slug
  `hotel-jobs-australia-overseas-workers` is **also** an active
  `urgent_requirements` slug already submitted at
  `/urgent-requirements/hotel-jobs-australia-overseas-workers`. Correcting the
  filter alone — the obvious next edit — would have started submitting a
  duplicate URL that 404s. Turn `serve` on in the same change that adds the
  route and resolves the collision.
- **Expired openings.** `urgent_requirements` has no `published_at` or
  `canonical_url` but does have `expires_at`, and the select ladder used to
  degrade straight past it. A shape was added for that table's real columns, and
  `toEntry` now rejects a record whose `expires_at` has passed — so the dynamic
  half agrees with the page, which goes `noindex` at the same moment
  (`UrgentRequirementDetailPage`, `noindex={isClosed}`). All 14 active rows
  currently expire in the future, so this drops nothing today; it is a guard.
- **Live metadata** needs the Cloudflare decision above.
- **Old-slug → new-slug redirects** cannot be driven from a database table
  without a runtime in front of the domain. Until then they stay in
  `public/.htaccess`.
