# SEO Fixes Applied — 23 September 2026

Implements findings from [`technical-audit.md`](./technical-audit.md). Every measurement below was taken with Playwright against a production build (`npm run build:only` + `vite preview`), not estimated.

---

## Measured result

| | Before | After | Change |
|---|---|---|---|
| **Homepage, mobile (390×844)** | ~576 KB | **~75 KB** | **−87%** |
| **Homepage, desktop (1440×900)** | ~731 KB | **~231 KB** | **−68%** |
| **LCP element** | `earth-blue-marble.jpg` (501 KB) | `earth-poster-768.avif` (**56 KB**) | **−89%** |
| **Globe textures** | 1,302 KB | 161 KB | −88% |
| **JS preloaded before first paint** | 13 vendor chunks (~1.5 MB) | 9 chunks | three.js + charts removed |
| **three.js on mobile** | Downloaded (890 KB) | **Not downloaded** | eliminated |

Verified in Chromium: LCP element is the AVIF; `canvas` count is 0 on mobile and 1 on desktop, so the globe still works where it should. All 92 routes prerender, typecheck passes, production build succeeds.

---

## C1 — Analytics tag (Critical)

**Was:** `src/lib/analytics.ts` fired `phone_click`, `whatsapp_click` and `form_submit` from 8 call sites. No GA4/GTM tag existed anywhere, so `window.gtag` was undefined and every call silently did nothing.

**Now:**
- `initAnalytics()` in `src/lib/analytics.ts` loads GA4 or GTM at runtime from an env var, so no tag ID is committed to the repository.
- `trackPageView()` added, because GA4 cannot see React Router navigations.
- `AnalyticsPageViews` in `src/App.tsx` fires a `page_view` on every route change, after a tick so `react-helmet-async` has applied the new title.
- Called once from `src/main.tsx`.

**Verified in a browser:** `typeof window.gtag === 'function'`, the tag script is requested with the configured ID, and `dataLayer` gains a second `page_view` entry after navigating from `/` to `/work-visa`.

### What you must do — this is the one step I cannot do for you

1. Create a GA4 property at analytics.google.com, copy the Measurement ID (`G-XXXXXXXXXX`).
2. Add it to your **hosting provider's environment variables** (not a committed file):
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Or, to use Tag Manager instead, set `VITE_GTM_ID=GTM-XXXXXXX`. GTM takes precedence.
3. Redeploy. Vite inlines env vars at build time, so a rebuild is required.
4. In GA4 → Admin → Events, mark `phone_click`, `whatsapp_click` and `form_submit` as **Key events**.
5. Link GA4 to Search Console.

Without the variable, nothing is injected and every call stays a no-op — correct behaviour for local development.

---

## C2 — Largest Contentful Paint (Critical)

**Was:** `hero.tsx` loaded a 501 KB JPEG at `fetchPriority="high"` into a 256 px container, then pulled 1.3 MB of textures. No WebP or AVIF existed.

**Now:**
- `scripts/optimize-images.mjs` (new, `npm run images`) generates all derivatives with `sharp`. Reproducible — rerun it whenever a source image changes.
- Hero uses `<picture>` with AVIF → WebP → JPEG at 768 px.
- `index.html` preloads the AVIF, so it starts downloading before the JS parses.
- **Removed a second preload of the full-size 501 KB texture** in `HomePage.tsx`, which was silently cancelling the benefit. Testing caught this; source review had not.
- `useGlobeEnabled()` gates the 3D globe to ≥1024 px viewports and respects `navigator.connection.saveData`. Previously `setShowGlobe` was never called, so the globe always loaded.
- `interactive-globe.tsx` now loads `.webp` textures.

| File | Before | After |
|---|---|---|
| earth-blue-marble.jpg → poster AVIF | 501 KB | 56 KB |
| earth-blue-marble.webp | 501 KB | 50 KB |
| earth-normal.webp | 329 KB | 22 KB |
| earth-specular.webp | 218 KB | 11 KB |
| earth-clouds.webp | 254 KB | 72 KB |

`sharp` added to `devDependencies`.

---

## 17 — Every vendor chunk preloaded (Critical, newly found)

This was **not** in the original audit. I found it by measuring rather than reading.

**Was:** the `manualChunks` config in `vite.config.ts` named `vendor-three`, `vendor-three-stdlib`, `vendor-react-three` and `vendor-charts`. Naming them made Rollup treat them as entry-chunk dependencies, so `dist/index.html` emitted `modulepreload` links for all 13 vendor chunks — roughly **1.5 MB of JavaScript, including 890 KB of three.js and 392 KB of recharts, on every page of the site**, whether or not anything used them.

I confirmed it was pre-existing by stashing my changes and rebuilding: the same preloads appeared on the committed code.

**Now:** those four rules are removed. Rollup code-splits three.js and recharts into the dynamic chunks that actually import them. The globe fetches three only when it renders; the admin dashboard fetches recharts only when opened.

**Verified:** on a 390 px viewport the homepage no longer requests any three.js chunk. On desktop it does, and the canvas renders.

---

## Other fixes

| Finding | Change |
|---|---|
| **H2** soft 404 | `PathwayPage.tsx` renders `<NotFoundPage />` instead of `<Navigate to="/pathways">`. Verified: `/pathways/nope` serves the 404 page with `noindex, follow`, and `/pathways/canada-pgwp-to-pr` stays `index, follow`. The 404 page is imported lazily — importing it statically added 83 KB to every valid pathway page, which testing caught. |
| **H4** CLS | `BlogPostPage` featured image given `aspect-[16/9]` (dimensions are unknown until load, so CSS reserves the space); `StudyVisaPage` hero given explicit `width`/`height`. Admin and dashboard images left alone — they are `noindex`. |
| **M4** sitemap `lastmod` | `scripts/seo-routes.mjs` derives `lastmod` from `git log -1` on the content file backing each route. 76 static routes now carry a real date instead of none. Dates are not faked on unchanged pages. |
| **M5** robots.txt | `Disallow` removed for `/admin`, `/dashboard`, `/403`. They already send `X-Robots-Tag: noindex` via `.htaccess`; blocking crawlers stopped them reading it. |
| **M7** meta keywords | Removed from `index.html` and `SeoHead.tsx`. The `keywords` prop stays so content files keep their internal notes. |
| **M3** service worker | `public/sw.js` deleted — never registered anywhere, and its precache list was already wrong. |
| **H3** fonts | `preconnect` to `fonts.gstatic.com` added (only `fonts.googleapis.com` was covered, so the font files themselves paid a full handshake). Self-hosting is still the better fix and remains open. |

---

## Still open — and why

| Finding | Why I did not do it |
|---|---|
| **C3** post-study pages | Content work, not code. It needs a writer with current immigration knowledge, and my recommendation (Option A: keep `/pathways/*`, rewrite titles and H1s) changes user-visible copy on live pages. Your call. |
| **H1** rebuild on CMS publish | Needs a deploy-hook URL from your host, which I do not have. |
| **M1** orphaned program pages | Needs your decision: index them with real content, or `noindex`. Either is defensible; guessing is not. |
| **M2** dead directories | **Awaiting your OK.** `app/`, `components/`, `lib/`, `hooks/`, `auth/`, `countries/`, `dashboard/` (~1.3 MB) duplicate `src/` and are imported by nothing. Deleting 1.3 MB of files is not something I will do unasked. Say the word and it is a one-line commit. |
| **M6/M14** Bing, IndexNow, GBP | Account setup, not code. |

---

## Two things I found that were not in the audit

**1. Your dependency install is broken on a clean checkout.** `npm install` fails with `ERESOLVE`: `react-helmet-async@2.0.5` declares a peer range of React 16–18, and the project is on React 19. It installs only with `--legacy-peer-deps`. This is pre-existing and unrelated to SEO, but it will bite a new developer or a CI runner. Options: pin `overrides` in `package.json`, or migrate to `react-19` compatible head management. Worth a separate ticket.

**2. Prerendering depends on the Playwright browser version.** `scripts/prerender.mjs` calls `chromium.launch()` with no `executablePath`. If the CI image's browser revision does not match the installed Playwright version, the build fails at the prerender step with "Executable doesn't exist". If your deploys ever fail there, that is the cause — supporting a `PW_CHROMIUM_PATH` env var would make it robust. I did not change it, since your current pipeline evidently works.

---

## How to verify after deploying

1. **Analytics:** open the site on your phone, tap the footer phone number. GA4 → Reports → Realtime should show `phone_click` within about a minute.
2. **LCP:** PageSpeed Insights on the homepage, mobile. The LCP element should be `earth-poster-768.avif`. Compare against the baseline you captured before these changes — if you did not capture one, the Search Console field data in 28 days is your next-best comparison.
3. **404:** `curl -I https://siddhivinayakoverseas.com/pathways/does-not-exist` — the page must no longer redirect.
4. **Sitemap:** confirm `<lastmod>` appears on country and study pages.
5. **Globe:** open the homepage on a phone (poster image, no 3D) and on a desktop (interactive globe).
