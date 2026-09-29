# Technical SEO — findings

The delegated technical agent died on an API rate limit before writing. This file was
produced inline. Scope: HTTP/header behaviour, redirects, status codes, canonicalisation,
mobile config, and a read of the repo's `public/.htaccess`. Core Web Vitals are in
`performance.md`.

---

## What is correct — and it is most of it

**Security headers — full set present on every response:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: upgrade-insecure-requests
```

HSTS with `preload` is more than most sites this size ship.

**Canonicalisation — every variant resolves in exactly one 301 hop, no chains:**

| request | result |
|---|---|
| `http://siddhivinayakoverseas.com/` | 301 → https, single hop |
| `https://www.siddhivinayakoverseas.com/study-visa` | 301 → non-www, single hop |
| `https://siddhivinayakoverseas.com/study-visa/` | 301 → no trailing slash, single hop |

**Status codes are honest.** `/no-such-page-xyz` and `/STUDY-VISA` both return a real
**404**, not a soft 404 serving the homepage — the `.htaccess` ends with an explicit
`RewriteRule ^ - [R=404,L]` rather than a catch-all SPA rewrite. This is the single most
common technical SEO defect in React sites and this site does not have it.

All 92 sitemap URLs return 200. No 5xx, no redirects inside the sitemap.

**Mobile config:** `<meta name="viewport" content="width=device-width, initial-scale=1.0,
maximum-scale=5.0, viewport-fit=cover">` — `maximum-scale=5.0` permits pinch-zoom rather
than blocking it, which is both an accessibility win and avoids a Lighthouse flag.

**`robots.txt`** is permissive, well-commented, and deliberately does *not* Disallow
`/admin`, `/dashboard`, `/403` — because those emit `X-Robots-Tag: noindex` via `.htaccess`,
and blocking them in robots.txt would stop crawlers reading that header. That reasoning is
correct and worth preserving; it is a subtlety many sites get backwards.

---

## HIGH — sitemap.xml advertises 25 URLs that serve a duplicate-titled shell

Covered in full in `onpage.md`. The technical root is the contradiction between two build
scripts:

- `scripts/prerender.mjs:27` — `SKIP_PREFIXES = ['/blog/', '/urgent-requirements/']`
- `scripts/seo-routes.mjs:200-221` — emits those same URLs into `sitemap.xml` from Supabase

A sitemap is a statement that these URLs are the canonical, indexable version of your
content. Twenty-five of them currently serve 10 words and a title shared with 24 other
URLs. Either prerender them or drop them from the sitemap; shipping both is the problem.

---

## MEDIUM — Content-Security-Policy is a placeholder

`upgrade-insecure-requests` alone sets no `default-src`, `script-src` or `frame-ancestors`.
It is not an SEO issue and nothing is broken, but the header's presence may give a false
impression of coverage in a security review. `X-Frame-Options: SAMEORIGIN` is carrying the
clickjacking protection on its own.

---

## LOW — `lastmod` is absent on most sitemap entries

The homepage and several static routes carry no `<lastmod>`; `/visa-consultants-in-surat`
and the Supabase-driven URLs do. Google treats `lastmod` as a hint only, and an inconsistent
one is weaker than none, but populating it from the content files would help recrawl
prioritisation on a site that updates visa rules.

---

## Not assessed

- **IndexNow submission status.** `scripts/indexnow.mjs` exists and `/2683a14d8cc3956dff2b28c391d96921.txt`
  is present in `public/`, so the mechanism is wired; whether it is actually being run
  post-deploy was not verified.
- **Log-file or Search Console crawl data** — no GSC credentials are configured, so real
  crawl budget, index coverage and discovery data could not be read. This is the largest
  blind spot in the whole audit; see the action plan.
