"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { motion } from "framer-motion"
import { Lock, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getPasswordStrength } from "@/lib/validations/auth"
import { PasswordRequirements } from "@/components/password-requirements"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  /**
   * Whether this visit carries a usable recovery session.
   * 'checking' until Supabase has had a chance to exchange the code in the URL,
   * because detectSessionInUrl does that asynchronously after mount.
   */
  const [linkState, setLinkState] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    // PASSWORD_RECOVERY fires once the recovery link's code has been exchanged.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || session) setLinkState('valid')
    })

    // The listener does not fire if the exchange completed before this mounted,
    // so check directly as well.
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        setLinkState('valid')
        return
      }
      // No session yet and no code left to exchange means the link is spent.
      const url = new URL(window.location.href)
      const pending = url.searchParams.has('code') || window.location.hash.includes('access_token')
      if (!pending) setLinkState('invalid')
    })

    // Backstop: if the exchange neither succeeds nor errors, do not leave the
    // page spinning forever.
    const timer = setTimeout(() => {
      if (!cancelled) setLinkState((s) => (s === 'checking' ? 'invalid' : s))
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  const passwordStrength = getPasswordStrength(password)

  const getStrengthBarColor = (level: string) => {
    switch (level) {
      case "Weak":
        return "bg-destructive"
      case "Fair":
        return "bg-warning"
      case "Good":
        return "bg-info"
      case "Strong":
        return "bg-emerald-500 animate-pulse"
      default:
        return "bg-border"
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    if (passwordStrength.score < 4) {
      toast.error("Please choose a stronger password.")
      return
    }

    if (linkState !== 'valid') {
      toast.error("This reset link is no longer valid. Please request a new one.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        // Without a recovery session Supabase reports a missing session rather
        // than anything the user can act on, so say what actually went wrong.
        const missingSession = /session|jwt|token/i.test(error.message || '')
        toast.error(
          missingSession
            ? "This reset link has expired. Please request a new one."
            : error.message || "Failed to update your password.",
        )
        if (missingSession) setLinkState('invalid')
      } else {
        setSubmitted(true)
        toast.success("Password updated successfully!", {
          description: "You can now log in with your new password.",
        })
        setTimeout(() => {
          navigate("/login")
        }, 3000)
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>New Password | Siddhivinayak Overseas</title>
        <meta
          name="description"
          content="Choose a new secure password for your Siddhivinayak Overseas account."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <SiteHeader />
      <main className="relative min-h-screen bg-background flex flex-col justify-center py-24 px-4 md:px-6 premium-page">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/4 -z-10 h-[500px] w-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.16 84 / 0.12) 0%, transparent 65%)",
          }}
        />

        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border/60 bg-card/65 p-8 shadow-2xl backdrop-blur-xl"
          >
            {linkState === 'checking' ? (
              <div className="text-center py-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link...</p>
              </div>
            ) : linkState === 'invalid' ? (
              <div className="text-center py-6">
                <AlertTriangle className="mx-auto h-14 w-14 text-amber-500" />
                <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                  This link has expired
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Password reset links can only be used once, and they expire after a short
                  time. Request a new one and it will arrive in your inbox.
                </p>
                <Link
                  to="/forgot-password"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Request a new link
                </Link>
                <p className="mt-4 text-xs text-muted-foreground">
                  Remembered it? <Link to="/login" className="text-primary hover:underline">Back to login</Link>
                </p>
              </div>
            ) : submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 animate-bounce" />
                <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                  Password Updated
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been reset successfully. Redirecting you to the login page...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground">
                    New Password
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please choose a strong, secure password that meets our guidelines below
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-border/70 bg-background/50 focus:border-primary/50"
                      />
                    </div>

                    {/* Live strength checklists */}
                    {password.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Strength:</span>
                          <span className="font-semibold text-foreground">{passwordStrength.level}</span>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-full rounded-full transition-all duration-300 ${
                                idx < passwordStrength.score
                                  ? getStrengthBarColor(passwordStrength.level)
                                  : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>

                        <PasswordRequirements strength={passwordStrength} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 border-border/70 bg-background/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground btn-glow mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Password...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
