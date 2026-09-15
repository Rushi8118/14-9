import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Compass, GraduationCap, LineChart, Mail, MailCheck, User, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthField } from "@/components/auth/AuthField"
import { PasswordField } from "@/components/auth/PasswordField"
import { FormAlert } from "@/components/auth/FormAlert"
import { LoadingButton } from "@/components/auth/LoadingButton"
import { AuthDivider } from "@/components/auth/AuthDivider"
import { AuthPasswordStrength } from "@/components/auth/AuthPasswordStrength"
import type { AuthVisualContent } from "@/components/auth/AuthVisualPanel"
import {
  focusFirstInvalid,
  isValidEmail,
  normalizeEmail,
  normalizeName,
  useInitialFocus,
} from "@/components/auth/auth-form"
import { getPasswordStrength } from "@/lib/validations/auth"
import { OFFLINE_ERROR, toFriendlyAuthError, type FriendlyAuthError } from "@/lib/auth-errors"

type RegisterField = "fullName" | "email" | "password" | "confirmPassword" | "terms"
type Status = "idle" | "email" | "google"

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u

const VISUAL: AuthVisualContent = {
  heading: "Your move abroad starts with one account.",
  text: "Apply for study or work visas and follow every step of your application with our team.",
  highlights: [
    { icon: GraduationCap, title: "Study & work visas", text: "Canada, the UK, Australia, Germany and more" },
    { icon: Compass, title: "Guided every step", text: "Clear checklists from profile to decision" },
    { icon: LineChart, title: "Real-time progress", text: "Know exactly where your application stands" },
  ],
}

type RegisterValues = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

function validateRegister(values: RegisterValues) {
  const errors: Partial<Record<RegisterField, string>> = {}
  const name = normalizeName(values.fullName)
  if (!name) errors.fullName = "Enter your full name."
  else if (name.length < 2) errors.fullName = "Your name must be at least 2 characters."
  else if (name.length > 100) errors.fullName = "Your name must be 100 characters or fewer."
  else if (!NAME_PATTERN.test(name)) errors.fullName = "Use letters, spaces, apostrophes, periods or hyphens only."

  const email = values.email.trim()
  if (!email) errors.email = "Enter your email address."
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address, like name@example.com."

  if (!values.password) errors.password = "Create a password."
  else if (values.password.length > 72) errors.password = "Password must be 72 characters or fewer."
  else {
    const strength = getPasswordStrength(values.password)
    if (strength.score < strength.maxScore) errors.password = "Your password must meet every requirement below."
  }

  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password."
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords don't match."

  if (!values.agreeTerms) errors.terms = "Please accept the Terms & Conditions to create an account."
  return errors
}

export default function RegisterPage() {
  const { signUp, signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState<FriendlyAuthError | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)

  const submittingRef = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const termsRef = useRef<HTMLButtonElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  useInitialFocus(nameRef)

  useEffect(() => {
    if (verificationEmail) successHeadingRef.current?.focus()
  }, [verificationEmail])

  const values = { fullName, email, password, confirmPassword, agreeTerms }
  const errors = attempted ? validateRegister(values) : {}
  // Confirmation feedback is shown as soon as the user has typed in both fields.
  const confirmError =
    errors.confirmPassword ??
    (confirmPassword && password && confirmPassword.length >= password.length && confirmPassword !== password
      ? "Passwords don't match."
      : undefined)
  const emailError = errors.email ?? (formError?.code === "duplicate" ? formError.message : undefined)
  const busy = status !== "idle"

  if (user && !busy) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) return

    setAttempted(true)
    setFormError(null)
    const validation = validateRegister(values)
    if (Object.keys(validation).length > 0) {
      focusFirstInvalid(validation, [
        ["fullName", nameRef],
        ["email", emailRef],
        ["password", passwordRef],
        ["confirmPassword", confirmRef],
        ["terms", termsRef],
      ])
      return
    }
    if (!navigator.onLine) {
      setFormError(OFFLINE_ERROR)
      return
    }

    submittingRef.current = true
    setStatus("email")
    const cleanEmail = normalizeEmail(email)
    try {
      const { data, error } = await signUp(cleanEmail, password, normalizeName(fullName))
      if (error) {
        const friendly = toFriendlyAuthError(error.message, "register")
        setFormError(friendly)
        if (friendly.code === "duplicate") emailRef.current?.focus()
        return
      }

      const result = data as { user?: { identities?: unknown[] } | null; session?: unknown } | null
      // With email confirmation on, Supabase hides existing accounts by returning a user with no identities.
      if (result?.user && Array.isArray(result.user.identities) && result.user.identities.length === 0) {
        setFormError(toFriendlyAuthError("user_already_exists", "register"))
        emailRef.current?.focus()
        return
      }

      if (result?.session) {
        toast.success("Account created!", { description: "Welcome to Siddhivinayak Overseas." })
        navigate("/dashboard", { replace: true })
      } else {
        setVerificationEmail(cleanEmail)
      }
    } catch {
      setFormError(toFriendlyAuthError(null, "register"))
    } finally {
      submittingRef.current = false
      setStatus("idle")
    }
  }

  const handleGoogle = async () => {
    if (submittingRef.current) return
    setFormError(null)
    submittingRef.current = true
    setStatus("google")
    try {
      const { error } = await signInWithGoogle()
      if (error) setFormError(toFriendlyAuthError(error.message, "google"))
    } catch {
      setFormError(toFriendlyAuthError(null, "google"))
    } finally {
      submittingRef.current = false
      setStatus("idle")
    }
  }

  const linkClass = "font-medium text-foreground underline decoration-primary underline-offset-4"

  return (
    <>
      <Helmet>
        <title>Register | Siddhivinayak Overseas</title>
        <meta
          name="description"
          content="Create an account with Siddhivinayak Overseas. Apply for work visa or study visa and track progress in real-time."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <AuthLayout
        variant="register"
        eyebrow="Start your application"
        title={verificationEmail ? "Almost there" : "Create your account"}
        description={
          verificationEmail
            ? "One last step before you can sign in."
            : "Register to apply for visas and manage your applications."
        }
        visual={VISUAL}
        footer={
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        }
      >
        {verificationEmail ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600" aria-hidden="true">
                <MailCheck className="h-7 w-7" />
              </span>
              <h2 ref={successHeadingRef} tabIndex={-1} className="mt-4 text-lg font-semibold text-foreground focus:outline-none">
                Check your inbox
              </h2>
              <p role="status" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We sent a verification link to <strong className="break-all text-foreground">{verificationEmail}</strong>. Confirm your
                email address, then sign in to continue.
              </p>
            </div>
            <Button asChild className="h-11 w-full rounded-full btn-glow">
              <Link to="/login">Go to sign in</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                type="button"
                className="rounded font-semibold text-foreground underline decoration-primary underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setVerificationEmail(null)
                  setPassword("")
                  setConfirmPassword("")
                  setAttempted(false)
                }}
              >
                use a different email
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} noValidate aria-busy={busy} className="space-y-4">
              {formError && formError.code !== "duplicate" ? (
                <FormAlert tone="error" title="We couldn't create your account">
                  {formError.message}
                </FormAlert>
              ) : null}

              <AuthField
                ref={nameRef}
                id="register-name"
                label="Full name"
                icon={User}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={100}
                placeholder="As shown on your passport"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                error={errors.fullName}
                disabled={busy}
              />

              <AuthField
                ref={emailRef}
                id="register-email"
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
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (formError?.code === "duplicate") setFormError(null)
                }}
                error={emailError}
                hint={
                  formError?.code === "duplicate" ? (
                    <span role="alert">
                      <Link to="/login" className={linkClass}>
                        Sign in instead
                      </Link>{" "}
                      or{" "}
                      <Link to="/forgot-password" className={linkClass}>
                        reset your password
                      </Link>
                      .
                    </span>
                  ) : undefined
                }
                disabled={busy}
              />

              <PasswordField
                ref={passwordRef}
                id="register-password"
                label="Password"
                autoComplete="new-password"
                maxLength={72}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                hint={<AuthPasswordStrength password={password} />}
                disabled={busy}
              />

              <PasswordField
                ref={confirmRef}
                id="register-confirm-password"
                label="Confirm password"
                autoComplete="new-password"
                maxLength={72}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={confirmError}
                hint={
                  confirmPassword && confirmPassword === password ? (
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">✓ Passwords match</span>
                  ) : undefined
                }
                disabled={busy}
              />

              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    ref={termsRef}
                    id="register-terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                    aria-invalid={errors.terms ? true : undefined}
                    aria-describedby={errors.terms ? "register-terms-error" : undefined}
                    disabled={busy}
                    className="mt-0.5 size-[18px]"
                  />
                  <Label htmlFor="register-terms" className="inline text-sm font-normal leading-snug text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" className={linkClass}>
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className={linkClass}>
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>
                {errors.terms ? (
                  <p id="register-terms-error" className="text-xs font-medium text-destructive">
                    {errors.terms}
                  </p>
                ) : null}
              </div>

              <LoadingButton type="submit" loading={status === "email"} loadingText="Creating account…" icon={UserPlus} disabled={busy} className="mt-2">
                Create account
              </LoadingButton>

              <p className="sr-only" aria-live="polite">
                {status === "email" ? "Creating your account, please wait." : ""}
              </p>
            </form>

            <AuthDivider />

            <GoogleSignInButton onClick={handleGoogle} isLoading={status === "google"} disabled={busy} label="Sign up with Google" />
          </>
        )}
      </AuthLayout>
    </>
  )
}
