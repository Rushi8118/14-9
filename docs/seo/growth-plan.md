# Local SEO, Link Building, Conversion & Measurement — Siddhivinayak Overseas

Companion to [`technical-audit.md`](./technical-audit.md) and [`content-plan.md`](./content-plan.md).

**Verified business facts used throughout** (from `src/lib/seo/site.ts`):

```
Siddhivinayak Overseas
620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road
Surat, Gujarat 395006, India
+91 99250 64666  ·  +91 95120 00632
info@siddhivinayakoverseas.com
21.1702, 72.8311
```

Every directory listing must match the first four lines **character for character**. Not "6th Flr", not "Surat, GJ", not a different phone number for tracking. Inconsistent NAP is the most common cause of weak local rankings, and it is entirely avoidable.

---

# Part 1 — Local SEO

Your office is in Surat. Local search is the fastest revenue you can unlock, because "visa consultant near me" converts at a far higher rate than any national keyword, and the competition is a handful of local agencies rather than the entire internet.

## 1.1 Google Business Profile

**NEEDS DATA:** I cannot verify from the repository whether a GBP exists or is verified. Everything below assumes you will confirm this first.

**Setup and optimisation:**

1. **Claim and verify** at business.google.com. Video verification is now standard — you will film your office exterior, signage, and interior including a desk. Have the signage ready before you start.
2. **Primary category:** `Immigration & Naturalization Service`. This single field influences local rankings more than anything else on the profile. **Secondary categories:** `Visa Consultant`, `Educational Consultant`, `Consultant`.
3. **Name:** exactly `Siddhivinayak Overseas`. Do **not** append keywords ("Siddhivinayak Overseas — Best Visa Consultant Surat"). That violates Google's guidelines and is a common reason for suspension.
4. **Address:** exactly as above. **Do not hide it** — you have a real office that clients visit, so a visible address is an advantage over the many competitors running service-area profiles.
5. **Service areas:** Surat, Navsari, Bharuch, Valsad, Ankleshwar, Vapi, and a reasonable radius. Do not list Mumbai or Delhi unless you genuinely serve walk-ins there.
6. **Hours:** accurate, including a lunch break if you take one, and special hours for Diwali, Holi and other closures. Wrong hours generate one-star reviews.
7. **Services:** add each one individually — Study Visa Consultation, Work Visa Consultation, Post-Study Work Visa Support, SOP Preparation, Documentation Review, IELTS Guidance. Each gets its own description.
8. **Photos:** minimum 20, all genuine. Exterior with signage (this is how people find you), reception, counselling rooms, team at work, the building entrance from the road. Add 2–3 monthly — profiles with recent photos outperform static ones.
9. **Description (750 characters):** mention Surat, study visas, work visas, post-study conversion, and the languages you counsel in. Write naturally; this is not a keyword field.
10. **Products:** list each service with an indicative price or "from" figure. This surfaces in the local panel.
11. **Q&A:** seed 8–10 genuine questions yourself and answer them. This section is public and competitors can answer it if you do not.
12. **Posts:** weekly. Rule changes, intake deadlines, a success story, an offer. Posts expire after 7 days, so consistency matters more than length.
13. **Messaging:** enable it only if you will answer within hours. Google shows response times.
14. **Attributes:** wheelchair accessible, languages spoken, appointment required — whatever is true.

## 1.2 Bing Places, Apple Business Connect and the rest

| Platform | Why it matters | Effort |
|---|---|---|
| **Bing Places** | Powers Bing, Yahoo and DuckDuckGo local results. Has a direct "import from Google Business Profile" option. | 15 min |
| **Apple Business Connect** | Apple Maps is the default on every iPhone. Siri answers "visa consultant near me" from it. Almost no Indian consultancy has claimed theirs. | 30 min |
| **Justdial** | Genuinely high-intent traffic in India. Expect sales calls. | 1 hour |
| **Sulekha** | Education/immigration category is active in Gujarat. | 30 min |
| **IndiaMART** | Useful for B2B enquiries and a NAP citation. | 30 min |
| **Facebook Page** | A citation source, and where local word-of-mouth happens. | 1 hour |
| **LinkedIn Company Page** | Matters for employer-sponsored work visa credibility. | 30 min |

## 1.3 Citations

Build these in a single session with the NAP text copy-pasted from one source document, so no variation creeps in:

Justdial · Sulekha · IndiaMART · TradeIndia · Yellow Pages India · AskLaila · Grotal · Cybo · Tupalo · Apple Maps · Bing Places · Facebook · LinkedIn · Surat Chamber of Commerce (if you are a member) · local Gujarat business directories.

**Do not** buy a bulk citation package. They generate listings on dead directories, frequently with mangled NAP, and you then spend months cleaning them up.

## 1.4 Reviews — the highest-leverage local activity

Reviews are the second strongest local ranking factor after categories, and the single strongest conversion factor. They are also the area where this industry has the worst reputation, so doing it honestly is a differentiator.

**The process:**

1. **Ask at the moment of relief** — visa approved, offer letter received. Not at the start, not months later.
2. **Ask in person first**, then follow up with the link. In-person asks convert several times better than a cold message.
3. **Use the short GBP review link** (Google gives you one in the dashboard). Send by WhatsApp, since that is how you already communicate.
4. **Make it specific:** "If it helps, mention which country and which visa — it helps other students find us." Specific reviews rank better and convert better than "Great service".
5. **Respond to every review within 48 hours.** Thank positives by name. For negatives: acknowledge, do not argue, take it offline, follow up publicly once resolved. A well-handled negative review builds more trust than a wall of five stars.
6. **Target a steady trickle** — a few genuine reviews every month beats thirty in one week, which looks manufactured and can trigger filtering.

**Absolutely not:** buying reviews, incentivising reviews with discounts, writing them yourself, asking staff or family, or review-gating (asking happy clients for a public review and unhappy ones for private feedback). All of these violate Google's policies, all are detectable, and for an immigration consultancy a review manipulation penalty is reputationally fatal.

> **Also:** do not add `AggregateRating` schema based on the testimonials in `src/lib/reviews-data.ts`. Self-serving review markup risks a manual action. Reviews on your GBP surface in search without any markup from you.

## 1.5 Local links and community

- Sponsor an IELTS or spoken-English workshop at a Surat college and be listed on the event page
- Offer a genuinely free "studying abroad — what it actually costs" session at local colleges (VNSGU, SVNIT and the private colleges)
- Join the Surat Chamber of Commerce
- Contribute a factual column to a local Gujarati newspaper on visa rule changes
- Partner with local IELTS coaching centres — mutual referral, mutual link, both genuinely relevant
- Sponsor a local sports team or cultural event and get listed

Each of these produces a real local link from a real local site. That is worth more than a hundred directory submissions.

## 1.6 LocalBusiness schema

✅ **Already implemented correctly** in `src/lib/seo/schema.ts` as `['ProfessionalService','LocalBusiness']` with `GeoCoordinates` and `PostalAddress`. Two additions worth making: `openingHoursSpecification` (not currently present) and `areaServed` listing your real service areas. Validate at validator.schema.org after any change.

---

# Part 2 — Ethical link building

You asked me to exclude the manipulative tactics, and I have. What follows is slower but does not carry the risk of a manual action — which, for a business whose entire product is trustworthiness, would be an existential problem rather than a ranking problem.

## 2.1 What to do

**Industry directories that are actually relevant**
Education and immigration directories where a listing is genuinely useful to a searcher. Study-abroad portals, student forums with business listings, education fair exhibitor pages. One relevant listing beats fifty generic ones.

**Local organisations**
Surat Chamber of Commerce, Gujarat education associations, local business networks. Membership pages are real links from real institutions.

**Partner and supplier pages**
Universities and colleges you place students with often maintain "our recruitment partners" pages. IELTS centres, forex providers, travel insurers and accommodation services you work with are all natural link exchanges — natural because the relationship is real. This is different from link exchanges at scale, which I am not recommending.

**Guest contributions**
Education portals, HR and recruitment blogs (for the employer-sponsorship angle), Indian business publications. Pitch a specific, useful article — not a thinly-veiled advert. One piece on a genuinely authoritative site beats twenty on content farms.

**Digital PR**
Immigration rules change constantly and journalists need someone who can explain them. Register on HARO-equivalents and Indian journalist request services. Build relationships with education reporters at Gujarati and national outlets. When a rule changes, be the first to publish a clear explainer and tell the journalists who cover it.

**Original research** — your single best opportunity
You hold real application data in Supabase. An annual, anonymised report on observed processing times, refusal reasons, or destination shifts among Indian applicants is exactly what gets cited. State your sample size and method plainly. This is the asset most likely to earn links you could never ask for.

**Useful tools**
An eligibility checker, a documents checklist generator, a cost calculator. Tools earn links passively for years. Build one after the post-study content is live.

**Community involvement and sponsorships**
College events, local sports teams, cultural festivals. Real involvement, real links, real local brand awareness.

**Unlinked brand mention reclamation**
Set a Google Alert for "Siddhivinayak Overseas". When someone mentions you without linking — a college page, a forum, a news piece — politely ask for the link. This is the highest-conversion outreach there is, because the relationship already exists.

## 2.2 What I am explicitly not recommending, and why

Buying backlinks · private blog networks · automated link software · large-scale link exchanges · comment spam · forum spam · fake reviews · fake locations · hacked links · cloaking · keyword stuffing · hidden text · duplicate AI-generated pages · mass-produced thin pages.

Every one of these violates search engine guidelines. More importantly: you are asking people to trust you with their immigration future and a large sum of money. A business that manipulates search results is making a statement about how it operates. The pages you would create with these tactics are also exactly the kind Google already soft-404'd on your site once.

---

# Part 3 — Conversion optimisation

Traffic that does not convert is a vanity metric. Your site already has good bones here — the tracking code is written, the WhatsApp FAB exists, both phone numbers are `tel:` links. The gaps are specific.

## 3.1 Forms

**VERIFIED:** `src/components/contact-section.tsx` has separate work and study consultation forms with React Hook Form + Zod validation, and fires a segmented `form_submit` event at line 182. This is well built.

**Improvements:**
- **Cut fields to the minimum.** Name, phone, destination country, current status (in India / abroad on a student visa). Everything else can be asked on the call. Each extra field measurably reduces completion.
- **Make "currently abroad on a student visa" a prominent option** — it routes your highest-value audience straight to the right counsellor.
- **Show what happens next:** "We will call you within 1 working day." Ambiguity kills form completion.
- **Validate inline, not on submit.** Zod is already there; surface errors as the user leaves each field.
- **Confirmation page, not a toast.** A dedicated `/thank-you` URL is trivially trackable as a GA4 conversion and lets you set expectations properly.
- **Autofill destination** from the page the user is on. Someone on `/work-visa/germany` should see Germany pre-selected.

## 3.2 Phone and WhatsApp

**VERIFIED:** both numbers are `tel:` links with click tracking; a WhatsApp FAB exists (`site-footer.tsx:408`) with tracking.

- **Pre-fill the WhatsApp message** with page context: `?text=Hi, I'm enquiring about the Germany work visa`. This tells you the source without any analytics work and makes it easier for the user to start.
- **Sticky mobile call bar.** On mobile, a persistent bottom bar with Call and WhatsApp. This is the highest-converting element on most local service sites.
- **Check the FAB tap target is at least 48 px** and does not obscure content or form fields on small screens.
- **State response times** next to each channel: "WhatsApp — usually replies within an hour."

## 3.3 Trust signals

Place these where decisions happen — next to the CTA, not on a separate page:
- Google review count and rating (once you have a genuine base)
- Named counsellors with photos
- Any verifiable registration — **only** what you can prove
- "Free first consultation" — only if it genuinely is
- Real office photos
- Year established
- Success stories with country and route specifics
- A visible link to `/immigration-disclaimer` ✅ (exists)

**Guarantees you can truthfully make:** transparent fees with no hidden charges · a documented process with named points of contact · a response-time commitment · honest eligibility assessment including telling people when they do not qualify · file tracking until a decision.

**Guarantees you cannot make:** visa approval, processing times, refunds contingent on an embassy decision. Anyone in this industry promising those is either misleading clients or about to.

## 3.4 Pricing

Publishing fees is uncomfortable and it works. Most competitors hide them, so "visa consultancy fees in Surat" is an under-served query with unambiguous intent. Publish ranges, separate your fee from government fees, and state what moves the number. Being the only transparent option in a market known for opacity is a positioning advantage, not just an SEO one.

## 3.5 Layout and CTAs

- One primary CTA per page, repeated 2–3 times as the page gets long
- Specific verbs: "Check if you qualify for a Germany work visa" beats "Submit"
- Above-the-fold CTA on every commercial page
- Consistent CTA styling — users should recognise the button instantly
- On long country pages, a sticky sidebar CTA on desktop

## 3.6 A/B tests worth running, in order

1. Sticky mobile call bar vs current FAB only — measure phone + WhatsApp clicks
2. 4-field form vs current form — measure completion rate
3. Fees published vs "request a quote" on one country page — measure form submits
4. Hero: 3D globe vs static image vs office photo — measure scroll depth and CTA clicks (this also interacts with audit C2)
5. Review count above the fold vs below — measure form submits
6. "Free consultation" vs "Free eligibility check" — measure clicks

Run one at a time, for at least two weeks, and do not call a winner on fewer than ~100 conversions per variant. With low traffic, prioritise tests 1 and 2 — they have the largest expected effects.

---

# Part 4 — Measurement

> **Nothing in this section works until audit finding C1 is fixed.** The GA4 tag is not installed. Every event your site fires currently goes nowhere.

## 4.1 The stack

| Tool | Purpose | Setup |
|---|---|---|
| **Google Tag Manager** | Container for everything else | Install in `index.html` |
| **GA4** | Behaviour, conversions, traffic sources | Via GTM |
| **Google Search Console** | Impressions, clicks, position, indexing, CWV | Domain property |
| **Bing Webmaster Tools** | Bing/Yahoo/DuckDuckGo | Import from GSC |
| **Rank tracking** | Position over time | Any affordable tracker, ~50 keywords |
| **Call tracking** | Which pages produce calls | Optional — see caution below |

**Caution on call tracking:** dynamic number insertion swaps your phone number per visitor, which can break NAP consistency and harm local rankings. If you use it, use a provider that keeps your real GBP number intact for organic local traffic. For a business your size, GA4 `phone_click` events are enough to start.

## 4.2 Conversions to configure in GA4

Your code already fires these — they just need a receiver:

| Event | Where it fires (verified) | Mark as key event |
|---|---|---|
| `phone_click` | `site-footer.tsx:303,314`, `contact-section.tsx:246` | ✅ |
| `whatsapp_click` | `site-footer.tsx:327,408`, `contact-section.tsx:265` | ✅ |
| `form_submit` | `contact-section.tsx:182` (segmented work/study) | ✅ |
| `social_click` | footer | No — engagement only |

Add: a `/thank-you` page view, scroll depth 75% on guide pages, and outbound clicks to official government sources (a useful engagement quality signal).

## 4.3 Metrics that matter

**Leading indicators** (move first, weeks 1–8): indexed pages, impressions, average position, Core Web Vitals, crawl stats.
**Lagging indicators** (weeks 8–24): organic sessions, organic CTR, conversion events, leads, revenue.
**Vanity metrics to ignore:** raw keyword counts, Domain Authority, bounce rate in isolation, total pageviews.

The only number that ultimately matters: **organic enquiries per month, and what proportion become clients.**

## 4.4 Baseline before you change anything

Do this in the first week, before any fix:

1. Export Search Console Performance, last 12 months, by query and by page
2. Export Search Console Pages (indexing status) — record the "Not indexed" reasons and counts
3. Run PageSpeed Insights on the homepage, one country page, one study page — mobile and desktop, save the reports
4. Record current Core Web Vitals field data (may be "insufficient data" — record that too)
5. Note your current GBP review count and rating
6. Record current monthly enquiry volume from whatever you track today, even if it is a notebook

Without this you will not be able to prove anything worked.

---

# Part 5 — Monthly report template

Copy this each month. Keep it to one page; a report nobody reads is wasted effort.

```markdown
# SEO Report — {Month Year}
Prepared: {date} · Period: {start}–{end} · Comparison: previous month + same month last year

## 1. Headline
Organic sessions      {n}  ({+/-}% MoM)
Organic enquiries     {n}  ({+/-}% MoM)   ← the number that matters
Conversion rate       {n}% ({+/-} pts)
Impressions           {n}  ({+/-}%)
Average position      {n}  ({+/-})
Indexed pages         {n}  ({+/-})

## 2. What improved
- {Page/keyword}: {metric} from {x} to {y}. Likely cause: {what we changed}

## 3. What declined
- {Page/keyword}: {metric} from {x} to {y}. Suspected cause: {x}. Action: {y}

## 4. Keyword movement
New in top 10:        {list}
New in top 3:         {list}
Lost from top 10:     {list} — investigate: {which}
Biggest gains:        {keyword}: position {x} → {y}
Biggest losses:       {keyword}: position {x} → {y}

## 5. Conversions
phone_click    {n}   whatsapp_click {n}   form_submit {n}
Top 3 converting pages: {list with counts}
Enquiries → clients: {n} ({n}%)

## 6. Technical health
Core Web Vitals (mobile): LCP {n}s  INP {n}ms  CLS {n}
Crawl errors: {n}    Soft 404s: {n}    Not indexed: {n}
New issues: {list}   Resolved: {list}

## 7. Content published
| Date | Title | Target keyword | URL | Impressions so far |

## 8. Links earned
| Date | Site | Page linked | How acquired |
Unlinked mentions found: {n}   Outreach sent: {n}   Converted: {n}

## 9. Local
GBP views {n} · searches {n} · calls {n} · direction requests {n}
New reviews {n} (avg {n}★) · Responded to {n}/{n}
New citations: {list}

## 10. Next month
| Priority | Action | Owner | Due |
| 1 | | | |
| 2 | | | |
| 3 | | | |

## 11. Blockers
{Anything waiting on a decision, budget or access}
```

---

# Part 6 — First 90 days, sequenced

**Weeks 1–2 — measurement and the critical fix**
Install GTM + GA4, configure the three conversions, verify SPA page views (audit C1). Set up Search Console and Bing Webmaster Tools. Capture every baseline in §4.4. Claim and fully optimise Google Business Profile.
*Nothing else should start before this. You cannot manage what you cannot measure.*

**Weeks 3–4 — Core Web Vitals**
Replace the 501 KB LCP image, gate the 3D globe to desktop, convert images to AVIF/WebP (C2). Self-host fonts (H3). Add width/height to the 13 images (H4). Fix the `/pathways/*` soft 404 (H2). Re-run PageSpeed and record the delta.

**Weeks 5–8 — the post-study cluster**
Rewrite and expand the pathway pages per audit C3 Option A. Add the "already abroad?" block to every study destination page. Add FAQPage schema. Publish months 1–2 of the calendar. Start the review request process with every client who receives an approval.

**Weeks 9–12 — depth and local**
Strengthen the ten tier-1 country pages to full depth. Build `/pricing` and `/faq`. Automate rebuild-on-publish (H1). Build the Surat citation set. Begin partner and college outreach. Publish months 3 of the calendar.

**Then:** hold the publishing cadence, review the report monthly, and revisit this plan at 90 days against real Search Console data rather than against my assumptions.

---

## Honest expectations

SEO for a YMYL topic in a competitive market is slow. Based on the state of the site, a realistic shape is: technical and measurement fixes visible within weeks; local ranking movement in 1–3 months; meaningful organic traffic growth from the post-study cluster in 3–6 months; competitive destination terms in 6–12 months, and some of them never, because you are competing with government sites and very large agencies.

The post-study work visa cluster is the exception, and it is why I keep returning to it. It is the one place where you have genuine expertise, a genuinely underserved audience, and almost no competition. That is where your first wins will come from.

I have not estimated traffic or revenue numbers anywhere in this document, because I would be making them up. Once GA4 and Search Console have 90 days of data, those projections become possible — and worth doing.
