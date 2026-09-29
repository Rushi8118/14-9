# Action Plan — siddhivinayakoverseas.com

Ordered by impact per hour of work. Do Phase 1 before anything else; several Phase 2 and 3
items are wasted effort until Phase 1 lands.

---

## Phase 1 — Week 1

### 1. Connect Google Search Console  ·  30 min  ·  do this first

This audit ran blind. No indexation status, no query data, no organic traffic, no field
Core Web Vitals. You are optimising without knowing which of the 92 pages Google has
actually indexed or what anyone searches to reach you.

Verify the domain, submit `sitemap.xml`, and use **URL Inspection** on three URLs
specifically:

```
https://siddhivinayakoverseas.com/blog/italy-healthcare-jobs-850-urgent-vacancies
https://siddhivinayakoverseas.com/urgent-requirements/israel-warehouse-worker-jobs
https://siddhivinayakoverseas.com/guides/japan-ssw-visa-guide
```

The first two will show you exactly what item 2 is about.

### 2. Prerender the 25 shell pages  ·  2–4 h

`scripts/prerender.mjs:27`:

```js
const SKIP_PREFIXES = ['/blog/', '/urgent-requirements/']
```

These 25 URLs are in your sitemap but serve a 5.8 KB document with 10 words, no `<h1>`,
no canonical, no structured data, and **the same title and meta description on all 25**.
The content is real — up to 2,079 words — but only after JavaScript runs.

Remove both prefixes. `scripts/seo-routes.mjs:200-221` already pulls these slugs from
Supabase for the sitemap, so the data path exists; the prerender just has to visit them.

### 3. Replace react-helmet-async  ·  4–6 h

`react-helmet-async@2.0.5` is its author's final release and its peer range stops at React
18. You are on React 19.2.8. **It emits nothing.**

Verified on the live site — clicking from `/` to `/study-in-canada`:

| | before | after |
|---|---|---|
| title | homepage title | **unchanged** |
| canonical | `…com/` | **still `…com/`** |

The Canada page declares the homepage as its canonical. On a blog URL,
`document.head.querySelectorAll('[data-rh]').length` is `0`.

Your page components are fine — `BlogPostPage.tsx:78-91` and
`UrgentRequirementDetailPage.tsx:207-221` declare correct tags. The library never applies
them.

React 19 hoists `<title>`, `<meta>` and `<link>` to `<head>` natively. Delete the
dependency and `HelmetProvider` (`src/main.tsx:34`) and render the tags directly. This
removes an unmaintained package rather than swapping in another one.

> Items 2 and 3 are both required. Prerendering fixes what Googlebot sees on first load;
> the metadata fix stops the canonical pointing at the wrong page everywhere else.

### 4. Make the 147 hidden FAQ answers visible  ·  1 day

Across 51 pages, **147 of 159 FAQ answers (92%) exist only in JSON-LD**. On 43 pages *no*
answer renders. Every question is visible; the answers are not.

Google's structured-data policy prohibits marking up content that is not visible to users.
This is the one finding in the audit that carries a manual-action risk.

Render the answers as expanded, self-contained 40–60 word responses. This fixes the policy
problem **and** creates the extractable passages the AI-search finding asks for — one piece
of work, two outcomes.

### 5. Fix the guarantee copy  ·  2 h + legal review

Homepage, verbatim: *"transition to lawful work visas with **fixed jobs, guaranteed
statutory salaries**, and company benefits"* — also in the homepage meta description and a
nav label.

No consultancy can guarantee a foreign employer's salary or a visa grant. In a YMYL vertical
this is what rater guidelines treat as untrustworthy.

Separately and more seriously: recruiting Indian nationals for overseas employment is
regulated under the **Emigration Act 1983** via the Protector General of Emigrants, and no
registration number appears anywhere on your site. I am not giving legal advice and I have
not established whether you hold a licence — but this needs a professional opinion before
the copy stays up. If you hold one, display it; it is also a strong trust signal.

Suggested replacement: "employer-sponsored roles with contracts stating statutory minimum
salaries", plus an explicit line that visa decisions rest with the immigration authority.

---

## Phase 2 — Weeks 2–3

### 6. Shorten 50 over-length titles  ·  3 h

50 of 92 titles exceed 60 characters, 34 exceed 70, longest is 87. The suffix
`| Siddhivinayak Overseas` costs 24 characters on every page.

`SeoHead.tsx:27-31` **already solves this** — it drops the brand suffix past 65 characters.
The pages that overflow are the ones calling Helmet directly instead of going through
`SeoHead`. Route them all through `SeoHead`; no new logic needed.

Worst offenders: `/post-study-work-visa` (87), `/services` (83), `/regional-coverage` (80),
`/study-visa` (78), `/` (77).

### 7. Google Business Profile  ·  2 h + verification wait

There is **no Google Maps presence anywhere on your site** — no embed, no directions link,
no GBP URL in `sameAs` (which has only Instagram and Facebook).

For a Surat walk-in office competing on "visa consultants in surat", GBP is the single
biggest lever available, and it sits outside the website entirely.

- Claim/verify the profile
- Add its URL to `sameAs`, plus a Get Directions link
- Add `openingHoursSpecification` to LocalBusiness **and** visible hours to `/contact`
  (markup must describe visible content)
- Verify the Instagram URL: it reads `instagram.com/siddhivinyakoverseas` — `vinyak`, not
  `vinayak`. A `sameAs` pointing at a 404 is worse than none.

### 8. Rescope areaServed  ·  1 h

Your `LocalBusiness` schema lists Surat + Gujarat + all 28 states + 8 UTs + India — 37+
entries on a single-location entity. This tells Google's entity model "pan-India business"
rather than "Surat business", working against map-pack relevance, and it does not help the
pan-India side either (`areaServed` does not drive organic ranking in other cities).

Scope it to Surat and South Gujarat. Move the all-India/Nepal/Bangladesh claim to the
`Organization` and `Service` nodes, where it belongs.

### 9. Add named people to /about  ·  1 day

`/about` is 231 words with no name, qualification, photo, GST, CIN or accreditation — just
"6+ years", "500+ clients", "thousands of families". For YMYL this is the weakest possible
authorship signal.

Named counsellors with credentials, plus bylines on every `/guides/*` page.

---

## Phase 3 — Month 2

### 10. Rebuild three guides — not all nine  ·  3–5 days

The nine `/guides/*` pages average **201 words** of main content while targeting queries led
by gov.uk and IRCC. Padding them is the wrong fix; the gap is coverage, not length.

Start with the three closest to your actual business, where you have genuine experience to
show:

- `/guides/japan-ssw-visa-guide` — your strongest differentiator
- `/guides/canada-study-visa-documents`
- `/guides/visa-rejection-reasons`

Every factual claim gets a figure, the official source, and the date checked. Measure those
three in Search Console before touching the other six.

### 11. Add real numbers everywhere  ·  3–5 days

All eight guides and all nine study-in pages contain **zero currency figures**.
`/study-in-germany` mentions the blocked account three times without ever stating its value.
`/study-in-canada` says "Exact figures depend on city and program."

There are also **zero `<table>` elements on the entire site**.

This is why AI search will not cite you: there is nothing specific enough to quote. Add
blocked-account amounts, GIC and proof-of-funds figures, tuition and living-cost ranges, SSW
sector lists and language thresholds — each with source and date.

### 12. Differentiate the 22 country pages  ·  1–2 weeks

11 `/work-visa/*` and 11 `/study-in-*` pages share one template with the country swapped.
Not thin (median 787 words) but interchangeable. Use `/work-visa/japan` — which names the
SSW and Engineer routes specifically — as the model.

### 13. Reviews — the right way  ·  ongoing

`/reviews` has first-party testimonials with visible stars and no markup.

**Do not add `AggregateRating` to them.** Google prohibits self-serving aggregate ratings
from self-collected testimonials, and it is a common manual-action trigger. Route customers
to Google Business Profile reviews instead: they feed the map pack directly, need no markup,
and are the third-party corroboration that AI search actually weighs.

---

## Phase 4 — Ongoing

- Pull **CrUX field data** from Search Console once collected. This audit measured CLS at
  0.0005 (excellent) but **could not measure LCP or INP** — no credentials, and the
  PageSpeed Insights quota was exhausted.
- Run Lighthouse once that quota resets, and look at **INP** specifically. `/study-visa`
  ships **1.9 MB of JavaScript** against 7 KB of images, which is the main suspect.
- Check `vite.config.ts` that three.js (homepage globe) is not in the vendor chunk every
  route loads.
- Re-audit after Phase 1 to confirm the 25 pages now serve unique titles and canonicals.

---

## Deliberately not recommended

Worth stating, because these are commonly sold as wins and would waste your money here:

| | why not |
|---|---|
| Expanding FAQPage markup for rich results | Since Aug 2023 Google shows FAQ rich results only for government and health sites. Keep the 51 existing blocks for entity understanding; add no more for this purpose. |
| `llms.txt` | No major AI search product has confirmed using it. Google ignores it. |
| Review schema on your testimonials | Policy violation risk with no upside — see item 13. |
| Chasing "study in canada from india" | The SERP is government and major-aggregator owned. A consultancy will not rank. Long-tail and local terms are where your effort converts. |
| Fixing CLS | Already 0.0005, which is 200× inside the threshold. Nothing to gain. |
| Rewriting all nine guides at once | Prove the approach on three first. |
