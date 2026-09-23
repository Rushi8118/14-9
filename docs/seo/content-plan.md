# Content Plan & 12-Month Publishing Calendar — Siddhivinayak Overseas

Companion to [`technical-audit.md`](./technical-audit.md) and [`keyword-plan.csv`](./keyword-plan.csv).
All page paths below reflect routes that **verifiably exist** in `src/App.tsx` and `scripts/seo-routes.mjs`. Where I propose a new page, it is marked **NEW**.

---

## Site architecture

```
/                               Homepage — brand + category, never destination-specific
├── /work-visa                  Service hub
│   └── /work-visa/{country}    40 country pages (all exist)
├── /study-visa                 Service hub
│   └── /study-in-{country}     11 study destination pages (all exist)
├── /post-study-work-visa       Conversion hub  ← your differentiator
│   └── /pathways/{slug}        15 pathway pages (all exist)
├── /visa-consultants-in-surat  Local landing page
├── /guides/{slug}              8 evergreen guides (exist) + new ones
├── /blog/{slug}                CMS-driven, Supabase
├── /countries/{slug}           CMS-driven country profiles
├── /urgent-requirements/{slug} Live job/requirement postings (JobPosting schema ✅)
├── /success-stories            Case studies
├── /reviews                    Testimonials
├── /about  /contact  /services
└── /privacy  /terms  /immigration-disclaimer
```

**One rule above all others:** every page must answer a question no other page on your site answers. Your soft-404 history (see audit C3) came from breaking this rule. When in doubt, make one page stronger rather than two pages thinner.

---

## Page blueprints

### Homepage — `/`

| | |
|---|---|
| **Title tag** | `Visa Consultants in Surat — Study & Work Visas \| Siddhivinayak Overseas` (66 ch) |
| **Meta description** | `Study visa and work visa consultants in Surat supporting 38+ destinations. Honest eligibility checks, documentation support and end-to-end filing. Book a free consultation.` |
| **H1** (exactly one) | `Study and Work Visa Consultants in Surat` |
| **Primary keyword** | visa consultants in surat |
| **Secondary** | study visa consultant in surat · work visa consultant in surat · overseas education consultants surat |
| **Intent** | Commercial / Navigational |
| **Words** | 800–1,200 |
| **Schema** | `Organization` + `ProfessionalService`/`LocalBusiness` + `WebSite` ✅ already implemented |

**H2/H3 structure**
- H2 `What we help with` → H3 Study visas · H3 Work visas · H3 Post-study work visa conversion
- H2 `Work visa countries we actively support` (existing `work-visa-section.tsx`)
- H2 `Study destinations`
- H2 `Already abroad on a student visa?` ← **add this.** Currently missing, and it is your core audience.
- H2 `How the process works` (existing `process-section.tsx`)
- H2 `Why applicants choose us`
- H2 `Visit our Surat office` — full NAP, map, hours
- H2 `Common questions`

**Internal links out:** `/work-visa`, `/study-visa`, `/post-study-work-visa`, `/visa-consultants-in-surat`, `/success-stories`, `/contact`
**CTA:** "Book a free eligibility consultation" — above the fold, repeated after the countries section and in the footer.

> **Fix from the audit:** the hero's 501 KB globe poster is likely your LCP element. See C2.

---

### Service hub — `/work-visa`

| | |
|---|---|
| **Title** | `Work Visa Consultants — 38+ Countries \| Siddhivinayak Overseas` |
| **Meta** | `Work visa and work permit support for 38+ destinations across Europe, North America, Oceania, Asia and the Gulf. Eligibility mapping from our Surat office.` |
| **H1** | `Work Visa Support for 38+ Destinations` |
| **Primary** | work visa consultant · work permit agency |
| **Words** | 1,000–1,500 |
| **Schema** | `Service` + `FAQPage` + `BreadcrumbList` |

**H2s:** How work visa routes differ (employer-sponsored vs job-seeker vs skilled) · Countries we support, by region · What we do and what you do · Documents you will need · Timelines and honesty about them · Fees · FAQ

**CTA:** "Check your eligibility — free 20-minute call"

---

### Country landing page — `/work-visa/{country}` (template for all 40)

| | |
|---|---|
| **Title** | `{Country} Work Visa — Routes, Requirements & Support \| Siddhivinayak Overseas` |
| **Meta** | `{Country} work visa guidance: which route fits your profile, documents required, realistic timelines and filing support. Free eligibility check.` |
| **H1** | `{Country} Work Visa` |
| **Primary** | {country} work visa |
| **Secondary** | {country} work permit · {country} work visa for indians · india to {country} work visa · {country} work visa requirements |
| **Intent** | Commercial |
| **Words** | 1,200–2,000 |
| **Schema** | `Service` + `FAQPage` + `BreadcrumbList` |

**H2/H3 structure**
- H2 `Work visa routes to {Country}` → H3 per route, each with eligibility in a table
- H2 `Who qualifies` — honest, including who does not
- H2 `Documents required`
- H2 `How long it takes` — observed ranges, never guarantees
- H2 `What it costs` — split government fees vs our fees
- H2 `Applying from India` — apostille, VFS centres in Gujarat, Surat-specific notes
- H2 `Already studying in {Country}?` → link to the pathway page
- H2 `Frequently asked questions`

**Internal links:** `/work-visa` (up) · `/pathways/{relevant}` · 2–3 comparable countries (sideways) · `/contact` · `/visa-consultants-in-surat`
**CTA:** "See if you qualify for a {Country} work visa"

**FAQs (use per country):** Do I need a job offer first? · Is IELTS required? · Can I bring my spouse? · How long does it take? · Can I apply from India or must I be in {Country}? · What happens if it is refused?

> **Depth over breadth.** Ten excellent country pages beat forty thin ones. Tier-3 destinations (Albania, Moldova, Belarus, Azerbaijan, Armenia) should stay as short entries under a regional page until you have real demand.

---

### Post-study pathway page — `/pathways/{slug}` (your highest-value template)

| | |
|---|---|
| **Title** | `{Country} Post-Study Work Visa — Switching from a Student Visa` |
| **Meta** | `Your {Country} student visa is ending. Here are your work visa options, the deadlines that matter, and how to switch without a gap in status.` |
| **H1** | `{Country} Post-Study Work Visa: Switching from a Student Visa` |
| **Primary** | {country} post study work visa |
| **Secondary** | convert student visa to work visa in {country} · {country} work visa after graduation · {country} student visa expiring what to do |
| **Intent** | Commercial + Informational |
| **Words** | 1,500–2,500 |
| **Schema** | `Article` + `FAQPage` + `BreadcrumbList` |

**H2/H3 structure**
- H2 `Your options when a {Country} student visa ends` — a comparison table of every route
- H2 `{Route name} explained` (one H2 per route) → H3 Eligibility · H3 Timing · H3 Cost
- H2 `The timeline that matters` — month-by-month, anchored to visa expiry, not to graduation
- H2 `Documents to start collecting now`
- H2 `Common mistakes that cause a gap in status`
- H2 `How we help` — concrete, not vague
- H2 `Questions students ask us`

**Non-negotiable:** every rule you state links to the official government source, and the page carries a visible `Last reviewed: {date}`. Immigration rules change; stale advice damages trust faster than a slow page does.

**Internal links:** `/study-in-{country}` · `/work-visa/{country}` · `/post-study-work-visa` · `/contact`
**CTA:** "Book a status review before your visa expires"

---

### City landing page — `/visa-consultants-in-surat` (exists) and future city pages

| | |
|---|---|
| **Title** | `Visa Consultants in Surat — Study & Work Abroad \| Siddhivinayak Overseas` ✅ already set |
| **H1** | `Visa Consultants in Surat — Study & Work Abroad` ✅ |
| **Primary** | visa consultants in surat |
| **Words** | 700–1,200 |
| **Schema** | `LocalBusiness` with geo ✅ + `FAQPage` |

**Must contain:** full NAP matching Google Business Profile character for character · embedded map · office photos (real, not stock) · named counsellors · languages spoken (Gujarati, Hindi, English — a genuine differentiator) · nearby landmarks (Pragti IT Park, Kiran Chowk, Yogi Chowk) · Google reviews · office hours · directions and parking.

**Build city pages only where you have real presence.** Order: Surat ✅ → Ahmedabad, Vadodara, Rajkot, Navsari → Mumbai/Pune only if you genuinely service them. A city page for a city you have never served is a doorway page; Google filters them and it is explicitly against the rules you asked me to respect.

---

### About — `/about`

**Title:** `About Siddhivinayak Overseas — Visa Consultants in Surat`
**H1:** `About Siddhivinayak Overseas` · **Words:** 600–900 · **Schema:** `AboutPage` + `Organization`

This page carries your E-E-A-T. It must have: founding year, real counsellor names with photos and credentials, any registrations you hold (**only** ones you can prove), office photos, how many applicants you have supported (only if you can substantiate it from Supabase), and your refusal policy stated plainly. Search quality raters look for exactly this on YMYL topics — and immigration advice is YMYL.

---

### Contact — `/contact`

**Title:** `Contact Siddhivinayak Overseas — Surat Visa Consultants`
**H1:** `Contact Us` · **Words:** 300–500 · **Schema:** `ContactPage` + `LocalBusiness`

Both phone numbers as `tel:` links, WhatsApp, email, full address, map, hours, and the consultation form. Every element instrumented — the tracking code is already written (`analytics.ts`), it just needs the GA4 tag from audit C1.

---

### Pricing / quote — **NEW** `/pricing`

**Title:** `Visa Consultancy Fees — Transparent Pricing \| Siddhivinayak Overseas`
**H1:** `What Our Services Cost` · **Words:** 600–1,000 · **Schema:** `FAQPage`

Most competitors hide fees. Publishing them is a genuine trust differentiator and captures "visa consultancy fees in surat" and "{country} work visa cost". Structure: what our fee covers · what it does not (government fees, medicals, translations, travel) · fee ranges by service · when payment is due · refund policy. If you cannot publish exact figures, publish ranges and the factors that move them. Do not publish nothing.

---

### FAQ — **NEW** `/faq`

**Title:** `Visa & Immigration FAQs \| Siddhivinayak Overseas`
**H1:** `Frequently Asked Questions` · **Words:** 1,500–2,500 · **Schema:** `FAQPage`

Grouped: Study visas · Work visas · Post-study conversion · Fees and process · About us. Link each answer to the page that covers it in depth. This page exists to capture question keywords and to feed AI assistants, which increasingly answer immigration questions directly.

---

## Blog categories

1. **Post-study work visas** — your priority category
2. **Country guides** — work and study, per destination
3. **Visa process & documents** — SOPs, funds, interviews, refusals
4. **Rule changes & updates** — dated, time-sensitive
5. **Life abroad** — cost of living, housing, settling in
6. **Success stories** — real, consented, anonymised where needed

---

## 12-month publishing calendar

Two pieces per month: one **pillar** (1,500–2,500 words, targets commercial intent) and one **support** (800–1,200 words, targets a question). Months 1–3 are deliberately loaded toward post-study conversion, because that is where you can win fastest.

| Month | Type | Topic | Primary keyword | Intent | Target page | Outline | Internal links | Conversion goal |
|---|---|---|---|---|---|---|---|---|
| **1** | Pillar | What happens when your UK student visa expires | uk student visa expiring what to do | Informational | `/pathways/uk-student-visa-to-skilled-worker-visa` | 5 options compared · deadlines · gap-in-status risks · documents · how we help | `/study-in-uk`, `/work-visa/uk`, `/contact` | Status review booking |
| **1** | Support | Is IELTS required for a work visa? Country by country | is ielts required for a work visa | Informational | `/guides/ielts-requirements-for-study-abroad` | Table of 10 destinations · which accept alternatives | `/work-visa`, country pages | Newsletter signup |
| **2** | Pillar | UK Graduate Route to Skilled Worker: month-by-month timeline | graduate route visa uk | Commercial | `/pathways/uk-graduate-visa-to-skilled-worker-visa` | Route rules · sponsor licence check · timing · costs | `/work-visa/uk`, `/contact` | Consultation |
| **2** | Support | How to check if a UK employer is a licensed sponsor | licensed sponsor check uk | Informational | New guide | Walk through the official register · red flags | Pathway page | Consultation |
| **3** | Pillar | Canada PGWP to PR: which provincial programs suit Indian graduates | pgwp to pr canada | Commercial | `/pathways/canada-pgwp-to-pr` | Express Entry vs PNP · CRS factors · timelines | `/study-in-canada`, `/work-visa/canada` | Consultation |
| **3** | Support | Can you work while studying in Canada? | can i work while studying in canada | Informational | `/study-in-canada` | Hour limits · co-op permits · tax basics | `/pathways/canada-pgwp-to-pr` | Newsletter |
| **4** | Pillar | Australia 485 to employer sponsorship: how Skills in Demand works | australia post study work visa | Commercial | `/pathways/australia-485-to-employer-sponsored-visa` | 485 duration · SID visa · skills assessment | `/study-in-australia`, `/work-visa/australia` | Consultation |
| **4** | Support | Australian skills assessment explained for Indian graduates | australia skills assessment | Informational | New guide | Assessing authorities · documents · timelines | Pathway page | Consultation |
| **5** | Pillar | Germany Opportunity Card vs EU Blue Card | germany work visa | Commercial | `/work-visa/germany` | Honest comparison table · who each suits | `/study-in-germany`, `/contact` | Eligibility check |
| **5** | Support | How much German do you need for a work visa? | german language requirement work visa | Informational | New guide | By route and sector · where B1 is mandatory | `/work-visa/germany` | Newsletter |
| **6** | Pillar | Japan SSW visa: sectors, language and realistic salaries | ssw visa japan | Commercial | `/work-visa/japan` | 16 sectors · JFT-Basic/JLPT · salary ranges | `/guides/japan-ssw-visa-guide` | Consultation |
| **6** | Support | Cost of living in Japan for Indian workers | cost of living japan for indians | Informational | New blog | Rent, food, transport, remittance | `/work-visa/japan` | Newsletter |
| **7** | Pillar | Portugal and Poland: Europe's most accessible work permits from India | portugal work visa | Commercial | `/work-visa/portugal` | Honest comparison · routes · realistic timelines | `/work-visa/poland`, `/contact` | Eligibility check |
| **7** | Support | What is an apostille and how do you get one in Gujarat? | apostille surat | Informational | New guide | MEA process · Surat/Ahmedabad centres · costs | `/visa-consultants-in-surat` | Consultation |
| **8** | Pillar | Why work visa applications get refused: 7 documentation errors | work visa rejection reasons | Informational | `/guides/visa-rejection-reasons` | Each error with a fix · what to do after refusal | All country pages | Consultation |
| **8** | Support | Can you reapply after a visa refusal? | reapply after visa refusal | Informational | New blog | Cooling-off by country · disclosure duty | `/guides/visa-rejection-reasons` | Consultation |
| **9** | Pillar | New Zealand AEWV explained for graduates already in NZ | new zealand accredited employer work visa | Commercial | `/pathways/new-zealand-accredited-employer-work-visa` | 3-step process · pay thresholds · job token | `/study-in-new-zealand` | Consultation |
| **9** | Support | Bringing your spouse on a work visa: 8 countries compared | can i bring my family on a work visa | Informational | New pillar-support | Dependant rules table · work rights for spouses | Country pages | Newsletter |
| **10** | Pillar | Moving from the UK to Canada, Australia or NZ for work | move from uk to canada for work | Commercial | `/pathways/move-from-uk-to-canada` | Your visa does not transfer · what does · routes | Sibling pathway pages | Consultation |
| **10** | Support | Credential recognition: getting Indian qualifications accepted abroad | credential recognition for indian degrees | Informational | New guide | WES/ECA · per-country bodies · timelines | Country pages | Consultation |
| **11** | Pillar | Study visa vs work visa: which route abroad is realistic for you | study visa vs work visa | Informational | `/services` | Honest decision framework · cost, time, risk | `/study-visa`, `/work-visa` | Eligibility check |
| **11** | Support | How much bank balance is required for a student visa? | bank balance required for student visa | Informational | `/study-visa` | Per-country figures with official source links | Study destination pages | Newsletter |
| **12** | Pillar | Processing times we observed across 8 destinations in 2026 | work visa processing time | Informational | New — **original research** | Anonymised data from your own files · method · sample size | All country pages | Link acquisition |
| **12** | Support | Year in review: immigration rule changes that affected Indian applicants | immigration rule changes 2026 | Informational | New blog | Chronological, sourced | Affected country pages | Newsletter |

**Two rules for this calendar.** First, the month-12 research piece is your best shot at earning genuine links — but only publish it if your sample is large enough to state honestly, and always state the sample size. Second, anything touching fees, salary thresholds or processing times gets a diary entry for quarterly review. Stale immigration content is worse than no content.

---

## Comparison pages

Comparison content converts well and is under-served in this sector. Build these as guides, not as thin doorway pages:

- Canada vs Australia for post-study work rights
- UK Graduate Route vs Canada PGWP
- Germany vs Netherlands for Indian engineers
- Study visa vs work visa: cost and time compared
- Applying yourself vs using a consultant — **write this honestly.** Saying "you can do this yourself, and here is when it makes sense to" builds more trust than pretending otherwise, and it ranks for a query your competitors are afraid of.

---

## Trust & authority content

Immigration advice is a YMYL topic. Google's raters explicitly look for expertise and accountability signals. Priority order:

1. **Named counsellors with real credentials** on `/about` — photos, experience, languages, any registration.
2. **`/immigration-disclaimer`** ✅ already exists. Make it linked from every advice page footer, not buried.
3. **Case studies** on `/success-stories` — with consent, with specifics (country, route, timeline), without exaggeration.
4. **Source every factual claim.** Every visa rule links to the official government page. This is the strongest E-E-A-T signal available to you and costs nothing but discipline.
5. **Visible "Last reviewed" dates** on all advice content.
6. **A published refusal policy** — what happens, what you do, what you refund. Nobody publishes this. It is a real differentiator.
7. **Real office photography.** Stock images of generic offices actively hurt local trust signals.
