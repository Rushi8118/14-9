import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { FileCheck2, FolderLock, LogIn, Mail, MessagesSquare } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthField } from "@/components/auth/AuthField"
import { PasswordField } from "@/components/auth/PasswordField"
import { FormAlert } from "@/components/auth/FormAlert"
import { LoadingButton } from "@/components/auth/LoadingButton"
import { AuthDivider } from "@/components/auth/AuthDivider"
import type { AuthVisualContent } from "@/components/auth/AuthVisualPanel"
import {
  focusFirstInvalid,
  isValidEmail,
  normalizeEmail,
  safeRedirectPath,
  useInitialFocus,
} from "@/components/auth/auth-form"
import { OFFLINE_ERROR, toFriendlyAuthError, type FriendlyAuthError } from "@/lib/auth-errors"

type LoginField = "email" | "password" | "terms"
type Status = "idle" | "email" | "google"

const VISUAL: AuthVisualContent = {
  heading: "Pick up right where your journey left off.",
  text: "Track applications, manage documents and stay in touch with your advisor, all in one place.",
  highlights: [
    { icon: FileCheck2, title: "Application tracking", text: "See the latest status of every visa file" },
    { icon: FolderLock, title: "Your documents, organised", text: "Upload and review paperwork securely" },
    { icon: MessagesSquare, title: "Direct advisor access", text: "Questions answered by real consultants" },
  ],
}

function validateLogin(values: { email: string; password: string; agreeTerms: boolean }) {
  const errors: Partial<Record<LoginField, string>> = {}
  const email = values.email.trim()
  if (!email) errors.email = "Enter your email address."
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address, like name@example.com."
  if (!values.password) errors.password = "Enter your password."
  if (!values.agreeTerms) errors.terms = "Please agree to the Terms & Conditions to continue."
  return errors
}

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, profile, isLoading, canAccessAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTarget = safeRedirectPath(searchParams.get("redirect"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState<FriendlyAuthError | null>(null)
  const [signedIn, setSignedIn] = useState(false)

  const submittingRef = useRef(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLButtonElement>(null)
  useInitialFocus(emailRef)

  // Errors appear after the first submit, then update live as the user types.
  const errors = attempted ? validateLogin({ email, password, agreeTerms }) : {}
  const busy = status !== "idle"
  const destination = redirectTarget ?? (canAccessAdmin ? "/admin" : "/")

  // AuthProvider hydrates the profile and roles before signIn resolves, so the
  // destination above is role-aware by the time this runs.
  useEffect(() => {
    if (signedIn && !isLoading) navigate(destination, { replace: true })
  }, [signedIn, isLoading, destination, navigate])

  if (user && !isLoading && profile && !signedIn && !busy) {
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return

    setAttempted(true)
    setFormError(null)
    const validation = validateLogin({ email, password, agreeTerms })
    if (Object.keys(validation).length > 0) {
      focusFirstInvalid(validation, [["email", emailRef], ["password", passwordRef], ["terms", termsRef]])
      return
    }
    if (!navigator.onLine) {
      setFormError(OFFLINE_ERROR)
      return
    }

    submittingRef.current = true
    setStatus("email")
    try {
      const { error } = await signIn(normalizeEmail(email), password)
      if (error) {
        setFormError(toFriendlyAuthError(error.message, "login"))
        return
      }
      toast.success("Welcome back!", { description: "You're signed in." })
      setSignedIn(true)
    } catch {
      setFormError(toFriendlyAuthError(null, "login"))
    } finally {
      submittingRef.current = false
      setStatus("idle")
    }
  }

  const handleGoogle = async () => {
    if (submittingRef.current) return
    setFormError(null)
    if (!agreeTerms) {
      setAttempted(true)
      termsRef.current?.focus()
      return
    }

    submittingRef.current = true
    setStatus("google")
    try {
      // On success the browser leaves for Google, so only errors come back here.
      const { error } = await signInWithGoogle()
      if (error) setFormError(toFriendlyAuthError(error.message, "google"))
    } catch {
      setFormError(toFriendlyAuthError(null, "google"))
    } finally {
      submittingRef.current = false
      setStatus("idle")
    }
  }

  return (
    <>
      <Helmet>
        <title>Login | Siddhivinayak Overseas</title>
        <meta
          name="description"
          content="Access your immigration applications and consultations portal. Secure login for Siddhivinayak Overseas."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <AuthLayout
        variant="login"
        eyebrow="Client portal"
        title="Welcome back"
        description="Sign in to track your visa applications and consultations."
        visual={VISUAL}
        footer={
          <p>
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">
              Create an account
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="space-y-5">
          {formError ? (
            <FormAlert tone="error" title="Sign-in failed">
              {formError.message}
              {formError.code === "credentials" ? (
                <>
                  {" "}
                  <Link to="/forgot-password">Reset your password</Link>
                </>
              ) : null}
            </FormAlert>
          ) : null}

          <AuthField
            ref={emailRef}
            id="login-email"
            label="Email address"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            disabled={busy}
          />

          <PasswordField
            ref={passwordRef}
            id="login-password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            disabled={busy}
            labelAction={
              <Link
                to="/forgot-password"
                className="rounded text-xs font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Forgot password?
              </Link>
            }
          />

          <div className="space-y-1.5">
            <div className="flex items-start gap-2.5">
              <Checkbox
                ref={termsRef}
                id="login-terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                aria-invalid={errors.terms ? true : undefined}
                aria-describedby={errors.terms ? "login-terms-error" : undefined}
                disabled={busy}
                className="mt-0.5 size-[18px]"
              />
              <Label htmlFor="login-terms" className="inline text-sm font-normal leading-snug text-muted-foreground">
                I agree to the{" "}
                <Link to="/terms" className="font-medium text-foreground underline decoration-primary underline-offset-4">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-medium text-foreground underline decoration-primary underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {errors.terms ? (
              <p id="login-terms-error" className="text-xs font-medium text-destructive">
                {errors.terms}
              </p>
            ) : null}
          </div>

          <LoadingButton type="submit" loading={status === "email"} loadingText="Signing in…" icon={LogIn} disabled={busy}>
            Sign in
          </LoadingButton>

          <p className="sr-only" aria-live="polite">
            {status === "email" ? "Signing you in, please wait." : ""}
          </p>
        </form>

        <AuthDivider />

        <GoogleSignInButton onClick={handleGoogle} isLoading={status === "google"} disabled={busy} />
      </AuthLayout>
    </>
  )
}
