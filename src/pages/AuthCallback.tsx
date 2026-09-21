import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

type Status = "processing" | "success" | "verified" | "error"

const GENERIC_ERROR = "We couldn't complete sign-in. Please try again."

/** Maps provider/Supabase error codes to plain messages; raw auth errors are never shown. */
function friendlyAuthError(code: string | null, description: string | null): string {
  const text = `${code ?? ""} ${description ?? ""}`.toLowerCase()
  if (/expired|invalid|otp/.test(text)) return "This link is invalid or has expired. Please request a new one."
  if (/access_denied|cancel/.test(text)) return "Sign-in was cancelled."
  return GENERIC_ERROR
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>("processing")
  const [message, setMessage] = useState("")
  const settled = useRef(false)

  useEffect(() => {
    let mounted = true
    settled.current = false
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const finish = (next: Status, text: string, to: string, delay: number, notify?: () => void) => {
      if (!mounted || settled.current) return
      settled.current = true
      setStatus(next)
      setMessage(text)
      notify?.()
      later(() => navigate(to, { replace: true }), delay)
    }

    const params = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const errorCode = params.get("error") || hash.get("error")
    const errorDescription = params.get("error_description") || hash.get("error_description")
    const hadCode = params.has("code")

    const run = async () => {
      if (errorCode) {
        const text = friendlyAuthError(errorCode, errorDescription)
        finish("error", text, "/login", 2500, () => toast.error(text, { id: "auth-callback" }))
        return
      }

      // The Supabase client already exchanges ?code= on page load (detectSessionInUrl).
      // getSession waits for that exchange; exchanging the code again here would fail
      // with "PKCE code verifier not found" even though sign-in succeeded.
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        finish("success", "Redirecting to home page...", "/", 600, () => toast.success("You're signed in.", { id: "auth-callback" }))
        return
      }

      if (hadCode) {
        // Link opened in another browser or inside the email app: the account is verified,
        // but a session can only be created in the browser where sign-up started.
        finish("verified", "Your account is verified. Please sign in to continue.", "/login", 2500)
        return
      }

      finish("error", GENERIC_ERROR, "/login", 2500)
    }

    run().catch((err: unknown) => {
      logger.error("Auth callback failed:", err)
      finish("error", GENERIC_ERROR, "/login", 2500)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        finish("success", "Redirecting to home page...", "/", 600)
      }
    })

    later(() => finish("error", "Sign-in is taking too long. Please try again.", "/login", 2000), 15000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [navigate])

  return (
    <>
      <Helmet>
        <title>Authenticating | Siddhivinayak Overseas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center max-w-sm">
          {status === "processing" && (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Completing sign-in</h2>
              <p className="text-sm text-muted-foreground">Please wait a moment...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">You're signed in</h2>
              <p className="text-sm text-emerald-600 font-medium">{message}</p>
            </>
          )}
          {status === "verified" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Account verified</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Taking you to the login page...</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Sign-in not completed</h2>
              <p className="text-sm text-destructive">{message}</p>
              <p className="text-xs text-muted-foreground">Taking you to the login page...</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
