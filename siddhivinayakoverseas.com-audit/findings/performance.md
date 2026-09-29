# Performance / Core Web Vitals — findings

The delegated performance agent died on an API rate limit mid-run. This file was produced
inline, with a reduced method — read the limitations before acting on it.

## Limitations, stated up front

- **No field data.** No Google API credentials are configured, so CrUX was unavailable.
  Everything below is lab data from a single browser on one connection, which is not what
  Google ranks on. CrUX/Search Console is the only source that reflects real users.
- **PageSpeed Insights was unavailable** — the API returned
  `PSI rate limit exceeded (240 QPM / 25,000 QPD)` on every attempt, because the agent that
  died had already exhausted the quota. No Lighthouse scores were obtained.
- **LCP and INP were not captured.** The browser used did not surface
  `largest-contentful-paint` entries, and INP needs real interaction. **The two Core Web
  Vitals that matter most are therefore unmeasured.** Treat this section as partial.

## What was measured

Mobile viewport emulation (375×812), live site:

| metric | `/` | `/study-visa` | Google threshold |
|---|---|---|---|
| CLS | **0.0005** | **0.0005** | < 0.1 = good |
| TTFB | 976 ms | 397 ms | < 800 ms = good |
| DOM interactive | 1,047 ms | — | — |
| Load event | 1,769 ms | 735 ms | — |
| Requests | 21 | 18 | — |

**CLS at 0.0005 is effectively zero** — 200× inside the threshold. Layout stability is a
solved problem on this site; the prerendered HTML plus reserved image dimensions are doing
their job. Do not spend effort here.

**TTFB is inconsistent**: 976 ms on the homepage versus 397 ms on `/study-visa`, same
session. The homepage is the slower document and it is the one most people land on. Worth a
second look, though shared hosting variance could explain it — re-measure before acting.

## HIGH — 1.9 MB of JavaScript on a prerendered content page

`/study-visa` downloads **1,953 KB of decoded JavaScript** against **7 KB of images**.

That is a lot of JavaScript for a page whose content is already in the HTML. It does not
hurt CLS and probably does not hurt LCP much — the prerendered markup paints first — but it
is the main suspect for **INP**, the CWV that was not measurable here, because interaction
responsiveness is dominated by main-thread work during hydration.

Contributing factors visible in the repo:

- `three.js` powers the homepage 3D earth. `vite.config.ts` does manual chunking, so verify
  it is not pulled into the shared vendor chunk that every route loads — a globe on the
  homepage should not cost `/study-visa` anything.
- Large textures sit in `public/`: `earth-texture.jpg`, `earth-clouds.png`, `stars-bg.jpg`,
  plus `earth-poster-768.{avif,webp,jpg}`. Images were only 7 KB on `/study-visa`, so these
  are correctly not loading there — good. Confirm the same on `/`.

**Next step, in order:** get CrUX field data via Search Console (free, and it replaces every
lab number here), then run Lighthouse once the PSI quota resets, then look at INP
specifically rather than at the JS figure in isolation.

## What is already good

- CLS is excellent sitewide.
- Brotli and gzip are configured; hashed assets carry `Cache-Control: immutable, max-age=31536000`;
  HTML is `no-cache, must-revalidate` so deploys are picked up immediately. That caching
  strategy is correct.
- Only 18–21 requests per page.
- Fonts are preconnected and preloaded with `fetchpriority="high"`.
