# Structured Data — findings

The delegated schema agent died on an API rate limit before writing. Produced inline from a
full parse of all 92 URLs plus a property-level read of the JSON-LD on
`/visa-consultants-in-surat`.

---

## The state of it

Every JSON-LD block on the site is **valid JSON** — zero parse errors across 67 pages. The
type coverage is genuinely good for the vertical:

| type | pages |
|---|---|
| `Organization`, `LocalBusiness`+`ProfessionalService`, `EducationalOrganization`, `WebSite`, `WebPage` | 67 |
| `BreadcrumbList` | 57 |
| `FAQPage` | 51 |
| `Service` | 50 |
| `Article` | 8 |

Entity linking is done properly: blocks carry `@id` values (`…/#localbusiness`),
`parentOrganization` links the local entity to the brand, `WebPage.isPartOf` links to
`WebSite`, and `WebSite.potentialAction` carries a `SearchAction`. That is a more coherent
entity graph than most sites this size manage.

---

## MEDIUM — 56 of 67 pages emit the same three blocks twice; the live DOM has them three times

Verified by hashing each JSON-LD block. In the **raw HTML**, 56 pages contain byte-identical
duplicates of exactly three blocks:

| duplicated block | size |
|---|---|
| `Organization` | 720 B |
| `WebSite` | 489 B |
| `ProfessionalService` + `LocalBusiness` | 3,224 B |

`/study-in-canada`: 12 blocks in the HTML, 9 unique. The homepage is clean (5 blocks,
5 unique), so this affects the non-home prerendered pages.

In the **rendered DOM** it compounds further — `/study-in-canada` after JavaScript:

```
Organization: 3    WebSite: 3    ProfessionalService+LocalBusiness: 3    WebPage: 3
FAQPage: 2         Service: 2    BreadcrumbList: 2        → 19 blocks total
```

**Mechanism.** `src/components/seo/JsonLd.tsx` appends its script to `document.head` in a
`useEffect`, with no check for a block already present. The prerender (`scripts/prerender.mjs`)
snapshots the DOM *after* those effects have run, so the generated HTML already contains
them; when a visitor loads that HTML, React mounts and appends the same blocks again.

**Impact — deliberately not overstated.** Google de-duplicates identical structured data and
this is not a spam signal or a ranking penalty. The real costs are ~4.4 KB of redundant
markup per page and a validation report that is hard to read. **Severity: Medium**, fix it
for cleanliness, not because rankings depend on it.

**Fix:** have `JsonLd` skip insertion when a block with the same `@id` or content hash is
already in `document.head` — which also makes the prerender idempotent.

---

## HIGH — LocalBusiness is missing opening hours

The `ProfessionalService`/`LocalBusiness` block has `address`, `geo`, `telephone`,
`priceRange: "$$"`, `image`, `url`, `sameAs` and `@id` — but **no `openingHoursSpecification`**,
and no opening hours appear in the visible page copy either.

For a walk-in office in Surat this is both a schema gap and a real user-experience gap:
someone deciding whether to visit cannot find out when you are open. Add it to the markup
*and* to the contact page — structured data describing content that is not on the page is a
Google spam-policy violation, so both together.

---

## HIGH — no Google Maps presence anywhere on the site

No Maps embed, no "Get Directions" link, and no Google Maps/Business Profile URL in
`sameAs` — which currently lists only Instagram and Facebook. `geo` coordinates are present
(21.1702, 72.8311) but at 4 decimal places; Google's guidance prefers 5+.

Adding the GBP URL to `sameAs` is the single cheapest entity-resolution win available and
takes minutes. (Also worth checking: the Instagram URL in `sameAs` reads
`instagram.com/siddhivinyakoverseas` — note `vinyak`, not `vinayak`. Confirm that is the
real handle and not a typo, because a `sameAs` pointing at a 404 is worse than none.)

---

## MEDIUM — FAQPage on 51 pages will not produce rich results

Since Google's August 2023 change, FAQ rich results are shown only for authoritative
government and health sites. A private consultancy will not get them, regardless of markup
quality.

The markup is not harmful and still helps entity and passage understanding, so **keep it** —
but it should not be counted as a rich-result win in any reporting, and no further effort
should go into expanding it for that purpose.

---

## MEDIUM — no review markup, on a site that has reviews

`/reviews` carries first-party testimonials with visible star ratings, but there is no
`Review` or `AggregateRating` markup and no `aggregateRating` on the LocalBusiness block.

Handle with care: Google's policy prohibits `AggregateRating` built from self-collected
testimonials presented as independent, and self-serving review markup is a common manual-action
trigger. The correct move is **not** to mark up the existing testimonials — it is to route
customers to Google Business Profile reviews, which feed the map pack directly and require no
markup at all. Higher value, lower risk.

---

## MEDIUM — 25 pages carry no structured data at all

The `/blog/*` and `/urgent-requirements/*` app-shell pages emit zero JSON-LD in their raw
HTML. Both components do declare schema (`BlogPostPage.tsx:77`,
`UrgentRequirementDetailPage.tsx:206`) — it only exists after JavaScript runs. `Article`
markup on the blog and `JobPosting` on urgent-requirements would both be genuinely valuable
here, and `JobPosting` is one of the few rich results still widely granted. Fixing the
prerender (see `onpage.md`) unlocks this.

---

## LOW — WebPage blocks are templated

`WebPage` carries the same generic `name`/`description` sitewide rather than per-page values,
which wastes a cheap disambiguation signal.

## Not assessed

Google Rich Results Test / Schema Markup Validator were not run against each URL — findings
here come from direct parsing and property inspection. Run the official validators on
`/visa-consultants-in-surat` and one `/guides/*` page before shipping changes.
