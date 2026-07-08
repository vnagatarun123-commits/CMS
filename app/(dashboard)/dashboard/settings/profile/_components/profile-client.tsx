'use client'

import { useState, useTransition, useRef } from 'react'
import { Camera, Loader2, Mail, Phone, Building2, CalendarDays, Clock, Languages, Check } from 'lucide-react'
import type { UserWithRole } from '@/types/domain'
import type { User } from '@/types/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { updateMyProfile } from '@/app/actions/profile'

const TIMEZONES = [
  { value: 'Asia/Kolkata',      label: 'India Standard Time (IST) — UTC+5:30' },
  { value: 'Asia/Colombo',      label: 'Sri Lanka Standard Time — UTC+5:30' },
  { value: 'Asia/Dubai',        label: 'Gulf Standard Time (GST) — UTC+4' },
  { value: 'Asia/Singapore',    label: 'Singapore Standard Time — UTC+8' },
  { value: 'Asia/Tokyo',        label: 'Japan Standard Time (JST) — UTC+9' },
  { value: 'Europe/London',     label: 'Greenwich Mean Time (GMT) — UTC+0' },
  { value: 'America/New_York',  label: 'Eastern Time (ET) — UTC-5' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) — UTC-8' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ta', label: 'Tamil' },
  { value: 'kn', label: 'Kannada' },
  { value: 'mr', label: 'Marathi' },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// ── Section shell ──────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
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

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-medium">{label}</p>
        <p className="text-[13.5px] font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

interface Props {
  profile: UserWithRole
  currentUser: User
}

export function ProfileClient({ profile, currentUser }: Props) {
  const [name, setName]         = useState(profile.name)
  const [phone, setPhone]       = useState(profile.phone ?? '')
  const [bio, setBio]           = useState(profile.bio ?? '')
  const [timezone, setTimezone] = useState(profile.timezone ?? 'Asia/Kolkata')
  const [language, setLanguage] = useState(profile.language ?? 'en')
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photoUrl ?? null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 256
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const w = img.width * scale, h = img.height * scale
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
        setPhotoUrl(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateMyProfile({
        name,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        timezone,
        language,
        photoUrl,
      })
      if (result.ok) toast.success('Profile updated successfully')
      else toast.error(result.error.message)
    })
  }

  const isDirty =
    name !== profile.name ||
    (phone.trim() || null) !== (profile.phone ?? null) ||
    (bio.trim() || null) !== (profile.bio ?? null) ||
    timezone !== (profile.timezone ?? 'Asia/Kolkata') ||
    language !== (profile.language ?? 'en') ||
    photoUrl !== (profile.photoUrl ?? null)

  const memberSince = profile.joinedAt ?? profile.invitedAt
  const memberSinceLabel = memberSince
    ? memberSince.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const orgLabel = currentUser.organizationId === 'org_puralocal_001' ? 'PuraLocal' : currentUser.organizationId
  const tzLabel = TIMEZONES.find(t => t.value === timezone)?.label.split(' — ')[0] ?? timezone
  const langLabel = LANGUAGES.find(l => l.value === language)?.label ?? language

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Manage your personal information and dashboard preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[12.5px] text-amber-600 dark:text-amber-400 font-medium">
              Unsaved changes
            </span>
          )}
          <Button onClick={handleSave} disabled={isPending || !name.trim() || !isDirty}>
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Check className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

        {/* ── Left: identity card ─────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-2 self-start rounded-2xl border bg-card ring-1 ring-border/50 overflow-hidden">
          {/* gradient banner */}
          <div className="h-24 bg-gradient-to-br from-primary via-primary to-primary/60" />
          <div className="px-6 pb-6 -mt-12">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 ring-4 ring-card shadow-sm">
                {photoUrl && <AvatarImage src={photoUrl} alt={profile.name} />}
                <AvatarFallback className="text-2xl font-semibold bg-primary/15 text-primary">
                  {initials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                aria-label="Upload photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-[18px] font-semibold leading-tight tracking-tight truncate">{profile.name}</p>
              <p className="text-[13.5px] text-muted-foreground mt-0.5 truncate">{profile.email}</p>
              <div className="mt-3">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-xs font-semibold px-2.5 py-1">
                  {roleLabel(profile.role)}
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-4 border-t pt-5">
              <MetaRow icon={Building2}  label="Organization" value={orgLabel} />
              <MetaRow icon={CalendarDays} label="Member since" value={memberSinceLabel} />
              <MetaRow icon={Clock}      label="Timezone" value={tzLabel} />
              <MetaRow icon={Languages}  label="Language" value={langLabel} />
            </div>
          </div>
        </div>

        {/* ── Right: form sections ────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">

          <Section title="Personal Information" description="Update your name, phone number, and bio.">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </Label>
                  <Input id="email" value={profile.email} readOnly disabled className="cursor-not-allowed opacity-60" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                </Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">
                  Bio
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">({bio.length}/280)</span>
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 280))}
                  placeholder="A short bio about yourself…"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </Section>

          <Section title="Preferences" description="Set your timezone and display language for the dashboard.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={v => setTimezone(v ?? 'Asia/Kolkata')}>
                  <SelectTrigger id="timezone" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Display Language</Label>
                <Select value={language} onValueChange={v => setLanguage(v ?? 'en')}>
                  <SelectTrigger id="language" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
