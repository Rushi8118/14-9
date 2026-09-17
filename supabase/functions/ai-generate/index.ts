// Server-side AI content generation proxy for the admin Blog Writer and
// Urgent Requirement "1-Click Synthesis" tools.
//
// Why this exists: the client used to call Gemini/OpenRouter directly from
// the browser with the API key inlined in the request (Gemini) or an
// Authorization header (OpenRouter) built from a key read straight out of
// the `admin_ai_settings` table. That put the real provider key on the
// wire from every admin's browser. This function keeps the key server-side:
// the browser sends only the prompt + which provider/model to use, and this
// function loads the actual secret from the database with the service-role
// key before calling the provider.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

const ALLOWED_FEATURES = new Set(["blog", "urgent_requirement", "country_eligibility", "keyword_trends"])

/**
 * Popular search phrases for a seed keyword, from Google's public autocomplete
 * endpoint (what people are actually typing). No search volumes are available
 * from this source, so none are claimed. Expands with a-z / question prefixes.
 */
async function fetchKeywordTrends(seed: string, country: string): Promise<string[]> {
  const base = seed.trim().toLowerCase().slice(0, 80)
  if (!base) return []
  const variants = [base, `${base} for`, `${base} how`, `how to ${base}`, `best ${base}`, `${base} 2026`, `${base} cost`, `${base} requirements`]
  const gl = /^[a-z]{2}$/i.test(country) ? country.toLowerCase() : "in"
  const results = await Promise.allSettled(variants.map(async (q) => {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=${gl}&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
    if (!res.ok) return [] as string[]
    const data = await res.json().catch(() => null)
    return Array.isArray(data?.[1]) ? (data[1] as unknown[]).filter((x): x is string => typeof x === "string") : []
  }))
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of results) {
    if (r.status !== "fulfilled") continue
    for (const k of r.value) {
      const key = k.trim().toLowerCase()
      if (key && key !== base && !seen.has(key)) { seen.add(key); out.push(key) }
    }
  }
  return out.slice(0, 40)
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

function isHighDemandError(message: string): boolean {
  return /high demand|temporarily unavailable|try again later|resource.?exhausted|429|rate.?limit|overloaded|unavailable|503/i.test(
    message,
  )
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function callGemini(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n")
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }),
    },
    90_000,
  )
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed (${response.status})`)
  }
  const text = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("")
  if (!text?.trim()) throw new Error("Gemini returned an empty response.")
  return text.trim()
}

async function callOpenRouter(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://siddhivinayakoverseas.com",
        "X-Title": "Siddhivinayak Overseas AI Content System",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    },
    90_000,
  )
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `OpenRouter request failed (${response.status})`)
  }
  const text = payload?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new Error("OpenRouter returned an empty response.")
  return String(text).trim()
}

async function generateWithRetry(
  provider: "gemini" | "openrouter",
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const call = provider === "gemini" ? callGemini : callOpenRouter
  try {
    return await call(apiKey, model, messages)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // One retry for transient/high-demand failures only — never for auth or
    // bad-request errors, which would just fail identically again.
    if (isHighDemandError(message)) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return await call(apiKey, model, messages)
    }
    throw error
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401)

    const body = await req.json().catch(() => null)
    const feature = body?.feature
    const messages = body?.messages as ChatMessage[] | undefined
    const requestedProvider = body?.provider as "gemini" | "openrouter" | undefined

    if (!feature || !ALLOWED_FEATURES.has(feature)) {
      return json({ error: "Unsupported AI feature" }, 400)
    }
    if (feature !== "keyword_trends" && (!Array.isArray(messages) || messages.length === 0)) {
      return json({ error: "messages are required" }, 400)
    }

    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData?.user) return json({ error: "Unauthorized" }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Authorization: mirrors the RBAC boundary already used by the client
    // (blogs.create for the blog writer; admin/super_admin/manager for
    // urgent requirements, matching canAccessAdmin() in src/lib/rbac).
    const { data: profile } = await admin
      .from("user_profiles")
      .select("user_role")
      .eq("id", callerData.user.id)
      .maybeSingle()
    const role = profile?.user_role
    const isAdminTier = role && ["super_admin", "superadmin", "admin"].includes(role)
    let authorized = isAdminTier
    if (!authorized && feature === "blog") {
      const { data: canBlog } = await callerClient.rpc("user_has_permission", {
        required_permissions: ["blogs.create", "blogs.update"],
      })
      authorized = Boolean(canBlog)
    }
    if (!authorized && feature === "urgent_requirement") {
      authorized = role === "manager"
    }
    if (!authorized && feature === "country_eligibility") {
      const { data: canEditCountries } = await callerClient.rpc("user_has_permission", {
        required_permissions: ["countries.update", "countries.edit"],
      })
      authorized = Boolean(canEditCountries)
    }
    if (!authorized && feature === "keyword_trends") {
      const { data: canBlog } = await callerClient.rpc("user_has_permission", {
        required_permissions: ["blogs.create", "blogs.update"],
      })
      authorized = role === "manager" || Boolean(canBlog)
    }
    if (!authorized) {
      return json({ error: "You do not have permission to generate AI content" }, 403)
    }
    if (feature === "keyword_trends") {
      const seed = typeof body?.seed === "string" ? body.seed : ""
      if (!seed.trim()) return json({ error: "Enter a keyword first" }, 400)
      const keywords = await fetchKeywordTrends(seed, typeof body?.country === "string" ? body.country : "in")
      return json({ keywords })
    }

    const { data: settingsRow } = await admin
      .from("admin_ai_settings")
      .select("*")
      .eq("singleton_key", "default")
      .maybeSingle()

    const provider = requestedProvider || settingsRow?.active_provider || "gemini"
    const apiKey = provider === "gemini"
      ? (settingsRow?.gemini_api_key || Deno.env.get("GEMINI_API_KEY") || "")
      : (settingsRow?.openrouter_api_key || Deno.env.get("OPENROUTER_API_KEY") || "")
    const model = provider === "gemini"
      ? (settingsRow?.gemini_model || "gemini-2.0-flash")
      : (settingsRow?.openrouter_model || "google/gemini-2.0-flash-001")

    if (!apiKey.trim()) {
      return json({ error: `No ${provider === "gemini" ? "Gemini" : "OpenRouter"} API key configured on the server. Add one under Admin → Settings.` }, 422)
    }

    try {
      const text = await generateWithRetry(provider, apiKey.trim(), model, messages)
      return json({ text, provider, model })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      // Auto-fallback to OpenRouter when Gemini is overloaded and a key exists.
      if (provider === "gemini" && isHighDemandError(message) && settingsRow?.openrouter_api_key) {
        try {
          const fallbackModel = settingsRow.openrouter_model || "google/gemini-2.0-flash-001"
          const text = await generateWithRetry("openrouter", settingsRow.openrouter_api_key, fallbackModel, messages)
          return json({ text, provider: "openrouter", model: fallbackModel, fellBack: true })
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          return json({ error: `Gemini is busy (high demand). OpenRouter fallback also failed: ${fallbackMessage}` }, 502)
        }
      }

      if (isHighDemandError(message)) {
        return json({ error: "This AI model is currently overloaded. Wait a minute, switch provider/model in Settings, then try again." }, 503)
      }
      return json({ error: message }, 502)
    }
  } catch (error) {
    console.error("ai-generate error:", error)
    const message = error instanceof Error ? error.message : "AI generation failed"
    return json({ error: message }, 500)
  }
})
