// Admin-initiated email change that takes effect immediately.
// Users changing their own email go through Supabase's confirmation links;
// this lets an admin (or super admin fixing their own account) switch the
// login email at once, marked as confirmed, and keeps user_profiles in sync.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

    const body = await req.json().catch(() => null)
    const userId = typeof body?.userId === "string" ? body.userId : ""
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!userId || !EMAIL_PATTERN.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address." }, 400)
    }

    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData?.user) return json({ error: "Unauthorized" }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: callerProfile } = await admin
      .from("user_profiles").select("user_role").eq("id", callerData.user.id).maybeSingle()
    const callerRole = callerProfile?.user_role ?? ""
    const isSuper = ["super_admin", "superadmin"].includes(callerRole)
    if (!isSuper && callerRole !== "admin") {
      return json({ error: "You do not have permission to change account emails." }, 403)
    }

    const { data: target } = await admin
      .from("user_profiles").select("user_role").eq("id", userId).maybeSingle()
    // Only super admins may change the login of another admin-level account.
    if (!isSuper && userId !== callerData.user.id && ["super_admin", "superadmin", "admin"].includes(target?.user_role ?? "")) {
      return json({ error: "Only a super admin can change another administrator's email." }, 403)
    }

    const { data: existing } = await admin
      .from("user_profiles").select("id").ilike("email", email).neq("id", userId).limit(1)
    if (existing && existing.length > 0) return json({ error: "Another account already uses this email." }, 409)

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true })
    if (updateError) {
      console.error("admin-change-email auth update failed:", updateError.message)
      const taken = /already|registered|exists/i.test(updateError.message)
      return json({ error: taken ? "Another account already uses this email." : "Could not change the email. Please try again." }, taken ? 409 : 500)
    }

    await admin.from("user_profiles").update({ email, updated_at: new Date().toISOString() }).eq("id", userId)
    await admin.from("audit_logs").insert({
      user_id: callerData.user.id, action: "user.email_changed", resource: "user_profiles", resource_id: userId,
      new_value: { email }, severity: "warning",
    }).then(() => undefined, () => undefined)

    return json({ success: true, email })
  } catch (error) {
    console.error("admin-change-email error:", error)
    return json({ error: "Could not change the email. Please try again." }, 500)
  }
})
