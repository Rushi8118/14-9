/**
 * Post-build prerender for public SEO routes.
 * Starts vite preview, renders each route with Playwright, writes HTML into dist/.
 */
import { spawn, execSync } from 'node:child_process'
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { getPublicRoutes } from './seo-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const PORT = 4179
const BASE = `http://127.0.0.1:${PORT}`

// Same list as the sitemap, plus the static 404 page.
const ROUTES = [...(await getPublicRoutes(root)).map((route) => route.path), '/404']

/**
 * Routes served by app-shell.html at runtime (see public/.htaccess).
 * They fetch content from Supabase which is unavailable during a local build,
 * and vite preview returns HTTP errors for them, so prerendering them is both
 * impossible and unnecessary. They are intentionally client-rendered.
 */
const SKIP_PREFIXES = ['/blog/', '/urgent-requirements/']
const shouldSkip = (route) => SKIP_PREFIXES.some((prefix) => route.startsWith(prefix))

// Google's tag must not load or be serialized during prerender; see page.route below.
const ANALYTICS_HOST = /(?:googletagmanager|google-analytics)\.com/
const ANALYTICS_SCRIPT = /<script[^>]*(?:googletagmanager|google-analytics)\.com[^>]*>\s*<\/script>/gi

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

async function main() {
  // Free the port before starting vite preview — a leftover server from a
  // previous build causes silent startup failure and ERR_CONNECTION_REFUSED.
  await killPort(PORT)
  await access(distDir)

  // Shell for client-rendered routes (see .htaccess): the untouched Vite index.html minus the homepage's
  // canonical, og:url and robots tags, so an un-prerendered URL never claims to be the homepage.
  const shell = (await readFile(path.join(distDir, 'index.html'), 'utf8'))
    .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<meta[^>]*property="og:url"[^>]*>/gi, '')
    .replace(/<meta[^>]*name="robots"[^>]*>/gi, '')
  await writeFile(path.join(distDir, 'app-shell.html'), shell, 'utf8')

  // Run vite via node directly — avoids shell wrappers and DEP0190 warning.
  const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
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

    for (const route of ROUTES) {
      // Skip dynamic Supabase-fetched routes — these are served by app-shell.html
      // at runtime via .htaccess and do not need static prerendered snapshots.
      if (shouldSkip(route)) {
        console.log(`skipped  ${route} (client-rendered via app-shell.html)`)
        continue
      }

      const url = `${BASE}${route === '/404' ? '/this-page-does-not-exist-prerender' : route}`
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('#root', { timeout: 15000 }).catch(() => {})
        await page.waitForFunction(() => (document.getElementById('root')?.innerText?.length || 0) > 10, { timeout: 8000 }).catch(() => {})
        await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {})
        // Give helmet/lazy routes a moment to settle
        await sleep(300)
        // The inline GA4 tag is now in index.html. Remove any runtime-injected duplicate
        // that analytics.ts might add, to avoid a double pageview on first load.
        const html = (await page.content()).replace(ANALYTICS_SCRIPT, '')
        const target = outFileForRoute(route === '/404' ? '/404' : route)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, html, 'utf8')
        console.log(`prerendered ${route} -> ${path.relative(root, target)}`)
      } catch (err) {
        console.warn(`prerender failed for ${route}:`, err.message)
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

  if (previewLog.includes('error')) {
    console.warn('Preview log contained errors:\n', previewLog.slice(-1000))
  }
  console.log(`Prerender complete (${ROUTES.length} routes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
