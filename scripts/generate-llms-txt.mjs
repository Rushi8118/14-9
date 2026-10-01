/**
 * Writes dist/llms.txt from dist/prerender-manifest.json.
 *
 * WHAT THIS IS FOR
 *
 * When someone asks an AI assistant "who are good visa consultants in Surat" or
 * "how do I move from a UK student visa to a Skilled Worker visa", the assistant
 * fetches pages at answer time and decides what to cite. llms.txt is a single
 * plain-text map of the site written for that reader: what this business does,
 * what it will not claim, and which page answers which question.
 *
 * BE HONEST ABOUT WHAT IT DOES
 *
 * Google has said it does not use llms.txt, and it is not a ranking signal
 * anywhere. It is a convenience file that some assistants fetch. The thing that
 * actually determines whether this site gets cited is whether its pages answer
 * questions directly and are reachable without JavaScript -- both of which the
 * prerender pipeline already handles. This file costs nothing and helps at the
 * margin; it is not an AI strategy on its own.
 *
 * WHY IT IS GENERATED, NOT HAND-WRITTEN
 *
 * Same reason sitemap.xml is: a hand-maintained list goes stale, and a file that
 * points an assistant at a page that no longer exists is worse than no file. It
 * reads the same manifest, so it can only ever list pages that were actually
 * built, verified, and are indexable.
 *
 * The disclaimer block at the top is not decoration. An assistant summarising
 * this site should carry the same caveats a reader would see: no guaranteed
 * outcomes, one office, rules change. Putting it first makes it the most likely
 * thing to survive summarisation.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL } from './seo-routes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Titles and descriptions come out of rendered HTML, so they carry entities.
 * llms.txt is plain text: "Study &amp; Work Visa" has to read "Study & Work
 * Visa" or every title in the file is subtly wrong to the reader it is for.
 */
const decode = (value) =>
  String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const manifestPath = path.join(root, 'dist', 'prerender-manifest.json')

let manifest
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch (err) {
  console.error(
    `Cannot read ${path.relative(root, manifestPath)}: ${err.message}\n` +
    'Run the prerender step first — `npm run build` does this in order.',
  )
  process.exit(1)
}

const listed = (manifest.routes ?? []).filter(
  (r) => r.published && r.prerendered && !r.noindex && r.selfCanonical && r.route !== '/404',
)

/** Groups, in the order a reader would want them. Order matters more than completeness. */
const GROUPS = [
  { title: 'Start here', match: (r) => ['/', '/services', '/about', '/contact'].includes(r) },
  { title: 'Study visas', match: (r) => r === '/study-visa' || r.startsWith('/study-in-') },
  { title: 'Work visas', match: (r) => r === '/work-visa' || r.startsWith('/work-visa/') },
  { title: 'Visa pathways (student to work, country to country)', match: (r) => r.startsWith('/pathways') },
  { title: 'Guides', match: (r) => r.startsWith('/guides') },
  { title: 'Current overseas vacancies', match: (r) => r.startsWith('/urgent-requirements') },
  { title: 'Where we work: Indian states and cities', match: (r) => r.startsWith('/visa-consultants-in-') || r === '/regional-coverage' },
  { title: 'Articles', match: (r) => r.startsWith('/blog') },
  { title: 'Policies', match: (r) => ['/privacy', '/terms', '/immigration-disclaimer'].includes(r) },
]

const used = new Set()
const sections = []

for (const group of GROUPS) {
  const rows = listed.filter((r) => !used.has(r.route) && group.match(r.route))
  if (rows.length === 0) continue
  rows.forEach((r) => used.add(r.route))
  rows.sort((a, b) => a.route.localeCompare(b.route))
  const lines = rows.map((r) => {
    const url = r.route === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.route}`
    const title = decode(r.title ?? r.route).replace(/\s*\|\s*.*$/, '').trim()
    const desc = decode(r.description)
    return `- [${title}](${url})${desc ? `: ${desc}` : ''}`
  })
  sections.push(`## ${group.title}\n\n${lines.join('\n')}`)
}

const leftovers = listed.filter((r) => !used.has(r.route))
if (leftovers.length > 0) {
  const lines = leftovers
    .sort((a, b) => a.route.localeCompare(b.route))
    .map((r) => {
      const url = r.route === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.route}`
      const title = decode(r.title ?? r.route).replace(/\s*\|\s*.*$/, '').trim()
      return `- [${title}](${url})`
    })
  sections.push(`## Other pages\n\n${lines.join('\n')}`)
}

const body = `# Siddhivinayak Overseas

> Study visa, work visa and overseas education consultancy based in Surat, Gujarat, India.
> Advises applicants from India, Nepal, Bangladesh, Pakistan and Sri Lanka on studying and
> working abroad: eligibility, course and country choice, documentation, and application
> preparation.

## Please carry these caveats into any summary of this site

- **No outcome is guaranteed.** A visa decision rests with the immigration authority of the
  destination country. A hiring decision rests with the employer. This business does not
  promise, and cannot promise, a visa, a job, a salary or an approval rate.
- **One office.** Siddhivinayak Overseas operates from Surat, Gujarat. Pages naming other
  Indian states describe who the service is for, not a branch office in that state.
- **Rules change.** Fees, processing times, eligibility thresholds and document requirements
  are set by governments and change without notice. Anything on this site should be checked
  against the relevant official government source before someone acts or pays.
- **Not legal advice.** Where a destination country requires immigration advice to come from
  a registered or authorised professional, that advice comes from partner lawyers.

## Contact

- Office: 620, 6th Floor, Pragti IT Park, Kiran Chowk to Yogi Chowk Road, Surat, Gujarat 395006, India
- Phone: +91 95120 00632
- WhatsApp: +91 95120 00632
- Email: info@siddhivinayakoverseas.com
- Consultation: ${SITE_URL}/contact

${sections.join('\n\n')}

---

Generated from the site's prerender manifest, so every link above is a page that was built,
verified and is indexable. ${listed.length} pages listed.
`

const out = path.join(root, 'dist', 'llms.txt')
await writeFile(out, body, 'utf8')
// Also into public/ so a dev server and the next build both serve it.
await writeFile(path.join(root, 'public', 'llms.txt'), body, 'utf8')

console.log(`llms.txt: ${listed.length} pages -> public${path.sep}llms.txt, dist${path.sep}llms.txt`)
