/**
 * Notifies IndexNow search engines (Bing, Yandex, Seznam, Naver…) about every
 * URL in the sitemap so new/updated pages are crawled within minutes.
 * Run AFTER uploading dist/ (engines verify the key file on the live site):
 *   npm run seo:ping
 * Google does not use IndexNow — submit sitemap.xml in Google Search Console.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL } from './seo-routes.mjs'

const KEY = '2683a14d8cc3956dff2b28c391d96921'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const xml = await readFile(path.join(root, 'public', 'sitemap.xml'), 'utf8')
const urlList = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].replace(/&amp;/g, '&'))
const only = process.argv.slice(2).map((arg) => (arg.startsWith('http') ? arg : `${SITE_URL}${arg.startsWith('/') ? '' : '/'}${arg}`))

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: only.length ? only : urlList,
  }),
})
console.log(`IndexNow: submitted ${only.length || urlList.length} URLs -> HTTP ${response.status}`)
if (response.status >= 400) console.log(await response.text())
