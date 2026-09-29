# Search Experience Optimization (SXO) Analysis
## siddhivinayakoverseas.com — overseas education / study visa / work visa consultancy, Surat, Gujarat

Analysis date: 2026-09-29
Method: live Google SERP read-back for 10 commercially-weighted queries, compared against
the rendered DOM of the 10 corresponding pages on the site.
Pages fetched with `render_page.py --mode auto` (all pages returned `is_spa: false` — the
Vite build is pre-rendered, so Googlebot sees full HTML; **rendering is not a problem here**).

---

## 0. Executive summary — the two findings that matter

**Finding 1 (blocking, affects every query): the site is not a recognised entity.**
A search for the brand name itself — `Siddhivinayak Overseas Surat` — does **not** return
siddhivinayakoverseas.com anywhere in the top 10. What it returns instead:

| Observed result | Problem it creates |
|---|---|
| facebook.com/p/Siddhivinyak-Overseas-61557503816943 | brand spelled **Siddhivin*y*ak** (missing "a") |
| facebook.com/Siddhivinayakoverseas01 | a **second, competing** Facebook page |
| indiamart.com/shreesiddhivinayakoverseas — wooden furniture manufacturer | name collision |
| **siddhivinayakoverseas.in** — "Trusted Travel consultant, under development" | a **different domain** outranks the real one |
| officedial.com — address `2/4480, 102-Dharmanath Complex, Shivdas Zaveri Street, Sagrampura, Surat 395002` | **NAP conflict** |
| zoominfo.com/c/siddhivinayak-overseas — "registered office A-41 Basement Kalkaji Extn, New Delhi", founded Nov 2015 | **second NAP conflict, different city** |

The site's own declared NAP is `620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk
Road, Surat` / `+91 99250 64666`. That address appears on the website and **nowhere else in
the index**. The `sameAs` array carries only two profiles, and the Instagram handle
(`instagram.com/siddhivinyakoverseas/`) reproduces the misspelling.

Consequence: Google has no consolidated entity for this business. Until that is fixed,
every local query is unwinnable and every YMYL (visa/immigration) query is authority-capped,
regardless of how good the pages become.

**Finding 2 (blocking, affects every informational query): the content is an order of
magnitude too thin.** Body word counts from the rendered DOM:

| Page | Body words | SERP median for its query |
|---|---|---|
| /guides/post-study-work-visa-comparison | **197** | ~2,000–3,500 (multi-country tables) |
| /guides/uk-student-visa-requirements | **216** | ~1,500–3,000 |
| /guides/japan-ssw-visa-guide | **225** | ~1,500–2,500 |
| /guides/canada-student-visa-requirements | **297** | ~2,000–3,000 |
| /study-in-germany | **408** | ~2,000+ (cost tables) |
| /visa-consultants-in-surat | **478** | ~800–2,000 + directory depth |
| /work-visa/japan | **496** | ~1,500–2,500 |
| /study-visa | **583** | ~1,200+ |
| /study-in-canada | **719** | ~2,000–4,000 |
| Homepage | 1,675 | n/a |

Every "guide" is a single paragraph plus one FAQ. The schema markup is genuinely good
(Article + FAQPage + BreadcrumbList + Service, correctly nested) — but it is **marking up
content that does not exist**. This is schema-rich, substance-poor: the classic pattern
Google's helpful-content systems suppress.

---

## 1. Query-by-query SERP read-back and mismatch verdict

### Q1. "visa consultants in surat"
**Observed organic top 10:** dir.indiamart.com/surat/visa-consultant.html · sulekha.com/employment-visa-consultants/surat · sulekha.com/visa-consultants/surat · ioverseas.in · canopusedu.com · myssoverseasvisa.com · rginternational.org · justdial.com/Surat/Immigration-Consultants · aspiresquare.com/surat

**Dominant page type:** Directory/aggregator (IndiaMART, Sulekha ×2, JustDial = 4/9) +
Local Service Page (5/9). Consensus: **Local — 100%**. In the live SERP this query is
topped by a **3-pack map unit**; the organic results below it are largely directories that
themselves aggregate GBP data.

**Site page:** /visa-consultants-in-surat (Local Page, 478 words)

**Verdict: PAGE TYPE ALIGNED — but the page is not the lever.**
This is the case the brief asked to be flagged: **a local pack dominates and the real lever
is Google Business Profile, not the page.** The page does the on-page job adequately (NAP in
body text, LocalBusiness schema, GeoCoordinates, WhatsApp + tel: links, and a genuinely good
differentiator paragraph about Gujarat academic patterns — gaps, backlogs, medium of
instruction, sponsor structures). What it lacks is everything the pack ranks on:

- `openingHours` / `openingHoursSpecification`: **absent** (count = 0 across all pages)
- `aggregateRating` / `Review` schema: **absent sitewide**
- Embedded Google Map: **absent** (`iframe` count = 0, `google.com/maps` count = 0)
- Images: **2 on the entire page**, no office or team photography
- No verified GBP surfaced in any search performed

Do not rewrite this page to chase rank. Claim/verify the GBP, fix NAP to match the site
exactly, kill or merge the duplicate Facebook page, correct the Instagram handle spelling,
get 30+ Google reviews, upload office and team photos, then get listed on Sulekha/JustDial/
IndiaMART — you cannot beat those directories, so be *inside* them.

---

### Q2. "study visa consultants surat"
**Observed organic top 10:** idp.com/india/study-visa-consultants/surat · upgrad.com/study-abroad/study-visa-consultants/surat · sulekha.com · yami-edu.com · ioverseas.in (×2 URLs) · wecoverseaseducation.com · swecvisaconsultant.com · aspiresquare.com/surat

**Dominant page type:** Local Service Page (7/9), with two national aggregators
(IDP, upGrad) holding the top two slots via city-templated pages. Consensus: **Local/Service — 78%**.

**Site page:** /study-visa (Service Page, 583 words)

**Verdict: PAGE TYPE ALIGNED, EXECUTION MISMATCH — HIGH.**
Three concrete defects:

1. **The page contradicts the rest of the site.** It states "Primary study destinations: UK,
   France, Germany, Spain, Dubai and Singapore", "6 Study Countries", and "We exclusively
   represent prestigious institutions across Europe and the UK." But the sitemap contains
   /study-in-canada, /study-in-australia, /study-in-usa, /study-in-ireland,
   /study-in-new-zealand — and the **homepage** features USA, UK, Canada, Australia as the
   headline destinations. Canada/Australia/USA/NZ/Ireland study pages are therefore
   **orphaned from the study hub**. For Surat/Gujarat students, Canada and Australia are the
   two highest-demand destinations, and the hub page hides them.
2. **Weakest schema on the site.** This page has *no* FAQPage, *no* Service, *no* Article —
   only the sitewide Organization/WebSite boilerplate. Every other analysed page has FAQPage.
3. **Unverifiable claims as the primary trust device.** "70+ Partner Unis", "24/7 Expert
   Support", "exclusively represent" — no named institutions, no proof, on a YMYL page.

The Surat office address does not appear on this page at all, despite it being an "in Surat"
targeted page.

---

### Q3. "overseas education consultants surat"
**Observed organic top 10:** idp.com/india/study-abroad-consultants/surat · sulekha.com/overseas-education-consultants/surat · studies-overseas.com (KC Overseas) · fateheducation.com · edworldeducation.com · prolificoverseaseducation.com · justdial.com · globalcolliance.com · about.me/eliteoverseas

**Dominant page type:** Local Service Page (6/9) + Directory (3/9). Consensus: **Local — 100%**.
Note the competitive texture: Edworld "16+ years", Global Colliance "17+ years", Fateh "two
decades", Prolific "3 offices". **Tenure is the ranking-adjacent trust currency in this SERP.**

**Site page:** no dedicated page. /study-visa and /visa-consultants-in-surat both partially
target it.

**Verdict: KEYWORD CANNIBALISATION + NO TENURE SIGNAL.**
Two pages half-target this term and neither owns it. More importantly, the site publishes no
founding year, no counsellor names, no counsellor credentials and no certifications anywhere —
in a SERP where every competitor leads with years-in-business. Same pack/GBP conclusion as Q1.

---

### Q4. "study in canada from india"
**Observed organic top 10:** idp.com/india/study-abroad/study-in-canada · en.wikipedia.org/wiki/Indian_students_abroad · edwiseinternational.com · quora.com · imfs.co.in · **canada.ca/en/immigration-refugees-citizenship/services/study-canada.html** · globaldegrees.in · canadavisa.com · **educanada.ca**

**Dominant page type:** Informational Guide (7/10), including **2 government domains**
(canada.ca, educanada.ca), Wikipedia and a forum (Quora). Consensus: **Informational — 70%**,
with a government/encyclopaedic authority floor.

**Site page:** /study-in-canada — title `Canada Study Visa Consultant in Surat | Study in
Canada from India`, H1 `Canada Study Visa Consultants in Surat`

**Verdict: INTENT MISMATCH — CRITICAL. This page cannot win as built.**
This is exactly the flagged pattern: a **commercial local service page** targeting a
**national informational head term** whose SERP is held by the Canadian government, Wikipedia
and 20-year-old national aggregators. The H1 answers "who should I hire in Surat"; the query
asks "how does this work". No amount of on-page work closes that gap.

**Compounding this: a YMYL factual-accuracy defect.** The page markets "SDS & non-SDS filing"
as a headline service and carries the FAQ *"What is SDS for Canada?"*. **IRCC discontinued the
Student Direct Stream in November 2024.** The live SERP confirms the correction is now
mainstream — competing results explicitly state *"The Student Direct Stream (SDS), which used
to offer faster processing for Indian students, ended in late 2024. Everyone must use the
regular study permit process."* The site is selling a visa route that no longer exists. On a
YMYL topic this is the most damaging single item in this audit after the entity problem.

**Recommendation: do not chase this query.** Retarget the page to
`canada study visa consultants in surat` / `canada student visa from surat` — terms where the
local pack and local intent give it a real path — and fix the SDS content immediately.

---

### Q5. "canada student visa requirements for indian students"
**Observed organic top 10:** goniyo.com · mastersportal.com · vedantu.com · idp.com · canadiansim.com · **policybazaar.com** · y-axis.com · goodwind.in · shiksha.com

**Dominant page type:** Informational Guide (9/9). Consensus: **Informational — 100%**.
Publisher profile: fintech (Niyo, PolicyBazaar), ed-tech giants (Vedantu, Shiksha), global
aggregators (IDP, Mastersportal, Y-Axis) — DR 70–90 domains with dedicated content teams.

**Site page:** /guides/canada-student-visa-requirements (297 body words, 1,594 chars extracted)

**Verdict: PAGE TYPE ALIGNED, DEPTH MISMATCH — CRITICAL.**
The format is right (Article + FAQPage + BreadcrumbList schema, /guides/ URL, dateModified
2026-08-25). The substance is 297 words against 2,000–3,000-word competitors that publish
**exact numbers** — CAD 20,635 proof of funds, CAD 150 permit fee, CAD 85 biometrics, PAL
requirement, SDS termination. The site page publishes none of these figures.
It also repeats the SDS framing ("SDS vs non-SDS (high level)") — same accuracy defect as Q4.

**Recommendation: do not chase the head term.** This SERP is bought and paid for by
balance-sheet publishers. Redirect the effort into the long tail this business can uniquely
serve: `canada study visa rejection reasons for gujarat students`,
`canada study visa with backlogs from india`, `canada study visa education loan surat`.

---

### Q6. "japan ssw visa india"  ← **the one genuine opportunity**
**Observed organic top 10:** indembassy-tokyo.gov.in (a **PDF**) · careergrowthplacement.com ·
navishr.com · e-j.org.in · genrise.in · japaneselanguageclasses.com (×2) ·
japanvisawithchetan.com · teamlanguages.com

**Dominant page type:** Informational Guide (8/9) — but note *who* is publishing: small
recruitment agencies, Japanese-language schools and one-person consultancies. **There is no
aggregator, no fintech publisher, no English-language government page, and no Wikipedia
entry.** The #1 result is a government **PDF** — the weakest possible format to defend a
position with. Consensus: **Informational — 89%, and the authority floor is low.**

**Site pages:** /guides/japan-ssw-visa-guide (225 words) and /work-visa/japan (496 words)

**Verdict: PAGE TYPE ALIGNED, SERP IS WINNABLE, PAGE IS UNDER-BUILT.**
This is the only query in the analysed set where a Surat consultancy can realistically take a
top-3 organic position. The site already has the correct two-page architecture (informational
guide → commercial pathway page) and correct schema. It is losing purely on depth.

What the ranking pages cover that /guides/japan-ssw-visa-guide does not: the **NSDC**
implementation route, the **India–Japan MoC (Jan 2021)** that makes India one of ~15 partner
countries, **JFT-Basic** vs **JLPT N4** test equivalence, the **14 SSW sectors** named
individually, skills-evaluation test schedules in India, SSW-1 vs SSW-2 distinction, salary
ranges in JPY, the **Certificate of Eligibility** (CoE) 3–4 month timeline, and total cost.
The site page covers none of it in 225 words.

Also relevant: the **India–Japan Human Resource Exchange Partnership (Aug 2025)** targeting
500,000 personnel over 5 years is surfacing in these SERPs. That is a live news hook this
site is not using.

---

### Q7. "work visa for japan from india"
**Observed organic top 10:** godigit.com · en.wikipedia.org/wiki/Working_holiday_visa ·
tataaig.com · **policybazaar.com** · en.wikipedia.org/wiki/Indians_in_Japan · y-axis.com ·
btwvisas.com · **in.emb-japan.go.jp/long_term visas.html** · japaneselanguagecourses.com

**Dominant page type:** Informational Guide (7/9), with 2 Wikipedia entries and 1 embassy
page. Publisher profile: **insurance/fintech content farms** (GoDigit, Tata AIG, PolicyBazaar
all publish visa content as travel-insurance lead magnets) + Y-Axis + BTW Visas.
Consensus: **Informational — 78%**.

**Site page:** /work-visa/japan (Service Page, 496 words, H1 "Japan Work Visa Consultants in
Surat (SSW & Engineer)")

**Verdict: INTENT MISMATCH — HIGH.**
Second instance of the flagged pattern: a Surat-branded commercial page against an
informational SERP owned by insurance conglomerates and Wikipedia. The competitors answer
concrete questions — CoE required, ¥3,000 single / ¥6,000 multiple entry fee, 7–10 day visa
processing after a 3–4 month CoE wait, 1–5 year durations. The site page answers none of them.

Credit where due: the FAQ *"Can you guarantee a Japan job?"* is a genuinely strong honesty
signal for this market and should be kept and expanded.

**Recommendation: do not chase this head term.** Let /guides/japan-ssw-visa-guide carry the
informational load (Q6), and retarget /work-visa/japan to
`japan ssw visa consultant in surat` / `japan work visa agency gujarat`.

---

### Q8. "study in germany from india cost"
**Observed organic top 10:** credila.com · ue-germany.com · gradright.com · **icicibank.in** ·
quora.com · studying-in-germany.org · y-axis.com · shiksha.com · careers360.com

**Dominant page type:** Informational Cost Guide (8/9) + 1 forum. Publisher profile:
**education-loan lenders** (Credila = HDFC Credila, ICICI Bank, GradRight) who publish cost
content to originate loans, plus ed-tech (Shiksha, Careers360). Consensus: **Informational — 89%**.
Every ranking page leads with numbers: ₹18–30 lakh/year, €10,000–14,000/year, €100–400
semester fee, €800–1,200/month living, €5,000–20,000 private tuition.

**Site page:** /study-in-germany (408 words, H1 "Germany Study Visa Consultants in Surat")

**Verdict: INTENT MISMATCH — CRITICAL.**
The query is explicitly a **cost** query. The page contains **no cost figures at all** — it
has an H2 "Blocked account help" and an FAQ "Is studying in Germany free?" but publishes no
blocked-account amount, no semester fee, no living-cost estimate, and no table
(`<table>` count = 0). A page targeting a cost query with zero costs cannot rank, and would
not deserve to.

**Recommendation: do not chase this head term** — you are competing with banks whose business
model funds the content. But the *fixable* defect is independent of ranking: a Germany study
page for Indian students that omits the blocked-account figure is failing its visitors.

---

### Q9. "uk student visa requirements"
**Observed organic top 10:** gmac.com · immigrationbarrister.co.uk · registryservices.ed.ac.uk
(University of Edinburgh) · **ukcisa.org.uk** · **britishcouncil.org** · iasservices.org.uk ·
gostudyin.com · **ox.ac.uk** · **gov.uk/student-visa**

**Dominant page type:** Government / official-body / university (6/9 — GOV.UK, UKCISA,
British Council, Oxford, Edinburgh, plus two regulated UK immigration law firms).
Consensus: **Government/Institutional — 67%**, and it is the hardest authority wall in this set.

**Site page:** /guides/uk-student-visa-requirements (216 body words — second-thinnest page on the site)

**Verdict: UNWINNABLE — ABANDON AS A RANKING TARGET. Be blunt: this will never rank.**
GOV.UK is the primary source; UKCISA and the British Council are the officially-sanctioned
advisory bodies; Oxford and Edinburgh are the institutions issuing the CAS. A 216-word page
from an unverified Surat consultancy has no path here, at any content length.

Keep the page — but only as a **conversion asset** linked from /study-in-uk, not as a ranking
play. And fix the substance: the SERP publishes £1,483/month (London) and £1,136/month
(outside London) maintenance, £558 visa fee, £776/year IHS. The site page mentions "maintenance
funds for the required period" without a single number.

---

### Q10. "post study work visa comparison"
**Observed organic top 10:** gradright.com · studyinternational.com · expatrio.com ·
**internationalservices.hsbc.com** · nnuimmigration.com · **timeshighereducation.com** ·
vanguardngr.com · unitrackoverseas.com · mindmineglobal.com

**Dominant page type:** **Comparison Page** (9/9) — every single result is a multi-country
comparison with a structured table or matrix. Consensus: **Comparison — 100%**. This is the
most format-homogeneous SERP in the entire analysis.

**Site page:** /guides/post-study-work-visa-comparison — **197 body words, `<table>` count = 0**

**Verdict: FORMAT MISMATCH — CRITICAL. The most clear-cut failure in this audit.**
The page is titled a comparison, has an H2 "Quick comparison lens", and then delivers a single
72-word paragraph naming four programmes with **no comparison of any kind** — no table, no
matrix, no durations, no eligibility, no pros/cons, no ItemList schema. Full extracted body:

> "Canada's PGWP, the UK Graduate Route, Australia's Temporary Graduate settings, and US
> OPT/CPT rules each have different eligibility, duration and employer requirements. Choose a
> study destination for education quality first, then validate post-study options for your
> intake year."

Against a SERP where every competitor tabulates: UK Graduate route 2 years / 3 for doctoral;
Canada PGWP up to 3 years, open permit, no sponsorship, 3-year for most master's regardless of
programme length since Feb 2024; Australia 2–4 years by qualification and location; Germany
18 months, any job; USA restricted to field of study.

**Recommendation: don't chase the head term** (THE and HSBC own it) — **but build the table
anyway.** The narrower, winnable version is
`post study work visa comparison for indian students 2026`, and the table is reusable across
every /study-in-* page as an internal-link magnet.

---

## 2. Consolidated verdict table

| Query | SERP dominant type | Site page | Type match | Severity | Strategic call |
|---|---|---|---|---|---|
| visa consultants in surat | Local pack + directory | /visa-consultants-in-surat | Aligned | — | **GBP, not the page** |
| study visa consultants surat | Local service | /study-visa | Aligned | HIGH (execution) | Rebuild + GBP |
| overseas education consultants surat | Local + directory | (none / split) | Cannibalised | HIGH | **GBP, not the page** |
| study in canada from india | Informational + **.gov** | /study-in-canada | **Mismatch** | **CRITICAL** | **Abandon head term** |
| canada student visa requirements for indians | Informational, DR 70–90 | /guides/canada-student-visa-requirements | Aligned | CRITICAL (depth) | **Abandon head term**, go long-tail |
| **japan ssw visa india** | Informational, **low authority** | /guides/japan-ssw-visa-guide | Aligned | CRITICAL (depth) | **PURSUE — best opportunity** |
| work visa for japan from india | Informational + Wikipedia | /work-visa/japan | **Mismatch** | HIGH | Abandon; retarget to local |
| study in germany from india cost | Cost guide, **lender-owned** | /study-in-germany | **Mismatch** | **CRITICAL** | **Abandon head term** |
| uk student visa requirements | **Government/institutional** | /guides/uk-student-visa-requirements | Aligned | — | **Unwinnable. Abandon.** |
| post study work visa comparison | **Comparison, 100%** | /guides/post-study-work-visa-comparison | **Format mismatch** | **CRITICAL** | Abandon head term, build table |

### The blunt version
Of 10 target queries, **6 should be abandoned as ranking targets** (Q4, Q5, Q7, Q8, Q9, Q10):
they are held by governments (canada.ca, educanada.ca, GOV.UK, embassy pages), institutions
(Oxford, Edinburgh, UKCISA, British Council), Wikipedia, or publishers with balance sheets
(PolicyBazaar, ICICI, Credila, HSBC, Times Higher Education, IDP, Shiksha). A small
consultancy with 200–700-word pages and no entity presence has no path to any of them, and
effort spent there is wasted.

**3 are local-pack queries** (Q1, Q2, Q3) where the page is the second-order lever and the
**Google Business Profile is the first-order lever**.

**1 is genuinely winnable organically** (Q6, japan ssw visa india) — and it is the one the
site has invested least in (225 words).

---

## 3. User stories derived from observed SERP signals

**US-1 — Surat parent vetting a consultancy before handing over documents.**
*As a* parent in Surat, *I want to* see the consultancy's Google rating, years in business
and office photos, *so that* I know this is a real firm and not a fly-by-night agent.
> **Signal:** the organic top 10 for "visa consultants in surat" is 4/9 directories
> (IndiaMART, Sulekha ×2, JustDial) whose entire value proposition is ratings and verified
> listings; competitors in Q3 lead with "16+ years", "17+ years", "two decades".
> **Site status:** zero ratings, zero tenure statement, 2 images, no GBP. **Unserved.**

**US-2 — ITI-qualified job-seeker checking whether a Japan agent is licensed.**
*As a* 26-year-old from a tier-2 Gujarat town, *I want to* verify the agency's MEA/eMigrate
Recruiting Agent licence and its fee policy, *so that* I do not lose ₹2–3 lakh to a fraud.
> **Signal:** the Q6/Q7 SERPs are populated by small recruitment operators
> (careergrowthplacement, navishr, e-j.org.in, genrise) — precisely the category Indian
> job-seekers have been warned about; the site itself pre-empts this with the FAQ
> "Can you guarantee a Japan job?".
> **Site status:** no RA licence number, no registration number, no fee-transparency
> statement anywhere across the 10 pages fetched. **Unserved — highest-risk gap.**

**US-3 — Student comparing destinations before committing to a country.**
*As a* BCom graduate deciding between Canada, UK, Australia and Germany, *I want* one table
comparing post-study work rights, duration and PR pathway, *so that* I can pick a country
before paying anyone.
> **Signal:** Q10 SERP is **100% comparison-table format** across 9/9 results.
> **Site status:** /guides/post-study-work-visa-comparison has **zero tables** and 197 words.
> **Unserved.**

**US-4 — Cost-sensitive applicant sizing up total outlay.**
*As an* applicant whose family is arranging an education loan, *I want* the actual numbers —
blocked-account amount, proof of funds, visa fee, IHS, living cost — *so that* I can approach
a bank.
> **Signal:** Q5 and Q8 SERPs are dominated by **lenders and insurers** (Credila, ICICI,
> Niyo, PolicyBazaar) who rank precisely because they publish exact figures.
> **Site status:** /study-in-germany contains no cost figure; /guides/uk-student-visa-
> requirements contains no maintenance figure; /guides/canada-student-visa-requirements
> contains no CAD figure. **Unserved.**

**US-5 — SSW candidate mapping the test-to-job sequence.**
*As a* candidate targeting Japan SSW, *I want to* know the JFT-Basic vs JLPT N4 route, the
NSDC skills-test schedule in India, and the CoE timeline, *so that* I can plan 12 months ahead.
> **Signal:** every ranking page in Q6 structures itself around exactly this sequence; the
> India–Japan MoC (Jan 2021) and NSDC's role appear in the majority of results.
> **Site status:** /guides/japan-ssw-visa-guide has an H2 "Preparation roadmap" and 225 words;
> NSDC, JFT-Basic, MoC and CoE are not covered. **Unserved — and this is the winnable query.**

---

## 4. SXO Gap Scores (page-level)
*Scored across 7 dimensions — Page Type (15), Content Depth (15), UX Signals (15), Schema (15),
Media (15), Authority (15), Freshness (10). This is an **SXO Gap Score**, separate from any
SEO Health Score.*

| Page | Type | Depth | UX | Schema | Media | Auth | Fresh | **Total** |
|---|---|---|---|---|---|---|---|---|
| /guides/canada-student-visa-requirements | 13 | 3 | 6 | 12 | 3 | 3 | 6 | **46** |
| /visa-consultants-in-surat | 11 | 6 | 9 | 9 | 3 | 3 | 5 | **46** |
| /guides/japan-ssw-visa-guide | 13 | 2 | 5 | 12 | 3 | 3 | 6 | **44** |
| /work-visa/japan | 6 | 5 | 10 | 10 | 3 | 3 | 4 | **41** |
| /study-visa | 11 | 6 | 7 | 5 | 3 | 3 | 4 | **39** |
| /study-in-canada | 5 | 6 | 10 | 10 | 3 | 3 | **1** | **38** |
| /guides/uk-student-visa-requirements | 8 | 2 | 5 | 12 | 3 | 2 | 6 | **38** |
| /study-in-germany | 5 | 3 | 8 | 10 | 3 | 3 | 4 | **36** |
| /guides/post-study-work-visa-comparison | **3** | 2 | 4 | 9 | 3 | 3 | 6 | **30** |

**Score evidence notes**
- *Schema* scores are high because the markup is legitimately well-built (Article, FAQPage,
  BreadcrumbList, Service, Organization, PostalAddress, GeoCoordinates, correctly nested).
  It is capped below 13 everywhere because `aggregateRating`, `Review`, `openingHoursSpecification`
  and `ImageObject` on content images are absent sitewide, and no page uses `ItemList`/`Table`.
- *Media* is 3/15 on every page: 2–3 images per page, no video, no diagrams, no comparison
  graphics, no office or team photography — against SERPs full of tables, checklists and screenshots.
- *Authority* is 3/15 sitewide and is **not a page-level problem** — it is the entity problem
  in §0, Finding 1. It cannot be fixed by editing pages.
- */study-in-canada Freshness = 1/10* solely because of the discontinued-SDS content.

---

## 5. Persona scoring

### Persona A — "Priya", prospective student in Surat comparing local consultants
Role: 21, BCom graduate, Varachha, Surat. Goal: pick a consultancy she can walk into and trust
with ₹15–25 lakh of family money. Emotional state: cautious, comparison-shopping, parent-influenced.
Journey stage: Consideration → Decision.
> **SERP evidence:** local pack + 4 directory results in Q1; "FREE Counselling" (IDP),
> "99% Visa Success Rate" (WEC), "Best Student Visa Consultant" framing throughout Q2/Q3;
> tenure claims ("16+ years", "17+ years", "two decades") in Q3.

Scored against /visa-consultants-in-surat + /study-visa:

| Dimension | Score | Evidence |
|---|---|---|
| Relevance | **18**/25 | Page is genuinely Surat-specific. The paragraph on Gujarat academic patterns — "gaps, backlogs, medium of instruction, sponsor structures" — is a real differentiator no competitor in the SERP articulates. Undercut by /study-visa omitting Canada and Australia. |
| Clarity | **15**/25 | Address and four value props are above the fold; Gujarati/Hindi/English communication is stated. But no opening hours, no map, no landmark/travel guidance, no fee indication. Directory competitors give her phone + rating + distance in one glance. |
| Trust | **7**/25 | The failure point. No Google rating, no `aggregateRating` schema, 45 on-site testimonials with **zero third-party corroboration**, no counsellor names, photos or credentials, no founding year, no registration number. And the brand **does not rank for its own name** — if Priya searches "Siddhivinayak Overseas Surat" she finds a misspelled Facebook page, a wooden-furniture manufacturer, a different domain, and two conflicting addresses (New Delhi via ZoomInfo, Sagrampura via Officedial). |
| Action | **17**/25 | `wa.me` and `tel:` links are present and correctly chosen for this market. No online booking, no "visit us today, open until X", no callback form above fold. |
| **Total** | **57/100** | **Needs Work** |

**Top issue:** trust collapse on external verification, not on-page copy.
**Concrete fix:** claim and verify the GBP at 620 Pragti IT Park; make site NAP byte-identical
to GBP; add `openingHoursSpecification` + `aggregateRating` to LocalBusiness schema; embed the
GBP map on /visa-consultants-in-surat; add a "Meet your counsellors" block with 3 named people,
photos and qualifications; add "Serving Surat since [year]" to the H1 area; consolidate the two
Facebook pages and correct the Instagram handle spelling.

---

### Persona B — "Ramesh", job-seeker in a tier-2 Indian city researching Japan / Gulf work visas
Role: 26, ITI diploma, Rajkot. Goal: a real overseas job with a stated salary, without being
defrauded. Emotional state: hopeful but highly fraud-alert; likely knows a victim.
Journey stage: Awareness → Consideration.
> **SERP evidence:** Q6/Q7 organic is populated almost entirely by small recruitment operators
> and language schools (careergrowthplacement.com, navishr.com, genrise.in,
> japanvisawithchetan.com, e-j.org.in, teamlanguages.com) — the exact category that generates
> the fraud anxiety; ranking pages lead with concrete fees (¥3,000/¥6,000), timelines (CoE 3–4
> months, visa 7–10 days) and the NSDC/MoC institutional backing.

Scored against /work-visa/japan + /guides/japan-ssw-visa-guide:

| Dimension | Score | Evidence |
|---|---|---|
| Relevance | **19**/25 | Strong. The SSW + Engineer framing is correct; "SSW sectors", "Language roadmap", "Honest timelines" are the right H2s; and the site's /urgent-requirements vacancy pages (14 of them, with salaries) match exactly what this persona searches. |
| Clarity | **9**/25 | 225 words (guide) / 496 words (service page). No JFT-Basic vs JLPT N4 explanation, no NSDC route, no named list of SSW sectors, no salary range, no CoE timeline, no cost breakdown, no tables. Ramesh must leave the site to answer his first three questions. |
| Trust | **5**/25 | **Critical.** For overseas recruitment from India the single decisive signal is the **MEA / eMigrate Recruiting Agent (RA) licence number** — absent from every page fetched. No fee-transparency statement (illegal charging is this persona's top fear). No named counsellor. No Google reviews. The FAQ "Can you guarantee a Japan job?" is an excellent instinct but is unsupported by any verifiable credential. |
| Action | **14**/25 | WhatsApp is the right channel. But there is no self-serve eligibility screener, no way to see which of the 14 live vacancies he qualifies for, and no stated cost of engagement. |
| **Total** | **47/100** | **Needs Work, trending Critical Mismatch on Trust** |

**Top issue:** a fraud-alert persona is given zero verifiable credentials.
**Concrete fix (highest ROI item in this audit):** publish the MEA/eMigrate RA licence number
in the header, footer and on every /work-visa/* and /urgent-requirements/* page; add a
"What we charge and what we never charge" section stating that no fee is taken for job offers;
expand /guides/japan-ssw-visa-guide to cover NSDC, the Jan-2021 India–Japan MoC, all SSW
sectors, JFT-Basic vs JLPT N4, the skills-test calendar in India, SSW-1 vs SSW-2, salary ranges
and the CoE timeline; add an eligibility self-check that maps him to live vacancies.

### Systemic issues across both personas
- **Trust is the lowest dimension for both** (7/25 and 5/25) and the cause is external, not
  on-page: no verified entity, no third-party reviews, no licence/registration disclosure,
  conflicting NAP across the index.
- **Media is 3/15 on every page** — no office photos, no counsellor photos, no comparison
  tables, no process diagrams.
- **Numbers are missing everywhere** — fees, funds, salaries, timelines. Both personas need
  them; every ranking competitor publishes them.

---

## 6. Priority actions, in order

1. **Fix the entity.** Claim/verify GBP; align NAP everywhere; merge the duplicate Facebook
   page; correct the Instagram handle; resolve or acquire siddhivinayakoverseas.in; expand
   `sameAs`; get listed on Sulekha, JustDial and IndiaMART. *Nothing else works until this does.*
2. **Remove the SDS content from /study-in-canada and /guides/canada-student-visa-requirements.**
   YMYL accuracy defect — the site is marketing a route IRCC closed in Nov 2024.
3. **Publish the MEA/eMigrate RA licence number** and a fee-transparency statement sitewide.
4. **Rebuild /guides/japan-ssw-visa-guide to 2,000+ words** with NSDC, MoC, JFT-Basic, the 14
   sectors, skills-test calendar, salary ranges and CoE timeline. This is the one winnable SERP.
5. **Build the actual comparison table** on /guides/post-study-work-visa-comparison and reuse
   it across all /study-in-* pages.
6. **Add `aggregateRating` + `Review` schema** to /reviews (45 real testimonials are already
   published as plain text with no markup) and `openingHoursSpecification` to LocalBusiness.
7. **Fix /study-visa** — add Canada, Australia, USA, NZ, Ireland (currently orphaned from the
   hub despite existing and being featured on the homepage), add FAQPage schema, add the Surat
   address, and either substantiate or remove "70+ Partner Unis" / "24/7" / "exclusively represent".
8. **Retarget the mismatched commercial pages** to local-modified terms: /study-in-canada →
   "canada study visa consultants in surat"; /work-visa/japan → "japan ssw visa consultant surat";
   /study-in-germany → keep national targeting only if cost tables are added.
9. **Stop investing in Q4, Q5, Q7, Q8, Q9, Q10 head terms.**

---

## 7. Cross-skill referrals
- E-E-A-T gaps (no author entities, no credentials, no tenure, YMYL accuracy defect) → `/seo content`
- Missing `aggregateRating`, `Review`, `openingHoursSpecification`, `ItemList` → `/seo schema`
- Local pack is the primary lever for 3 of 10 queries; GBP unverified → `/seo local` (highest priority)
- Nine pages under 750 words with correct schema over absent content → `/seo page`

---

## 8. Limitations
- **No rank data.** Google Search Console was not connected; no query is confirmed to rank or
  not rank. SERP composition was read via WebSearch, which returns organic results but **does
  not expose local packs, featured snippets, People-Also-Ask, AI Overviews or ads**. Local-pack
  presence for Q1/Q2/Q3 is inferred from result composition (4 directory results whose value is
  aggregated GBP data), not directly observed — it should be verified manually from a Surat IP.
- **No search-volume or difficulty data.** "Most commercially important" was judged from intent
  and the site's own page inventory, not from volume.
- **Competitor word counts are estimates** from SERP snippets and page type, not full crawls of
  each competing URL.
- **GBP status not directly verified.** No Google Business Profile surfaced in any search
  performed, but absence from these results is not proof the listing does not exist — it must be
  checked in the GBP dashboard.
- **Core Web Vitals, mobile UX and above-the-fold rendering were not measured** (no PageSpeed or
  screenshot analysis in this pass). UX Signals scores reflect information architecture only.
- **Conversion data absent** — persona Action scores reflect CTA design, not measured behaviour.
- Word counts are DOM-derived (script/style/nav/header/footer stripped) and corroborated against
  trafilatura `extracted_text`; they may differ by ±10% from a human count.
- One item was checked and **cleared**: apparent mojibake in extracted text was a terminal
  artifact. The live response serves valid UTF-8 with `<meta charset="UTF-8">`. Not a defect.

---
*Generate a PDF report? Use `/seo google report`.*
