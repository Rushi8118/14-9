# Local SEO Findings — siddhivinayakoverseas.com

Status: **Partial audit — turn-budget limited.** Sections not reached are explicitly marked "Not assessed." This file was written directly to complete/final state (no earlier partial draft existed at time of writing).

Scope covered: homepage (`/`), `/contact`, `/visa-consultants-in-surat`, `/reviews` (partial), `/about` (partial grep), `/regional-coverage` (fetched, not analyzed in depth). All data pulled via raw HTML fetch (`render_page.py --mode auto`, all pages resolved as non-SPA / `mode_used: raw`), so this reflects what a non-JS crawler and most users see. No GBP API access was used anywhere below — all GBP-related statements are inferences from on-site evidence only.

---

## 1. Business type & dual-targeting assessment

**Detected type: Hybrid**, but leaning hard toward the "broad" side in its schema and copy, which is diluting local (Surat map-pack) relevance signals. Evidence:

- The sitewide `LocalBusiness`/`ProfessionalService` schema's `name` field is literally: `"Siddhivinayak Overseas — Visa Consultants in Surat & Pan-India"` and its `description` reads: *"Study visa, work visa & post-study transition consultants serving all 28 states & 8 UTs in India, Bangladesh, Pakistan, Nepal & Sri Lanka..."*
- The same schema's `areaServed` array lists **Surat (City) + Gujarat (AdministrativeArea) + all 28 Indian states + 8 union territories + India (Country)** — 37+ `AdministrativeArea`/`Country` entries in one `areaServed` list.

**Severity: High.** This is the single biggest local-SEO risk on the site. Per Whitespark 2026 data, primary category/entity clarity is the #1 ranking factor, and an `areaServed` list spanning an entire country (India) attached to a single-location `LocalBusiness` signals to Google's entity model "this is a pan-India business," not "this is a Surat business that also happens to serve remote clients." That works against local pack visibility for queries like "visa consultants near me" / "visa consultants Surat" specifically because:
- `areaServed` this broad is not how Google's own guidance recommends using the property for a single physical location (recommended: a handful of named nearby cities/regions, not an entire country's states list).
- It signals category dilution risk — Whitespark's #1 *negative* ranking factor is wrong-category signals, and an over-broad `areaServed` is a close cousin of that problem for LocalBusiness entities.
- It does **not** even help the "broad" side of the business meaningfully, since `areaServed` on a `LocalBusiness`/GBP profile has no bearing on organic map-pack ranking in other cities anyway (SAB service-area settings, not this markup, would be the mechanism for that) — so the dilution has a cost with no compensating benefit.

**Recommendation:** Keep the hybrid *positioning* in on-page copy (it is legitimate — real walk-in office + real remote clients) but scope the `LocalBusiness` schema's `areaServed` down to Surat + a realistic drive-time ring (e.g., Surat, Navsari, Vapi, Bardoli, South Gujarat) and move the "all 28 states / Nepal / Bangladesh" claim into the `Organization`/`EducationalOrganization`/`Service` schema layer instead, where it belongs to the brand/service, not the physical-location entity. This is a schema-authoring fix, not a copy fix — the visible page copy is not the problem here.

---

## 2. NAP consistency audit

### 2a. Phone numbers — inconsistency found (Medium-High severity)

Three phone-number representations exist across the site's markup and visible content:

| Source | Exact string found | Format |
|---|---|---|
| `Organization` schema (`telephone`) | `+91 99250 64666` | spaced |
| `LocalBusiness`/`ProfessionalService` schema (`telephone`) | `+919925064666` | unspaced |
| `EducationalOrganization` schema (`telephone`) | `+91 99250 64666` | spaced |
| Homepage header/footer CTA links (`tel:` href) | `tel:+919925064666` displayed as `+91 99250 64666` | consistent with above |
| Homepage footer — **second, separate** phone line | `tel:+919512000632` displayed as `+91 95120 00632` | **not present in any schema block, anywhere checked** |
| `/contact` page contact-info card | `+91 99250 64666` (Call us) + WhatsApp `wa.me/919925064666` | matches primary number only |
| `/visa-consultants-in-surat` FAQ schema (`acceptedAnswer` text) | "Call +91 99250 64666, WhatsApp on the same number..." | matches primary number |

**Finding:** The digits themselves are consistent for the *primary* number (+91 99250 64666) — only the punctuation format varies between schema blocks (spaced vs. unspaced), which is a low-severity cosmetic inconsistency Google generally normalizes. The **more material issue** is the second phone number, `+91 95120 00632`, which appears as a live `tel:` link in the sitewide footer (every page) but is **not declared in any JSON-LD block** on any page checked (homepage, contact, Surat page). If this second number is also registered against the Google Business Profile (e.g., as a secondary/tracking number), the schema is incomplete; if it is *not* on the GBP profile at all, it is a genuine NAP inconsistency risk between the website and GBP that should be resolved by either removing it from the footer or adding it to schema/GBP consistently. **Not assessed:** which number (if either) is the actual GBP-verified primary number — requires GBP dashboard access.

### 2b. Address — consistent everywhere checked

Exact string, verbatim, in all four locations checked (Organization schema, LocalBusiness schema, EducationalOrganization schema, /contact page hero copy, /visa-consultants-in-surat hero + FAQ):

> `620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat, Gujarat, India` / postal code `395006`

No variation found (no abbreviation drift, no suite-number mismatch). This is a genuine strength.

**Gap:** The `/contact` page's dedicated "Office" info-card (the structured contact-details list with icon+label pairs for Call/WhatsApp/Email/Office) does **not** repeat the full street address — it only shows the literal label text "Siddhivinayak Overseas, India" under the map-pin icon. The full address only appears in the page's hero paragraph, not in the scannable contact card where a user (or a citation-building VA copying NAP for directory submissions) would expect to find it. **Severity: Medium** — increases risk of copy-paste NAP errors when the address is manually re-keyed for citations, since the canonical structured location is a generic placeholder.

### 2c. Business name — consistent core name, inconsistent long-form variant

- Core name `Siddhivinayak Overseas` is consistent everywhere (schema `Organization.name`, logo alt text, nav branding).
- Long-form name varies by schema type:
  - `LocalBusiness`: `"Siddhivinayak Overseas — Visa Consultants in Surat & Pan-India"`
  - `EducationalOrganization`: `"Siddhivinayak Overseas — Overseas Education Consultants"`
- These are two different "full names" for what is `@id`-referenced as the same entity's different facets. If either of these long-form strings is also used as the literal GBP business name, only one can match — worth checking against the actual GBP listing name (**not assessed** — needs GBP access) since an exact-match GBP business name is part of the #1 ranking factor (primary category/name alignment).

### 2d. Email — consistent

`info@siddhivinayakoverseas.com` — identical across Organization schema, EducationalOrganization schema, and /contact page mailto link. No issues.

---

## 3. LocalBusiness / Organization schema completeness

Sitewide `LocalBusiness` block (`@type: ["ProfessionalService","LocalBusiness"]`, `@id: #localbusiness`) evaluated against the required/recommended property checklist:

| Property | Status | Detail |
|---|---|---|
| `name` | Present | See 2c re: long-form variance |
| `address` | Present, complete | Full `PostalAddress` with street, locality, region, postal, country |
| `geo` | Present but **below spec** | `{"latitude": 21.1702, "longitude": 72.8311}` — **only 4 decimal places**, not the 5-decimal (~1.1m accuracy) minimum called for. 4 decimals ≈ ~11m of positional slack, low materiality on its own but an easy fix. **Severity: Low.** |
| `openingHoursSpecification` | **Missing entirely** | Not present in any schema block on homepage, /contact, or /visa-consultants-in-surat. No visible business hours found in page copy either (checked for "Working Hours," "Office Hours," "Mon–Sat," AM/PM patterns — none found anywhere on /contact). **Severity: High** — this is a recommended property AND a real UX gap: a walk-in office with zero published hours (on-site or in schema) is a conversion and trust problem, not just a schema gap. |
| `telephone` | Present | See 2a for cross-source format/second-number issue |
| `url` | Present | Canonical homepage URL |
| `priceRange` | Present | `"$$"` — generic but present |
| `areaServed` | Present, **over-scoped** | See Section 1 — 37+ region entries on a single-location LocalBusiness |
| `aggregateRating` | **Missing** | Not present anywhere checked, despite a dedicated /reviews page with visible star ratings on individual testimonial cards (see Section 5) |
| `review` | **Missing** | Same as above |
| `image` | Present | `consultant-office.jpg` — a real, specific office photo (not a generic stock/logo placeholder), which is a positive trust signal |
| `sameAs` | Present but thin | Instagram + Facebook only — no GBP/Maps URL, no LinkedIn, no Justdial/Sulekha/IndiaMART profile links (see Section 6) |

**Technical defect — duplicate schema injection (Medium severity):** On both `/contact` and `/visa-consultants-in-surat`, the entire sitewide schema set (Organization, WebSite, LocalBusiness, WebPage — 5 blocks, byte-for-byte identical `@id`s and content) is emitted **twice** in the page source, immediately followed by a second, page-specific set (WebPage/Service/FAQPage/BreadcrumbList as appropriate). This looks like a layout-component double-injection bug (e.g., both a root layout and a page template independently rendering the same global JSON-LD). It is not incorrect data (identical `@id`s mean parsers should de-duplicate/merge), but it roughly doubles JSON-LD payload weight sitewide and is the kind of thing that can trigger validator warnings or, in more complex cases, ambiguous merging. Worth a dev fix to emit shared schema once (e.g., only from the root layout).

**Correct schema subtype note:** `ProfessionalService`/`LocalBusiness` is a reasonable generic choice for a visa/immigration consultancy — Schema.org has no dedicated `VisaConsultancy` or `ImmigrationService` subtype, and `EmploymentAgency` (listed in the general LocalBusiness subtype catalog) would be a worse fit given the study-visa side of the business. `ProfessionalService` + `EducationalOrganization` as a dual-typed entity pair is a defensible modeling choice for this hybrid education/immigration business model. No subtype correction needed.

### `/visa-consultants-in-surat` page-specific schema (positive finding)

This page adds a scoped `Service` block (`areaServed: {"@type":"City","name":"Surat"}`, `provider` pointing back to the `#localbusiness` `@id`) and a 3-question `FAQPage` block with location- and contact-specific Q&A. This is good practice — it gives Google a Surat-specific entity to match against "visa consultants Surat" queries distinct from the diluted sitewide `areaServed` list. It partially offsets the Section 1 concern but does not fully compensate for it, since the primary `LocalBusiness` entity (which is what typically anchors GBP/map-pack matching) still carries the pan-India `areaServed` list.

---

## 4. GBP signals inferable from the site

No live GBP API access was used; everything below is inferred from on-site evidence only.

| Signal | Status |
|---|---|
| Google Maps embed (iframe) | **Not found** on homepage or /contact — checked via `<iframe>` search on both raw HTML sources, zero matches |
| "Get Directions" link / Maps deep link | **Not found** — no `google.com/maps`, `maps.app.goo.gl`, or `goo.gl/maps` links anywhere on homepage or /contact |
| GBP profile link / `g.page` reference | **Not found** |
| `sameAs` link to Maps/GBP listing | **Not present** — `sameAs` only contains Instagram + Facebook |
| Photo evidence of the physical office | One specific image (`consultant-office.jpg`) referenced in schema `image` — positive signal, but **not assessed** whether this photo is also uploaded to the actual GBP listing |
| Review widget / GBP review carousel | A first-party `/reviews` page exists but shows no indication of being sourced from or synced with Google reviews (see Section 5) |
| Posts / announcements indicator | **Not assessed** — no GBP-posts-style component (e.g., "Latest updates from Google") found on pages checked, but this would need GBP dashboard access to fully rule out |
| Category alignment | **Not assessed — requires GBP access.** Cannot verify actual GBP primary category from the website alone. Given Whitespark's finding that primary category is the #1 ranking factor (and wrong category is the #1 *negative* factor), this should be checked directly in the GBP dashboard against categories like "Educational Consultant," "Immigration & Naturalization Service," or "Visa Consultant" |

**Overall GBP-inferable picture: weak.** The complete absence of any Maps embed, directions link, or GBP cross-link anywhere on the site (homepage or contact page, the two places it matters most) is the most concrete, fixable finding in this whole audit. A physical-location business with a real walk-in office and zero Maps embed/directions CTA is leaving an easy, free local-SEO and conversion win on the table.

---

## 5. Review signals

- A dedicated `/reviews` page exists with a searchable/filterable UI ("Search reviews or names...", region filter) and individual testimonial cards, each rendered with 5 inline SVG star icons (not an image or third-party embed).
- **No `aggregateRating` or `Review` schema found anywhere** — checked homepage, contact, Surat page, and the /reviews page itself. Zero occurrences of `aggregateRating`, `ratingValue`, or `reviewCount` in any JSON-LD block or raw text across all pages fetched.
- **No visible sourcing/attribution.** No "posted on Google," no Google "G" icon, no Trustpilot badge, no verified-purchase-style indicator found anywhere on the reviews page (checked explicitly, zero matches for "Posted on," "via Google," "Source:," "verified," "Trustpilot," "google.com" within the reviews page content). These read as **first-party, site-collected testimonials** rather than syndicated/verified third-party (e.g., GBP) reviews.
- **Severity: Medium-High.** Two compounding issues: (1) genuine trust risk — a prospective client cannot verify these reviews are real, unbiased, or from actual clients versus being written/curated by the business itself, which matters more than usual for a visa consultancy where trust and past-outcome credibility are the core purchase driver; (2) missed schema opportunity — even if these are legitimate first-party testimonials, marking them up with `Review`/`aggregateRating` schema (which is legitimate to do for genuinely collected first-party reviews, as distinct from fabricating a rating) would support rich-result eligibility and give Google corroborating entity signal.
- **Not assessed:** review velocity/dates (the 18-day-rule check requires timestamps on individual reviews, which I did not extract in the time available), response-rate/reply patterns (would require confirmed GBP review data), and total review count/rating value (the actual GBP star rating and count — genuinely requires GBP access and must not be guessed).

---

## 6. Citation / directory presence

**Not assessed via live search** — I did not run `site:` queries or fetch Justdial/Sulekha/IndiaMART/BBB/Yelp directly in the time available. This entire section needs follow-up. What I can report from the site itself:

- The site's own `sameAs` schema property lists only Instagram and Facebook — **no outbound link to a Justdial, Sulekha, IndiaMART, or Google Maps/GBP listing anywhere on the site**, which is itself a (weak) negative signal: sites with active, healthy citations often reciprocally link to at least their GBP/Maps listing and sometimes their top directory profiles.
- Recommended next step (not performed here): manually verify listings on Justdial, Sulekha, IndiaMART, and Google Maps directly, cross-checking the NAP fields found in Section 2 against each. For an Indian overseas-education/visa consultancy specifically, Justdial and Sulekha are the highest-value Tier-1-equivalent local directories (analogous to Yelp/BBB in a US context), with IndiaMART relevant if the business lists itself as a B2B service provider. Google Maps/GBP itself is the highest-priority citation and (per Section 4) shows no on-site cross-linking at all.

---

## 7. Location page quality — `/visa-consultants-in-surat`

**Verdict: Real, differentiated page — not a thin template.**

Evidence for genuine, hand-authored local content (not a doorway/swap-test-failing page):
- Body copy references Surat-specific and Gujarat-specific detail not reusable verbatim for another city: "a Surat team that understands Gujarat academic patterns (gaps, backlogs, medium of instruction, sponsor structures)," "WhatsApp + phone updates in Gujarati, Hindi or English," and repeated, specific mentions of the exact office landmark ("Pragti IT Park, Kiran Chowk to Yogi Chowk Road").
- Distinct sections: hero, 4-card feature grid, two full prose articles ("Looking for visa consultants in Surat?" and "Why local Surat counselling helps"), a 4-step process block, and a page-specific 3-question FAQ block (see Section 3) — total extracted `<main>` HTML content ~26KB, substantially more than boilerplate contact-page depth.
- Has its own `Service` schema and `FAQPage` schema scoped to Surat (Section 3), reinforcing this is treated as a genuine landing page, not a stub.
- Internal linking: reachable from the main sitemap and appears in the /contact page's breadcrumb pattern; **not assessed** — did not verify how many other pages link into `/visa-consultants-in-surat` (internal linking depth/PageRank flow) or whether it's linked from primary nav vs. only footer/sitemap.

**Since this is a single-location business, the doorway-page swap test (comparing near-duplicate multi-city pages) does not apply** — there is only one physical-location page. This page should not be read as part of a "location pages" program; it is the sole local landing page, and on its own merits it passes a quality bar most single-location businesses fail (most just repurpose the homepage or contact page for this instead of building a dedicated one).

---

## 8. Industry-specific trust factors (Indian visa/education consultancy)

Checked `/about` page content for common Indian consultancy trust markers: **none found.**

| Marker checked | Found? |
|---|---|
| ICEF / IATA agent certification | Not found |
| MEA-registered-agent number or Ministry of External Affairs recognition badge | Not found (only incidental unrelated substring matches, no genuine MEA reference) |
| Business registration number (CIN / Udyam / Shop Act) | Not found |
| GST number | Not found |
| ISO or other quality certification | Not found |
| "Recognized by" / "Certified by" university or government partner logos | Not assessed visually — did not render page as image/screenshot to check for logo strips, which text-grep would miss. **This specifically needs a rendered screenshot check, not yet done.** |

**Severity: Medium-High for the confirmed-absent items.** For a visa/study-abroad consultancy — an industry with a well-known trust deficit in India due to fraud and misrepresentation cases — the *absence* of any displayed registration number, MEA/ICEF-style accreditation, or verifiable regulatory credential on the About page is a meaningful trust gap relative to competitors who typically display these prominently. This compounds the Section 5 review-verifiability concern: a prospective client has no on-site regulatory or accreditation cross-check available at all. Recommend verifying whether any such credentials actually exist for this business (e.g., MEA OMC/RA registration, a state Shop & Establishment number, ICEF membership) and, if so, surfacing them prominently on /about and /contact — if none exist, that is a business-level finding worth flagging to the client separately from the SEO audit itself.

---

## Prioritized actions

**Critical**
1. Publish and display actual business hours (on `/contact`, footer, and in `openingHoursSpecification` schema) — currently absent everywhere, which is both a schema gap and a real conversion/trust problem for a walk-in office.
2. Add a Google Maps embed and a "Get Directions" link on `/contact` and ideally `/visa-consultants-in-surat` — currently zero Maps presence anywhere on the site.
3. Resolve the second, undeclared phone number (`+91 95120 00632`) in the sitewide footer — confirm against the actual GBP-verified number and either add it to schema consistently or remove it from the footer.

**High**
4. Rescope the sitewide `LocalBusiness.areaServed` from ~37 pan-India regions down to Surat + a realistic South Gujarat service ring; move the "all 28 states / Nepal / Bangladesh" claim to the `Organization`/`EducationalOrganization`/service-level schema instead (Section 1).
5. Verify the actual GBP primary category and confirm it matches "visa/immigration/education consultant" positioning — cannot be done from the site alone; needs GBP dashboard access.
6. Add `aggregateRating`/`Review` schema for the first-party testimonials on `/reviews` (only if genuinely representative — do not fabricate a rating), and/or clarify on-page whether these are Google-sourced or independently collected.
7. Surface any real regulatory/accreditation credentials (MEA registration, ICEF/IATA membership, business registration number) on `/about` and `/contact` — none found currently.

**Medium**
8. Fix the duplicate sitewide JSON-LD injection on `/contact` and `/visa-consultants-in-surat` (and likely other pages) — same 5 schema blocks emitted twice verbatim.
9. Populate the `/contact` page's structured "Office" info-card with the actual full street address instead of the generic "Siddhivinayak Overseas, India" placeholder, to reduce NAP copy-paste risk for citation building.
10. Increase `geo` coordinate precision from 4 to 5+ decimal places.

**Low**
11. Reconcile the two differing long-form business-name strings used in `LocalBusiness` vs. `EducationalOrganization` schema against the literal GBP listing name.
12. Add a GBP/Maps URL and relevant directory profile links (Justdial, Sulekha) to the `sameAs` array once those citations are confirmed live.

---

## Limitations / not assessed

This was a partial audit cut short by a turn-budget limit. Explicitly **not assessed** (do not treat as "clean" — treat as unverified):

- **All GBP dashboard data**: actual primary/secondary category, verified phone/name/hours, photo count and recency, Q&A, Posts activity, GBP review count/rating/velocity, review reply rate. Nothing here was fabricated; every GBP-related statement above is an inference from the public website only, as instructed.
- **Live citation search**: Justdial, Sulekha, IndiaMART, Google Maps listing, and BBB-equivalent presence/consistency were not queried or fetched — Section 6 is site-side inference only.
- **Review velocity / 18-day-rule check**: individual review timestamps on `/reviews` were not extracted.
- **Screenshot/visual check**: did not render and visually inspect pages for logo strips, trust badges, or map embeds that might only appear as background images/CSS rather than text/HTML (a false negative risk for Sections 4 and 8).
- **`/regional-coverage` and `/about` deep content review**: both pages were fetched (raw HTML saved) but only lightly grepped, not read in full — could contain additional NAP variants, hours, or accreditation content not surfaced by the specific keywords searched.
- **Other location-adjacent pages** (`/services`, `/success-stories`, country-specific pages) were not checked for NAP mentions or schema at all.
- **Internal linking depth** to `/visa-consultants-in-surat` (nav placement, link count, anchor text) was not measured.
- **Mobile-specific rendering** (click-to-call button placement, tap-target sizing) was not assessed — this audit used raw/auto HTML fetch, not a mobile-viewport render.

All raw fetch artifacts (HTML + extracted JSON-LD) used for this audit are saved under `D:\webseries\14-9\siddhivinayakoverseas.com-audit\` (`homepage-*.json/html`, `contact-*.json`, `visa-consultants-in-surat-*.json`, `reviews-*.json`, `regional-coverage-*.json`, `about-*.json`) for follow-up verification.
