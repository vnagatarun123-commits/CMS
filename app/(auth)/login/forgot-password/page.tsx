'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { requestPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail } from 'lucide-react'
import { AuthBrandPanel } from '@/app/(auth)/_components/auth-brand-panel'

const ease = [0.22, 1, 0.36, 1] as const

const fieldContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await requestPasswordReset({ email: email.trim() })

    setLoading(false)
    if (result.ok) {
      setSubmitted(true)
    } else {
      setError(result.error.message)
    }
  }

  return (
    <div className="flex flex-1 min-h-screen">

      <AuthBrandPanel />

      {/* ── Right panel ──────────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center bg-[#f5f6f8] dark:bg-background px-6 py-12 overflow-hidden">

        <motion.div
          className="pointer-events-none absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(circle, oklch(0.85 0.08 255) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, oklch(0.88 0.07 255) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <motion.div
          className="relative z-10 w-full max-w-[380px]"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">PuraLocal</span>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.4, ease }}
                  className="space-y-5"
                >
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
                  >
                    <Mail className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      If <span className="font-medium text-foreground">{email}</span> is registered,
                      you'll receive a password reset link shortly.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Didn't get it? Check your spam folder or{' '}
                    <button
                      type="button"
                      onClick={() => { setSubmitted(false); setEmail('') }}
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      try again
                    </button>.
                  </p>
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <motion.div
                    className="space-y-5"
                    variants={fieldContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={fieldItem}>
                      <Link
                        href="/login"
                        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to sign in
                      </Link>
                      <h1 className="text-xl font-semibold tracking-tight">Forgot password?</h1>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Enter your email and we'll send you a reset link.
                      </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                      <motion.div className="space-y-1.5" variants={fieldItem}>
                        <Label htmlFor="email" className="text-[13px]">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@puralocal.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          className="h-10 text-sm"
                        />
                      </motion.div>

                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.p
                            key="error"
                            role="alert"
                            className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease }}
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <motion.div variants={fieldItem}>
                        <motion.div
                          whileHover={{ scale: loading ? 1 : 1.01 }}
                          whileTap={{ scale: loading ? 1 : 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <Button type="submit" className="w-full h-10 text-sm" disabled={loading}>
                            {loading ? (
                              <span className="flex items-center gap-2">
                                <motion.span
                                  className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                />
                                Sending…
                              </span>
                            ) : (
                              'Send reset link'
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
