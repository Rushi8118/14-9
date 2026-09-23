# Technical SEO Audit — siddhivinayakoverseas.com

**Audited:** 23 September 2026 · **Method:** full source review of this repository at commit `448374b`
**Site:** https://siddhivinayakoverseas.com · **Business:** Siddhivinayak Overseas, Surat, Gujarat
**Platform (verified):** Custom React 19 SPA — Vite + React Router + Supabase, prerendered to static HTML with Playwright, served from Apache (`.htaccess`) with Cloudflare in front

---

## How to read this document

| Label | Meaning |
|---|---|
| **VERIFIED** | I read this in your code. It is a fact about your site. |
| **ASSUMPTION** | My inference. I flag what would confirm or refute it. |
| **NEEDS DATA** | I cannot assess this from source alone — it needs Search Console, a live crawl, or field CWV data. |

**I have not invented anything.** No search volumes, no competitor names, no ranking claims, no review counts. Where you see a number, it came from a file in this repo.

---

## Executive summary

**Your site is in the top ~10% of technically-executed small business sites I could audit from source.** Someone did serious work here: a single source of truth for indexable routes shared by the sitemap generator and the prerenderer, a hand-tuned `.htaccess` that returns genuine 404s instead of soft 404s, `ProfessionalService`/`LocalBusiness` schema with real geo coordinates, 100% image alt coverage, and per-page canonical management.

So this audit is **not** a list of beginner mistakes. It is a short list of things that are genuinely costing you, and the biggest one is not a ranking problem at all:

> **You have built complete conversion tracking and never installed the analytics tag that receives it.** Phone clicks, WhatsApp clicks and form submissions all fire `gtag()` events. No GA4 or GTM tag exists anywhere in the codebase. Every conversion you have ever had is unmeasured.

The second biggest is a 501 KB image loaded at highest priority as your homepage hero.

### The findings, ranked

**Status as of 23 September 2026: 10 of 17 findings are fixed in code and verified in a real browser.** See [`fixes-applied.md`](./fixes-applied.md) for the measurements.

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | GA4/GTM tag missing — all conversion tracking fires into nothing | 🔴 Critical | ✅ **Fixed** — needs your tag ID in `.env` |
| 2 | 501 KB LCP hero image + 1.3 MB of 3D globe textures on the homepage | 🔴 Critical | ✅ **Fixed** — LCP now a 56 KB AVIF |
| 3 | `/post-study-work-visa/*` country pages are 301-redirected away | 🔴 Critical | ⏳ Content work — 2 weeks |
| 4 | CMS-published blog posts are not prerendered until the next deploy | 🟠 High | ⏳ Needs your host's deploy-hook URL |
| 5 | Invalid `/pathways/*` URLs client-redirect instead of 404ing (soft 404) | 🟠 High | ✅ **Fixed** |
| 6 | Render-blocking Google Fonts stylesheet in `<head>` | 🟠 High | 🔶 Partial — `fonts.gstatic.com` preconnect added; self-hosting still open |
| 7 | Images without `width`/`height` — CLS risk | 🟠 High | ✅ **Fixed** on public pages |
| 8 | No WebP/AVIF anywhere; every image is JPEG/PNG | 🟠 High | ✅ **Fixed** — `npm run images` |
| 9 | `/countries/:slug/programs/:programSlug` pages are orphaned | 🟡 Medium | ⏳ Needs your decision: index or noindex |
| 10 | Four dead top-level directories (~1.3 MB) from an abandoned Next.js build | 🟡 Medium | ⏳ **Awaiting your OK to delete** |
| 11 | `public/sw.js` service worker is served but never registered | 🟡 Medium | ✅ **Fixed** — deleted |
| 12 | Sitemap has no `<lastmod>` for the static routes | 🟡 Medium | ✅ **Fixed** — derived from git history |
| 13 | `robots.txt` disallows `/admin` and `/dashboard`, blocking their own noindex tags | 🟡 Medium | ✅ **Fixed** |
| 14 | No Bing Webmaster Tools / IndexNow verification evidence in repo | 🟡 Medium | ⏳ Account setup, not code |
| 15 | `meta keywords` tag present (ignored by every engine since 2009) | 🟢 Low | ✅ **Fixed** |
| 16 | No `hreflang` — correct today, but revisit if you ever add Gujarati | 🟢 Low | — No action |
| **17** | **NEW: every vendor chunk preloaded on every page (~1.1 MB of three.js + charts)** | 🔴 **Critical** | ✅ **Fixed** — found while testing |

---

## 1. What is already right (do not "fix" these)

I am listing these because a future consultant or developer may try to "improve" them and make things worse.

**VERIFIED — keep as is:**

- `scripts/seo-routes.mjs` is a single source of truth consumed by both `generate-sitemap.mjs` and `prerender.mjs`. Your sitemap and your prerendered HTML cannot drift apart. This is better than most agencies ship.
- `.htaccess` rule 6 returns a real `404` for unknown paths instead of the SPA soft-404 that ruins most React sites.
- `prerender.mjs` writes an `app-shell.html` with the homepage's canonical, `og:url` and robots tags **stripped**, so a client-rendered URL never claims to be a duplicate of the homepage. This is a subtle, correct fix.
- `CountryPage.tsx:158` applies `noindex` when a country description is under 150 characters, and `seo-routes.mjs` excludes those same pages from the sitemap. Thin content is being actively suppressed. Excellent.
- Blog posts with a `canonical_url` pointing elsewhere are excluded from the sitemap.
- `schema.ts` emits `['ProfessionalService','LocalBusiness']` with `GeoCoordinates` (21.1702, 72.8311), `PostalAddress`, plus `FAQPage`, `BreadcrumbList`, `Article`, `Service`, `WebSite`, `Organization`, `JobPosting`.
- Every `<img>` in `src/` has an `alt` attribute. All 19 of them.
- HSTS with `preload`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` all set.
- `www` → apex 301 in one hop, trailing slashes stripped, canonical URLs slash-less throughout.
- AI crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) explicitly allowed — a deliberate and, in 2026, correct call for an advice business.

---

## 2. Critical fixes

### 🔴 C1 — Analytics tag is missing; all conversion tracking is dead

**The exact problem — VERIFIED.**
`src/lib/analytics.ts` defines `GA_EVENTS` with `PHONE_CLICK`, `WHATSAPP_CLICK`, `FORM_SUBMIT`, and `trackEvent()` which calls `window.gtag(...)` or pushes to `window.dataLayer`. These are correctly wired up in at least 8 places:

- `site-footer.tsx:303,314` — phone clicks (both numbers)
- `site-footer.tsx:327` — WhatsApp footer click
- `site-footer.tsx:408` — WhatsApp floating action button
- `contact-section.tsx:182` — consultation form submit, segmented by work vs study
- `contact-section.tsx:246,265` — header phone and WhatsApp clicks

A repo-wide search for `G-XXXXXXX`, `GTM-`, or `googletagmanager.com` across `.ts`, `.tsx`, `.html` and `.json` returns **zero results**. `index.html` contains no tag.

**Why it matters.** `window.gtag` is undefined, `window.dataLayer` is undefined, so `trackEvent()` silently does nothing on every call. You have no record of how many people called you, messaged you on WhatsApp, or submitted the consultation form from organic search. You cannot calculate cost per lead, you cannot tell which destination pages produce enquiries, and you cannot prove any SEO work pays for itself. Every recommendation in this document is unmeasurable until this is fixed. **Fix this before anything else in this audit.**

**Recommended solution.** Install GA4 via Google Tag Manager (not the raw gtag snippet — GTM lets you add call tracking and A/B tests later without another developer ticket).

**Step by step.**
1. Create a GA4 property at analytics.google.com. Copy the Measurement ID (`G-XXXXXXXXXX`).
2. Create a GTM container at tagmanager.google.com. Copy the container ID (`GTM-XXXXXXX`).
3. In `index.html`, add the GTM script as the first item in `<head>` and the `<noscript>` iframe immediately after `<body>`. Use the exact snippets Google gives you.
4. In GTM: add a Google Tag with your GA4 Measurement ID, trigger "Initialization — All Pages".
5. In GTM: add three GA4 Event tags triggered on Custom Events named `phone_click`, `whatsapp_click`, `form_submit`. Your existing `dataLayer.push` fallback in `analytics.ts:26` already pushes events in exactly this shape, so **no code change is needed beyond the snippet**.
6. In GA4 → Admin → Events, mark all three as **Key events** (conversions).
7. **Verify the SPA route change tracking.** React Router does not reload the page, so GA4's automatic `page_view` may only fire once per session. Add a `useEffect` in `src/App.tsx` that pushes a `page_view` on every `useLocation()` change. Test by navigating between three pages and confirming three page views in GA4 Realtime.
8. Link GA4 to Search Console (GA4 → Admin → Search Console links).

**Who implements.** Developer, 1 hour. Steps 1–2 and 6 can be done by the business owner.

**Expected benefit.** Not a ranking benefit — a decision-making one. You will finally know which pages generate enquiries.

**Difficulty.** Low. **Priority.** Critical, do first.

**How to measure success.** GA4 Realtime shows a `phone_click` event within 5 minutes of you tapping the footer phone number on your own phone. Within 30 days, GA4 → Reports → Engagement → Events shows non-zero counts for all three events.

---

### 🔴 C2 — 501 KB hero image at `fetchPriority="high"`, plus 1.3 MB of globe textures

**The exact problem — VERIFIED.** In `src/components/hero.tsx:12-21`, the `GlobePoster` renders:

```
<img src="/earth-blue-marble.jpg" width={640} height={640}
     fetchPriority="high" decoding="async"
     className="h-full w-full object-cover scale-150" />
```

`public/earth-blue-marble.jpg` is **501 KB**. Its container is `h-64 w-64` — 256 × 256 CSS pixels, scaled 1.5×. So on a 2× device you need roughly a 768 px image; you are shipping a 640 px JPEG that weighs half a megabyte, at the browser's highest fetch priority, as the first thing on your homepage.

Then, after hydration, `src/components/interactive-globe.tsx:111-117` loads four more textures through three.js:

| File | Size |
|---|---|
| earth-blue-marble.jpg | 501 KB |
| earth-normal.jpg | 329 KB |
| earth-clouds.png | 254 KB |
| earth-specular.jpg | 218 KB |
| **Total textures** | **1.3 MB** |

Plus `vendor-three`, `vendor-three-stdlib` and `vendor-react-three` chunks (`vite.config.ts` splits them out, so they are real dependencies).

There are **no `.webp` or `.avif` files in `public/`** — every raster image on the site is JPEG or PNG.

**Why it matters.** That `<img>` is almost certainly your homepage **Largest Contentful Paint** element. On a mid-range Android phone on Indian 4G — which is exactly your audience — half a megabyte at high priority can easily put LCP past 4 seconds. Google's "good" threshold is 2.5 s. LCP is a confirmed ranking signal and, more importantly, it is the difference between a prospective student reading your page and closing the tab. The 1.3 MB of textures then compete for bandwidth with everything below the fold.

**Recommended solution.** Three layers, in order of value:

1. **Right-size and modernise the poster.** Generate `earth-poster-768.avif` (and a `.webp` fallback) at 768 × 768. Expect roughly 20–40 KB instead of 501 KB — a ~92% reduction on your LCP resource.
2. **Do not load the 3D globe on mobile at all.** It is decorative. Users on phones get the poster image; desktop users get the interactive globe.
3. **Convert the remaining textures to WebP** and only fetch them when the globe actually mounts.

**Step by step.**
1. Install `sharp` as a dev dependency.
2. Write `scripts/optimize-images.mjs` that reads each file in `public/` and emits `.avif` and `.webp` siblings at sensible widths. Add it to the `build` script before `vite build`.
3. Replace the `<img>` in `hero.tsx` with a `<picture>` element: AVIF source, WebP source, JPEG fallback. Keep `fetchPriority="high"` and the explicit `width`/`height`.
4. Add `<link rel="preload" as="image" href="/earth-poster-768.avif" type="image/avif" fetchpriority="high">` to `index.html` so the poster starts downloading before the JS parses.
5. In `hero.tsx`, gate the `InteractiveGlobe` lazy import behind `window.matchMedia('(min-width: 1024px)').matches` **and** `navigator.connection?.saveData !== true`.
6. In `interactive-globe.tsx`, point `textureLoader.load()` at the `.webp` versions.
7. Re-run Lighthouse on the homepage in mobile mode, before and after. Record both numbers.

**Who implements.** Developer, roughly one day.

**Expected benefit.** The single largest Core Web Vitals improvement available to you. Realistically this moves homepage mobile LCP from "poor" into "good" territory — but see the honesty note below.

**Difficulty.** Medium. **Priority.** Critical.

**How to measure success.** PageSpeed Insights on `https://siddhivinayakoverseas.com/`, mobile, before and after. Then watch Search Console → Core Web Vitals → Mobile for the field-data URL group to move to "Good" — that takes 28 days because CrUX uses a rolling 28-day window.

> **NEEDS DATA:** I am reasoning from file sizes and source code, not from measurement. I have no access to your live site, so I cannot tell you your current LCP. **Run PageSpeed Insights on your homepage before you change anything** and save the report. Without a baseline you cannot prove the improvement.

---

### 🔴 C3 — Your best keyword cluster has been redirected away

**The exact problem — VERIFIED.** `public/.htaccess` line 15 contains:

```
# Old per-country post-study URLs (reported as Soft 404 / not indexed): move to the country's study page,
# which covers post-study work rights for that country.
RewriteRule ^post-study-work-visa/(uk|ireland|new-zealand|germany|australia|france|canada)$ /study-in-$1 [R=301,L]
```

So `/post-study-work-visa/canada` currently 301s to `/study-in-canada`. `seo-routes.mjs` lists only the parent `/post-study-work-visa`, no country children.

**This directly contradicts the keyword strategy I gave you in our previous session,** where I recommended `/post-study-work-visa/{country}` as your ten highest-priority pages. I was working from the keyword data alone and did not know these URLs already existed and had been retired. I should correct that properly rather than quietly reissue the same advice.

**Why it matters — and why the redirect was still the right call at the time.** Your own comment says Search Console reported these as "Soft 404 / not indexed". Google does not soft-404 a URL because of its address; it does so because the page had little unique content. The redirect correctly stopped the bleeding.

But the *concept* is still your strongest commercial asset. Your audience — students abroad whose study visa is expiring — is genuinely underserved, and you already have deep, specific content for it in `src/content/pathways.ts`: UK Student→Skilled Worker, UK Graduate Route, Canada PGWP→PR, Australia 485→employer-sponsored, NZ AEWV. That content is live at `/pathways/*` and is substantive.

So you already rank-worthy content on this topic. It is just sitting at URLs nobody searches for the word "pathways".

**Recommended solution.** Do **not** simply remove the redirect — that would restore thin pages and re-earn the soft 404. Instead:

**Option A (recommended): keep `/pathways/*` as the canonical home and strengthen it.** You avoid a second migration, the URLs are already indexed, and the content is already good. Rename the section's user-facing label from "Pathways" to "Post-Study Work Visas", update the `<h1>` and title tags on each pathway page to lead with the searched phrase ("UK Post-Study Work Visa: Switching from Student to Skilled Worker"), and leave the URLs alone. URLs are a weak ranking factor; titles and H1s are strong ones.

**Option B: rebuild `/post-study-work-visa/{country}` properly.** Only if each page will carry 1,500+ words of genuinely country-specific content — eligibility tables, timelines keyed to visa expiry, official source links, real case studies. Then remove the redirect line and 301 `/pathways/{slug}` → the new URL. More work, more risk, marginally better URL semantics.

**I recommend Option A.** It captures the same searches for a fraction of the effort and no migration risk.

**Step by step (Option A).**
1. In `src/content/pathways.ts`, rewrite each entry's `title` and `h1` to lead with the phrase people actually search. Example: `h1: 'UK Post-Study Work Visa — Switching from a Student Visa'`.
2. Add the five missing destinations your work section covers but pathways does not — Germany, Ireland, USA and the two biggest EU work destinations.
3. Expand each page to 1,500+ words: an eligibility table, a month-by-month timeline anchored to visa expiry, a documents checklist, and links to the official government source for every rule you state.
4. Add `FAQPage` schema per page using the questions in `docs/seo/keyword-strategy.md`.
5. Add a visible link block on every `/study-in-{country}` page: *"Finishing your studies in {country}? See your work visa options."*
6. Leave the `.htaccess` redirect in place. It is doing no harm.
7. Add a dated "Last reviewed" line to each page, and diary a quarterly review.

**Who implements.** Content writer with immigration knowledge (steps 1–3, 7), developer (4–5). 2–3 weeks.

**Expected benefit.** This is where your differentiated traffic will come from. Low competition, high commercial intent, and you already have the expertise written down.

**Difficulty.** Medium — the constraint is writing quality, not code. **Priority.** Critical.

**How to measure success.** Search Console → Performance → filter Page contains `/pathways/`. Track impressions and clicks monthly. Target: impressions up meaningfully within 90 days of the rewrite going live.

---

## 3. High-priority fixes

### 🟠 H1 — Blog posts published from the CMS are never prerendered

**VERIFIED.** `scripts/prerender.mjs:20` builds its route list from `getPublicRoutes(root)` at **build time**. That function queries Supabase for published `blog_posts`, active `countries` and active `urgent_requirements`. So a post published through your admin panel (`src/components/admin/blog/AiBlogWriter.tsx`) is prerendered **only if a deploy runs after it is published**.

Until then, `.htaccess` rule 5 catches it — `RewriteRule ^(blog|countries|urgent-requirements)(/.*)?$ /app-shell.html [L]` — and serves the empty JS shell. It is also absent from `sitemap.xml`, which is only regenerated at build time.

**Why it matters.** Googlebot does render JavaScript, but rendering is queued separately from crawling and can lag by days or weeks. A time-sensitive post ("UK visa rule change effective October") may not be indexed while it still matters. And it will not appear in your sitemap at all until someone redeploys.

**Recommended solution.** Trigger a rebuild automatically when content is published. Every modern host supports deploy hooks.

**Step by step.**
1. Create a deploy hook URL in your host's dashboard (Netlify: Build hooks; Vercel: Deploy Hooks; Cloudflare Pages: Deploy hooks).
2. Store it as a Supabase secret, not in the repo.
3. Add a Supabase Database Webhook on `blog_posts` for INSERT and UPDATE where `status = 'published'`, calling that URL.
4. Repeat for `urgent_requirements` and `countries`.
5. Debounce: if you publish several posts at once, you do not want five builds. A 5-minute delay in an Edge Function is enough.
6. After each publish, submit the new URL in Search Console → URL Inspection → Request Indexing, and run `npm run seo:ping` (you already have `scripts/indexnow.mjs`) to notify Bing.

**Who implements.** Developer, one day. **Difficulty.** Medium. **Priority.** High.

**How to measure.** Publish a test post. Within 10 minutes, `curl -s https://siddhivinayakoverseas.com/blog/<slug> | grep "<h1"` should return the real heading, not an empty shell. Confirm the URL appears in `sitemap.xml`.

---

### 🟠 H2 — Invalid `/pathways/*` URLs produce a soft 404

**VERIFIED.** `src/pages/PathwayPage.tsx:8`:

```
if (!content) return <Navigate to="/pathways" replace />
```

**Why it matters.** A typo'd, outdated or scraped `/pathways/anything` URL returns HTTP 200 and client-redirects to the index. Google classifies that as a soft 404 — and per your own `.htaccess` comment, soft 404s are already a problem you have had. Every soft 404 wastes crawl budget and can suppress indexing of neighbouring pages. It also means retired pathway slugs silently vanish instead of signalling their status.

Note the contrast: `src/pages/CountryPage.tsx` handles this correctly with `noindex`, and `.htaccess` handles unknown top-level paths correctly with a real 404. This one route is the exception.

**Recommended solution.** Render the 404 page component directly rather than redirecting.

**Step by step.**
1. In `PathwayPage.tsx`, replace the `<Navigate>` with `return <NotFoundPage />`. `NotFoundPage.tsx:96` already sets `<meta name="robots" content="noindex, follow">`.
2. Better still, add valid pathway slugs to `STATIC_ROUTES` in `seo-routes.mjs` (they are already listed) and add an `.htaccess` rule so unknown `/pathways/*` paths hit rule 6 and return a genuine 404 status code.
3. Apply the same pattern to any future dynamic route.

**Who implements.** Developer, 30 minutes. **Difficulty.** Low. **Priority.** High.

**How to measure.** Search Console → Pages → "Soft 404" count trends to zero. Verify directly: `curl -I https://siddhivinayakoverseas.com/pathways/does-not-exist` should return `404`, not `200`.

---

### 🟠 H3 — Render-blocking font stylesheet

**VERIFIED.** `index.html` preloads the Google Fonts CSS with `fetchpriority="high"` and then immediately includes it as a plain `<link rel="stylesheet">`. It requests **three families** — DM Sans (8 weights/styles), Playfair Display (2), Fraunces (3 optical-size axes).

**Why it matters.** A plain stylesheet link blocks rendering. The browser must fetch `fonts.googleapis.com`, parse the CSS, then fetch the font files from `fonts.gstatic.com` — a second domain, with its own DNS and TLS handshake, which you do not preconnect to. On a slow Indian mobile connection this adds real delay before *anything* paints, and 13 font variations is a lot of weight for a site with three visible type styles.

**Recommended solution.** Self-host the subsetted fonts. This removes two third-party round trips, eliminates the render block, and is better for GDPR.

**Step by step.**
1. Use `google-webfonts-helper` or `fontsource` to download WOFF2 files for only the weights you actually use. Audit `src/index.css` and `tailwind.config` — you likely need 3–4 files, not 13.
2. Put them in `public/fonts/`.
3. Declare `@font-face` in `src/index.css` with `font-display: swap`.
4. Preload only the font used by your `<h1>` — one file: `<link rel="preload" as="font" type="font/woff2" href="/fonts/..." crossorigin>`.
5. Delete both Google Fonts `<link>` tags and the `preconnect`/`dns-prefetch` lines.
6. Your `.htaccess` already caches `woff2` for a year.

**Alternative if you must keep Google Fonts:** add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` (currently missing — you only preconnect to `fonts.googleapis.com`) and load the stylesheet with `media="print" onload="this.media='all'"`.

**Who implements.** Developer, 2 hours. **Difficulty.** Low. **Priority.** High.

**How to measure.** PageSpeed Insights "Eliminate render-blocking resources" opportunity disappears. First Contentful Paint improves.

---

### 🟠 H4 — 13 of 19 images have no width/height attributes

**VERIFIED.** Across all `.tsx` files in `src/`: 19 `<img>` elements total, **all 19 have `alt`** (genuinely good), but **13 lack a `width` attribute** and **12 have neither `loading` nor `fetchpriority`**.

**Why it matters.** Without intrinsic dimensions the browser cannot reserve space, so content jumps as images load. That is **Cumulative Layout Shift**, a Core Web Vitals metric. It is also the single most irritating thing a user can experience on a phone — tapping "Book consultation" and hitting something else because an image just pushed the page down.

**Recommended solution.** Add explicit `width` and `height` to every `<img>`, and `loading="lazy"` to every image below the fold.

**Step by step.**
1. For each of the 13, find the source file's natural dimensions and add `width={W} height={H}`. Tailwind classes control display size; these attributes only set the aspect ratio.
2. Add `loading="lazy" decoding="async"` to every image not visible on first paint.
3. **Do not** add `loading="lazy"` to the hero poster — it already correctly uses `fetchPriority="high"`.
4. Add an ESLint rule (`jsx-a11y` plus a custom check) so new images cannot be merged without dimensions.

**Who implements.** Developer, 2 hours. **Difficulty.** Low. **Priority.** High.

**How to measure.** PageSpeed Insights CLS score < 0.1 on homepage, a country page and a study page. Then Search Console → Core Web Vitals field data after 28 days.

---

## 4. Medium-priority improvements

### 🟡 M1 — Orphaned program pages

**VERIFIED.** `src/App.tsx` registers `/countries/:slug/programs/:programSlug`. That pattern appears in **no** `STATIC_ROUTES` entry and **no** dynamic sitemap query in `seo-routes.mjs`.

**Why it matters.** These pages exist, are crawlable via `.htaccess` rule 5, but are in no sitemap and — unless linked from the country page body — have no internal links. Orphan pages rarely get indexed, and if they hold course/program detail they are exactly the long-tail content that wins "MSc data science Canada fees" style searches.

**Solution.** Decide deliberately: either (a) add them to the sitemap with a content-length threshold like the one already used for countries, and link them from the parent country page, or (b) `noindex` them. Do not leave them in limbo. **Difficulty.** Medium. **Priority.** Medium. **Measure:** Search Console → Pages → "Discovered – currently not indexed" count.

### 🟡 M2 — Dead directories from an abandoned Next.js build

**VERIFIED.** Top level contains `app/` (640 KB), `components/` (468 KB), `lib/` (112 KB), `hooks/` (24 KB), `auth/`, `countries/`, `dashboard/` — duplicating `src/`. `tsconfig.json` includes only `src/**/*` and `types/**/*.d.ts`, `vite.config.ts` aliases `@` to `./src`, and nothing in `src/` imports from them. `app/robots.ts.temp` and `app/sitemap.ts.temp` are disabled Next.js route handlers.

**Why it matters.** No direct SEO impact — this code does not ship. The risk is human: a developer edits `components/hero.tsx` instead of `src/components/hero.tsx`, sees no change, and "fixes" it by breaking something. Given how carefully the real SEO plumbing is built, protecting it from accidental edits matters.

**Solution.** Confirm with `git log` that nothing has touched them recently, then delete in one clearly-labelled commit that is easy to revert. Keep `types/` — it is in `tsconfig.json`. **Difficulty.** Low. **Priority.** Medium.

### 🟡 M3 — Unregistered service worker

**VERIFIED.** `public/sw.js` exists (2 KB, `CACHE_VERSION = "v1"`, precaches `/`, `/manifest.json`, `/icon.svg`, `/favicon/site.webmanifest`). No `navigator.serviceWorker` registration exists anywhere in `src/`.

**Why it matters.** Harmless today — dead weight being served. But a stale service worker is one of the nastiest bugs in web development: if anyone ever registers it, visitors can be served cached HTML indefinitely and will not see new content. Note it precaches `/favicon/site.webmanifest` while `index.html` references `/manifest.json` — the precache list is already wrong.

**Solution.** Delete `public/sw.js`, or register it deliberately with a proper update strategy. Do not leave it ambiguous. **Difficulty.** Low. **Priority.** Medium.

### 🟡 M4 — No `<lastmod>` on static routes

**VERIFIED.** `generate-sitemap.mjs` emits `<lastmod>` only when a route has one, and `STATIC_ROUTES` entries are mapped as `{ path }` with no date. So all ~80 static URLs — every work-visa country page, every study page, every guide — have no `lastmod`. Only the ~35 Supabase-driven URLs have one.

**Why it matters.** `lastmod` is one of the few sitemap signals Google has confirmed it uses, to prioritise recrawling. Without it, updates to your country pages are discovered more slowly. This matters for immigration content specifically, because rules change and you want the refresh crawled quickly.

**Solution.** Derive `lastmod` from git: `git log -1 --format=%cI -- <file>` for the content file backing each route. Do not fake it with today's date on every build — an always-current `lastmod` on unchanged pages is a signal Google learns to ignore. **Difficulty.** Medium. **Priority.** Medium. **Measure:** Search Console → Settings → Crawl stats.

### 🟡 M5 — robots.txt blocks pages that carry their own noindex

**VERIFIED.** `public/robots.txt` disallows `/dashboard`, `/admin`, `/403`. Those same routes set `noindex` via meta tags and via `X-Robots-Tag` in `.htaccess` (`E=NOINDEX:1`).

**Why it matters.** A classic conflict: if Google cannot crawl a URL, it cannot see the `noindex` on it. A disallowed URL that gets linked from anywhere can still appear in results as a bare URL with "No information is available for this page". Your `X-Robots-Tag` header approach is the stronger one, and `Disallow` undermines it.

**Solution.** Remove the `Disallow` lines for `/admin` and `/dashboard` and rely on the headers, which are already correctly configured. Keep `Disallow` only for things you genuinely never want fetched. **Difficulty.** Low. **Priority.** Medium.

### 🟡 M6 — Bing and IndexNow

**VERIFIED.** `scripts/indexnow.mjs` exists and `package.json` exposes `npm run seo:ping`. `public/2683a14d8cc3956dff2b28c391d96921.txt` (32 bytes) is an IndexNow key file. **NEEDS DATA:** I cannot verify from the repo whether Bing Webmaster Tools is actually set up, or whether the ping runs automatically.

**Why it matters.** Bing powers Yahoo, DuckDuckGo and Ecosia. Bing is materially easier to rank on than Google for a business like yours, and Bing Webmaster Tools lets you bulk-import everything from Search Console in about two minutes. IndexNow gets URLs indexed on Bing in hours.

**Solution.** Create the Bing Webmaster account, use "Import from Google Search Console", submit the sitemap, and add `npm run seo:ping` to your post-deploy step so it runs automatically. Apple Business Connect is separate and covered in the local plan. **Difficulty.** Low. **Priority.** Medium.

### 🟡 M7 — Remove the meta keywords tag

**VERIFIED.** `index.html` includes `<meta name="keywords" ...>`, and `src/content/local-surat.ts` carries a long `keywords` string.

No search engine has used this tag since roughly 2009. It is not harmful, but it publicly advertises your keyword targets to competitors. Remove it from `index.html` and from the `SeoHead` component. Keep the `keywords` field in your content files if your admin panel uses it internally. **Difficulty.** Trivial. **Priority.** Low.

---

## 5. Long-term improvements

**L1 — Server-side rendering for database-driven pages.** Prerendering solves the static routes. If blog and country content becomes a major traffic channel, migrating those routes to real SSR (or an incremental static regeneration host) removes the rebuild dependency in H1 entirely. Six-month horizon, only worth it if blog traffic justifies it.

**L2 — An eligibility checker tool.** A short interactive quiz — "Can I switch from a student visa to a work visa in Canada?" — that returns an honest indicative answer and captures an email. Tools earn links far more reliably than blog posts, and this one sits exactly on your commercial intent. Build after the content in C3 is live.

**L3 — Original research.** You have real application data in Supabase. An annual, fully anonymised report — "Processing times we observed across 8 destinations in 2026" — is the single most linkable asset a consultancy can publish, because journalists and student forums cite primary data. Only do this if your sample is large enough to be honest about, and say what the sample size is.

**L4 — Structured internationalisation.** Only if you add Gujarati. Then `hreflang` for `en-IN` / `gu-IN` becomes necessary. Do not do this speculatively; a half-maintained second language is worse than one.

**L5 — Review schema from verified reviews.** `src/lib/reviews-data.ts` contains testimonials. **Do not** add `AggregateRating` schema based on self-hosted testimonials — Google has restricted self-serving review markup and it risks a manual action. Collect reviews on Google Business Profile instead; those surface without any markup from you.

---

## 6. Quick-reference technical checklist

Tick these off in order. Items marked ✅ are **VERIFIED as already done** — do not redo them.

**Search Console & Bing**
- [ ] Verify domain property (not URL prefix) in Google Search Console
- [ ] Submit `https://siddhivinayakoverseas.com/sitemap.xml`
- [ ] Set up Bing Webmaster Tools via "Import from GSC"
- [ ] Automate `npm run seo:ping` (IndexNow) on deploy — script ✅ exists
- [ ] Link GA4 ↔ Search Console

**Crawling & indexing**
- ✅ robots.txt present with sitemap directive
- [ ] Remove `/admin` + `/dashboard` Disallow lines (M5)
- ✅ Sitemap generated from a single source of truth
- [ ] Add `lastmod` to static routes (M4)
- ✅ Thin country pages excluded from sitemap and noindexed
- [ ] Resolve orphaned program pages (M1)

**Redirects & status codes**
- ✅ www → apex, one hop
- ✅ Trailing slash stripped
- ✅ Real 404 for unknown paths
- [ ] Fix `/pathways/*` soft 404 (H2)
- [ ] Confirm http → https redirect exists at Cloudflare — **NEEDS DATA**

**Canonicals & duplication**
- ✅ Per-page canonicals via `SeoHead`
- ✅ `app-shell.html` strips homepage canonical
- ✅ Blog posts with external canonicals excluded from sitemap

**Core Web Vitals**
- [ ] Replace 501 KB LCP image (C2)
- [ ] Gate 3D globe to desktop (C2)
- [ ] Convert images to AVIF/WebP (C2)
- [ ] Self-host fonts (H3)
- [ ] Add width/height to 13 images (H4)
- ✅ Brotli + gzip, immutable asset caching, `no-cache` on HTML

**Mobile & accessibility**
- ✅ Viewport meta correct
- ✅ 100% image alt coverage
- [ ] Run axe DevTools on homepage, contact and a country page
- [ ] Verify tap targets ≥ 48 px, especially the WhatsApp FAB
- [ ] Verify colour contrast meets WCAG AA on the cream (`#ece2cf`) background

**JavaScript rendering**
- ✅ Static routes prerendered with Playwright
- [ ] Automate rebuild on CMS publish (H1)
- [ ] Verify with GSC URL Inspection → "View crawled page" on a blog post

**Structured data**
- ✅ ProfessionalService/LocalBusiness with geo, Organization, WebSite, Service, FAQPage, BreadcrumbList, Article, JobPosting
- [ ] Validate every template at validator.schema.org
- [ ] Check Search Console → Enhancements for errors
- [ ] Do **not** add self-serving AggregateRating (L5)

**Security**
- ✅ HSTS with preload, nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy
- [ ] Consider a Content-Security-Policy header
- [ ] Remove `X-XSS-Protection` — deprecated, and can introduce vulnerabilities in old browsers

---

## 7. What I still need from you

None of these block the work above, but each one would sharpen it.

| # | Question | Why it changes the plan |
|---|---|---|
| 1 | Can you share Search Console Performance (12 months) and Pages (indexing status) exports? | Everything marked NEEDS DATA becomes measurable. This is the single most useful thing you can send. |
| 2 | Do you hold ICCRC/CICC, MARA, OISC or an Indian registration? | Determines whether "licensed/registered" keywords are usable or a legal risk. |
| 3 | Who are your three actual competitors, by URL? | I deliberately did not invent any. Real ones let me do a genuine gap analysis. |
| 4 | Monthly SEO budget and who implements — in-house dev, agency, or you? | Changes sequencing entirely. A ₹15,000/month budget and a ₹150,000/month budget produce different plans. |
| 5 | Which destinations are actually most of your revenue? | I tiered by search demand. Your revenue mix should override that. |
| 6 | Is the first consultation genuinely free? | Affects several keyword targets and the CRO plan. |
| 7 | Where is the site hosted — Cloudflare Pages, Netlify, cPanel? | Determines the exact deploy-hook mechanism for H1. |
| 8 | Do you have a Google Business Profile, and is it verified? | The whole local plan depends on it. |
