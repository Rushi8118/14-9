/**
 * Sends the business an email when a website enquiry is submitted.
 *
 * WHY THIS EXISTS
 *
 * src/components/contact-section.tsx posted to `/api/emails/consultation`, which
 * does not exist: there is no api/ directory, it is not a deployed function, and
 * the site is static Apache hosting with no server routes. The call was wrapped
 * in `.catch(() => {})`, so the 404 was swallowed and no enquiry notification
 * has ever been sent. Leads reached the `consultations` table and nothing else.
 *
 * DIFFERENCES FROM send-welcome-email, WHICH THIS IS MODELLED ON
 *
 * 1. `Deno.connectTls`, not `Deno.connect`. Port 465 is implicit TLS (SMTPS):
 *    the TLS handshake happens before any SMTP command. A plain TCP socket sends
 *    `EHLO` in cleartext to a port that will not answer it, so the existing
 *    function cannot be delivering mail either. That is worth checking
 *    separately.
 * 2. Reply codes are checked. The existing function fires commands and discards
 *    every response, so an authentication failure looks identical to a success.
 * 3. Host, port, user and password come from secrets rather than being hardcoded
 *    to one provider, because this project's mail account has already moved once.
 *
 * SECRETS (set with `supabase secrets set NAME=value` -- never in the repo)
 *
 *   SMTP_HOST      e.g. smtp.zoho.com, smtp.gmail.com, smtp.hostinger.com
 *   SMTP_PORT      465 for implicit TLS (default), 587 for STARTTLS
 *   SMTP_USER      the mailbox that authenticates and appears as From
 *   SMTP_PASSWORD  app password, not the account password, where 2FA is on
 *   ENQUIRY_TO     where notifications are delivered (defaults to SMTP_USER)
 *
 * This function sends mail. It does not write to the database -- the browser
 * already inserted the row before calling this, so a mail failure never costs
 * you the lead.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.zoho.com"
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465")
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "info@siddhivinayakoverseas.com"
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD")
const ENQUIRY_TO = Deno.env.get("ENQUIRY_TO") ?? SMTP_USER

/** Submission identifiers, so B2C and B2B are distinguishable at the destination. */
const ENQUIRY_TYPES = [
  "b2c_enquiry",
  "b2b_enquiry",
  "application_enquiry",
  "contact_enquiry",
] as const
type EnquiryType = (typeof ENQUIRY_TYPES)[number]

const SUBJECT_PREFIX: Record<EnquiryType, string> = {
  b2c_enquiry: "New applicant enquiry",
  b2b_enquiry: "New BUSINESS enquiry",
  application_enquiry: "New application enquiry",
  contact_enquiry: "New contact enquiry",
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })

/** Header-injection guard: a newline in a field would let a submitter add headers. */
const oneLine = (v: unknown, max = 200) =>
  String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max)

const block = (v: unknown, max = 4000) =>
  String(v ?? "").replace(/\r/g, "").trim().slice(0, max)

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  if (!SMTP_PASSWORD) {
    // Deliberately explicit: a silently missing secret is how the previous
    // notification path went unnoticed for so long.
    console.error("SMTP_PASSWORD secret is not set; cannot send enquiry notification")
    return json({ error: "Mail is not configured on the server", code: "smtp_not_configured" }, 503)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const enquiryType = String(payload.enquiry_type ?? "contact_enquiry") as EnquiryType
  if (!ENQUIRY_TYPES.includes(enquiryType)) {
    return json({ error: `enquiry_type must be one of: ${ENQUIRY_TYPES.join(", ")}` }, 400)
  }

  const name = oneLine(payload.name)
  const email = oneLine(payload.email, 254)
  const phone = oneLine(payload.phone, 40)
  const company = oneLine(payload.company)
  const country = oneLine(payload.country, 80)
  const service = oneLine(payload.service)
  const requirement = oneLine(payload.requirement)
  const message = block(payload.message)

  if (!name && !email && !phone) {
    return json({ error: "At least one of name, email or phone is required" }, 400)
  }

  const isB2B = enquiryType === "b2b_enquiry"
  const subject = `${SUBJECT_PREFIX[enquiryType]}${company ? ` from ${company}` : name ? ` from ${name}` : ""}`

  const lines = [
    `Type:        ${enquiryType}`,
    isB2B && company ? `Company:     ${company}` : null,
    name ? `Contact:     ${name}` : null,
    email ? `Email:       ${email}` : null,
    phone ? `Phone:       ${phone}` : null,
    country ? `Country:     ${country}` : null,
    service ? `Service:     ${service}` : null,
    requirement ? `Requirement: ${requirement}` : null,
    "",
    message ? `Message:\n${message}` : "(no message)",
    "",
    "--",
    "Sent by the notify-enquiry function. The enquiry is already saved in the",
    "consultations table; this email is the notification, not the record.",
  ].filter((l) => l !== null)

  const raw = [
    `From: Siddhivinayak Overseas <${SMTP_USER}>`,
    `To: ${ENQUIRY_TO}`,
    email ? `Reply-To: ${email}` : null,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "",
    lines.join("\r\n"),
  ]
    .filter((l) => l !== null)
    .join("\r\n")

  try {
    // Port 465 is implicit TLS, so the socket must be TLS from the first byte.
    // 587 would need STARTTLS instead, which this does not implement -- use 465.
    const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT })
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const buf = new Uint8Array(8192)

    async function read(): Promise<string> {
      const n = await conn.read(buf)
      return decoder.decode(buf.subarray(0, n ?? 0))
    }

    /** Sends a command and fails loudly unless the reply starts with `expect`. */
    async function cmd(line: string, expect: string, label: string): Promise<void> {
      await conn.write(encoder.encode(line + "\r\n"))
      const reply = await read()
      if (!reply.startsWith(expect)) {
        throw new Error(`SMTP ${label} failed: ${reply.slice(0, 120).trim()}`)
      }
    }

    const greeting = await read()
    if (!greeting.startsWith("220")) throw new Error(`SMTP greeting: ${greeting.slice(0, 120).trim()}`)

    await cmd(`EHLO ${SMTP_HOST}`, "250", "EHLO")
    await cmd("AUTH LOGIN", "334", "AUTH")
    await cmd(btoa(SMTP_USER), "334", "username")
    await cmd(btoa(SMTP_PASSWORD), "235", "password")
    await cmd(`MAIL FROM:<${SMTP_USER}>`, "250", "MAIL FROM")
    await cmd(`RCPT TO:<${ENQUIRY_TO}>`, "250", "RCPT TO")
    await cmd("DATA", "354", "DATA")
    await cmd(`${raw}\r\n.`, "250", "message body")

    try {
      await conn.write(encoder.encode("QUIT\r\n"))
    } catch {
      // Some servers close on QUIT before the write lands. The mail is accepted.
    }
    conn.close()

    console.log(`enquiry notification sent: ${enquiryType}`)
    return json({ success: true, enquiry_type: enquiryType })
  } catch (error) {
    // The row is already saved, so this is a notification failure, not data loss.
    console.error("enquiry notification failed:", error instanceof Error ? error.message : error)
    return json(
      {
        error: "Could not send the notification email",
        code: "smtp_send_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      502,
    )
  }
})
