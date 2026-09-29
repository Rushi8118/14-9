"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { SeoHead } from '@/components/seo/SeoHead'
import { motion } from "framer-motion"
import { Mail, Send, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address.")
      return
    }

    setLoading(true)
    try {
      // No "/#/" here: the app uses BrowserRouter, and the client runs the PKCE
      // flow, so Supabase appends "?code=..." to this URL. A hash would bury the
      // query inside the fragment, where detectSessionInUrl cannot read it.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast.error(error.message || "Failed to request password reset link.")
      } else {
        setSubmitted(true)
        toast.success("Reset link sent!", {
          description: "Please check your inbox for instructions.",
        })
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
      <SeoHead
        title="Forgot Password"
        description="Request a secure password reset link for your Siddhivinayak Overseas account."
        path="/forgot-password"
        noindex
      />
      <SiteHeader />
      <main className="relative min-h-screen bg-background flex flex-col justify-center py-20 px-4 md:px-6 premium-page">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/4 -z-10 h-[500px] w-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.7 0.16 84 / 0.12) 0%, transparent 65%)",
          }}
        />

        <div className="mx-auto w-full max-w-md">
          <Link
            to="/login"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border/60 bg-card/65 p-8 shadow-2xl backdrop-blur-xl"
          >
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 animate-bounce" />
                <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                  Check your Email
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We have sent a secure link to <strong className="text-foreground">{email}</strong>.
                  Please follow the instructions to reset your password.
                </p>
                <Button asChild className="mt-6 w-full rounded-full bg-primary">
                  <Link to="/login">Back to Login</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground">
                    Reset Password
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your registered email address and we&apos;ll send you a password reset link
                  </p>
                </div>

                <form onSubmit={handleResetRequest} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-border/70 bg-background/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground btn-glow"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Reset Link
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
