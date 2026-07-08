'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthBrandPanel } from '@/app/(auth)/_components/auth-brand-panel'

interface SeedEntry {
  email: string
  name: string
  role: string
}

interface LoginFormProps {
  seedEmails?: SeedEntry[]
  linkError?: string
}

const ease = [0.22, 1, 0.36, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } },
}

const fieldContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const fieldItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

export function LoginForm({ seedEmails, linkError }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(linkError ?? null)
  const [loading, setLoading] = useState(false)
  const [devOpen, setDevOpen] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn({ email: email.trim(), password })

    if (result.ok) {
      router.push('/dashboard')
    } else {
      setError(result.error.message)
      setLoading(false)
    }
  }

  function fillCredential(entry: SeedEntry) {
    setEmail(entry.email)
    setPassword('password')
    setDevOpen(false)
  }

  return (
    <div className="flex flex-1 min-h-screen">

      <AuthBrandPanel />

      {/* ── Right panel ──────────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center bg-[#f5f6f8] dark:bg-background px-6 py-12 overflow-hidden">

        {/* Decorative blobs */}
        <motion.div
          className="pointer-events-none absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(circle, oklch(0.85 0.08 255) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full opacity-50"
          style={{ background: 'radial-gradient(circle, oklch(0.88 0.07 255) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 w-full max-w-[380px]"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">PuraLocal</span>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] p-8 space-y-6">

            {/* Card header */}
            <div className="flex flex-col items-center gap-3 pb-1">
              <motion.div
                className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-sm"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.25 }}
                whileHover={{ scale: 1.08, rotate: -4 }}
              >
                <span className="text-primary-foreground text-base font-bold">P</span>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.35 }}
              >
                <h1 className="text-xl font-semibold tracking-tight">Sign in to PuraLocal</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
              </motion.div>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              variants={fieldContainer}
              initial="hidden"
              animate="visible"
            >
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
                  className="h-10 text-sm transition-shadow focus:shadow-[0_0_0_3px_oklch(0.56_0.20_255_/_0.15)]"
                />
              </motion.div>

              <motion.div className="space-y-1.5" variants={fieldItem}>
                <Label htmlFor="password" className="text-[13px]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 text-sm transition-shadow focus:shadow-[0_0_0_3px_oklch(0.56_0.20_255_/_0.15)]"
                />
              </motion.div>

              <motion.div className="flex justify-end" variants={fieldItem}>
                <Link
                  href="/login/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>

              <AnimatePresence mode="wait">
                {error !== null && (
                  <motion.p
                    key="error"
                    role="alert"
                    className="rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
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
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-semibold tracking-wide uppercase relative overflow-hidden"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        />
                        Signing in…
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>

            {/* Dev credentials */}
            {seedEmails !== undefined && seedEmails.length > 0 && (
              <motion.div
                className="rounded-lg border border-dashed border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <button
                  type="button"
                  onClick={() => setDevOpen(v => !v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Dev credentials</span>
                  <motion.span
                    className="text-[10px]"
                    animate={{ rotate: devOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {devOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease }}
                      className="overflow-hidden border-t border-border divide-y divide-border"
                    >
                      {seedEmails.map(u => (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => fillCredential(u)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors"
                        >
                          <div>
                            <div className="text-xs font-medium text-foreground">{u.name}</div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">{u.role}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
