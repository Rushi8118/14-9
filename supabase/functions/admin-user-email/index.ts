// Admin-triggered account emails (email verification / password reset).
//
// The client SDK's `supabase.auth.resend({ type: 'signup' })` only works for
// the currently-authenticated user's own pending signup — it cannot be used
// by an admin to (re)send a verification email to an arbitrary user, and for
// most already-created/confirmed users it silently no-ops.
//
// This function uses the service-role key to generate the correct auth link
// via `supabase.auth.admin.generateLink(...)` and delivers it using the same
// Zoho SMTP mechanism already used by `send-welcome-email`.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://siddhivinayakoverseas.com"

const ZOHO_SMTP_HOST = "smtp.zoho.com"
const ZOHO_SMTP_PORT = 465
const ZOHO_EMAIL = "info@siddhivinayakoverseas.com"
const ZOHO_APP_PASSWORD = Deno.env.get("ZOHO_APP_PASSWORD")

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  if (!ZOHO_APP_PASSWORD) {
    throw new Error("Email is not configured on the server (ZOHO_APP_PASSWORD missing)")
  }

  const boundary = `----=_Part_${Date.now()}`
  const rawEmail = [
    `From: Siddhivinayak Overseas <${ZOHO_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    "",
    text,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    "",
    html,
    `--${boundary}--`,
  ].join("\r\n")

  const conn = await Deno.connect({ hostname: ZOHO_SMTP_HOST, port: ZOHO_SMTP_PORT, transport: "tcp" })
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const buf = new Uint8Array(4096)

  async function readResponse(): Promise<string> {
    const n = await conn.read(buf)
    return decoder.decode(buf.subarray(0, n || 0))
  }
  async function send(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"))
    return await readResponse()
  }

  try {
    const greeting = await readResponse()
    if (!greeting.startsWith("220")) throw new Error(`SMTP greeting failed: ${greeting}`)
    await send(`EHLO ${ZOHO_SMTP_HOST}`)
    await send("AUTH LOGIN")
    await send(btoa(ZOHO_EMAIL))
    const authResp = await send(btoa(ZOHO_APP_PASSWORD))
    if (!authResp.startsWith("235")) throw new Error(`SMTP auth failed: ${authResp}`)
    await send(`MAIL FROM:<${ZOHO_EMAIL}>`)
    const rcpt = await send(`RCPT TO:<${to}>`)
    if (!rcpt.startsWith("250")) throw new Error(`SMTP recipient rejected: ${rcpt}`)
    await send("DATA")
    const dataResp = await send(rawEmail + "\r\n.")
    if (!dataResp.startsWith("250")) throw new Error(`SMTP message rejected: ${dataResp}`)
    await send("QUIT")
  } finally {
    conn.close()
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const { email, type } = await req.json()
    if (!email || !type || !["verify", "reset"].includes(type)) {
      return new Response(JSON.stringify({ error: "email and type ('verify' | 'reset') are required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    // Verify the caller is authenticated and has an admin-capable role before
    // using the service role key on their behalf.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: callerProfile } = await admin
      .from("user_profiles")
      .select("user_role")
      .eq("id", callerData.user.id)
      .maybeSingle()
    const allowedRoles = ["admin", "super_admin", "staff"]
    if (!callerProfile || !allowedRoles.includes(callerProfile.user_role)) {
      return new Response(JSON.stringify({ error: "You do not have permission to send account emails" }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const linkType = type === "verify" ? "signup" : "recovery"
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: linkType,
      email,
      options: { redirectTo: `${SITE_URL}/auth/reset-password` },
    })

    if (linkError) {
      // A user who is already confirmed can't get a fresh "signup" link from
      // generateLink — fall back to an invite-style magic link so the admin
      // action still does something useful instead of failing silently.
      if (type === "verify" && /already.*confirm|already registered/i.test(linkError.message)) {
        return new Response(
          JSON.stringify({ error: "This user's email is already verified." }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        )
      }
      throw linkError
    }

    const actionLink = linkData?.properties?.action_link
    if (!actionLink) throw new Error("Failed to generate auth link")

    const subject = type === "verify" ? "Verify your email" : "Reset your password"
    const heading = type === "verify" ? "Confirm your email address" : "Reset your password"
    const body = type === "verify"
      ? "An administrator has requested that you verify your email address. Click the button below to confirm your account."
      : "An administrator has requested a password reset for your account. Click the button below to choose a new password."

    const text = `${heading}\n\n${body}\n\n${actionLink}\n\nIf you did not expect this, you can ignore this email.`
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#1a1a2e;padding:32px 40px;text-align:center;"><h1 style="color:#d4a843;margin:0;font-size:22px;">Siddhivinayak Overseas</h1></td></tr>
      <tr><td style="padding:40px;"><h2 style="color:#1a1a2e;margin:0 0 16px;">${heading}</h2>
      <p style="color:#555;line-height:1.7;margin:0 0 28px;font-size:15px;">${body}</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td>
      <a href="${actionLink}" style="display:inline-block;background:#d4a843;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">${type === "verify" ? "Verify email" : "Reset password"}</a>
      </td></tr></table>
      <p style="color:#999;font-size:12px;margin:28px 0 0;">If you did not expect this, you can safely ignore this email.</p>
      </td></tr></table></td></tr></table></body></html>`

    await sendEmail(email, subject, text, html)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("admin-user-email error:", error)
    const message = error instanceof Error ? error.message : "Failed to send email"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }
})
