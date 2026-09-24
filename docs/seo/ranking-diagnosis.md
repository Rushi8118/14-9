# Why the site is not ranking — diagnosis & full SEO report

**Date:** 23 September 2026
**Site:** https://siddhivinayakoverseas.com
**Method:** live crawl of the production site as Googlebot, header/response testing, full source review of this repository at `629288e`, index-coverage sampling via Bing/DuckDuckGo, Wayback history, DNS records.

Every number below came from a request I made or a file in this repo. Where I could not verify something without your Search Console login, I say so instead of guessing.

> **Update — code fixes applied.** Findings 7 (duplicate country pages), 8 (keyword stuffing) and §3.4 (`/countries/*` empty states) have been addressed in code. See [`fixes-2-content-quality.md`](./fixes-2-content-quality.md) for what changed, what it measured, and the content backlog that remains. The findings below are left as originally written, as the record of what was found.

---

## 1. Bottom line

**The site is not failing on SEO craft. It is failing on age, authority and deployment.**

The build in this repository is genuinely well made — better than most small-business sites. But three things are true at the same time:

1. **The site is 3 weeks old** (first commit 31 Aug 2026). Nothing about it is broken because it isn't ranking yet; new sites in a competitive money vertical do not rank in three weeks.
2. **The good work is not on the internet.** The production server is running an *old build*. Every performance fix, the GA4 tag and the newest content are sitting in git, undeployed.
3. **The domain has no authority signal of any kind.** Zero editorial backlinks found. No Google Business Profile located. The brand name collides with a temple, a spice exporter and a different Delhi visa consultancy.

Ranked by how much each is actually costing you:

| # | Cause | Severity | Evidence |
|---|---|---|---|
| 1 | Site is 3 weeks old, domain had no content until now | 🔴 Dominant | First commit 31 Aug 2026; Wayback shows the domain returning **404 in Jan 2024** — it was dormant, so the 2009 registration date buys you nothing |
| 2 | Almost nothing is indexed | 🔴 Critical | Sampling Bing/DDG returns **~11 URLs** out of **115 in your sitemap**. Zero `/study-in-*` pages. Zero `/guides/*` pages. |
| 3 | Production is running a stale build | 🔴 Critical | Live homepage still preloads 14 vendor chunks incl. `vendor-three` (~890 KB) and uses the 501 KB `earth-blue-marble.jpg` hero. Live JS bundle contains **no GA4 ID**. |
| 4 | Host serves a **403 bot challenge** to lean requests | 🔴 Critical (unconfirmed for real Googlebot) | Reproducible: UA + `Accept-Encoding` only → `403` + "Checking your browser before accessing" page, **site-wide including `/robots.txt` and `/sitemap.xml`** |
| 5 | Zero backlinks, zero brand entity | 🔴 Critical | No editorial links found to the domain. Brand name ambiguous against Siddhivinayak Temple / a spice exporter / a Delhi consultancy of the same name |
| 6 | No Google Business Profile found | 🔴 Critical for local | "visa consultants in Surat" is a map-pack query. Directory listings show a **different Surat address** (Sagrampura) than your site (Pragti IT Park) |
| 7 | 35 of 40 work-visa country pages are 95% identical | 🟠 High | Measured text similarity **0.94–0.97** between `/work-visa/albania`, `/moldova`, `/denmark` with the country name neutralised |
| 8 | Undeployed change would print **7,819 keywords** across 56 pages | 🔴 Do not ship | `/work-visa` alone renders **616** keyword phrases in a "Popular searches" block |

---

## 2. The five things that are actually blocking you

### 2.1 🔴 The live site is an old build

This is the most fixable thing on the list and nobody has noticed it.

| Signal | Live production | This repo's build |
|---|---|---|
| Hero image | `earth-blue-marble.jpg` (501 KB) | `earth-poster-768.avif` (56 KB) |
| Vendor chunks preloaded | **14**, incl. three.js + charts | 9, three.js excluded on mobile |
| GA4 measurement ID in bundle | **absent** | `G-MDVF551H1C` present |
| Sitemap URLs | 115 | 121 |

`docs/seo/fixes-applied.md` documents a −87% mobile payload reduction. **None of it is serving.** Real users and Googlebot are still getting the heavy version, and you have had **zero analytics data since launch** — so you cannot see impressions, clicks or conversions even if they exist.

**Action: deploy `main`. Today.** Then confirm by checking that the live homepage source references `earth-poster-768.avif` and the bundle contains `G-MDVF551H1C`.

### 2.2 🔴 Your host returns 403 to bot-shaped requests

Hostinger's `hcdn` edge serves an HTTP **403** with a JS challenge page (`<title>Checking your browser before accessing. Just a moment...</title>`, `meta robots noindex,nofollow`, `meta refresh 30`) to any request it fingerprints as automated.

Reproducible, deterministic, and it covers everything:

```
Googlebot UA + Accept-Encoding, nothing else:
  /             403
  /robots.txt   403
  /sitemap.xml  403
  /work-visa    403
  /assets/*.js  403
```

Adding any third header makes it pass with 200. Real Googlebot sends more than two headers, so it *probably* gets through — but a challenge that also fires on `robots.txt` and `sitemap.xml` is exactly the shape of problem that produces the index coverage you have (11 of 115 URLs).

**I could not confirm whether real Googlebot trips this**, because my requests come from a non-Google IP and the WAF may whitelist verified crawler IPs. **You must check this — it is the single highest-value thing on this list:**

1. Search Console → Settings → **Crawl stats** → look for any `403` or "Other client error (4xx)" rows.
2. Search Console → **URL Inspection** → paste `https://siddhivinayakoverseas.com/study-in-canada` → **Test Live URL** → check "Page availability" and view the rendered HTML.
3. If either shows a 403 or the challenge page: open a Hostinger ticket asking them to **exclude verified search-engine crawlers from the bot challenge**, and at minimum exempt `/robots.txt`, `/sitemap.xml` and `/assets/*`.

Also, per `public/cloudflare-setup.md`, there is a WAF rule proposed as **"Block Bad Bots"** using `(cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawlers"})`. If Cloudflare is live in front of this site, verify that rule is not catching AI crawlers and secondary search bots you explicitly allow in `robots.txt`.

### 2.3 🔴 Only ~11 URLs are known to search engines

Index sampling found these and essentially nothing else:

```
/                                    /pathways
/about                               /pathways/new-zealand-accredited-employer-work-visa
/contact/            ← trailing slash /pathways/pakistan-to-europe-work-visa
/login               ← should not be  /reviews
/work-visa/          ← trailing slash /countries/new-zealand
/work-visa/poland/   ← trailing slash /blog/israel-work-and-travel-opportunity
/work-visa/portugal                  /urgent-requirements/israel-visit-visa-jobs-...
```

Two things stand out:

- **Zero `/study-in-*` pages and zero `/guides/*` pages are indexed.** Those are your best, most unique content. They are invisible.
- **Trailing-slash URLs are in the index** (`/contact/`, `/work-visa/`, `/work-visa/poland/`). Your `.htaccess` now 301s these correctly, so they will consolidate — but it confirms the index contains a stale, pre-fix snapshot.
- **`/login` is indexed.** It carries `noindex, follow` in the React render, but it is served via `app-shell.html` so a crawler that does not execute JS sees an indexable page. The `X-Robots-Tag: noindex` header in `.htaccess` should cover it — verify with `curl -I https://siddhivinayakoverseas.com/login`.

**Action:** in Search Console, submit the sitemap, then use **URL Inspection → Request Indexing** on your 10 priority pages (home, `/visa-consultants-in-surat`, `/study-in-canada`, `/study-in-uk`, `/study-in-australia`, `/work-visa`, `/work-visa/germany`, `/work-visa/japan`, `/study-visa`, `/contact`). Check the **Pages** report for the exact reason each excluded URL is excluded — "Discovered – currently not indexed" means a quality/authority problem, "Crawled – currently not indexed" means Google saw it and declined, and "Blocked" or "Page with redirect" means a technical fault.

### 2.4 🔴 Zero backlinks and no brand entity

Searching for the domain returns no editorial links — only your own Instagram and unrelated companies. Google has no external corroboration that this business exists.

Worse, **"Siddhivinayak Overseas" is an ambiguous entity**:

- Siddhivinayak Temple, Mumbai (a national landmark) dominates the name
- A merchant exporter of spices and handicrafts trading as "Siddhivinayak Overseas" on Amazon and Walmart
- A *different* visa consultancy called Siddhivinayak Overseas, registered in New Delhi since 2015
- A separate live website at **siddhivinayakoverseas.in** (GoDaddy builder) using the same brand name

If that `.in` site is yours, it is splitting your brand signals and should 301 to the `.com`. If it isn't yours, you have a brand collision you need to out-rank. **Tell me which it is — this matters.**

**Action (this is your highest-leverage off-page work):**
1. Claim listings with **identical NAP** on JustDial, Sulekha, IndiaMART, Google Business Profile, Bing Places, Facebook, LinkedIn, Instagram.
2. Add every one of those profile URLs to the `sameAs` array in `src/lib/seo/schema.ts` — it currently lists only Instagram and Facebook.
3. Get listed in Surat business directories, the local chamber of commerce, and any education-fair or partner-institution pages.

### 2.5 🔴 No Google Business Profile — and a NAP conflict

"Visa consultants in Surat" is a **local-pack query**. The three map results take the clicks. No amount of on-page work wins that without a verified Google Business Profile.

I could not find a GBP for the Pragti IT Park address. What I *did* find is a directory listing (Officedial) showing **Siddhivinayak Overseas at 2/4480, 102-Dharmanath Complex, Shivdas Zaveri Street, Sagrampura, Surat 395002** — a different address from the one in your schema (`620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat 395006`).

Conflicting addresses for one brand is a direct local-ranking suppressor.

**Action:** create/claim the GBP at the Pragti IT Park address, verify it, then correct or remove every listing showing the old address. Then run a review campaign — you have 30+ genuine testimonials in `src/lib/reviews-data.ts`; those people should be leaving Google reviews, not just on-site quotes.

---

## 3. Full technical SEO audit

### 3.1 What is already correct — do not let anyone "fix" these

- ✅ **Genuine prerendering.** 116 routes rendered to static HTML with Playwright. Googlebot gets full content without executing JS. Verified live.
- ✅ **HTTPS, HSTS, one-hop canonicalisation.** `http://` → `https://`, `www` → apex, trailing slash → no slash. All single 301s.
- ✅ **Real 404s.** `/this-page-does-not-exist` returns HTTP 404 with `noindex, follow`, not a soft 404.
- ✅ **Fast server.** Median TTFB across all 115 sitemap URLs: **0.17s**, p90 0.27s, max 0.39s. All 115 return 200.
- ✅ **Correct canonicals** on every prerendered page, self-referencing and absolute.
- ✅ **Schema done properly:** `Organization`, `WebSite`, `ProfessionalService`/`LocalBusiness` with real geo coordinates, `Service`, `BreadcrumbList`, `FAQPage`, `JobPosting`. Valid JSON-LD.
- ✅ **No fake review markup.** You have 30+ testimonials on-site and correctly did *not* wrap them in `AggregateRating` — that would be a manual-action risk. Good call.
- ✅ **100% image alt coverage** on public pages.
- ✅ **robots.txt explicitly allows AI crawlers** (GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider) — right call for AI-search visibility.
- ✅ **Search Console is verified** — two `google-site-verification` TXT records on the domain.

### 3.2 Crawlability & indexing

| Check | Result |
|---|---|
| robots.txt | ✅ Correct, sitemap declared |
| Sitemap valid, all 200 | ✅ 115/115 |
| Sitemap ↔ live parity | ⚠️ Repo has 121 URLs, live has 115 — undeployed |
| `<lastmod>` | ⚠️ Present on some URLs, missing on core pages (`/`, `/study-visa`, `/work-visa`) |
| Soft 404s | 🟠 `/countries/zzz`, `/blog/zzz`, `/countries/canada/programs` all return **200** with `app-shell.html` |
| Orphaned routes | 🟠 `/countries/:slug/programs/:programSlug` — indexable, not in sitemap, not linked |

**Soft 404s:** `.htaccess` rule 5 sends any unmatched `/blog/*`, `/countries/*` and `/urgent-requirements/*` to `app-shell.html` with a 200. The shell strips the canonical and robots tags (good), but a non-JS crawler still sees a 200 page. Fix: have the React 404 view set a `noindex` tag *and* have the server return 404 for these, or accept the soft 404 and keep the paths out of the sitemap (they already are).

### 3.3 On-page

Across 116 prerendered pages:

| Issue | Count | Detail |
|---|---:|---|
| Titles over 62 chars | **45** | Worst: `/post-study-work-visa` at **91 chars**; all 11 blog posts 68–85 chars |
| Meta descriptions out of range | 5 | `/contact` at 182 chars |
| Duplicate titles | 2 pairs | Malta and NZ AEWV — `/blog/*` and `/urgent-requirements/*` collide exactly |
| Pages with ≠1 `<h1>` | 0 | ✅ |
| Missing canonical | 0 | ✅ |

The 45 long titles are being truncated in the SERP — you are losing the tail of every blog headline. The `| Siddhivinayak Overseas` suffix on blog posts is what pushes them over; drop it there and keep it only on the brand/service pages.

### 3.4 Content quality — this is where the real work is

**Thin pages (rendered word count, including nav and footer):**

```
347  /guides/australia-student-visa-requirements
352  /guides/ielts-requirements-for-study-abroad
360  /guides/post-study-work-visa-comparison
375  /guides/visa-rejection-reasons
381  /guides/uk-student-visa-requirements
382  /countries/canada
383  /countries/new-zealand
389  /guides/japan-ssw-visa-guide
```

Strip the ~180 words of chrome and the guides have **~170–220 words of actual content**. These are competing against 2,000-word IDP and Leverage Edu articles. They cannot win as written. This is why zero `/guides/*` pages are indexed.

**Near-duplicate country pages.** Measured text similarity, country name neutralised:

```
albania vs moldova   0.954
albania vs denmark   0.942
moldova vs denmark   0.969
albania vs japan     0.443   ← Japan has real content
albania vs canada    0.448   ← Canada has real content
```

Only 5 of 40 work-visa country pages (Japan, Germany, UK, Canada, Australia) have bespoke content. The other 35 are the same template with a swapped country name and a one-line summary generated as *"Work permit and employment-visa counselling for {Country} from our Surat office."*

Google's guidance on scaled content is explicit about this pattern. These 35 pages are not just failing to rank — they dilute the site's overall quality assessment.

**Broken data on `/countries/*` pages.** Live right now:

> "**0** Visa Eligibility Criteria for Canada … 💼 Work Visa Eligibility — **No specific work criteria listed.** 🎓 Study Visa Eligibility — **No specific study criteria listed.**"

These are Supabase-driven pages rendering empty states as published content, and they're indexable (`index, follow`). `/countries/new-zealand` is one of the few pages Bing *has* indexed. That is the version of your site search engines are seeing.

**Three overlapping page families for the same country:**

```
/countries/canada      "Canada Work & Study Visa | Express Entry"      208 words
/study-in-canada       "Canada Study Visa Consultant in Surat"         884 words  ← the good one
/work-visa/canada      "Canada Work Visa Consultant in Surat"          572 words
```

Classic keyword cannibalisation. `/countries/*` adds nothing that the other two don't do better.

### 3.5 🔴 Do not deploy the "Popular searches" keyword blocks

The committed-but-undeployed change (`941f267`, `4ac7ea4`) prints **7,819 keyword phrases across 56 pages** into the static HTML. `/work-visa` alone renders **616**:

> Belgium job seeker visa · Belgium seasonal work visa · Belgium skilled worker visa · Belgium work permit · Belgium work visa · Belgium work visa agency · Belgium work visa application · Belgium work visa appointment · Belgium work visa consultancy · Belgium work visa consultation · Belgium work visa documents required · … *(×616)*

This is keyword stuffing under Google's spam policies, on a domain that has no authority to absorb the risk. It also inflates `/work-visa` from ~100 KB to 150 KB of HTML for content no human reads.

The *intent* is right — you want coverage for those searches. The *method* is the one Google names in its spam documentation. **Revert or gate these blocks before the next deploy.** The right way to capture those queries is a smaller number of genuinely useful pages that answer them.

### 3.6 Performance

The documented fixes are real but **unshipped**. Live production today:

- 14 vendor chunks `modulepreload`ed on every page, including `vendor-three` and `vendor-charts`
- 501 KB JPEG hero as the LCP element
- Total JS in the build: **4.2 MB across 196 files** (715 KB `three.module`, 433 KB `AdminDashboard`)
- CSS: 777 KB
- Render-blocking Google Fonts stylesheet in `<head>`

I could not get fresh Core Web Vitals field data — the PageSpeed Insights API hit its daily quota. **Get real numbers from Search Console → Core Web Vitals**, which uses CrUX field data, once the new build is live.

Two things worth doing after deploying:
- **Self-host the fonts.** The `<link rel="stylesheet">` to `fonts.googleapis.com` is render-blocking on every page, and `preconnect` only softens it.
- **Check that `AdminDashboard-*.js` (433 KB) is not in the public route graph.** It should only load behind auth.

### 3.7 A few smaller things

- **JSON-LD is emitted 3× per page.** `/study-in-canada` has 15 `ld+json` blocks where it needs 5; the `Organization` / `WebSite` / `LocalBusiness` / `WebPage` set repeats three times. Harmless for ranking, but it is a prerender serialisation bug worth fixing.
- **`Content-Type` header has no `; charset=utf-8`.** The `<meta charset>` covers it, but the header should say so too.
- **No `lastmod` on core pages** in the sitemap.
- **`/blog/*` and `/urgent-requirements/*` cover the same job posts** under different URLs with identical titles. The bodies differ (similarity 0.07–0.15), so it's not duplicate content — but it is duplicate *intent*, and you're asking Google to choose. Pick one home for job posts.
- **CMS-published blog posts are not prerendered until the next deploy** (noted in `technical-audit.md` #4, still open). Every post published between deploys is invisible to non-JS crawlers.

---

## 4. What to do, in order

### This week

1. **Deploy `main`.** Everything documented in `fixes-applied.md` is sitting undeployed. Verify afterwards: live source references `earth-poster-768.avif`, bundle contains `G-MDVF551H1C`.
2. **Revert the 7,819-keyword "Popular searches" blocks** before that deploy, or gate them off.
3. **Check Search Console Crawl Stats for 403s** and run URL Inspection → Test Live URL on `/study-in-canada`. If the bot challenge is hitting Googlebot, open a Hostinger ticket immediately.
4. **Create and verify the Google Business Profile** at the Pragti IT Park address.
5. **Submit the sitemap and request indexing** on your 10 priority URLs.
6. **Decide on `siddhivinayakoverseas.in`** — 301 it to the `.com` if it's yours.

### Weeks 2–4

7. **Fix the `/countries/*` pages.** They render "No specific criteria listed" placeholders. Either populate the Supabase data properly or `noindex` the whole family and 301 them to the matching `/study-in-*` and `/work-visa/*` pages. I recommend the second — they duplicate better pages.
8. **Cut the 35 templated work-visa country pages back.** Keep the 5 with real content. For the rest: either write genuinely different pages (real salary ranges, real employer types, real processing times, real document lists per country) or consolidate them into regional pages and 301 the thin ones.
9. **Rewrite the 8 thin guides to 1,200+ words each.** These are your highest-intent informational queries and currently zero of them are indexed.
10. **Shorten the 45 over-length titles.** Drop `| Siddhivinayak Overseas` from blog posts.
11. **NAP cleanup and citation building.** Identical name/address/phone on 10+ directories; add each to `sameAs` in `schema.ts`.

### Months 2–3

12. **Review campaign on the GBP.** You have 30+ happy clients quoted on-site. Ask them.
13. **Earn links:** local press on student outcomes, partner institution pages, education fairs, Surat business directories, a genuinely useful free tool (the Germany Opportunity Card points calculator you already have is the right idea — promote it).
14. **Self-host fonts**, re-measure Core Web Vitals from CrUX field data.
15. **Fix blog prerendering** so CMS posts render without a deploy.
16. **Then** expand content — one strong page per real query cluster, not 616 keywords on one page.

---

## 5. What I could not verify

These need your Search Console / GA4 / Hostinger access:

- **Actual index coverage and exclusion reasons** — Search Console → Pages report. My ~11-URL figure is a Bing/DDG sample, not Google's number.
- **Whether real Googlebot receives the 403 challenge** — Crawl stats + URL Inspection live test.
- **Core Web Vitals field data** — PSI API quota exhausted; Search Console has it.
- **Whether a manual action or security issue exists** — Search Console → Manual actions. Worth checking given the domain's dormant history.
- **Whether the domain had a penalised prior life.** It was registered before 2009 and returned 404 as recently as Jan 2024. A dropped-and-re-registered domain carries no authority forward, and occasionally carries baggage.
- **Whether `siddhivinayakoverseas.in` is yours.**
- **Real backlink counts** — I found none, but I have no Ahrefs/Semrush/Moz key in this environment.

---

## 6. Honest expectation

Fix the deployment and the crawl-block risk this week, and you remove the things that are *actively* holding the site back. But the site will still be a three-week-old domain with no links and no map presence.

Realistic timeline, assuming the work above gets done:

- **Weeks 1–2:** indexing coverage improves from ~11 to most of the 115 URLs
- **Weeks 4–8:** brand searches ("siddhivinayak overseas surat") rank #1; long-tail informational queries start showing impressions
- **Months 3–6:** map-pack presence for "visa consultants in Surat" *if* the GBP is verified and reviews come in — this is the fastest route to actual enquiries
- **Months 6–12:** competitive commercial terms, and only with links

The GBP and the reviews will bring you enquiries faster than anything in the codebase will.
