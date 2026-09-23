# SEO Keyword Strategy — Siddhivinayak Overseas

**Site:** https://siddhivinayakoverseas.com
**Business:** Visa & overseas education consultancy, Surat, Gujarat, India
**Office:** 620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat 395006
**Languages:** English (primary). Gujarati and Hindi are spoken in counselling but the site is English-only — see "Language decision" below.

**Full keyword table:** [`keyword-strategy.csv`](./keyword-strategy.csv) — **7,843 unique keywords**, 12 columns (Keyword, Category, Intent, Origin, Destination, Service, Page type, URL slug, Title tag, Meta description, Priority, Notes). Open it in Excel or Google Sheets and filter by Priority or Category.

Same keywords in the alternative 12-column shape (intent / target country / target city / page / competition / internal links / content requirements): [`keyword-plan.csv`](./keyword-plan.csv).

| Category | Keywords |
|---|---|
| Location (country/city pairs) | 5,857 |
| Service | 956 |
| Comparison (modifiers) | 420 |
| Local (Surat/Gujarat) | 410 |
| Question | 168 |
| Variation (misspellings, abbreviations) | 19 |
| Brand | 13 |

### Coverage check against the brief

I re-verified the file against every destination and modifier in the request. All 30 named destination countries are present — Germany, France, Italy, Spain, Portugal, Netherlands, Belgium, Austria, Switzerland, Ireland, Sweden, Norway, Denmark, Finland, Poland, Czech Republic, Hungary, Romania, Greece, Canada, Australia, New Zealand, Japan, South Korea, UAE, Saudi Arabia, Qatar, Singapore, Malaysia, Thailand — plus the extra destinations found in your code.

**Four genuine gaps were found and filled (+1,680 keywords):**

1. **Spelled-out country names.** The first version generated `uk`, `usa`, `nz` and `uae` only. "new zealand work visa" and "united kingdom work visa" are distinct, higher-volume search strings than their abbreviations. Both forms are now separate entries, as the brief asked.
2. **"online" and "local"** — safe, accurate modifiers for your remote counselling. Added.
3. **"booking", "company", "provider"** — natural phrasings real applicants use. Added.
4. **"phone number"** — contact-detail navigational queries. Added.

**Four modifiers from the brief remain deliberately excluded.** This is a recommendation, not an oversight:

| Excluded | Reason |
|---|---|
| **cheap** | A price claim you would have to defend, and it attracts clients who churn. "Affordable" (44 keywords, included) captures the same intent defensibly. |
| **licensed** | Unless you hold ICCRC/CICC, MARA or OISC registration, this is misrepresentation — and in Canada and Australia, advertising immigration advice without registration is a criminal offence. **Tell me you hold one and I will add the entire tier.** |
| **same day / 24-hour** | No work or study visa is issued same-day. These queries belong to passport and travel agencies; the traffic cannot convert for you, and the phrasing implies a promise you cannot keep. "Fast" and "urgent" are included (22 each) but flagged Low and tied to honest timeline content. |
| **official** | Implies a government relationship you do not have. The people searching it want the embassy site, not a consultancy. |

---

## What I used instead of asking you

You asked me to check the codebase for the countries you serve, so I did rather than hold the work up. Everything below is built on what's actually in the site:

- **Work destinations (38, from `src/content/work-countries.ts`):** Germany, France, Italy, Spain, Portugal, Netherlands, Austria, Switzerland, Ireland, Sweden, Norway, Denmark, Finland, Poland, Hungary, Romania, Croatia, Malta, Slovakia, Albania, Armenia, Azerbaijan, Belarus, Moldova, Russia, Kazakhstan, Israel, Canada, United States, United Kingdom, Australia, New Zealand, Japan, Singapore, Malaysia, Maldives, Saudi Arabia, Qatar, plus Gulf and Africa regional groupings.
- **Study destinations (11, from `src/content/study-destinations.ts`):** Canada, UK, Australia, USA, Germany, Ireland, New Zealand, France, Spain, Dubai, Singapore.
- **Post-study pathways already written (`src/content/pathways.ts`):** UK Student→Skilled Worker, UK Graduate Route, Canada PGWP→PR, Australia 485→employer-sponsored, NZ AEWV, UK→Australia/Canada/NZ moves, Japan SSW.

**Three things I'd still like from you**, because they change priorities rather than block them:

1. **Do you hold any formal registration** (ICCRC/CICC, MARA, OISC, or a Gujarat/India registration)? If yes, a whole "licensed/registered" keyword tier opens up. If no, I have deliberately excluded it — see the warning list.
2. **Is the first consultation genuinely free?** I've included "free visa consultation in Surat" on the assumption that it is.
3. **Which 5–8 destinations are 80% of your actual revenue?** I've tiered by search demand; your revenue mix should override mine.

---

## The strategic call: lead with post-study conversion

Your stated audience is unusual and it's your biggest advantage. Almost every competitor in Surat is fighting over "Canada study visa consultant" — a brutally contested term. Almost nobody is targeting *students already abroad whose study visa is running out*.

That cluster — "UK post study work visa", "convert student visa to work visa in Canada", "Australia student visa expiring what to do" — is **high intent, low competition, and you already have the pathway content written**. Every one of those is marked High priority in the CSV.

Build that first. It will rank faster than anything else on this list.

---

## The 30 highest-priority keywords

**Tier 1 — post-study conversion (your moat)**

| # | Keyword | Page |
|---|---|---|
| 1 | uk post study work visa | `/post-study-work-visa/united-kingdom` |
| 2 | convert student visa to work visa in uk | `/post-study-work-visa/united-kingdom` |
| 3 | canada post study work visa | `/post-study-work-visa/canada` |
| 4 | pgwp to pr canada | `/post-study-work-visa/canada` |
| 5 | australia post study work visa | `/post-study-work-visa/australia` |
| 6 | study visa to work visa in canada | `/post-study-work-visa/canada` |
| 7 | uk student visa expiring what to do | `/guides/uk-student-visa-expiring` |
| 8 | canada work visa sponsorship for international students | `/post-study-work-visa/canada` |
| 9 | graduate route visa uk | `/post-study-work-visa/united-kingdom` |
| 10 | switch student visa to work visa uk | `/post-study-work-visa/united-kingdom` |

**Tier 2 — local Surat commercial**

| # | Keyword | Page |
|---|---|---|
| 11 | visa consultants in surat | `/visa-consultants-in-surat` |
| 12 | study visa consultant in surat | `/visa-consultants-in-surat` |
| 13 | work visa consultant in surat | `/visa-consultants-in-surat` |
| 14 | immigration consultant in surat | `/visa-consultants-in-surat` |
| 15 | canada visa consultant in surat | `/study-in-canada/surat` |
| 16 | study abroad consultants in surat | `/visa-consultants-in-surat` |
| 17 | work visa consultant near me | GBP + local page |
| 18 | study visa consultant near me | GBP + local page |
| 19 | best visa consultant in surat | `/visa-consultants-in-surat` |
| 20 | student visa consultant in surat | `/visa-consultants-in-surat` |

**Tier 3 — destination heads and India pairs**

| # | Keyword | Page |
|---|---|---|
| 21 | germany work visa | `/work-visa/germany` |
| 22 | canada work visa | `/work-visa/canada` |
| 23 | india to germany work visa | `/work-visa/germany/from-india` |
| 24 | india to canada work visa | `/work-visa/canada/from-india` |
| 25 | study in canada from india | `/study-in-canada/from-india` |
| 26 | study in uk from india | `/study-in-uk/from-india` |
| 27 | japan ssw visa | `/work-visa/japan` |
| 28 | germany work visa for indians | `/work-visa/germany` |
| 29 | portugal work visa | `/work-visa/portugal` |
| 30 | siddhivinayak overseas | `/` |

---

## Keywords by page

### Homepage (`/`)
Keep it brand + category, not destination-specific. The homepage should never compete with a country page.

- siddhivinayak overseas *(and the misspellings: sidhivinayak overseas, siddhi vinayak overseas surat)*
- visa consultants in surat
- study and work visa consultants in surat
- overseas education consultants in surat
- immigration consultant in surat
- siddhivinayak overseas reviews / contact number / address

### Service pages
- `/work-visa` → work visa consultancy, work permit agency, overseas job visa consultant, work visa eligibility check
- `/study-visa` → study visa consultant, student visa consultancy, study abroad consultants, SOP writing support
- `/post-study-work-visa` → post study work visa, student visa to work visa conversion, graduate work visa options
- `/contact` → visa consultants in surat contact number, visa consultants in surat address, free visa consultation in surat

### Country landing pages (`/work-visa/{country}`, `/study-in-{country}`)
One page per country, targeting five clustered terms:
`{country} work visa` · `{country} work permit` · `{country} work visa for indians` · `india to {country} work visa` · `{country} work visa requirements`

Do **not** create a separate page per origin country unless the pair has real demand. Only these deserve their own `/from-{origin}` page today: India, Pakistan, Nepal, Bangladesh, Sri Lanka — and only for Germany, Canada, Australia, UK, USA, Japan, Portugal, Poland, Ireland, New Zealand. That's ~50 pages, not 450. Everything else stays as a section on the country page.

### City landing pages
Build in this order, and **only these**:
1. Surat (already exists — your anchor)
2. Ahmedabad, Vadodara, Rajkot, Navsari (Gujarat catchment, real client volume)
3. Mumbai, Pune (if you actually service them)

Pattern: `{country} work visa consultant in {city}` · `{city} to {country} work visa` · `{city} to {country} student visa`

The CSV contains city keywords for 18 Indian and 18 overseas cities so you have the full map — but most are marked Low with a note saying *don't build a page*. Thin city pages for places you have no presence in are the single fastest way to get a site filtered out of the index.

---

## Blog topics (informational cluster)

1. What happens when your UK student visa expires — your five real options
2. UK Graduate Route to Skilled Worker: a month-by-month switching timeline
3. Canada PGWP to PR: which provincial programs suit Indian graduates
4. Australia 485 to employer sponsorship — how the Skills in Demand visa actually works
5. Germany Opportunity Card vs EU Blue Card: which one fits your profile
6. Japan SSW visa: sectors, language requirements and realistic salaries
7. Portugal and Poland work permits — Europe's most accessible routes from India
8. Work visa without a job offer: which countries genuinely allow it
9. IELTS for work visas: where it's required and where it isn't
10. Why work visa applications get refused — the seven most common documentation errors
11. Bringing your spouse on a work visa: dependant rules compared across 8 countries
12. Cost of a Germany work visa from India: full breakdown including hidden costs
13. Study visa vs work visa — which route to a foreign career is realistic for you
14. New Zealand AEWV explained for graduates already in New Zealand
15. Moving from the UK to Canada or Australia: your visa doesn't transfer, here's what does

Every one links down to the relevant country or pathway page.

---

## FAQ (put these on-page with FAQPage schema)

**Q: My study visa is ending. Can you help me get a work visa in the same country?**
Yes — that's a core part of what we do. The route depends on the country: the UK has the Graduate Route and Skilled Worker switch, Canada has the PGWP, Australia has the 485. We assess your eligibility, map the timeline against your current visa expiry, and support the documentation. Start early — most routes must be applied for *before* your student visa expires.

**Q: Do I need a job offer before applying for a work visa?**
It depends on the country. Germany's Opportunity Card and some job-seeker routes let you enter to look for work. The UK Skilled Worker, Australia's employer-sponsored routes and Japan's SSW require a sponsoring employer first. We'll tell you which category you fall into at the first consultation.

**Q: Which countries do you handle work visas for?**
38 destinations across Europe, North America, Oceania, Asia, the Gulf and Africa — including Germany, Canada, the UK, Australia, the USA, Japan, Portugal, Poland, Ireland and New Zealand.

**Q: Can I apply from outside India?**
Yes. Many of our clients are already abroad on a student visa. Counselling is available by phone, WhatsApp and video call.

**Q: How long does a work visa take?**
Ranges vary widely by country and route — from a few weeks to several months. We give you a realistic range for your specific case at the assessment stage. Be cautious of anyone promising a fixed or guaranteed timeline.

**Q: Do you guarantee a visa?**
No, and nobody honestly can — the decision rests with the immigration authority. What we do is make sure your file is complete, consistent and meets the published criteria, which is what reduces avoidable refusals.

**Q: Where is your office?**
620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat, Gujarat 395006. Call +91 99250 64666.

**Q: What does it cost?**
Our service charges are separate from government and embassy fees. We quote both in writing before you commit — no hidden charges.

---

## Internal linking plan

```
Homepage
 ├─ /work-visa ──────────► /work-visa/{country} ──► /work-visa/{country}/from-{origin}
 ├─ /study-visa ─────────► /study-in-{country} ───► /study-in-{country}/{city}
 ├─ /post-study-work-visa ► /post-study-work-visa/{country}
 └─ /visa-consultants-in-surat (local hub)
```

Rules:
1. **Study page → post-study page.** Every `/study-in-{country}` page gets a block: *"Finishing your studies in {country}? See your work visa options."* This is the single highest-value internal link on the site — it moves users along your actual funnel.
2. **Post-study page → country work visa page.** Cross-link both directions.
3. **Every blog post links up** to one country page and one service page. Never leave a guide as a dead end.
4. **Country pages link sideways** to 2–3 comparable destinations ("Considering Poland instead? Compare Portugal and Poland work permits").
5. **Every page links to `/visa-consultants-in-surat`** from the footer NAP block for local-signal consistency.
6. **Anchor text = the target's primary keyword**, not "click here" and not the same phrase every time.

---

## ⚠️ Warning list — do not target these

**Legally risky / unprovable claims**

| Avoid | Why |
|---|---|
| "licensed visa consultant", "official visa agent", "government approved" | Unless you hold ICCRC/CICC, MARA or OISC registration, these are misrepresentation. In Australia and Canada, claiming to give immigration advice without registration is a criminal offence. The word "official" also implies a government relationship you don't have. |
| "guaranteed work visa", "100% visa guarantee", "visa guarantee or money back" | You cannot guarantee a sovereign government's decision. Attracts the wrong clients and regulatory attention. |
| "number one visa consultant", "cheapest visa agency", "best in India" | Superlatives you can't substantiate. "Cheapest" is also a price claim you'd have to defend. |
| "work visa without job offer guaranteed", "visa without IELTS guaranteed" | The unqualified versions of these are fine as informational content; adding "guaranteed" is not. |
| "same day work visa", "24 hour visa", "urgent visa approval" | No work visa is issued same-day. I've included a small number of *speed* keywords (fast/urgent/quick + "process") flagged Low, to be targeted **only** with honest timeline content. I have excluded "same day" and "24-hour" entirely — they're irrelevant to your services and would attract passport/travel-agency traffic you can't convert. |
| "immigration lawyer", "visa attorney" | You're a consultancy, not a law firm. |

**Weak or wasteful**

- **"which country gives work visa easily"** — enormous volume, near-zero conversion, and any honest answer disappoints. Include it as one blog post; don't build a strategy around it.
- **City-to-city pairs** (e.g. "Surat to Munich work visa") — 400+ of these are in the CSV for completeness, all marked Low with a *do not build a page* note. Search volume is effectively zero.
- **Tier-3 destination pages** (Albania, Moldova, Belarus, Azerbaijan, Armenia) — keep them as short entries under a regional page. Individual optimised pages won't earn their keep, and some of these markets carry reputational risk in the visa sector.
- **Russia and Belarus work visa content** — live sanctions and travel-advisory issues. Keep factual and minimal, or drop.
- **"free visa consultation"** — only if genuinely free with no conditions.

**Cannibalisation risk**

- "study visa" vs "student visa" — same intent. Pick one as your H1 per page and use the other in body copy. Don't build two pages.
- "work visa" vs "work permit" — same. One page, both terms.
- `/work-visa/germany` and `/work-visa/germany/from-india` will compete unless the origin page adds genuinely distinct content (India-specific documents, apostille process, VFS locations in Gujarat). If you can't write that, don't create the page.

---

## Language decision

You left additional languages blank. My recommendation: **stay English-only on the site**. Your audience searches for visa information in English even when they speak Gujarati or Hindi at home, and a half-maintained Gujarati subfolder will cost more in technical debt than it returns. Advertise the Gujarati/Hindi counselling as a *human service* in your English copy — "counselling in Gujarati, Hindi or English" — which is already in your Surat page and is genuinely a differentiator. If you later want a second language, Gujarati for the Surat local pages only would be the place to start.

---

## Suggested sequence

1. **Weeks 1–2** — Post-study work visa cluster, 7 country pages. Highest return, lowest competition, content mostly written.
2. **Weeks 3–4** — Surat local page + Google Business Profile (categories, photos, real review generation). This drives "near me".
3. **Weeks 5–8** — Tier-1 work destination pages: Germany, Canada, UK, Australia, USA, Japan, Portugal, Poland, Ireland, New Zealand.
4. **Weeks 9–12** — `/from-india` origin pages for those ten, plus the four Gujarat city pages.
5. **Ongoing** — Two blog posts a week from the list above; quarterly review of every page carrying fees, salary thresholds or processing times, since those go stale fast and stale immigration content damages trust badly.
