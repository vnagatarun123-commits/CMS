'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (mismatch) return
    setLoading(true)
    setError(null)

    const result = await updatePassword({ password, confirmPassword: confirm })

    setLoading(false)
    if (result.ok) {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
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
              {done ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="space-y-5"
                >
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">Password updated</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Your password has been changed. Redirecting you to the dashboard…
                    </p>
                  </div>
                  <motion.div
                    className="h-1 rounded-full bg-green-500/20 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'linear' }}
                    />
                  </motion.div>
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
                      <motion.div
                        className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-sm mb-4"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.2 }}
                      >
                        <span className="text-primary-foreground text-base font-bold">P</span>
                      </motion.div>
                      <h1 className="text-xl font-semibold tracking-tight">Set new password</h1>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Choose a strong password — at least 8 characters.
                      </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                      <motion.div className="space-y-1.5" variants={fieldItem}>
                        <Label htmlFor="password" className="text-[13px]">New password</Label>
                        <Input
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          minLength={8}
                          disabled={loading}
                          className="h-10 text-sm"
                        />
                      </motion.div>

                      <motion.div className="space-y-1.5" variants={fieldItem}>
                        <Label htmlFor="confirm" className="text-[13px]">Confirm password</Label>
                        <Input
                          id="confirm"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          required
                          disabled={loading}
                          aria-invalid={mismatch}
                          className="h-10 text-sm"
                        />
                        <AnimatePresence>
                          {mismatch && (
                            <motion.p
                              className="text-xs text-destructive"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease }}
                            >
                              Passwords do not match
                            </motion.p>
                          )}
                        </AnimatePresence>
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
                          whileHover={{ scale: loading || mismatch ? 1 : 1.01 }}
                          whileTap={{ scale: loading || mismatch ? 1 : 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <Button
                            type="submit"
                            className="w-full h-10 text-sm"
                            disabled={loading || mismatch}
                          >
                            {loading ? (
                              <span className="flex items-center gap-2">
                                <motion.span
                                  className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                />
                                Updating…
                              </span>
                            ) : (
                              'Update password'
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
