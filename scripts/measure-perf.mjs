/**
 * Lab performance measurement against the production build.
 *
 * Reports LCP, CLS, TTFB, FCP and TBT per route, plus transferred JS and CSS.
 * It exists so performance claims can be checked rather than asserted: run it,
 * change something, run it again, and compare. A number from this script is a
 * *lab* number on this machine — it is not field data and must never be
 * presented as "Core Web Vitals improved", which only Search Console or CrUX can
 * establish.
 *
 * INP is deliberately not reported: it measures response to real user
 * interaction and has no meaningful lab equivalent here.
 *
 * Usage:
 *   npm run build            # this measures dist/, so build first
 *   npm run perf
 *   npm run perf -- /study-visa /study-in-canada     # specific routes
 *   npm run perf -- --json > before.json             # to diff later
 */
import { spawn, execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4187
const BASE = `http://127.0.0.1:${PORT}`

const args = process.argv.slice(2)
const AS_JSON = args.includes('--json')
const routes = args.filter((a) => a.startsWith('/'))
const ROUTES = routes.length
  ? routes
  : ['/', '/study-visa', '/work-visa', '/study-in-canada', '/guides/canada-student-visa-requirements', '/blog']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
      for (const line of out.split('\n')) {
        if (!line.includes('LISTENING')) continue
        const pid = line.trim().split(/\s+/).at(-1)
        if (pid && /^\d+$/.test(pid) && pid !== '0') execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      }
    } else {
      execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' })
    }
  } catch {
    // already free
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

killPort(PORT)
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: ['ignore', 'ignore', 'ignore'] },
)

const results = []
try {
  await waitForServer(BASE)
  let browser
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' })
  } catch {
    browser = await chromium.launch({ headless: true })
  }

  for (const route of ROUTES) {
    // A fresh context per route: a warm HTTP cache would flatter every route
    // after the first and make the numbers incomparable.
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await context.newPage()

    // Observers must be registered before the page loads. LCP and longtask
    // entries are not returned by getEntriesByType after the fact — only a
    // PerformanceObserver with `buffered: true` sees them, and it has to exist
    // when they fire. Reading them afterwards silently yields nothing, which is
    // indistinguishable from a page that genuinely had no LCP.
    await page.addInitScript(() => {
      window.__perf = { lcp: null, cls: 0, tbt: 0 }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__perf.cls += entry.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__perf.tbt += Math.max(0, entry.duration - 50)
        }).observe({ type: 'longtask', buffered: true })
      } catch {
        // an entry type this browser does not support stays null/0
      }
    })

    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 })
    // Let layout settle so late-shifting elements are counted in CLS.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await sleep(2500)

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const paint = performance.getEntriesByName('first-contentful-paint')[0]
      const perf = window.__perf ?? { lcp: null, cls: 0, tbt: 0 }

      // Transfer sizes from Resource Timing rather than Content-Length headers,
      // which vite preview omits on chunked responses.
      const bytes = { js: 0, css: 0, image: 0, font: 0, other: 0 }
      for (const entry of performance.getEntriesByType('resource')) {
        const size = entry.transferSize || entry.encodedBodySize || 0
        const key =
          entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(entry.name) ? 'js'
          : entry.initiatorType === 'css' || entry.initiatorType === 'link' || /\.css(\?|$)/.test(entry.name) ? 'css'
          : entry.initiatorType === 'img' ? 'image'
          : /\.(woff2?|ttf|otf)(\?|$)/.test(entry.name) ? 'font'
          : 'other'
        bytes[key] += size
      }
      bytes.html = nav ? nav.transferSize || nav.encodedBodySize || 0 : 0

      return {
        ttfb: nav ? Math.round(nav.responseStart) : null,
        fcp: paint ? Math.round(paint.startTime) : null,
        lcp: perf.lcp === null ? null : Math.round(perf.lcp),
        cls: Number(perf.cls.toFixed(4)),
        tbt: Math.round(perf.tbt),
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        bytes,
      }
    })

    results.push({ route, ...metrics })
    await context.close()
  }
  await browser.close()
} finally {
  try {
    preview.kill()
    await sleep(300)
    if (!preview.killed && process.platform === 'win32' && preview.pid) {
      spawn('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    }
  } catch {
    // already gone
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2))
} else {
  const kb = (n) => `${Math.round(n / 1024)} KB`
  const pad = (s, n) => String(s).padEnd(n)
  console.log('\nLab measurements — this machine, headless Chrome, no throttling.')
  console.log('Not field data. Do not describe these as Core Web Vitals.\n')
  console.log(`${pad("Route", 44)}${pad("LCP", 9)}${pad("CLS", 8)}${pad("TTFB", 8)}${pad("FCP", 8)}${pad("TBT", 8)}${pad("HTML", 9)}${pad("JS", 10)}CSS`)
  console.log('-'.repeat(112))
  for (const r of results) {
    console.log(
      pad(r.route, 44) +
      pad(r.lcp === null ? '—' : `${r.lcp}ms`, 9) +
      pad(r.cls, 8) +
      pad(`${r.ttfb}ms`, 8) +
      pad(`${r.fcp}ms`, 8) +
      pad(`${r.tbt}ms`, 8) +
      pad(kb(r.bytes.html), 9) +
      pad(kb(r.bytes.js), 10) +
      kb(r.bytes.css),
    )
  }
  console.log('\nTo compare a change: `npm run perf -- --json > before.json`, make the change,')
  console.log('rebuild, then `npm run perf -- --json > after.json` and diff the two.')
}
