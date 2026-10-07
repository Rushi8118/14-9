# Content briefs — thin and near-duplicate indexable pages

Generated 2026-10-07 from a measurement pass over the 105 URLs in `dist/sitemap-pages.xml`.
Method: main-content text only (nav, header and footer stripped), 4-gram Jaccard similarity
between every indexable pair. These numbers are therefore lower than `npm run
check:similarity`, which scores whole pages and includes the 29 **noindex** work-visa pages
Google never compares.

**Every factual slot below is a placeholder on purpose.** Nothing in this file may be filled
from inference. Each one names the authority that governs it; the value goes in only after
someone reads it there. See the "never invent a business fact" rule in `CLAUDE.md`.

---

## Priority 1 — three guides that are thin for their page type

These are the only genuinely under-served indexable pages. The other six pages under 350
words (`/contact` 207, `/about` 231, `/services` 231, `/guides` 264,
`/immigration-disclaimer` 286, `/for-business/contact` 160) are short because that is what
they are for; leave them alone.

### `/guides/uk-student-visa-requirements` — 344 words, 0.53 similarity to its peers

| Field | Value |
|---|---|
| Target keyword | uk student visa requirements for indian students |
| Secondary | uk student visa documents checklist, cas letter requirements |
| Intent | Informational, pre-application. Reader wants a checklist they can act on today. |
| Recommended title | UK Student Visa Requirements for Indian Students: Full Checklist |
| Current gap | Lists requirement names without the thresholds that make a checklist usable. |

Outline:

1. Who the Student route is for — one paragraph, no numbers needed.
2. **Financial requirement** — `[PLACEHOLDER: maintenance funds for London vs outside
   London, per month, and the number of months]`. Source: GOV.UK "Student visa" → Money you
   need. Changes periodically; record the date read.
3. **English language requirement** — `[PLACEHOLDER: CEFR level per course level, accepted
   SELT providers]`. Source: GOV.UK approved secure English language tests list.
4. **CAS** — what it is, who issues it, how long it stays valid.
   `[PLACEHOLDER: CAS validity window]`. Source: the sponsoring university / UKVI guidance.
5. **Document checklist** — passport, CAS, financial evidence held for
   `[PLACEHOLDER: consecutive-days requirement]`, TB certificate if applicable, ATAS if
   applicable, parental consent if under 18.
6. **Fees** — `[PLACEHOLDER: visa application fee, Immigration Health Surcharge per year]`.
   Source: GOV.UK visa fees table.
7. **Timeline** — `[PLACEHOLDER: published decision-waiting time from outside the UK]`.
   Source: GOV.UK visa processing times. Must be labelled as UKVI's published guide, not a
   promise.
8. How Siddhivinayak Overseas helps — document review, CAS liaison, interview prep. Factual
   about the service, silent on outcomes.

Internal links: `/study-visa`, `/study-in-uk` (if published), `/guides/visa-rejection-reasons`,
`/guides/post-study-work-visa-comparison`, `/contact`.

FAQ opportunities (answers must come from the sources above, and must be visible on the page
— `validate-seo` fails the build on an answer that exists only in JSON-LD):

- How much money do I need to show for a UK student visa?
- How long is a CAS valid?
- Do I need IELTS for a UK student visa?
- Can I work while studying on a UK Student visa? `[PLACEHOLDER: term-time hour cap]`

### `/guides/ielts-requirements-for-study-abroad` — 335 words, 0.48 similarity

| Field | Value |
|---|---|
| Target keyword | ielts requirements for study abroad |
| Secondary | ielts band requirement for uk/canada/australia, pte vs ielts |
| Intent | Comparative informational. Reader is deciding which test to sit and what to aim for. |
| Recommended title | IELTS Band Requirements by Country: UK, Canada, Australia, Europe |

Outline:

1. IELTS Academic vs General Training, and which route needs which.
2. **Band requirement table by destination** — the page's reason to exist, and what it
   currently lacks. `[PLACEHOLDER: minimum overall and per-band scores, per country, per
   course level]`. Sources: each country's own immigration authority (GOV.UK, IRCC,
   Department of Home Affairs) **plus** the institution, since universities often require
   more than the visa does. Say which of the two each figure comes from.
3. Accepted alternatives — PTE, TOEFL, Duolingo — and that acceptance is per-institution.
4. Validity: `[PLACEHOLDER: how long an IELTS result is accepted]`. Source: IELTS official.
5. Test fee and booking in India: `[PLACEHOLDER: current fee]`. Source: IDP/British Council India.
6. What to do about a low band — retake, pathway programme, pre-sessional English.

Internal links: `/study-visa`, the destination pages for each country in the table,
`/guides/visa-rejection-reasons`.

FAQ: What IELTS score do I need for a UK student visa? / Is PTE accepted instead of IELTS? /
How long is an IELTS score valid? / Can I apply with a 5.5 band?

### `/guides/australia-student-visa-requirements` — 287 words, 0.53 similarity

| Field | Value |
|---|---|
| Target keyword | australia student visa requirements for indian students |
| Secondary | subclass 500 requirements, australia student visa financial requirement |
| Intent | Informational, pre-application. |
| Recommended title | Australia Student Visa (Subclass 500) Requirements for Indian Students |

Outline:

1. Subclass 500 — who it covers, including dependants.
2. **Confirmation of Enrolment (CoE)** — who issues it and when.
3. **Genuine Student / GTE requirement** — what the statement must address. This is the
   highest-value section and the one competitors handle badly. No invented criteria; source
   it from the Department of Home Affairs' own instruction.
4. **Financial capacity** — `[PLACEHOLDER: funds required for tuition, travel and 12 months
   living costs]`. Source: Department of Home Affairs.
5. **English requirement** — `[PLACEHOLDER: score by course level]`. Same source.
6. **OSHC** health cover — required for the full visa period.
   `[PLACEHOLDER: indicative annual cost]`. Source: an OSHC provider's published rates.
7. **Fee and timeline** — `[PLACEHOLDER: application charge; published processing time]`.
   Source: Department of Home Affairs. Label as published guidance.
8. Work rights while studying: `[PLACEHOLDER: current hour cap]`.

Internal links: `/study-in-australia`, `/work-visa/australia`, `/study-visa`,
`/guides/post-study-work-visa-comparison`.

FAQ: How much money do I need for an Australian student visa? / What is the GTE requirement?
/ Can I work on a subclass 500? / Is OSHC compulsory?

---

## Priority 2 — the work-visa cluster (0.69–0.77)

`belarus`↔`italy` 0.765 · `malta`↔`belarus` 0.762 · `israel`↔`malta` 0.717 ·
`new-zealand`↔`malta` 0.688. All five are ~1050–1130 words, so this is **not** a thin-content
problem — it is a sameness problem. Rewording will not fix it; only country-specific fact
will.

Do **not** consolidate or redirect these. They target distinct queries and each has a real
corresponding service. The fix is to replace the shared template prose with per-country
material in three sections:

1. **The actual visa instrument** — its real name and the authority that issues it, per
   country (e.g. Malta's single permit, Italy's *nulla osta* / Decreto Flussi quota, Israel's
   B/1, New Zealand's AEWV, Belarus's work permit). `[PLACEHOLDER per country: instrument
   name, issuing authority, whether an employer must be accredited or quota-bound]`. Source:
   each country's immigration ministry.
2. **Which sectors actually recruit Indian workers there** — tie to the urgent requirements
   already published for that country rather than generic lists. This is unique content you
   already own.
3. **Documents and sequence** — where the order genuinely differs (Italy's quota window vs
   Malta's employer-led application vs New Zealand's job-check step).

Leave in place, indexable. Re-measure with the pass in this file after rewriting; target
below 0.60 against every sibling.

Per-country FAQ, answers sourced per country: Who applies — me or the employer? / Is there a
quota or window? / Can family join? / Does the permit lead to residence?

---

## Priority 3 — four north-east state pages at 0.80

`/visa-consultants-in-meghalaya`, `/visa-consultants-in-mizoram`,
`/visa-consultants-in-nagaland`, `/visa-consultants-in-manipur` — ~1145 words each, 0.802–0.803.

These sit exactly on the fail threshold. They are state landing pages for an office in Surat,
so there is little honest state-specific fact to add beyond what is already there, and
inventing local detail is out.

Decision needed from the business, not from code. Two defensible options:

1. **Keep all four, differentiate lightly** — state-specific additions limited to things that
   are true and checkable: nearest passport Seva Kendra / VFS centre for that state, the
   state's own documents (domicile, PRC) where they matter for an application, and realistic
   travel routing to Surat. `[PLACEHOLDER per state: nearest VFS/PSK location]`. Source: VFS
   Global and Passport Seva site listings.
2. **Consolidate to one north-east page** — `/visa-consultants-in-north-east-india` with the
   four 301-redirected to it. Fewer, stronger URLs. Only if the business is not actually
   pursuing these states individually.

Nothing was changed here. Option 2 would mean retiring live URLs, which is an approval
decision; option 1 needs the facts above.

---

## Not a content problem

Worth recording so these do not get "fixed" later by mistake:

- The 29 noindex work-visa pages scoring 0.90+ against each other. They are deliberately not
  indexed; near-duplication among them has no search cost.
- `/for-business/contact` at 160 words. It is a contact form.
- `/immigration-disclaimer` at 286 words. Legal text; padding it would be worse.
