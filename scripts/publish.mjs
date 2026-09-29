/**
 * `npm run publish` — one command that takes the site from source to a verified,
 * upload-ready dist/.
 *
 * It runs the full chain, stops at the first failure, then prints exactly what
 * changed and what must be uploaded.
 *
 *     vite build  ->  prerender  ->  sitemap  ->  validate-seo  ->  report
 *
 * It does NOT upload anything. The hosting provider and access method have not
 * been supplied, so no FTP, SFTP, SSH, rsync or hosting-API code exists in this
 * repository — see `deploy()` at the bottom for the seam where it would go.
 *
 * What this means in practice, and it matters: publishing a blog post or an
 * urgent requirement in the admin panel makes it live for visitors immediately
 * (Apache serves app-shell.html and React fetches it from Supabase), but it does
 * NOT put it in sitemap.xml and does NOT give it server-rendered metadata. Both
 * of those need a new build and a new upload. Until then Google may not discover
 * the post at all.
 */
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

function run(label, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${label} ===`)
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${label} failed (exit ${code})`))))
    child.on('error', reject)
  })
}

const node = process.execPath

try {
  await run('Build', node, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'])
  await run('Prerender', node, ['--no-deprecation', path.join(root, 'scripts', 'prerender.mjs')])
  await run('Sitemap', node, [path.join(root, 'scripts', 'generate-sitemap.mjs')])
  await run('SEO validation', node, [path.join(root, 'scripts', 'validate-seo.mjs')])
} catch (err) {
  console.error(`\n${err.message}`)
  console.error('Nothing was uploaded. Fix the reported problems and run `npm run publish` again.')
  process.exit(1)
}

const manifest = JSON.parse(await readFile(path.join(distDir, 'prerender-manifest.json'), 'utf8'))
const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
const sitemapCount = (sitemap.match(/<loc>/g) ?? []).length
const rendered = manifest.routes.filter((r) => r.prerendered)
const notRendered = manifest.routes.filter((r) => !r.prerendered)

console.log('\n=== Ready to upload ===')
console.log(`  Directory:        ${distDir}`)
console.log(`  Pages rendered:   ${rendered.length} / ${manifest.routes.length}`)
console.log(`  Sitemap URLs:     ${sitemapCount}`)
if (notRendered.length) {
  console.log(`\n  ${notRendered.length} page(s) NOT rendered — live for visitors, absent from the sitemap:`)
  for (const r of notRendered) console.log(`    ${r.route} — ${r.reason ?? 'unknown'}`)
}
console.log('\nUpload the entire contents of dist/ to the web root, replacing what is there.')
console.log('The site is not updated until that upload completes.')

await deploy()

/**
 * Deployment seam. Intentionally a no-op.
 *
 * To enable automated upload, supply the hosting provider and the access method
 * (FTP/SFTP credentials, an SSH key, or a hosting-provider API token). The
 * implementation belongs here and should:
 *   - read credentials from a git-ignored env file, never from this repo
 *   - upload dist/ to the web root
 *   - upload sitemap.xml and robots.txt last, so a crawler never sees a sitemap
 *     pointing at files that are still being written
 *   - verify a sample of URLs return 200 with the expected canonical afterwards
 * Nothing is implemented until those details are provided.
 */
async function deploy() {
  // No hosting credentials configured; upload is manual.
}
