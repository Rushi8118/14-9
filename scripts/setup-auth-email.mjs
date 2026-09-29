/**
 * Applies the whole auth-email setup to Supabase in one command: custom SMTP,
 * the Site URL and redirect allowlist, and the HTML templates in
 * supabase/email-templates/. Everything that the dashboard's Authentication
 * screens configure, done over the Management API instead.
 *
 *   npm run auth:setup -- --check     show what the project has now
 *   npm run auth:setup -- --dry-run   show what would change
 *   npm run auth:setup                apply it
 *
 * Credentials come from scripts/.env.auth.local (git-ignored) or the real
 * environment — never from this file, and never from a committed .env.
 * See supabase/email-templates/README.md.
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.supabase.com/v1'

const args = new Set(process.argv.slice(2))
const CHECK = args.has('--check')
const DRY_RUN = args.has('--dry-run')

/* ------------------------------------------------------------------ config */

// A local env file keeps the SMTP password off the command line, where it would
// land in shell history. Loaded before process.env so real env vars win in CI.
async function loadEnvFile() {
  for (const name of ['.env.auth.local', '../.env.auth.local']) {
    const file = path.join(root, 'scripts', name)
    if (!existsSync(file)) continue
    const text = await readFile(file, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
      if (!(match[1] in process.env)) process.env[match[1]] = value
    }
    return file
  }
  return null
}

const envFile = await loadEnvFile()

const env = (name, fallback) => (process.env[name] ?? fallback ?? '').trim()

const ACCESS_TOKEN = env('SUPABASE_ACCESS_TOKEN')
const PROJECT_REF = env('SUPABASE_PROJECT_REF') || (await readLinkedRef())
const SITE_URL = (env('SITE_URL') || 'https://siddhivinayakoverseas.com').replace(/\/$/, '')

async function readLinkedRef() {
  try {
    const file = path.join(root, 'supabase', '.temp', 'linked-project.json')
    return JSON.parse(await readFile(file, 'utf8')).ref ?? ''
  } catch {
    return ''
  }
}

/** Every path a Supabase auth redirect is allowed to land on. */
const REDIRECT_URLS = [
  `${SITE_URL}/auth/reset-password`,
  `${SITE_URL}/reset-password`,
  `${SITE_URL}/auth/callback`,
  `${SITE_URL}/login`,
  // Local development. Supabase matches these as globs.
  'http://localhost:5001/**',
  'http://localhost:5173/**',
]

const TEMPLATES = [
  {
    file: 'reset-password.html',
    subjectKey: 'mailer_subjects_recovery',
    contentKey: 'mailer_templates_recovery_content',
    subject: 'Reset your Siddhivinayak Overseas password',
    // The template links to /auth/reset-password?token_hash=… itself, so it must
    // not be rewritten to the ConfirmationURL form.
    requires: ['{{ .TokenHash }}', '{{ .SiteURL }}'],
  },
  {
    file: 'confirm-signup.html',
    subjectKey: 'mailer_subjects_confirmation',
    contentKey: 'mailer_templates_confirmation_content',
    subject: 'Confirm your email address',
    requires: ['{{ .ConfirmationURL }}'],
  },
]

/* -------------------------------------------------------------- validation */

/**
 * Ends the run with a message and no stack trace. Thrown rather than
 * process.exit()'d: exiting while a fetch socket is still closing trips a
 * libuv assertion on Windows and buries the message under it.
 */
class Bail extends Error {}

function fail(message) {
  throw new Bail(message)
}

const reportAndExit = (error) => {
  console.error(`\n  ${error instanceof Bail ? error.message : error}\n`)
  process.exitCode = 1
}
process.on('uncaughtException', reportAndExit)
process.on('unhandledRejection', reportAndExit)

if (!ACCESS_TOKEN) {
  fail(
    'SUPABASE_ACCESS_TOKEN is not set.\n' +
      '  Create one at https://supabase.com/dashboard/account/tokens (starts with "sbp_")\n' +
      '  and put it in scripts/.env.auth.local — see scripts/.env.auth.example.',
  )
}
if (!PROJECT_REF) fail('SUPABASE_PROJECT_REF is not set and supabase/.temp/linked-project.json has no ref.')

/* --------------------------------------------------------------- API calls */

async function api(method, pathname, body) {
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  if (!response.ok) {
    const hint =
      response.status === 401
        ? ' — the access token is wrong or expired'
        : response.status === 403
          ? ' — this token cannot manage that project'
          : response.status === 404
            ? ` — no project with ref "${PROJECT_REF}"`
            : ''
    fail(`Supabase API ${method} ${pathname} failed: HTTP ${response.status}${hint}\n  ${text.slice(0, 400)}`)
  }
  return text ? JSON.parse(text) : {}
}

const mask = (value) => (value ? `${String(value).slice(0, 3)}…${String(value).slice(-2)}` : '(not set)')

/* ------------------------------------------------------------------- check */

async function main() {
  const current = await api('GET', `/projects/${PROJECT_REF}/config/auth`)

  if (CHECK) {
    const smtpOn = Boolean(current.smtp_host)
    console.log(`\n  Project ${PROJECT_REF}\n`)
    console.log(`  Custom SMTP     ${smtpOn ? 'enabled' : 'NOT enabled — Supabase\'s shared sender is rate limited'}`)
    if (smtpOn) {
      console.log(`    host          ${current.smtp_host}:${current.smtp_port}`)
      console.log(`    username      ${current.smtp_user ?? '(not set)'}`)
      console.log(`    sender        ${current.smtp_sender_name} <${current.smtp_admin_email}>`)
      console.log(`    min interval  ${current.smtp_max_frequency ?? 0}s`)
    }
    console.log(`\n  Site URL        ${current.site_url || '(not set)'}`)
    console.log('  Redirect URLs')
    for (const url of String(current.uri_allow_list || '').split(',').filter(Boolean)) {
      console.log(`    ${url}`)
    }
    const recovery = current.mailer_templates_recovery_content || ''
    console.log('\n  Reset-password template')
    console.log(`    subject       ${current.mailer_subjects_recovery || '(default)'}`)
    console.log(
      `    body          ${
        !recovery
          ? 'Supabase default'
          : recovery.includes('{{ .TokenHash }}')
            ? 'custom, token_hash link (correct)'
            : 'custom, but still uses ConfirmationURL — can fall back to the home page'
      }`,
    )
    console.log(`    OTP expiry    ${current.mailer_otp_exp ?? '(default)'}s\n`)
    return
  }

  /* ------------------------------------------------------------------- apply */

  const payload = {
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS.join(','),
    // One hour. Long enough for someone to find the mail, short enough that a
    // leaked link is not useful for long.
    mailer_otp_exp: 3600,
    mailer_autoconfirm: false,
  }

  // SMTP is optional on a --dry-run so the rest can be checked without secrets,
  // but a real run without it would silently leave the shared sender in place.
  const SMTP_HOST = env('SMTP_HOST')
  const SMTP_USER = env('SMTP_USER')
  const SMTP_PASS = env('SMTP_PASS')
  const SMTP_SENDER_EMAIL = env('SMTP_SENDER_EMAIL') || SMTP_USER
  const SMTP_SENDER_NAME = env('SMTP_SENDER_NAME', 'Siddhivinayak Overseas')
  const SMTP_PORT = Number(env('SMTP_PORT', '587'))

  if (SMTP_HOST || SMTP_USER || SMTP_PASS) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      fail('SMTP_HOST, SMTP_USER and SMTP_PASS must all be set together (or all left unset).')
    }
    Object.assign(payload, {
      smtp_host: SMTP_HOST,
      smtp_port: SMTP_PORT,
      smtp_user: SMTP_USER,
      smtp_pass: SMTP_PASS,
      smtp_admin_email: SMTP_SENDER_EMAIL,
      smtp_sender_name: SMTP_SENDER_NAME,
      // Supabase rejects a second mail to the same address inside this window.
      // 60s stops a double-clicked button from burning the first token.
      smtp_max_frequency: 60,
    })
  } else if (!current.smtp_host) {
    console.warn(
      '\n  No SMTP_* variables set and the project has no custom SMTP.\n' +
        "  Auth mail will keep using Supabase's shared sender, which is rate\n" +
        '  limited to a few messages per hour and is not meant for production.\n',
    )
  }

  for (const template of TEMPLATES) {
    const file = path.join(root, 'supabase', 'email-templates', template.file)
    const html = await readFile(file, 'utf8')
    for (const token of template.requires) {
      if (!html.includes(token)) {
        fail(`${template.file} is missing ${token} — the link in it would not work.`)
      }
    }
    payload[template.contentKey] = html
    payload[template.subjectKey] = template.subject
  }

  if (DRY_RUN) {
    console.log(`\n  Would PATCH /projects/${PROJECT_REF}/config/auth with:\n`)
    for (const [key, value] of Object.entries(payload)) {
      const shown =
        key === 'smtp_pass'
          ? mask(value)
          : typeof value === 'string' && value.length > 70
            ? `${value.length} chars of HTML`
            : value
      console.log(`    ${key.padEnd(34)} ${shown}`)
    }
    console.log('\n  Nothing was sent. Re-run without --dry-run to apply.\n')
    return
  }

  await api('PATCH', `/projects/${PROJECT_REF}/config/auth`, payload)

  console.log(`\n  Applied to project ${PROJECT_REF}:\n`)
  if (payload.smtp_host) {
    console.log(`    SMTP            ${payload.smtp_host}:${payload.smtp_port} as ${payload.smtp_user}`)
    console.log(`    Sender          ${SMTP_SENDER_NAME} <${SMTP_SENDER_EMAIL}>`)
  }
  console.log(`    Site URL        ${SITE_URL}`)
  console.log(`    Redirect URLs   ${REDIRECT_URLS.length} entries`)
  console.log(`    Templates       ${TEMPLATES.map((t) => t.file).join(', ')}`)
  console.log(`    Link expiry     ${payload.mailer_otp_exp}s`)
  if (envFile) console.log(`\n  Credentials read from ${path.relative(root, envFile)}`)
  console.log('\n  Next: request a reset at /forgot-password and open the link from the mail.\n')
}

await main()
