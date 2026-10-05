/**
 * Post-build prerender for every public route.
 *
 * Starts `vite preview`, renders each route with Playwright, verifies the result
 * actually rendered, and writes the HTML into dist/. Routes that fail
 * verification are NOT written — they fall back to app-shell.html at runtime and
 * are recorded as failures so the sitemap generator leaves them out.
 *
 * The output contract is dist/prerender-manifest.json, which is the only input
 * scripts/generate-sitemap.mjs uses. That is deliberate: a URL can only reach
 * sitemap.xml by having been rendered here and passed every check below.
 *
 * Two ordering rules this file depends on:
 *
 *   1. `/` is rendered LAST. dist/index.html is the SPA fallback that
 *      `vite preview` serves for every not-yet-written route, so rendering `/`
 *      first would make every later route load with the homepage's title and
 *      content already in the DOM — and the readiness gate below (which watches
 *      for the title to change away from the shell's) would pass instantly
 *      against stale homepage text.
 *   2. app-shell.html is captured from the untouched dist/index.html before any
 *      rendering happens, for the same reason.
 */
import { spawn, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { getPublicRoutes, SITE_URL } from './seo-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

/**
 * Path to vite's CLI. Node's own resolution cannot be used — vite's package
 * exports do not expose bin/vite.js — so walk up from the project looking for
 * an installed copy. A git worktree has no node_modules of its own and resolves
 * packages from the main checkout, where this finds it instead of spawning a
 * path that does not exist (which surfaced only as "preview server did not
 * start").
 */
function resolveViteCli() {
  for (let dir = root; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js')
    if (existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
  }
  throw new Error('Could not find vite/bin/vite.js — run npm install')
}
const distDir = path.join(root, 'dist')
const PORT = 4179
const BASE = `http://127.0.0.1:${PORT}`

/**
 * Routes whose content comes from Supabase at runtime. They are prerendered like
 * every other route — an earlier version of this script skipped them on the
 * stated grounds that "Supabase is unavailable during a local build" and that
 * "vite preview returns HTTP errors for them". Both were wrong: .env.local is
 * loaded in production mode so the credentials are in the bundle, the request
 * interceptor below lets Supabase fetches through, and vite preview's SPA
 * fallback answers these paths with HTTP 200. The cost of the mistake was 25
 * sitemap URLs serving an empty shell.
 *
 * They do still need a longer budget than a static route, because they cannot
 * render until a network round-trip completes.
 */
const DATA_BACKED = /^\/(blog|urgent-requirements)\//
const isDataBacked = (route) => DATA_BACKED.test(route)

// Google's tag must not load or be serialized during prerender; see page.route below.
const ANALYTICS_HOST = /(?:googletagmanager|google-analytics)\.com/
const ANALYTICS_SCRIPT = /<script[^>]*(?:googletagmanager|google-analytics)\.com[^>]*>\s*<\/script>/gi

/**
 * A page that rendered has at minimum this many words of text in <main>. The
 * floor is deliberately low — it is a skeleton detector, not a content-quality
 * check (that lives in scripts/validate-seo.mjs) — so a legitimately short page
 * never fails the build.
 */
const MIN_WORDS = 60

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Free PORT before starting the preview server.
 * A lingering process from a previous build run causes "Port already in use"
 * which makes the new preview server silently not start, resulting in
 * ERR_CONNECTION_REFUSED for every route.
 */
async function killPort(port) {
  try {
    if (process.platform === 'win32') {
      // netstat lists PID in the last column for LISTENING entries
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim()
      for (const line of out.split('\n')) {
        if (!line.includes('LISTENING')) continue
        const pid = line.trim().split(/\s+/).at(-1)
        if (pid && /^\d+$/.test(pid) && pid !== '0') {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
          console.log(`Killed PID ${pid} on port ${port}`)
        }
      }
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' })
    }
    // Give the OS a moment to release the port
    await sleep(400)
  } catch {
    // Port was already free — nothing to do
  }
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch {
      // retry
    }
    await sleep(250)
  }
  throw new Error(`Preview server did not start at ${url}`)
}

function outFileForRoute(route) {
  if (route === '/') return path.join(distDir, 'index.html')
  const clean = route.replace(/^\//, '').replace(/\/$/, '')
  return path.join(distDir, clean, 'index.html')
}

/** Canonical URL a self-canonical page at `route` must declare. Mirrors absoluteUrl(). */
function expectedCanonical(route) {
  return route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
}

/** HTML comments removed. See verifyHtml for why this matters. */
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '')

/** The document title as a browser would report it, not as a naive regex would. */
function titleOf(html) {
  return stripComments(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
}

/**
 * Removes index.html's fallback <title> from a rendered page.
 *
 * React 19 hoists the <title> a component renders into <head>, but it does not
 * remove a matching static one that was already there — it prepends its own. In
 * the live DOM that is invisible (the browser reports the first title, which is
 * React's), but the serialized HTML carries both, so every prerendered page
 * shipped two <title> elements.
 *
 * The static one cannot simply be deleted from index.html: it is what an
 * un-prerendered route gets through app-shell.html, and it is the signal the
 * readiness gate below uses to tell "React has rendered" from "React has not".
 * So it stays in the source and is stripped from the output here.
 */
function dropFallbackTitle(html, shellTitle) {
  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)]
  if (titles.length < 2) return html
  const fallback = titles.find((m) => m[1].trim() === shellTitle)
  if (!fallback) return html
  return html.slice(0, fallback.index) + html.slice(fallback.index + fallback[0].length)
}

function attr(html, tag, value, wanted) {
  // Attribute-order-independent: matches the tag, then reads `wanted` from it.
  const open = new RegExp(`<${tag}\\b[^>]*\\b${value}[^>]*>`, 'i')
  const found = html.match(open)
  if (!found) return null
  const got = found[0].match(new RegExp(`\\b${wanted}\\s*=\\s*"([^"]*)"`, 'i'))
  return got ? got[1] : null
}

/**
 * Checks the serialized HTML, not the live DOM. Anything that passes here is
 * what the crawler will actually be served, which is the only thing that counts.
 *
 * @returns {string[]} reasons the page is not fit to publish; empty means it is.
 */
function verifyHtml(rawHtml, route, shellTitle, wordCount, declaredCanonical) {
  // Comments stripped first: index.html's comments end up in every page, and one
  // that mentions a tag by name would otherwise be read as that tag.
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '')
  const problems = []

  const title = titleOf(html)
  if (!title) problems.push('no <title>')
  else if (title === shellTitle) problems.push(`title is still the shell default ("${shellTitle}") — the app did not render`)

  const description = attr(html, 'meta', 'name="description"', 'content')
  if (!description) problems.push('no meta description')

  // /404 is intentionally noindex and does not self-canonicalise.
  if (route !== '/404') {
    const want = declaredCanonical ?? expectedCanonical(route)
    const canonical = attr(html, 'link', 'rel="canonical"', 'href')
    if (!canonical) problems.push('no canonical')
    else if (canonical !== want) problems.push(`canonical is ${canonical}, expected ${want}`)
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length
  if (h1Count !== 1) problems.push(`${h1Count} <h1> elements, expected exactly 1`)

  if (wordCount < MIN_WORDS) problems.push(`only ${wordCount} words in <main> (floor is ${MIN_WORDS}) — looks like a loading skeleton`)

  return problems
}

async function main() {
  // Free the port before starting vite preview — a leftover server from a
  // previous build causes silent startup failure and ERR_CONNECTION_REFUSED.
  await killPort(PORT)
  await access(distDir)

  const routes = await getPublicRoutes(root)
  // `/` last (see the header comment). /404 is rendered but never indexed.
  const queue = [
    ...routes.filter((r) => r.path !== '/'),
    { path: '/404', noindex: true },
    ...routes.filter((r) => r.path === '/'),
  ]

  const rawIndex = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const shellTitle = titleOf(rawIndex) ?? ''
  if (!shellTitle) {
    throw new Error('dist/index.html has no <title>; the prerender readiness gate depends on it')
  }

  // Shell for client-rendered routes (see .htaccess): the untouched Vite index.html minus any
  // canonical, og:url and robots tags, so an un-prerendered URL never claims to be the homepage.
  const shell = rawIndex
    .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<meta[^>]*property="og:url"[^>]*>/gi, '')
    .replace(/<meta[^>]*name="robots"[^>]*>/gi, '')
  await writeFile(path.join(distDir, 'app-shell.html'), shell, 'utf8')

  // Run vite via node directly — avoids shell wrappers and DEP0190 warning.
  const viteCli = resolveViteCli()
  const previewArgs = [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort']
  const preview = spawn(
    process.execPath,
    previewArgs,
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    },
  )

  let previewLog = ''
  preview.stdout.on('data', (d) => {
    previewLog += d.toString()
  })
  preview.stderr.on('data', (d) => {
    previewLog += d.toString()
  })

  /** @type {Array<{route: string, published: boolean, prerendered: boolean, title?: string, description?: string, canonical?: string, selfCanonical?: boolean, lastmod?: string, noindex: boolean, reason?: string}>} */
  const manifest = []

  try {
    await waitForServer(BASE)
    // Prefer system Chrome when Playwright's bundled Chromium isn't installed yet.
    let browser
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' })
    } catch {
      browser = await chromium.launch({ headless: true })
    }
    const page = await browser.newPage()

    // This browser loads every route for real, so the site's own trackers fire
    // and write to Supabase — one page view per page, on every build. The flag
    // runs before any application code and makes src/lib/runtime-env.ts stamp
    // those rows `environment: 'build'`, so the admin access log can keep them
    // out of real visitor activity instead of silently inflating it.
    await page.addInitScript(() => {
      Object.defineProperty(window, '__SVO_PRERENDER__', { value: true, configurable: false })
    })

    // Abort heavy or stall-prone external media (images, videos) to prevent network hangs and speed up prerender
    await page.route('**/*', (route) => {
      // This browser runs initAnalytics(), so letting the tag load would report one
      // visit per route to the GA property from the build machine on every build.
      if (ANALYTICS_HOST.test(route.request().url())) {
        return route.abort()
      }
      const type = route.request().resourceType()
      if (type === 'image' || type === 'media') {
        return route.abort()
      }
      return route.continue()
    })

    for (const entry of queue) {
      const route = entry.path
      const record = {
        route,
        published: true,
        prerendered: false,
        noindex: Boolean(entry.noindex),
        lastmod: entry.lastmod,
      }

      const url = `${BASE}${route === '/404' ? '/this-page-does-not-exist-prerender' : route}`
      // Supabase-backed routes cannot render until a network round-trip finishes.
      const readyTimeout = isDataBacked(route) ? 30000 : 15000

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('#root', { timeout: 15000 })

        // The real readiness gate. SeoHead only mounts once a page component has
        // its data, so the title moving off the shell default is proof the route
        // rendered rather than proof that *something* painted. Every loading
        // state in the app renders before SeoHead, so none of them can satisfy
        // this. The word floor catches a page that set a title but has an empty
        // body.
        await page.waitForFunction(
          ({ shellTitle, minWords }) => {
            const title = document.title.trim()
            if (!title || title === shellTitle) return false
            if (!document.querySelector('link[rel="canonical"]')) return false
            const main = document.querySelector('main') || document.getElementById('root')
            const words = (main?.innerText || '').trim().split(/\s+/).filter(Boolean).length
            return words >= minWords
          },
          { shellTitle, minWords: MIN_WORDS },
          { timeout: readyTimeout },
        )

        // Let late effects (lazy chunks, JSON-LD) settle before snapshotting.
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
        await sleep(300)

        const wordCount = await page.evaluate(() => {
          const main = document.querySelector('main') || document.getElementById('root')
          return (main?.innerText || '').trim().split(/\s+/).filter(Boolean).length
        })

        // The inline GA4 tag is in index.html. Remove any runtime-injected duplicate
        // that analytics.ts might add, to avoid a double pageview on first load.
        const html = dropFallbackTitle(
          (await page.content()).replace(ANALYTICS_SCRIPT, ''),
          shellTitle,
        )

        const problems = verifyHtml(html, route, shellTitle, wordCount, entry.canonical)
        if (problems.length) {
          record.reason = problems.join('; ')
          console.warn(`NOT WRITTEN  ${route}\n             ${problems.join('\n             ')}`)
          manifest.push(record)
          continue
        }

        const target = outFileForRoute(route === '/404' ? '/404' : route)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, html, 'utf8')

        record.prerendered = true
        record.title = titleOf(html)
        record.description = attr(html, 'meta', 'name="description"', 'content') ?? undefined
        record.canonical = attr(html, 'link', 'rel="canonical"', 'href') ?? undefined
        // Recorded rather than recomputed downstream, so generate-sitemap.mjs
        // needs no knowledge of how canonicals are formed.
        record.selfCanonical = record.canonical === expectedCanonical(route)
        // The page's own robots directive wins over the route list's guess: a page
        // can decide at render time that it is too thin to index.
        const robots = attr(html, 'meta', 'name="robots"', 'content') ?? ''
        if (/\bnoindex\b/i.test(robots)) record.noindex = true

        manifest.push(record)
        console.log(`prerendered  ${route} -> ${path.relative(root, target)}`)
      } catch (err) {
        record.reason = err.message.split('\n')[0]
        console.warn(`NOT WRITTEN  ${route}\n             ${record.reason}`)
        manifest.push(record)
      }
    }

    await browser.close()
  } finally {
    // Cross-platform process cleanup
    try {
      preview.kill()
      await sleep(500)
      if (!preview.killed && process.platform === 'win32' && preview.pid) {
        // On Windows, force-kill the process tree
        spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
      } else if (!preview.killed) {
        preview.kill('SIGKILL')
      }
    } catch {
      // Process may have already exited
    }
  }

  await writeFile(
    path.join(distDir, 'prerender-manifest.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), routes: manifest }, null, 2)}\n`,
    'utf8',
  )

  if (previewLog.includes('error')) {
    console.warn('Preview log contained errors:\n', previewLog.slice(-1000))
  }

  const failed = manifest.filter((r) => !r.prerendered)
  const ok = manifest.length - failed.length
  console.log(`\nPrerender complete: ${ok}/${manifest.length} routes written`)

  if (failed.length) {
    console.warn(`\n${failed.length} route(s) were not prerendered and are excluded from the sitemap:`)
    for (const r of failed) console.warn(`  ${r.route}\n    ${r.reason}`)

    // A failed Supabase-backed route still works for visitors through
    // app-shell.html, so it is a warning: the post is live, it is just not
    // submitted to Google until the next build renders it. A failed STATIC route
    // means a page of the site itself did not render, which is a build failure —
    // .htaccess has no fallback for those (rule 6 404s them).
    const staticFailures = failed.filter((r) => !isDataBacked(r.route))
    if (staticFailures.length) {
      console.error(`\n${staticFailures.length} static route(s) failed to prerender. Failing the build.`)
      process.exitCode = 1
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
