'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SeedEntry {
  email: string
  name: string
  role: string
}

interface LoginFormProps {
  /** Populated server-side only in development — never passed in production. */
  seedEmails?: SeedEntry[]
}

export function LoginForm({ seedEmails }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [devOpen, setDevOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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

  function fillCredential(e: SeedEntry) {
    setEmail(e.email)
    setPassword('password')
    setDevOpen(false)
  }

  return (
    <div className="flex flex-1">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 shrink-0"
        style={{
          background: 'linear-gradient(160deg, oklch(0.511 0.228 264.1) 0%, oklch(0.398 0.213 264.1) 100%)',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">PuraLocal</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/90 text-3xl font-semibold leading-snug tracking-tight" style={{ textWrap: 'balance' }}>
            The newsroom<br />for every neighbourhood.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Manage content, reporters, ads, and analytics — all from one place.
          </p>
        </div>

        <p className="text-white/30 text-xs">
          PuraLocal CMS — admin access only
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">PuraLocal</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your email and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@puralocal.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error !== null && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !email || !password}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* ── Dev-only credentials panel ───────────────────────────────── */}
          {/* NOTE: seedEmails is only passed in development (NODE_ENV check in    */}
          {/* page.tsx). Remove this block during the Supabase swap — real users   */}
          {/* will sign in with actual credentials, not seeded mock accounts.       */}
          {seedEmails !== undefined && seedEmails.length > 0 && (
            <div className="rounded-md border border-dashed border-border">
              <button
                type="button"
                onClick={() => setDevOpen(v => !v)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>Dev credentials</span>
                <span>{devOpen ? '▲' : '▼'}</span>
              </button>

              {devOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {seedEmails.map(u => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => fillCredential(u)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <div>
                        <div className="text-xs font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <span className="text-xs text-muted-foreground/60 font-mono">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
