import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? Deno.env.get("ZOHO_SMTP_HOST") ?? ""
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? Deno.env.get("ZOHO_SMTP_PORT") ?? "465")
const SMTP_USER = Deno.env.get("SMTP_USER") ?? Deno.env.get("ZOHO_EMAIL") ?? "info@siddhivinayakoverseas.com"
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? Deno.env.get("ZOHO_APP_PASSWORD")

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { email, fullName } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!SMTP_PASSWORD || !SMTP_HOST) {
      console.error("SMTP_PASSWORD or SMTP_HOST secret not set")
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const displayName = fullName || "there"

    const boundary = `----=_Part_${Date.now()}`
    const rawEmail = [
      `From: Siddhivinayak Overseas <${SMTP_USER}>`,
      `To: ${email}`,
      `Subject: Welcome to Siddhivinayak Overseas!`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      "",
      `Hi ${displayName},`,
      "",
      `Welcome to Siddhivinayak Overseas!`,
      "",
      `We're excited to help you with your visa journey.`,
      `Log in to your dashboard to track your applications and consultations.`,
      "",
      `Dashboard: https://siddhivinayakoverseas.com/dashboard`,
      "",
      `Best regards,`,
      `Siddhivinayak Overseas Team`,
      `https://siddhivinayakoverseas.com`,
      `Phone: +91 98765 43210`,
      "",
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      "",
      `<!DOCTYPE html>`,
      `<html>`,
      `<head><meta charset="UTF-8"></head>`,
      `<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">`,
      `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">`,
      `<tr><td align="center">`,
      `<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">`,
      `<tr><td style="background:#1a1a2e;padding:32px 40px;text-align:center;">`,
      `<h1 style="color:#d4a843;margin:0;font-size:24px;font-weight:700;">Siddhivinayak Overseas</h1>`,
      `<p style="color:#cccccc;margin:6px 0 0;font-size:13px;">Your Trusted Visa Partner</p>`,
      `</td></tr>`,
      `<tr><td style="padding:40px;">`,
      `<h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px;">Welcome aboard, ${displayName}!</h2>`,
      `<p style="color:#555;line-height:1.7;margin:0 0 20px;font-size:15px;">`,
      `Thank you for joining <strong>Siddhivinayak Overseas</strong>. We're thrilled to guide you through your visa journey — whether it's a work visa, study visa, or immigration consultation.`,
      `</p>`,
      `<p style="color:#555;line-height:1.7;margin:0 0 28px;font-size:15px;">`,
      `You can now log in to your personal dashboard to track applications, book consultations, and manage your profile.`,
      `</p>`,
      `<table cellpadding="0" cellspacing="0" style="margin:0 auto;">`,
      `<tr><td>`,
      `<a href="https://siddhivinayakoverseas.com/dashboard" style="display:inline-block;background:#d4a843;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">Go to Dashboard</a>`,
      `</td></tr>`,
      `</table>`,
      `<hr style="border:none;border-top:1px solid #eee;margin:32px 0;">`,
      `<p style="color:#999;font-size:13px;margin:0;line-height:1.6;">`,
      `Need help? Contact us at <a href="mailto:${SMTP_USER}" style="color:#d4a843;">${SMTP_USER}</a> or call +91 98765 43210.`,
      `</p>`,
      `</td></tr>`,
      `<tr><td style="background:#f9f9f9;padding:20px 40px;text-align:center;">`,
      `<p style="color:#aaa;font-size:11px;margin:0;">`,
      `&copy; ${new Date().getFullYear()} Siddhivinayak Overseas. All rights reserved.`,
      `</p>`,
      `</td></tr>`,
      `</table>`,
      `</td></tr>`,
      `</table>`,
      `</body>`,
      `</html>`,
      `--${boundary}--`,
    ].join("\r\n")

    // Connect to SMTP via TLS on port 465
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      transport: "tcp",
    })

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

    // SMTP handshake
    await readResponse() // greeting
    await send(`EHLO ${SMTP_HOST}`)
    await send("AUTH LOGIN")
    await send(btoa(SMTP_USER))
    await send(btoa(SMTP_PASSWORD))
    await send(`MAIL FROM:<${SMTP_USER}>`)
    await send(`RCPT TO:<${email}>`)
    await send("DATA")
    await send(rawEmail + "\r\n.")
    await send("QUIT")

    conn.close()

    console.log(`Welcome email sent to ${email}`)

    return new Response(JSON.stringify({ success: true, email }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Email send error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
