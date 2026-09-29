# Content Quality & E-E-A-T — findings

The delegated content agent died on an API rate limit after recording five early findings.
This file completes them inline with the supporting evidence.

This is **YMYL content**. Visa and overseas-employment advice affects people's finances,
legal status and livelihood, so Google's quality-rater guidelines hold it to the higher
E-E-A-T bar: verifiable identity, demonstrable expertise, and claims a reader can check.

---

## CRITICAL — "fixed jobs, guaranteed statutory salaries" is the site's central promise

Homepage, main content, verbatim:

> "…in India, Bangladesh, Nepal, Pakistan, and Sri Lanka transition to lawful work visas
> with **fixed jobs, guaranteed statutory salaries**, and company benefits"

The phrase recurs as a navigation label — "Study to Work Visa (Fixed Job & Salary)" — and
in the meta description of the homepage, so it is the positioning, not a stray line.

Two distinct problems:

**1. Search quality.** Guaranteed-outcome claims in a YMYL vertical, with no named
guarantor, no contract terms, and no evidence, are precisely what rater guidelines
characterise as untrustworthy. No visa consultancy can guarantee a foreign employer's
salary or a visa grant — both are decisions of third parties. A reader who knows the
domain reads this as overpromising, and the rater guidelines are written to approximate
that reader.

**2. Regulatory exposure — verify this.** Recruiting Indian nationals for overseas
employment is regulated under the Emigration Act 1983, administered by the Protector
General of Emigrants, and generally requires a Recruiting Agent (RA) licence registered
on eMigrate. Advertising guaranteed overseas jobs and salaries is exactly the activity
that framework covers. I am not giving legal advice and have not established whether the
business holds a licence — but no registration number appears anywhere on the site. If a
licence is held, display it; if the activity requires one, that needs professional advice
before this copy stays up. This is flagged because it is material, not because the audit
assumes wrongdoing.

**Recommendation:** replace guarantee language with what is actually deliverable and
verifiable — "employer-sponsored roles with contracts stating statutory minimum salaries",
"we do not guarantee visa outcomes; decisions rest with the immigration authority". That
wording is both more honest and more credible to a cautious reader.

---

## HIGH — no named authors, no credentials, no verifiable identity anywhere

`/about` is 231 words and contains no person's name, no photograph of a named individual,
no qualifications, no GST or CIN, no ICEF/British Council/IATA accreditation, no MEA or
eMigrate registration.

What it offers instead is unverifiable quantity claims:

> "With **6+ years** of dedicated guidance, we have helped **thousands of families**…"
> "**500+** Work visa clients · **6** Study visa countries · **6+** Years of expertise"

For a YMYL business this is the weakest possible authorship signal. Google's Search Quality
Rater Guidelines ask raters to identify *who* is responsible for content; on this site the
answer is nobody in particular.

**Recommendation, in priority order:**
1. Named counsellors with photos, roles and credentials on `/about`, and bylines on every
   `/guides/*` page linking to those profiles.
2. Any registration/licence number the business actually holds, in the footer.
3. Replace round-number claims with something checkable, or drop them.

---

## HIGH — the /guides/ section is too thin to compete, and it carries Article schema

Main-content word counts (chrome stripped), all nine guides:

| words | page |
|---|---|
| 169 | `/guides/australia-student-visa-requirements` |
| 178 | `/guides/ielts-requirements-for-study-abroad` |
| 186 | `/guides/post-study-work-visa-comparison` |
| 201 | `/guides/uk-student-visa-requirements` |
| 201 | `/guides/visa-rejection-reasons` |
| 211 | `/guides/japan-ssw-visa-guide` |
| 226 | `/guides/canada-study-visa-documents` |

Median **201 words**. These target queries whose SERPs are led by gov.uk, IRCC and
competitor guides several thousand words deep. Eight of them carry `Article` schema,
declaring themselves as substantive articles.

Word count is not a ranking factor, and padding them would be the wrong fix. The real gap
is **coverage**: none of these answers the specific, checkable questions the query implies
(exact financial-proof amounts, current fees, processing times, document checklists with
issuing authority). That is also what makes a page quotable by AI search — see `geo.md`.

**Recommendation:** pick the three guides closest to the actual business (Japan SSW, Canada
documents, visa rejection reasons), rebuild them to genuinely answer the question with
figures and a "last verified" date citing the official source, and leave the rest until
those three prove out. Do not rewrite all nine at once.

---

## HIGH — country pages are template clones

`/work-visa/*` (11 pages) and `/study-in-*` (11 pages) follow one template with the country
name substituted. They are not thin — `/work-visa/*` median is 787 words — but they are
structurally identical, and the tier-2 destinations carry the least country-specific
substance.

This is not a penalty risk; it is a competitiveness ceiling. A page that could be about any
country ranks for none of them.

**Recommendation:** differentiate on facts only that country has — the actual visa subclass
names, current fee in INR, realistic processing time, the specific occupations in demand.
`/work-visa/japan` (SSW & Engineer routes named explicitly) is the closest to right; use it
as the model.

---

## MEDIUM — no citations to official sources

Across the sampled pages I found no outbound links to IRCC, UKVI, Australian Home Affairs,
BAMF or the Japanese immigration bureau, and no "last verified" dates on visa rules that
change yearly. For YMYL content this is the cheapest available trust signal and it is
entirely absent.

---

## What is genuinely good

- **`/visa-consultants-in-surat` is hand-written, not templated** — specific local detail,
  named landmarks, its own Service and FAQPage schema. It is the best page on the site and
  shows the team can write real local content when they choose to.
- **`/regional-coverage` (3,260 words) and `/reviews` (1,841)** are substantial.
- **The writing is clear and readable** for the target audience — no keyword stuffing, no
  AI-boilerplate tells, sentences at an appropriate reading level.
- **`/immigration-disclaimer` exists.** Most consultancies in this vertical have nothing of
  the sort. It partially offsets the guarantee language — though a disclaimer on a separate
  page does not cancel a promise made on the homepage.

---

## Not assessed

Blog post quality (the 11 `/blog/*` pages could not be read as static HTML — see the
app-shell finding in `onpage.md`), plagiarism/originality checks, and comparison against
named competitors' content depth.
