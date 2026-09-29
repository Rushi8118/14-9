# GEO / AI Search Readiness — siddhivinayakoverseas.com

Audit date: 2026-09-29
Pages sampled: 32 live URLs across 9 page types (home, local landing, hub, country study,
country work-visa, pathway, guide, blog detail, urgent-requirement detail, reviews,
success-stories, about, contact, legal). Sitemap contains 92 URLs.
Method: raw HTTP fetch (no JS) + Playwright render for control, trafilatura boilerplate-stripped
text for passage scoring, JSON-LD parsing, crawler-UA access tests.

---

## GEO Readiness Score: 33 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 22 | 5.5 |
| Structural readability | 20% | 45 | 9.0 |
| Multi-modal content | 15% | 20 | 3.0 |
| Authority & brand signals | 20% | 18 | 3.6 |
| Technical accessibility | 20% | 58 | 11.6 |
| **Total** | | | **32.7 → 33** |

The site is technically well-built and crawler-accessible. It scores badly because it is
**structurally unable to answer the questions it ranks for**: the pages are navigational and
promotional rather than informational, and the one place where real answers exist (FAQ schema)
is invisible to the extractors that matter.

---

## 1. AI crawler access — PASS (no blocking found)

All crawlers tested return HTTP 200 on a content page, with no UA-based blocking,
no Cloudflare interstitial, no `X-Robots-Tag` restriction. Server is `hcdn`.

| Crawler | What it actually governs | robots.txt | Live fetch |
|---|---|---|---|
| Googlebot | Google Search **and AI Overviews** inclusion | explicit `Allow: /` | 200 |
| Bingbot | Bing index → **Bing Copilot** grounding | explicit `Allow: /` | 200 |
| OAI-SearchBot | **ChatGPT Search citability** | not named; covered by `User-agent: *` | 200 |
| Claude-SearchBot | **Claude search citability** | not named; covered by `User-agent: *` | 200 |
| PerplexityBot | **Perplexity citability** | not named; covered by `User-agent: *` | 200 |
| Applebot | Siri / Spotlight / Safari discoverability | explicit `Allow: /` | 200 |
| GPTBot | OpenAI **model training** only | explicit `Allow: /` | 200 |
| ClaudeBot | Anthropic **model training** only | explicit `Allow: /` | 200 |
| Google-Extended | Gemini/Vertex **training & grounding** only | explicit `Allow: /` | 200 |
| CCBot, Bytespider | training corpora | explicit `Allow: /` | 200 |

### [LOW] Correction to the brief's framing
The brief states robots.txt "explicitly Allows GPTBot, ClaudeBot, Google-Extended … so AI
crawlers can read the content." That is true but is **not evidence of AI search citability**.
Every crawler named explicitly in robots.txt is a *training* crawler:

- **GPTBot is not the ChatGPT Search crawler.** ChatGPT Search uses **OAI-SearchBot**.
- **ClaudeBot is not the Claude search crawler.** Claude search uses **Claude-SearchBot**.
- **Google-Extended does not affect Google Search or AI Overviews** — those follow Googlebot.
  Google-Extended only governs Gemini/Vertex training and grounding.
- **Applebot-Extended** (Apple Intelligence training) is not listed at all; Applebot is, which
  is the one that actually governs Siri/Spotlight/Safari surfacing.

The three crawlers that decide whether this site can be *cited* — OAI-SearchBot,
Claude-SearchBot, PerplexityBot — are permitted only by the `User-agent: *` wildcard. That works
today, but it is incidental rather than intentional. Naming them explicitly costs nothing and
protects against a future wildcard tightening.

**Action:** add explicit `Allow` blocks for `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`,
`Applebot-Extended`, `meta-externalagent`, `Amazonbot`, `DuckAssistBot`. Effort: 10 minutes.

---

## 2. [CRITICAL] 25 of 92 sitemap URLs (27%) serve an empty client-side shell

**This directly contradicts the brief's premise that "pages are server-prerendered static HTML."**
It is true for most of the site — and false for exactly the pages with the highest commercial
intent and the freshest content.

Every `/blog/<slug>` and `/urgent-requirements/<slug>` detail page returns an identical
**5,830-byte** document. Verified with an OAI-SearchBot user-agent:

```
<div id="root"></div>
```

Full visible text of `/blog/germany-opportunity-card-2026-eligibility-points-calculator-process-india`
as a non-JS crawler sees it:

> "Overseas Education & Visa Consultants in Surat | Siddhivinayak Overseas"

That is the `<title>` and nothing else. On that page:
- `<title>` is the **generic homepage title**, not the article title
- **no** `<meta name="description">`
- **no** `<link rel="canonical">`
- **0** `application/ld+json` blocks (prerendered pages carry 13)
- **0** headings, 0 body text

Confirmed identical 5,830-byte response on `/blog/england-vs-ireland-for-international-students-2026`,
`/blog/australia-work-visa-482-jobs`, `/blog/turkey-warehouse-worker-jobs-65000-salary`,
`/urgent-requirements/uk-nhs-healthcare-assistant-urgent`,
`/urgent-requirements/greece-hospitality-jobs-200-positions`,
`/urgent-requirements/italy-healthcare-jobs-850-urgent-vacancies`,
`/urgent-requirements/israel-warehouse-worker-jobs`,
`/urgent-requirements/serbia-chocolate-factory-jobs`.

Compare prerendered pages, which are healthy:

| URL | Raw bytes (no JS) | Visible words | JSON-LD blocks |
|---|---|---|---|
| `/guides/japan-ssw-visa-guide` | 94,169 | 552 | 13 |
| `/work-visa/germany` | 274,717 | 1,283 | 13 |
| `/blog/<any post>` | **5,830** | **10** | **0** |
| `/urgent-requirements/<any>` | **5,830** | **10** | **0** |

**Impact.** Perplexity and ChatGPT Search do not reliably execute JavaScript for citation
extraction. Google can render, but render is queued and deprioritised, and a page whose
pre-render title is the homepage title will be deduplicated against the homepage. These 25 pages
are effectively **uncitable and near-unindexable**. They are also the pages carrying the specific
numbers the rest of the site lacks (salary figures, vacancy counts, 2026 policy detail) — the
only genuinely citable assets on the domain are the ones that are invisible.

**Action:** extend the existing prerender route list to `/blog/*` and `/urgent-requirements/*`.
The infrastructure already works for 67 other URLs; this is a build-config change, not a rewrite.
Effort: 2–4 hours. **Highest-ROI fix on the site.**

---

## 3. [CRITICAL] Passage-level citability — answers are absent, not merely buried

The brief asks whether answers are "self-contained and extractable, or buried in marketing prose."
The finding is worse than the second option: **for the three named target queries, the answer is
not on the page at any level of prose.**

### Quantitative evidence

Passage-length distribution across all sampled pages (508 paragraphs of 15+ words):

| Band | Count | Share |
|---|---|---|
| < 40 words | 327 | 64.4% |
| 40–79 words | 112 | 22.0% |
| 80–133 words | 27 | 5.3% |
| **134–167 words (optimal citation band)** | **40** | **7.9%** |

Median paragraph: **35 words**. Mean: 47. The site is built from short UI card blurbs, not
extractable answer passages. An extractor pulling a 35-word card gets a fragment with no
standalone meaning.

Concrete-number density — currency amounts found in visible body text:

| Page group | Pages | Currency figures |
|---|---|---|
| All 8 `/guides/*` pages | 8 | **0** |
| All 9 `/study-in-*` pages | 9 | **0** |
| `/visa-consultants-in-surat`, `/study-visa`, `/about`, `/reviews`, `/contact` | 5 | **0** |
| `/work-visa/*` and `/pathways/*` | 13 | 1–2 each |

The only numbers appearing on guide and study-in pages are `95120 00632`, `99250 64666` and
`395006` — the footer phone numbers and the office pincode.

### Query 1 — "how much bank balance for a Canada study visa"

Target page `/guides/canada-student-visa-requirements` (233 content words total). Full relevant text:

> "Most Indian applicants need a Letter of Acceptance from a DLI, proof of funds, identity
> documents, English evidence (or institutional alternative), and may need biometrics and a
> medical exam. SDS applicants must meet additional stream-specific conditions."

and the checklist item:

> "Proof of funds / GIC / tuition receipts as applicable"

No CAD amount. No GIC figure. No cost-of-living threshold. The secondary page `/study-in-canada`
(the strongest page on the site, 592 content words) **explicitly declines to answer**:

> "Budget planning should cover tuition, living costs, health insurance, airfare, and
> contingency. **Exact figures depend on city and program.** We help you build a realistic
> funding plan…"

An AI engine answering "how much bank balance for a Canada study visa" needs a number to cite.
This page offers a reason why it will not provide one, then pivots to a service pitch. It cannot
be cited for this query under any circumstances.

### Query 2 — "Japan SSW visa requirements"

Target page `/guides/japan-ssw-visa-guide` — **157 content words in total**. The entire
substantive body:

> "SSW is a skills-based work pathway for specified industries. It is not a tourist visa and not
> a guaranteed job offer. **Candidates usually need language and skills-test results**, plus an
> employing organisation in Japan."

> "Confirm sector fit → language plan → skill test → documents → interviews → contract/visa
> paperwork. Skip agents who demand large upfront fees without transparent milestones."

Missing: the 16 designated SSW sectors, JFT-Basic / JLPT N4 language thresholds, the SSW
skills-evaluation test, SSW(i) vs SSW(ii) distinction, period of stay, family-accompaniment
rules, salary parity requirement. The page has an H3 "Which sectors are under SSW?" — and the
answer to it is not rendered anywhere (see §4). "Candidates usually need language and skills-test
results" is a hedge, not a fact, and hedges are not citable.

### Query 3 — "cost of studying in Germany from India"

Target page `/study-in-germany` — 201 content words, **zero currency figures**:

> "Germany is popular for engineering, automotive, IT and applied sciences, with many public
> universities charging **limited tuition**. Students must still budget for living costs and meet
> language or English-taught program criteria."

> "Applications may involve uni-assist or direct portals, APS (for many Indian applicants),
> admission letter, **blocked account/finances**, health insurance and national visa appointment
> documentation."

The page names the blocked account — the single most-searched number in this query space — three
separate times ("blocked-account planning", "blocked account/finances", "Blocked account and
authentication sequencing") and **never states its value**. It also does not give the semester
contribution range, APS fee, or monthly living-cost estimate. Remaining copy is service-menu
fragments: "Portal strategy and document attestation support."

**Verdict:** the content is not "buried in marketing prose" — the factual layer does not exist.
No rewrite of tone will fix this; the pages need facts added.

---

## 4. [CRITICAL] 103 FAQ answers exist only in JSON-LD and never render on the page

Across the sampled pages, **103 Question/Answer pairs** have their `acceptedAnswer.text` present
in `FAQPage` structured data while the answer text appears **nowhere in the HTML** — not in the
raw response, and not after a full Playwright Chromium render.

Verified on `/study-in-canada` with `--mode always` (playwright-chromium, status 200). The
rendered DOM in the FAQ region reads, in full:

> "Do I need IELTS for a Canada study visa? What is SDS for Canada? Can I get PR after studying
> in Canada? How long does Canada study visa processing take? More openings in other countries…"

Four questions in sequence, immediately followed by the next section. Probe strings from the
schema answers — `"Study Direct Stream"`, `"SDS is"`, `"Institutions and visa streams"`,
`"Processing times vary"` — all return **False** against the rendered text.

Example of an answer that exists only in JSON-LD, on `/guides/canada-student-visa-requirements`:

```json
{"@type":"Question","name":"Is IELTS mandatory for Canada study visa?",
 "acceptedAnswer":{"@type":"Answer","text":"Institutions and visa streams often expect English
 proof. Some admits allow waivers or alternative tests. Your offer letter and stream rules
 decide the minimum."}}
```

Affected pages include every `/guides/*` page, every `/pathways/*` page and every `/study-in-*`
page. A representative sample of orphaned questions:

| Page | Question rendered | Answer rendered |
|---|---|---|
| `/guides/japan-ssw-visa-guide` | "Which sectors are under SSW?" | no |
| `/guides/post-study-work-visa-comparison` | "Which country is best for PR after study?" | no |
| `/guides/visa-rejection-reasons` | "Can a refused visa be fixed?" | no |
| `/pathways/canada-pgwp-to-pr` | "Does a PGWP lead directly to PR?" | no |
| `/pathways/india-to-uk-work-visa` | "How long does a UK work visa take from India?" | no |
| `/study-in-australia` | "What is the Genuine Student requirement?" | no |
| `/study-in-canada` | "What is SDS for Canada?" | no |

**Why this is severe.**
1. **ChatGPT Search, Perplexity and Claude extract rendered text.** They see a question heading
   with no answer — the worst possible signal, because the page *promises* an answer it does not
   deliver.
2. **Google requires structured data to reflect visible page content.** Markup carrying content
   not present for users is a spam-policy violation and risks structured-data manual action.
   FAQ rich results are also no longer shown for the vast majority of sites, so there is no
   rich-result upside to offset the risk.
3. This is also the site's largest *latent asset*. There are **125 informational question-form
   H2/H3 headings** already written and topically well targeted — genuinely good hooks. The
   answers are already drafted. They simply need to be moved into the DOM.

**Action:** render `acceptedAnswer.text` as visible body copy beneath each question (accordion
default-open, or a plain `<dl>`), then expand each answer to a self-contained 40–60 word direct
response. This converts 103 dead headings into 103 citable passages. Effort: 1 day of component
work + copy expansion. **Second-highest ROI on the site.**

---

## 5. [HIGH] Zero tables sitewide — no structured comparable data

Across all 32 sampled pages: **`<table>` count = 0.** Not one.

This matters disproportionately for this business, because its subject matter is inherently
tabular and AI engines preferentially lift tabular data into comparison answers:

- `/guides/post-study-work-visa-comparison` is a *comparison* page, 134 content words, no table.
  It compares nothing in structured form.
- `/countries` and `/study-visa` list destinations with no comparable attributes.
- Queries like "UK vs Canada post study work visa", "which country is cheapest to study in",
  "Germany vs Ireland cost" are exactly the head terms this site targets, and they are won almost
  exclusively by pages that ship a comparison table.

**Action:** add one comparison table per hub page (country × tuition range × living cost ×
post-study work duration × min funds × processing time), each cell sourced and dated. Effort:
2–3 days including sourcing. This single format change is the fastest route to AI Overview and
Perplexity citation.

---

## 6. [HIGH] Authority and entity signals — the business is not a resolvable entity

### Wikipedia / Wikidata: absent
- Wikidata `wbsearchentities` for "Siddhivinayak Overseas": `"search":[]` — zero results.
- English Wikipedia search for `"Siddhivinayak Overseas"`: `"totalhits":0`.

This is expected and largely unfixable for an SME — a Wikipedia article is not a realistic or
appropriate target, and pursuing one would likely fail notability review. Flagged for
completeness, not as an action item. A **Wikidata item** is a lower bar and is achievable, but
its independent effect on citation is unproven; treat it as optional.

### `sameAs` is nearly empty — 2 entries, both weak

From `#organization` and `#localbusiness`:
```json
"sameAs": ["https://www.instagram.com/siddhivinyakoverseas/",
           "https://www.facebook.com/share/1EMjNkoty3/"]
```

- The Facebook URL is a `/share/1EMjNkoty3/` **redirect token**, not a canonical Page URL.
  Share links are unstable and do not resolve as entity identifiers.
- The Instagram handle is `siddhivinyakoverseas` — **missing the second "a"** versus the brand
  name *Siddhiv-i-na-yak*. Whether this is the real handle or a typo, it breaks the string match
  between the brand name and its profile, which is precisely the join key entity resolvers use.
- **Absent from `sameAs`:** Google Business Profile, LinkedIn company page, YouTube channel,
  Justdial, Sulekha, IndiaMART, X, any education-directory listing.

Sitewide outbound link audit (all 32 pages) found only these external domains:
`instagram.com`, `facebook.com`, `wa.me`, plus five government sources (`canada.ca`, `gov.uk`,
`immi.homeaffairs.gov.au`, `immigration.govt.nz`, `home-affairs.ec.europa.eu`).

The government outbound links are a **genuine positive** — citing IRCC, GOV.UK and Home Affairs
is exactly right for YMYL immigration content and should be preserved and expanded.

### [MED] Entity is fragmented across three nodes with three different names

| `@id` | `@type` | `name` |
|---|---|---|
| `#organization` | Organization | `Siddhivinayak Overseas` |
| `#localbusiness` | ProfessionalService, LocalBusiness | `Siddhivinayak Overseas â€" Visa Consultants in Surat & Pan-India` |
| `#educationalorganization` | EducationalOrganization | `Siddhivinayak Overseas â€" Overseas Education Consultants` |

Two problems:
1. **UTF-8 mojibake.** The em-dash is double-encoded as `â€"` (raw `â\u0080\u0094`) in two of
   the three entity names. The canonical brand string an engine ingests is corrupted.
2. Only `#localbusiness` declares `parentOrganization`. `#educationalorganization` is orphaned —
   no `parentOrganization`, no `sameAs`, no `@id` cross-reference. Three unlinked nodes with three
   different names reads as three weakly-evidenced entities rather than one well-evidenced one.

### [MED] NAP inconsistency between visible content and markup

- Address is consistent everywhere: `620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat, Gujarat 395006, IN` — good.
- Phone: schema declares only `+91 99250 64666` (as both `+91 99250 64666` and `+919925064666`
  across nodes — inconsistent formatting). Visible pages also show **`+91 95120 00632`**, which
  appears in **no** structured data.
- `geo` is `21.1702, 72.8311` — that is generic Surat city centre, roughly 4–5 km from the
  Yogi Chowk / Pragti IT Park address given. Placeholder coordinates.
- `LocalBusiness` has no `openingHoursSpecification`.

### [MED] 45 reviews, zero review markup, zero third-party verification

`/reviews` carries 1,697 words — the largest body of unique text on the domain — and has
**no `Review`, no `AggregateRating`, no `aggregateRating` property** in any of its 5 JSON-LD
blocks (`Organization`, `WebSite`, `ProfessionalService/LocalBusiness`, `EducationalOrganization`,
`WebPage`).

More importantly, these are **self-hosted, unattributed, unverifiable testimonials** with no link
to any external review platform. They are also strikingly formulaic:

> "I would definitely recommend them." (Jashwant singh)
> "I would happily recommend them." (Balwantsingh)
> "I would recommend Siddhivinayak Overseas." (Umesh variya)
> "I would definitely recommend them to others." (Abhay gabani)
> "I would surely recommend Siddhivinayak Overseas." (Brijesh patel)
> "I would recommend them without hesitation." (Hardik chaudhary)
> "I would definitely recommend them." (Ahamed sharif)

Seven consecutive reviews, all tagged "India to Australia", all closing on a near-identical
recommendation clause. An LLM assessing trustworthiness treats a uniform-register testimonial
block with no external corroboration as a **negative** signal, not a neutral one. Note also that
Google does not support `AggregateRating` markup for self-serving reviews about the business's
own entity, so adding the schema here would be non-compliant — the fix is off-site, not on-site.

### [MED] No named authors on YMYL immigration content

Every `Article` declares `"author": {"@id": ".../#organization"}`. There is no `Person`, no
byline, no credentials, no reviewer. Sitewide search for visible `Updated` / `Reviewed` /
`By ` / `Last updated` / `Published` cues returns **nothing**. For immigration advice — a
textbook YMYL category — anonymous organisational authorship is a weak E-E-A-T position.

### [MED] "Guaranteed jobs & salaries" is a trust liability

`#educationalorganization.description` reads:

> "…post-study work visa transitions **with guaranteed jobs & salaries**."

The same phrasing recurs in `<meta name="keywords">` ("post study work visa with job and salary")
and in pathway URLs (`/pathways/student-visa-to-work-visa-with-job-and-salary`).

This **contradicts the site's own copy** on `/study-in-canada`:

> "Never rely on 'guaranteed approval' claims."

and its own FAQ headings ("Does Siddhivinayak Overseas provide fixed job and salary sponsorship?",
"Can you guarantee my salary and company benefits…?", "Can you get me an LMIA job?"). Guarantee
language in immigration services is a recognised fraud marker; models are tuned to down-weight it,
and it is a regulatory exposure in several destination markets. Self-contradiction between schema
and body copy is itself a quality signal.

---

## 7. [LOW] llms.txt — absent, and it does not matter much

`https://siddhivinayakoverseas.com/llms.txt` returns **HTTP 200 with the SPA 404 shell**
(`<title>Page Not Found | Siddhivinayak Overseas</title>`) — a soft 404, not a valid llms.txt.

**Honest assessment, per the brief:** this is a **LOW** priority and should not be sold as a
ranking factor.

- Google has publicly stated it **ignores llms.txt** and has no plans to use it.
- There is **no confirmed evidence** that OpenAI, Anthropic, Perplexity or Microsoft consume
  llms.txt for retrieval, ranking or citation in any shipping product.
- It is a community proposal, not an adopted standard. No major AI search product has
  documented support.

Adding one is cheap (~30 minutes) and harmless, and it is a reasonable hedge. It should be
positioned as **speculative**, ranked below every other item in this report, and **must not** be
presented to the client as something that will improve AI visibility. The one real defect worth
fixing regardless is the **soft 404**: unknown paths return 200 with a "Page Not Found" shell
rather than a true 404 status, which wastes crawl budget and can pollute the index.

**RSL 1.0 licensing:** not present. No `license` declaration in robots.txt, no `/.well-known/rsl`,
no RSL `<link>`. Optional; no citation impact.

---

## 8. [MED] Duplicate JSON-LD injection on every page

Every prerendered page emits 13 JSON-LD blocks, of which several are byte-identical duplicates:

| `@type` | Emitted |
|---|---|
| Organization | 2× (blocks 1, 6) |
| WebSite | 2× (blocks 2, 7) |
| ProfessionalService + LocalBusiness | 2× (blocks 3, 8) |
| WebPage | 2× (blocks 5, 9) — with *differing* byte sizes (434 vs 512) |

All blocks parse as valid JSON, so this is not a hard error — but the two `WebPage` blocks differ
in content while describing the same page, which is a genuine conflict. Likely cause: the global
schema component mounting once in the prerender shell and again in the page component. Roughly
7.5 KB of redundant payload per page.

**Action:** deduplicate schema injection; emit each `@type` once, `@id`-linked. Effort: 2 hours.

---

## 9. [LOW] Freshness signals are weak and undifferentiated

- Only the 5 `/guides/*` pages carry `Article` schema with dates. All 5 declare
  `datePublished: 2026-08-25` **and** `dateModified: 2026-08-25` — identical, hardcoded,
  never updated.
- `/study-in-*`, `/work-visa/*` and `/pathways/*` pages carry **no** `Article` or date markup
  at all.
- **No visible date appears anywhere on any page** — no "Last updated", no byline date.
- Sitemap `lastmod` values *are* varied and recent (23 URLs at 2026-09-28, 20 at 2026-08-31,
  etc.), so sitemap lastmod and schema dates now disagree.

Immigration thresholds change every few months. AI engines strongly prefer recently-dated sources
for policy questions. A visible, honest "Last updated" date plus an accurate `dateModified` is a
cheap and material win — but only once the pages actually contain the facts that dating would
vouch for.

---

## 10. Platform-specific outlook

| Platform | Score | Gating factor |
|---|---|---|
| **Google AI Overviews** | 30/100 | Googlebot allowed and 67 pages prerender cleanly, so *access* is fine. AIO selects passages containing specific, attributable facts; the guide and study-in pages contain none. Note Google ignores llms.txt entirely — AIO inclusion follows Googlebot. |
| **ChatGPT Search** | 25/100 | OAI-SearchBot reaches the site (200). ChatGPT Search weights third-party corroboration and entity consensus heavily; with no GBP, LinkedIn, YouTube, directory or press presence, the brand does not resolve. The 25 highest-specificity pages are invisible shells. |
| **Perplexity** | 28/100 | PerplexityBot reaches the site (200). Perplexity is the most quote-literal engine — it needs a directly liftable sentence answering the query. Median passage is 35 words of UI copy and the FAQ answers never render. Worst-fit platform currently; would benefit most from §4 and §5. |
| **Bing Copilot** | 30/100 | Bingbot allowed. Copilot leans on the Bing index plus business-entity signals (Bing Places, directory consistency), all of which are missing or unclaimed. |

Only ~11% of domains are cited by both ChatGPT and Google AI Overviews, so these need separate
treatment — but at present the blockers are common to all four platforms, so the first three
fixes below lift every platform simultaneously.

---

## 11. THE CENTRAL CONSTRAINT: on-page work alone cannot fix this

**Stated explicitly, as requested.**

The strongest single predictor of whether an AI engine will cite a business is **third-party
corroboration** — independent sources that mention the brand and agree about what it is. For this
business that evidence base is close to empty:

- Wikidata: **0** results. Wikipedia: **0** hits.
- `sameAs`: **2** profiles, one a share-redirect token, one a misspelled handle.
- Sitewide outbound profile links: Instagram, Facebook, WhatsApp. Nothing else.
- No Google Business Profile reference anywhere in markup or content.
- No LinkedIn company page, no YouTube channel, no Justdial / Sulekha / IndiaMART listing
  surfaced in any markup or link.
- The only reviews are 45 self-hosted, uniformly-worded, unverifiable testimonials.

Known correlations with AI citation frequency: **YouTube mentions ~0.737** (strongest measured
signal), Reddit presence high, Wikipedia entity high, and **backlink Domain Rating only ~0.266**
(weak). Note what this ordering implies: conventional link-building is the *least* effective
lever here, and the levers that matter most are all off-site presence that no amount of HTML
editing can produce.

**Therefore:** fixing prerendering, surfacing the FAQ answers, adding tables and adding real
numbers will make the site *eligible* for citation — it currently is not. They will not, on their
own, make it *cited* for competitive queries, because competing consultancies with equally thin
pages but real Google review volume, YouTube presence and directory consistency will continue to
be selected as the corroborated entity.

The off-site programme is the harder half and cannot be delivered by a developer:

1. **Claim and fully populate the Google Business Profile**; drive genuine reviews at volume.
   This is the single highest-value off-site action for a local consultancy and also feeds
   Bing Places / Copilot.
2. **YouTube channel with substantive Q&A videos** — highest measured correlation with AI
   citation. Short, specific answers ("What blocked account amount does Germany require in
   2026?") double as the on-page facts the site is missing.
3. **Directory consistency** across Justdial, Sulekha, IndiaMART and education directories with
   byte-identical NAP, then reference all of them in `sameAs`.
4. **LinkedIn company page** plus named-counsellor profiles — this simultaneously fixes the
   missing-author E-E-A-T gap in §6.
5. **Genuine press / local media mentions** (Gujarati and English Surat outlets) and participation
   in study-abroad communities where the brand can be discussed by others.
6. **Reddit / Quora presence** — not astroturfing, but genuine expert participation in
   r/IndiansAbroad, r/germany, r/ImmigrationCanada style communities.

Any proposal that presents on-page optimisation as sufficient for AI search visibility here would
be misleading. On-page work is necessary and currently blocking; it is not sufficient.

---

## Top 5 highest-impact changes

| # | Change | Severity | Effort | Why |
|---|---|---|---|---|
| 1 | **Prerender `/blog/*` and `/urgent-requirements/*`** — extend the existing prerender route list | CRITICAL | 2–4 h | 25 of 92 URLs (27%) currently serve an empty 5,830-byte shell with the wrong title, no canonical and no schema. These carry the site's only specific numbers. Infrastructure already works for the other 67 URLs. |
| 2 | **Render the 103 orphaned FAQ answers into visible DOM**, expanded to self-contained 40–60 word direct answers | CRITICAL | 1 d | Answers already exist in `FAQPage` schema but appear nowhere in the rendered page even after JS. Also resolves a Google structured-data policy violation. Converts 125 existing question headings from liabilities into assets. |
| 3 | **Add real numbers to guides and study-in pages** — blocked-account amount, GIC/proof-of-funds figures, tuition and living-cost ranges, SSW sector list and language thresholds — each with source and date | CRITICAL | 3–5 d | All 8 guide pages and all 9 study-in pages contain **zero** currency figures. `/study-in-germany` names the blocked account 3× without its value; `/study-in-canada` states "Exact figures depend on city and program." Without numbers, citation is impossible for the target queries. |
| 4 | **Off-site entity programme** — claim GBP and drive real reviews, launch YouTube Q&A, fix NAP across Justdial/Sulekha/IndiaMART, create LinkedIn, then expand `sameAs` to all of them | HIGH | ongoing, 4–8 wk to first effect | The binding constraint (§11). Currently `sameAs` holds 2 weak URLs, Wikidata returns 0, and all 45 reviews are self-hosted and formulaic. On-page work cannot substitute for this. |
| 5 | **Add comparison tables to hub and comparison pages** | HIGH | 2–3 d | Zero `<table>` elements across all 32 sampled pages, including a page literally titled "post study work visa comparison". Tables are the format AI engines lift most readily for the comparison queries this site targets. |

### Secondary queue
6. Fix entity hygiene: repair `â€"` mojibake in two entity names, `parentOrganization`-link
   `#educationalorganization`, correct or verify the Instagram handle, replace the Facebook
   share-redirect with a canonical Page URL, add the second phone number to schema, correct the
   placeholder `geo` coordinates, add `openingHoursSpecification`. (~3 h)
7. Deduplicate the 4 repeated JSON-LD blocks; resolve the two conflicting `WebPage` blocks. (~2 h)
8. Remove "guaranteed jobs & salaries" from schema descriptions and meta keywords — it
   contradicts the site's own "never rely on guaranteed approval" copy and is a trust-suppression
   marker. (~1 h)
9. Add visible "Last updated" dates and accurate `dateModified`; extend `Article` schema to
   study-in, work-visa and pathway pages. (~4 h)
10. Add named `Person` authors with credentials to YMYL guides. (~1 d, gated on item 4's LinkedIn work)
11. Return a real 404 status for unknown paths instead of HTTP 200 + shell. (~1 h)
12. Name `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Applebot-Extended` explicitly in
    robots.txt. (~10 min)
13. Add `/llms.txt` — **speculative, lowest priority**, no confirmed effect on any shipping AI
    search product; Google has said it ignores it. Do not present as a ranking factor. (~30 min)

---

## Structured findings (for audit-data.json — AI Search Readiness)

```json
{
  "category": "AI Search Readiness (GEO)",
  "score": 33,
  "dimensions": {
    "citability": 22,
    "structural_readability": 45,
    "multi_modal": 20,
    "authority_brand": 18,
    "technical_accessibility": 58
  },
  "platform_scores": {
    "google_ai_overviews": 30,
    "chatgpt_search": 25,
    "perplexity": 28,
    "bing_copilot": 30
  },
  "crawler_access": {
    "all_tested_return_200": true,
    "ua_blocking_detected": false,
    "explicitly_named_in_robots": ["Googlebot","Bingbot","Slurp","DuckDuckBot","Baiduspider","YandexBot","Applebot","GPTBot","ClaudeBot","Google-Extended","Bytespider","CCBot"],
    "search_crawlers_covered_only_by_wildcard": ["OAI-SearchBot","Claude-SearchBot","PerplexityBot"],
    "note": "All crawlers named explicitly in robots.txt are training crawlers, not AI-search citation crawlers"
  },
  "llms_txt": {
    "present": false,
    "response": "HTTP 200 SPA soft-404 shell",
    "priority": "low",
    "caveat": "Google ignores llms.txt; no confirmed use by any shipping AI search product"
  },
  "rsl_licensing": {"present": false},
  "findings": [
    {"id":"geo-01","severity":"critical","title":"25 of 92 sitemap URLs serve empty 5,830-byte SPA shell","evidence":"/blog/* and /urgent-requirements/* return <div id=\"root\"></div>, homepage title, 0 JSON-LD, no canonical, no meta description; verified as OAI-SearchBot","effort":"2-4h"},
    {"id":"geo-02","severity":"critical","title":"103 FAQ answers exist only in JSON-LD, never in rendered DOM","evidence":"Confirmed absent after full playwright-chromium render of /study-in-canada; affects all guides, pathways and study-in pages; also a Google structured-data policy violation","effort":"1d"},
    {"id":"geo-03","severity":"critical","title":"Zero currency figures on all 8 guide pages and all 9 study-in pages","evidence":"/study-in-germany names blocked account 3x without its value; /study-in-canada states 'Exact figures depend on city and program'; /guides/japan-ssw-visa-guide is 157 words with no thresholds","effort":"3-5d"},
    {"id":"geo-04","severity":"high","title":"No third-party entity corroboration","evidence":"Wikidata 0 results, Wikipedia 0 hits, sameAs has 2 weak URLs (FB share-redirect + misspelled IG handle), no GBP/LinkedIn/YouTube/directory presence, 45 self-hosted formulaic testimonials","effort":"ongoing"},
    {"id":"geo-05","severity":"high","title":"Zero HTML tables across 32 sampled pages","evidence":"Includes /guides/post-study-work-visa-comparison, a comparison page with no comparison table","effort":"2-3d"},
    {"id":"geo-06","severity":"high","title":"Passage lengths far below citation band","evidence":"Median 35 words; 64.4% of paragraphs under 40 words; only 7.9% in the 134-167 word band","effort":"included in geo-03"},
    {"id":"geo-07","severity":"medium","title":"Entity fragmented across 3 unlinked nodes with mojibake names","evidence":"'Siddhivinayak Overseas \\u00e2\\u0080\\u0094 Visa Consultants...'; #educationalorganization has no parentOrganization or sameAs","effort":"3h"},
    {"id":"geo-08","severity":"medium","title":"Duplicate JSON-LD injection","evidence":"Organization, WebSite, LocalBusiness and WebPage each emitted 2x per page; the two WebPage blocks differ in content (434 vs 512 bytes)","effort":"2h"},
    {"id":"geo-09","severity":"medium","title":"NAP inconsistency","evidence":"Second visible phone +91 95120 00632 absent from all schema; telephone formatted inconsistently across nodes; geo 21.1702,72.8311 is Surat city centre not the stated address","effort":"2h"},
    {"id":"geo-10","severity":"medium","title":"45 reviews with no Review/AggregateRating markup and no external verification","evidence":"7 consecutive near-identical 'I would recommend' closings, all tagged India to Australia; fix is off-site, self-serving AggregateRating is not Google-compliant","effort":"ongoing"},
    {"id":"geo-11","severity":"medium","title":"'Guaranteed jobs & salaries' in schema contradicts on-page copy","evidence":"EducationalOrganization description vs /study-in-canada 'Never rely on guaranteed approval claims'","effort":"1h"},
    {"id":"geo-12","severity":"medium","title":"No named authors on YMYL immigration content","evidence":"All Article author = Organization @id; no visible byline or date cues sitewide","effort":"1d"},
    {"id":"geo-13","severity":"low","title":"Freshness signals weak","evidence":"5 guides all hardcoded datePublished=dateModified=2026-08-25; no Article schema on study-in/work-visa/pathway pages; no visible dates anywhere","effort":"4h"},
    {"id":"geo-14","severity":"low","title":"Soft 404 - unknown paths return HTTP 200 with shell","evidence":"/llms.txt returns 200 with 'Page Not Found' SPA shell","effort":"1h"},
    {"id":"geo-15","severity":"low","title":"AI search crawlers not named explicitly in robots.txt","evidence":"OAI-SearchBot, Claude-SearchBot, PerplexityBot permitted only via User-agent: *","effort":"10m"},
    {"id":"geo-16","severity":"low","title":"llms.txt absent","evidence":"Speculative; Google ignores it, no confirmed use by any shipping AI search product","effort":"30m"}
  ]
}
```
