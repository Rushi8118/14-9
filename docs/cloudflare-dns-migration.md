# Cloudflare DNS migration — production plan

**Nothing in this document has been done. No DNS record has been changed.** The
SEO Worker is built and tested locally; this is the plan for putting it in front
of the live site when you decide to.

## Current vs future

```
CURRENT                          FUTURE
Browser / Googlebot              Browser / Googlebot
        |                                |
Hostinger DNS                    Cloudflare DNS  (nameservers changed)
(ns1/ns2.dns-parking.com)                |
        |                        Cloudflare Worker  (/blog/*, /urgent-requirements/* only)
Hostinger (Apache)                       |
                                 Hostinger (Apache)   <- still the origin, unchanged
                                         |
                                 Supabase  (metadata + sitemap)
```

Hostinger remains the origin and serves every byte of static content exactly as
it does today. The Worker runs on two route patterns and nothing else.

## Why a full nameserver change and not a CNAME

Verified against Cloudflare's documentation: a partial (CNAME) zone setup is
**Business or Enterprise only**. On the Free plan the only option is a full
setup, which means changing the nameservers at the registrar. Worker routes also
require an **active zone with the record proxied** ("orange-clouded") — a
grey-clouded record cannot run a Worker.

So the nameserver change is unavoidable for this architecture. It is also the one
step with real blast radius, which is why it is yours to make and is not
automated anywhere in this repo.

## The email records are the dangerous part

A nameserver change moves **all** DNS resolution to Cloudflare, including mail.
If the mail records are not recreated correctly before the switch propagates,
inbound email to `info@siddhivinayakoverseas.com` stops. This is the single most
likely way this migration causes real damage.

**Before changing anything**, export the complete current zone from Hostinger
(hPanel → Domains → DNS Zone) and keep it. Cloudflare's scan during setup usually
finds most records, but it misses some, and a missed MX record is an outage.

### What must be proxied and what must not

| Record | Name | Proxy | Why |
|---|---|---|---|
| A / AAAA | `@` | **Proxied (orange)** | The Worker cannot run on a grey-clouded record |
| CNAME | `www` | **Proxied (orange)** | Keeps the existing www → apex 301 working through Cloudflare |
| A | `mail` | **DNS only (grey)** | Mail must reach the mail host directly. Proxying it breaks SMTP — Cloudflare's proxy only handles HTTP/HTTPS |
| MX | `@` | **DNS only** (MX cannot be proxied) | Inbound mail routing |
| TXT (SPF) | `@` | **DNS only** | `v=spf1 …` — copy byte-for-byte; a re-typed SPF record is a deliverability failure |
| TXT (DKIM) | e.g. `zmail._domainkey`, `default._domainkey` | **DNS only** | Long base64 key. Copy exactly, including any quoting |
| TXT (DMARC) | `_dmarc` | **DNS only** | `v=DMARC1; …` |
| TXT | `@` | **DNS only** | Domain-verification records (Google Search Console, Zoho, Bing). Removing one silently unverifies the property |
| CNAME / TXT | Zoho or other business-email records | **DNS only** | Whatever the current provider requires, carried over unchanged |
| SRV | any | **DNS only** | Service records cannot be proxied |

Rule of thumb: **only HTTP hostnames get the orange cloud.** Everything to do
with mail, verification or non-HTTP services stays grey.

### Verify before and after

Capture the current state first, so you can diff it:

```bash
dig +short MX siddhivinayakoverseas.com; dig +short TXT siddhivinayakoverseas.com; dig +short A mail.siddhivinayakoverseas.com
```

Run the same commands after propagation and compare. Then send a test email to
the business address from an external account **and** reply from it, before
considering the migration done.

## Order of operations

1. **Export** the Hostinger DNS zone. Keep the file.
2. **Add the site to Cloudflare** (Free plan). Let it scan, then reconcile its
   record list against your export, record by record. Add what it missed; fix any
   proxy flag per the table above.
3. **Do not change nameservers yet.** Set SSL/TLS to **Full (Strict)** first —
   `Flexible` would serve the site over an unencrypted hop to Hostinger, and
   `Full (Strict)` requires Hostinger's certificate to be valid, which it is.
4. **Lower TTLs** at Hostinger to 300s a day ahead if you want a fast rollback
   window.
5. **Change nameservers** at Hostinger to the two Cloudflare gave you.
6. **Wait for propagation** and verify: site loads, `www` redirects, mail works,
   `dig` output matches, Search Console still verified.
7. **Only then deploy the Worker** (see below). The site runs normally through
   Cloudflare with no Worker — that is a good state to pause in and confirm
   before adding anything.

`public/cloudflare-setup.md` has the pre-existing notes on SSL, caching and WAF
settings. Two cautions from it worth repeating: **Rocket Loader must stay OFF**
(it breaks the React bundle), and Auto Minify HTML is unnecessary and risks
interfering with the injected tags — leave it off.

## Deploying the Worker, after DNS is confirmed working

1. Uncomment the two `[[routes]]` blocks in `workers/seo-head/wrangler.toml`.
2. Set the production variables:

```bash
npx wrangler deploy --config workers/seo-head/wrangler.toml
```

`SITE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` come from `[vars]` in
that file. **`ORIGIN_BASE` must remain unset in production** — it exists for
testing and staging; with it unset the Worker does a plain `fetch(request)` to
the proxied origin, which is what you want.

**`SUPABASE_SERVICE_ROLE_KEY` must never be bound to this Worker.** It is
read-only for public pages and the publishable key is sufficient, which keeps RLS
as the backstop.

3. Verify against the live site with raw HTTP, not DevTools:

```bash
curl -s https://siddhivinayakoverseas.com/blog/<a-recent-slug> | grep -E "<title>|canonical|og:|ld\+json"
```

4. Check an existing prerendered page is byte-identical to before, and that
   `/blog/does-not-exist` returns 404.

## Rollback

Three levels, fastest first:

1. **Disable the Worker route** in the Cloudflare dashboard. Traffic goes
   straight to Hostinger; the site returns to exactly today's behaviour.
2. **Pause Cloudflare** (Overview → Advanced → Pause Cloudflare on Site). DNS
   still resolves, proxying stops.
3. **Revert the nameservers** at Hostinger. Slowest, since it waits on
   propagation again.

Because the Worker degrades to the unmodified origin response on every failure
path, level 1 is almost never needed — but it is there.

## Caching and purge

The Worker sets `s-maxage=60, stale-while-revalidate=600` on injected pages, and
`no-store` on 404s. **HTML is not cached by Cloudflare by default**, so until a
Cache Rule is added nothing is held at the edge and newly published content is
visible immediately. That is the conservative starting point and I would leave it
there initially.

If you later add a Cache Rule for these paths, purge the single URL on
publish/update/unpublish — purge by URL is available on Free and is Cloudflare's
recommended method:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
  -H "Authorization: Bearer <API_TOKEN>" -H "Content-Type: application/json" \
  --data '{"files":["https://siddhivinayakoverseas.com/blog/<slug>"]}'
```

Never purge everything for a single content change — it discards the cache for
every static asset on the site.

## Plan and limits

Workers **Free** is sufficient: 100,000 requests/day, 50 subrequests/request,
128 MB. The one real constraint is **10 ms CPU per request**. The design keeps
well inside it — only the ~6 KB app shell is rewritten, prerendered pages are
passed through without parsing, and there is exactly one subrequest — but it
should be measured on real traffic after deployment. The Workers Paid plan
($5/month) raises CPU to 30 s and removes the question entirely.
