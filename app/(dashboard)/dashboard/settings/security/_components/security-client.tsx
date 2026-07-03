'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2, ShieldCheck, Info, Mail, Building2, CalendarDays, KeyRound, Smartphone, Check } from 'lucide-react'
import type { User } from '@/types/auth'
import type { UserWithRole } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { changeMyPassword } from '@/app/actions/profile'

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// Simple strength heuristic (0–4) for a premium visual meter.
function passwordScore(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}
const STRENGTH = [
  { label: '', color: '' },
  { label: 'Weak',     color: 'bg-destructive' },
  { label: 'Fair',     color: 'bg-amber-500' },
  { label: 'Good',     color: 'bg-sky-500' },
  { label: 'Strong',   color: 'bg-emerald-500' },
]

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-medium">{label}</p>
        <div className="text-[13.5px] font-medium text-foreground truncate">{value}</div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card ring-1 ring-border/50">
      <div className="border-b px-6 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

interface Props {
  user: User
  profile: UserWithRole
}

export function SecurityClient({ user, profile }: Props) {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition]  = useTransition()

  const passwordMismatch = confirmPw.length > 0 && confirmPw !== newPw
  const canSubmit = currentPw.length > 0 && newPw.length >= 8 && confirmPw === newPw && !isPending
  const score = passwordScore(newPw)

  function handleChangePassword() {
    startTransition(async () => {
      const result = await changeMyPassword({
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      })
      if (result.ok) {
        toast.success('Password changed successfully')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        toast.error(result.error.message)
      }
    })
  }

  const memberSince = profile.joinedAt ?? profile.invitedAt
  const formattedDate = memberSince
    ? memberSince.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Manage your password and account security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

        {/* ── Left: account summary ───────────────────────────────────────── */}
        <div className="lg:sticky lg:top-2 self-start rounded-2xl border bg-card ring-1 ring-border/50 overflow-hidden">
          <div className="flex items-center gap-3 border-b bg-emerald-500/[0.06] px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight">Account secure</p>
              <p className="text-[12.5px] text-muted-foreground">Password protection active</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <MetaRow icon={Mail} label="Email address" value={<span className="truncate block">{user.email}</span>} />
            <MetaRow icon={KeyRound} label="Role" value={
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[11px] font-semibold px-2 py-0.5">
                {roleLabel(user.role)}
              </Badge>
            } />
            <MetaRow icon={Building2} label="Organization" value="PuraLocal" />
            <MetaRow icon={CalendarDays} label="Member since" value={formattedDate} />
          </div>
        </div>

        {/* ── Right: password + 2FA ───────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          <Section title="Change Password" description="Use a strong password of at least 8 characters.">
            <div className="space-y-5">
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                  In mock mode the default password for all accounts is{' '}
                  <code className="font-mono font-semibold">password</code>.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <Label htmlFor="currentPw">Current Password</Label>
                <PwInput id="currentPw" value={currentPw} onChange={setCurrentPw} show={showCurrent} toggle={() => setShowCurrent(v => !v)} placeholder="Enter current password" autoComplete="current-password" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPw">New Password</Label>
                <PwInput id="newPw" value={newPw} onChange={setNewPw} show={showNew} toggle={() => setShowNew(v => !v)} placeholder="At least 8 characters" autoComplete="new-password" />
                {newPw.length > 0 && (
                  <div className="pt-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= score ? STRENGTH[score]!.color : 'bg-muted')} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[12px] text-muted-foreground">
                      Strength: <span className="font-medium text-foreground">{STRENGTH[score]?.label || 'Too short'}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPw">Confirm New Password</Label>
                <PwInput id="confirmPw" value={confirmPw} onChange={setConfirmPw} show={showConfirm} toggle={() => setShowConfirm(v => !v)} placeholder="Re-enter new password" autoComplete="new-password" invalid={passwordMismatch} />
                {passwordMismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
              </div>

              <div className="flex justify-end pt-1">
                <Button onClick={handleChangePassword} disabled={!canSubmit}>
                  {isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
                    : <><Check className="mr-2 h-4 w-4" />Update Password</>}
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">Authenticator app</p>
                  <p className="text-[12.5px] text-muted-foreground">Verify with a time-based one-time code.</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] text-muted-foreground shrink-0">Coming soon</Badge>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}

// ── Password input with show/hide toggle ───────────────────────────────────────

function PwInput({
  id, value, onChange, show, toggle, placeholder, autoComplete, invalid,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  show: boolean
  toggle: () => void
  placeholder: string
  autoComplete: string
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn('pr-10', invalid && 'border-destructive focus-visible:ring-destructive')}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
