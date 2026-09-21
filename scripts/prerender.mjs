/**
 * Post-build prerender for public SEO routes.
 * Starts vite preview, renders each route with Playwright, writes HTML into dist/.
 */
import { spawn } from 'node:child_process'
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
      const type = route.request().resourceType()
      if (type === 'image' || type === 'media') {
        return route.abort()
      }
      return route.continue()
    })

    for (const route of ROUTES) {
      const url = `${BASE}${route === '/404' ? '/this-page-does-not-exist-prerender' : route}`
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForSelector('#root', { timeout: 15000 }).catch(() => {})
        await page.waitForFunction(() => (document.getElementById('root')?.innerText?.length || 0) > 10, { timeout: 8000 }).catch(() => {})
        await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {})
        // Give helmet/lazy routes a moment to settle
        await sleep(300)
        const html = await page.content()
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
