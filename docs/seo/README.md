# SEO Documentation — Siddhivinayak Overseas

| File | What it is |
|---|---|
| [`technical-audit.md`](./technical-audit.md) | Source-verified audit of this repo: 16 findings, prioritised Critical → Low, each with problem, why it matters, fix, steps, owner, difficulty and how to measure. **Start here.** |
| [`content-plan.md`](./content-plan.md) | Site architecture, page-by-page blueprints (title, meta, H1, H2/H3, words, schema, CTA), and a 12-month publishing calendar. |
| [`growth-plan.md`](./growth-plan.md) | Local SEO, ethical link building, conversion optimisation, measurement stack, monthly report template, 90-day sequence. |
| [`keyword-strategy.md`](./keyword-strategy.md) | Keyword strategy narrative: top 30, page mapping, FAQ, warning list. |
| [`keyword-plan.csv`](./keyword-plan.csv) | 7,843 keywords × 12 columns: intent, target country/city, page, priority, competition estimate, title, meta, slug, internal links, content requirements. |
| [`keyword-strategy.csv`](./keyword-strategy.csv) | Same keywords in the earlier column shape (origin/destination/service oriented). |
| [`keyword-coverage.md`](./keyword-coverage.md) | Generated: which live page each of the 7,843 keywords is assigned to, and which destinations still have no page. Refresh with `npm run keywords`. |

## The three things that matter most

1. **No GA4 tag is installed.** `src/lib/analytics.ts` fires `phone_click`, `whatsapp_click` and `form_submit` events from 8 call sites. Nothing receives them. Every conversion you have ever had is unmeasured. Fix first — see audit C1.
2. **A 501 KB image loads at highest priority on the homepage**, plus 1.3 MB of 3D globe textures. Almost certainly your LCP element. See audit C2.
3. **Your best keyword cluster has no landing pages.** `/post-study-work-visa/*` is 301-redirected to the study pages. The content exists at `/pathways/*` under a name nobody searches for. See audit C3.

## Read before acting

The audit separates **VERIFIED** (read in the code), **ASSUMPTION** (inference, with what would confirm it) and **NEEDS DATA** (requires Search Console or live measurement). No search volumes, competitor names, rankings or review counts have been invented anywhere in these documents.
