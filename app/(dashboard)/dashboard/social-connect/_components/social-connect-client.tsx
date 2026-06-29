'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, X, Check, Unlink, RefreshCw, AlertCircle, ExternalLink,
  Link2, Zap, CheckCircle2, XCircle, Clock, Settings, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Platform definitions ───────────────────────────────────────────────────────

export type PlatformId = 'instagram' | 'facebook' | 'youtube'

interface SSOOption {
  id: string
  label: string      // e.g. "Continue with Google"
  icon: 'google' | 'facebook' | 'apple' | 'platform'
  primary?: boolean
}

export interface Platform {
  id: PlatformId
  name: string
  primaryColor: string
  loginBg: string
  loginAccent: string
  description: string
  ssoOptions: SSOOption[]
  maxAccounts: number
  features: string[]
}

export const PLATFORMS: Platform[] = [
  {
    id: 'instagram', name: 'Instagram', primaryColor: '#E1306C',
    loginBg: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    loginAccent: '#E1306C',
    description: 'Share photos, reels, and stories with your audience',
    ssoOptions: [
      { id: 'fb',     label: 'Continue with Facebook', icon: 'facebook', primary: true },
      { id: 'google', label: 'Continue with Google',   icon: 'google' },
    ],
    maxAccounts: 5,
    features: ['Post photos', 'Publish reels', 'Schedule stories', 'Auto-caption'],
  },
  {
    id: 'facebook', name: 'Facebook', primaryColor: '#1877F2',
    loginBg: 'linear-gradient(160deg, #1877F2 0%, #0d5fc7 100%)',
    loginAccent: '#1877F2',
    description: 'Publish news articles, videos, and live streams to Pages',
    ssoOptions: [
      { id: 'platform', label: 'Continue with Facebook', icon: 'platform', primary: true },
      { id: 'google',   label: 'Continue with Google',   icon: 'google' },
    ],
    maxAccounts: 5,
    features: ['Publish to Page', 'Post to Groups', 'Schedule posts', 'Live streaming'],
  },
  {
    id: 'youtube', name: 'YouTube', primaryColor: '#FF0000',
    loginBg: 'linear-gradient(160deg, #212121 0%, #111 100%)',
    loginAccent: '#FF0000',
    description: 'Upload videos, manage live streams, and schedule premieres',
    ssoOptions: [
      { id: 'google', label: 'Sign in with Google', icon: 'google', primary: true },
    ],
    maxAccounts: 3,
    features: ['Upload videos', 'Manage live streams', 'Schedule premieres', 'Shorts publishing'],
  },
]


// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired'

export interface ConnectedAccount {
  id: string
  platformId: PlatformId
  accountName: string
  accountHandle: string
  accountType: string
  avatarUrl: string | null
  followers: number
  verified: boolean
  status: ConnectionStatus
  active: boolean
  connectedAt: Date
  lastSyncedAt: Date | null
  expiresAt: Date | null
  autoPublish: boolean
  permissions: string[]
}

// ── Seed ──────────────────────────────────────────────────────────────────────

const SEED_ACCOUNTS: ConnectedAccount[] = [
  { id: 'ca1', platformId: 'instagram', accountName: 'PuraLocal News',          accountHandle: '@puralocal_news',       accountType: 'Business',    avatarUrl: 'https://i.pravatar.cc/150?img=10', verified: true,  followers: 48200,  status: 'connected', active: true,  connectedAt: new Date('2025-02-15'), lastSyncedAt: new Date('2025-06-26T09:00:00'), expiresAt: new Date('2025-12-15'), autoPublish: true,  permissions: ['publish_content', 'manage_comments', 'read_insights'] },
  { id: 'ca2', platformId: 'instagram', accountName: 'Hyderabad Breaking',      accountHandle: '@hyd_breaking',         accountType: 'Creator',     avatarUrl: 'https://i.pravatar.cc/150?img=22', verified: false, followers: 12600,  status: 'connected', active: false, connectedAt: new Date('2025-03-10'), lastSyncedAt: new Date('2025-06-25T14:30:00'), expiresAt: new Date('2025-12-10'), autoPublish: false, permissions: ['publish_content'] },
  { id: 'ca3', platformId: 'facebook',  accountName: 'PuraLocal — Official',    accountHandle: 'PuraLocalNews',         accountType: 'News Page',   avatarUrl: 'https://i.pravatar.cc/150?img=30', verified: true,  followers: 94500,  status: 'connected', active: true,  connectedAt: new Date('2025-01-20'), lastSyncedAt: new Date('2025-06-26T08:45:00'), expiresAt: new Date('2025-09-20'), autoPublish: true,  permissions: ['publish_content', 'manage_pages', 'read_insights'] },
  { id: 'ca4', platformId: 'facebook',  accountName: 'Telangana News Hub',      accountHandle: 'TelanganaNewsHub',      accountType: 'Group',       avatarUrl: null,                               verified: false, followers: 31200,  status: 'error',     active: true,  connectedAt: new Date('2025-04-05'), lastSyncedAt: new Date('2025-06-20T11:00:00'), expiresAt: null,                  autoPublish: false, permissions: ['publish_content'] },
  { id: 'ca5', platformId: 'youtube',   accountName: 'PuraLocal News',          accountHandle: '@puralocalnews',        accountType: 'Channel',     avatarUrl: 'https://i.pravatar.cc/150?img=40', verified: true,  followers: 124000, status: 'connected', active: true,  connectedAt: new Date('2025-01-05'), lastSyncedAt: new Date('2025-06-26T07:00:00'), expiresAt: null,                  autoPublish: true,  permissions: ['upload_videos', 'manage_live', 'read_analytics'] },
]

// ── Mock fetch pool (simulated OAuth account fetch) ───────────────────────────

interface FetchedAccount {
  id: string; name: string; handle: string; type: string
  avatarUrl: string; followers: number; verified: boolean
}

const FETCHED_POOL: Record<PlatformId, FetchedAccount[]> = {
  instagram: [
    { id: 'ig_1', name: 'PuraLocal News',     handle: '@puralocal_news', type: 'Business', avatarUrl: 'https://i.pravatar.cc/150?img=10', followers: 48200,  verified: true  },
    { id: 'ig_2', name: 'Hyderabad Breaking', handle: '@hyd_breaking',   type: 'Creator',  avatarUrl: 'https://i.pravatar.cc/150?img=22', followers: 12600,  verified: false },
    { id: 'ig_3', name: 'AP News Live',       handle: '@apnewslive',     type: 'Business', avatarUrl: 'https://i.pravatar.cc/150?img=33', followers: 8400,   verified: false },
  ],
  facebook: [
    { id: 'fb_1', name: 'PuraLocal — Official Page', handle: 'PuraLocalNews',    type: 'News Page',      avatarUrl: 'https://i.pravatar.cc/150?img=30', followers: 94500,  verified: true  },
    { id: 'fb_2', name: 'Telangana News Hub',        handle: 'TelanganaNewsHub', type: 'Group',          avatarUrl: 'https://i.pravatar.cc/150?img=44', followers: 31200,  verified: false },
    { id: 'fb_3', name: 'Hyderabad City Updates',    handle: 'HydCityUpdates',   type: 'Community Page', avatarUrl: 'https://i.pravatar.cc/150?img=55', followers: 17800,  verified: false },
  ],
  youtube: [
    { id: 'yt_1', name: 'PuraLocal News',   handle: '@puralocalnews',    type: 'Channel', avatarUrl: 'https://i.pravatar.cc/150?img=40', followers: 124000, verified: true  },
    { id: 'yt_2', name: 'PuraLocal Shorts', handle: '@puralocal_shorts', type: 'Channel', avatarUrl: 'https://i.pravatar.cc/150?img=60', followers: 38500,  verified: false },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Platform SVG icons ────────────────────────────────────────────────────────

export function PlatformIcon({ id, size = 20 }: { id: PlatformId; size?: number }) {
  const s = size
  if (id === 'instagram') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <defs><linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433" /><stop offset="25%" stopColor="#e6683c" /><stop offset="50%" stopColor="#dc2743" /><stop offset="75%" stopColor="#cc2366" /><stop offset="100%" stopColor="#bc1888" /></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig2)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  )
  if (id === 'facebook') return (
    <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1877F2" /><path d="M16 8h-2a1 1 0 00-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 014-4h2v3z" fill="white" /></svg>
  )
  if (id === 'youtube') return (
    <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#FF0000" /><path d="M19.6 8.2a2 2 0 00-1.4-1.4C16.8 6.5 12 6.5 12 6.5s-4.8 0-6.2.3a2 2 0 00-1.4 1.4C4.1 9.6 4.1 12 4.1 12s0 2.4.3 3.8a2 2 0 001.4 1.4c1.4.3 6.2.3 6.2.3s4.8 0 6.2-.3a2 2 0 001.4-1.4c.3-1.4.3-3.8.3-3.8s0-2.4-.3-3.8z" fill="white" /><path d="M10 15V9l5.2 3L10 15z" fill="#FF0000" /></svg>
  )
  return null
}

// ── Platform logo (large, for login screen) ───────────────────────────────────

function PlatformLogo({ id }: { id: PlatformId }) {
  const size = 48
  if (id === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5.5" stroke="white" strokeWidth="2" fill="none" />
      <rect x="1" y="1" width="22" height="22" rx="6" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="18" cy="6" r="1.5" fill="white" />
    </svg>
  )
  if (id === 'facebook') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  )
  if (id === 'youtube') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z" fill="white" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000" />
    </svg>
  )
  return null
}

// ── SSO icon SVGs (inline, no CDN) ────────────────────────────────────────────

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookSSOIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#1877F2"/>
      <path d="M16 8h-2a1 1 0 00-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 014-4h2v3z" fill="white"/>
    </svg>
  )
}


// ── OAuth login modal — simulated flow (swap for real redirect when live) ─────

type OAuthStep = 'choose-sso' | 'connecting' | 'select-accounts' | 'done'

function OAuthModal({ platform, onClose, onConnected }: {
  platform: Platform
  onClose: () => void
  onConnected: (accounts: ConnectedAccount[]) => void
}) {
  const [step, setStep]               = useState<OAuthStep>('choose-sso')
  const [activeSso, setActiveSso]     = useState('')
  const [progress, setProgress]       = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [fetched, setFetched]         = useState<FetchedAccount[]>([])
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [autoPublishAll, setAutoPublishAll] = useState(false)

  function runProgress(labels: string[], onDone: () => void) {
    let idx = 0; let p = 0
    setProgressLabel(labels[0] ?? '')
    const timer = setInterval(() => {
      p += Math.random() * 20 + 10
      if (p >= 100) { p = 100; clearInterval(timer); onDone(); return }
      const li = Math.min(Math.floor((p / 100) * labels.length), labels.length - 1)
      if (li !== idx) { idx = li; setProgressLabel(labels[idx] ?? '') }
      setProgress(Math.round(p))
    }, 130)
  }

  function handleSSOClick(ssoLabel: string) {
    setActiveSso(ssoLabel)
    setStep('connecting')
    setProgress(0)
    runProgress(
      [`Opening ${ssoLabel}…`, 'Authorising…', 'Fetching accounts…', 'Almost done…'],
      () => {
        const pool = FETCHED_POOL[platform.id] ?? []
        setFetched(pool)
        setSelected(new Set(pool.map(a => a.id)))
        setStep('select-accounts')
      },
    )
  }

  function handleConnect() {
    const toConnect = fetched.filter(f => selected.has(f.id))
    if (toConnect.length === 0) return toast.error('Select at least one account')
    const newAccounts: ConnectedAccount[] = toConnect.map(f => ({
      id: `ca_${f.id}_${Date.now()}`,
      platformId: platform.id,
      accountName: f.name, accountHandle: f.handle, accountType: f.type,
      avatarUrl: f.avatarUrl, followers: f.followers, verified: f.verified,
      status: 'connected' as const, active: true,
      connectedAt: new Date(), lastSyncedAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      autoPublish: autoPublishAll,
      permissions: platform.features.map(feat => feat.toLowerCase().replace(/ /g, '_')),
    }))
    setStep('done')
    setTimeout(() => { onConnected(newAccounts); onClose() }, 800)
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const btnColor = platform.primaryColor === '#000000' ? '#222' : platform.primaryColor

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== 'connecting') onClose() }}>

      <div className="w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Branded header */}
        <div className="relative px-8 pt-10 pb-7 flex flex-col items-center gap-3" style={{ background: platform.loginBg }}>
          {step !== 'connecting' && step !== 'done' && (
            <button onClick={onClose}
              className="absolute top-3.5 right-3.5 h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <PlatformLogo id={platform.id} />
          <div className="text-center">
            <h2 className="text-white text-base font-bold">
              {step === 'choose-sso'      ? `Connect ${platform.name}` :
               step === 'connecting'      ? 'Connecting…' :
               step === 'select-accounts' ? 'Select accounts to connect' :
               'All set!'}
            </h2>
            {step === 'choose-sso' && (
              <p className="text-white/55 text-[11px] mt-1 leading-relaxed">{platform.description}</p>
            )}
          </div>
        </div>

        <div className="bg-background">

          {/* ── CHOOSE SSO ── */}
          {step === 'choose-sso' && (
            <div className="px-6 py-6 space-y-3">
              <p className="text-xs text-center text-muted-foreground mb-1">Choose how you want to sign in</p>
              {platform.ssoOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => handleSSOClick(opt.label)}
                  className={`w-full h-11 flex items-center justify-center gap-3 rounded-xl text-sm font-semibold transition-all border shadow-sm
                    ${opt.primary
                      ? 'text-white border-transparent hover:opacity-90 active:scale-[0.98]'
                      : 'bg-background text-foreground border-border hover:bg-muted active:scale-[0.98]'}`}
                  style={opt.primary ? { backgroundColor: btnColor } : {}}>
                  {opt.icon === 'google'   && <GoogleIcon size={18} />}
                  {opt.icon === 'facebook' && <FacebookSSOIcon size={18} />}
                  {opt.icon === 'platform' && <PlatformIcon id={platform.id} size={18} />}
                  {opt.label}
                </button>
              ))}
              <p className="text-center text-[10px] text-muted-foreground pt-1 leading-relaxed px-2">
                PuraLocal CMS will receive permission to publish on your behalf. Revoke anytime from your account settings.
              </p>
            </div>
          )}

          {/* ── CONNECTING ── */}
          {step === 'connecting' && (
            <div className="px-8 py-8 flex flex-col items-center gap-5">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-2 border-muted" />
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${platform.primaryColor}25`, borderTopColor: platform.primaryColor }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlatformIcon id={platform.id} size={28} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{progressLabel}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px]">{activeSso}</p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: platform.primaryColor }} />
              </div>
            </div>
          )}

          {/* ── SELECT ACCOUNTS ── */}
          {step === 'select-accounts' && (
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Found <strong className="text-foreground">{fetched.length} account{fetched.length !== 1 ? 's' : ''}</strong>. Select which to connect.
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {fetched.map(acc => {
                  const sel = selected.has(acc.id)
                  return (
                    <button key={acc.id} type="button" onClick={() => toggleSelect(acc.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${sel ? 'shadow-sm' : 'border-border hover:border-foreground/20 hover:bg-muted/20'}`}
                      style={sel ? { borderColor: `${platform.primaryColor}50`, backgroundColor: `${platform.primaryColor}08` } : {}}>
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={acc.avatarUrl} alt={acc.name} className="h-9 w-9 rounded-full object-cover border border-border" />
                        {acc.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center"
                            style={{ backgroundColor: platform.primaryColor }}>
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{acc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{acc.handle} · {acc.type}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFollowers(acc.followers)} followers</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'border-0' : 'border-border'}`}
                        style={sel ? { backgroundColor: platform.primaryColor } : {}}>
                        {sel && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Auto-publish content</p>
                  <p className="text-[11px] text-muted-foreground">Push articles automatically when published</p>
                </div>
                <button type="button" onClick={() => setAutoPublishAll(p => !p)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${autoPublishAll ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoPublishAll ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 h-9 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleConnect} disabled={selected.size === 0}
                  className="flex-1 h-9 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: btnColor }}>
                  Connect {selected.size > 0 ? `${selected.size} account${selected.size > 1 ? 's' : ''}` : ''}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="px-8 py-10 flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-foreground">Connected!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Disconnect confirm ────────────────────────────────────────────────────────

function DisconnectModal({ account, onConfirm, onCancel }: {
  account: ConnectedAccount; onConfirm: () => void; onCancel: () => void
}) {
  const platform = PLATFORMS.find(p => p.id === account.platformId)!
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Unlink className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Disconnect account?</p>
              <p className="text-xs text-muted-foreground">CMS access to this account will be revoked.</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex items-center gap-3">
            <div className="relative shrink-0">
              {account.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={account.avatarUrl} alt={account.accountName} className="h-9 w-9 rounded-full object-cover border border-border" />
                : <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border border-border"><span className="text-xs font-bold">{account.accountName[0]}</span></div>}
              <div className="absolute -bottom-1 -right-1"><PlatformIcon id={account.platformId} size={14} /></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{account.accountName}</p>
              <p className="text-[11px] text-muted-foreground">{account.accountHandle} · {platform.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">Scheduled auto-publish tasks for this account will be cancelled.</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={onConfirm}>
              <Unlink className="h-3.5 w-3.5" />Disconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Account detail side panel ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const cfg: Record<ConnectionStatus, { cls: string; label: string; icon: React.ReactNode }> = {
    connected:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Connected',     icon: <CheckCircle2 className="h-3 w-3" /> },
    disconnected: { cls: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Disconnected',  icon: <XCircle className="h-3 w-3" /> },
    error:        { cls: 'bg-red-50 text-red-600 border-red-200',             label: 'Error',         icon: <AlertCircle className="h-3 w-3" /> },
    expired:      { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Token Expired', icon: <Clock className="h-3 w-3" /> },
  }
  const { cls, label, icon } = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {icon}{label}
    </span>
  )
}

function AccountDetailPanel({ account, onClose, onToggle, onToggleAutoPublish, onReconnect, onDisconnect }: {
  account: ConnectedAccount; onClose: () => void; onToggle: () => void
  onToggleAutoPublish: () => void; onReconnect: () => void; onDisconnect: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ml-auto h-full w-[380px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {account.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={account.avatarUrl} alt={account.accountName} className="h-10 w-10 rounded-full border border-border object-cover" />
                : <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border"><span className="text-sm font-bold">{account.accountName[0]}</span></div>}
              <div className="absolute -bottom-1 -right-1"><PlatformIcon id={account.platformId} size={14} /></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{account.accountName}</p>
              <p className="text-xs text-muted-foreground">{account.accountHandle}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={account.status} />
            <div className="flex gap-1.5">
              {(account.status === 'expired' || account.status === 'error') && (
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onReconnect}>
                  <RefreshCw className="h-3 w-3" />Reconnect
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Followers', value: formatFollowers(account.followers) },
              { label: 'Account type', value: account.accountType },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border divide-y divide-border">
            {[
              { label: 'Connected',    value: formatDate(account.connectedAt) },
              { label: 'Last synced',  value: account.lastSyncedAt ? formatDate(account.lastSyncedAt) : 'Never' },
              { label: 'Token expires', value: account.expiresAt ? formatDate(account.expiresAt) : 'Never' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-xs font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {[
              { label: 'Account active', sub: 'Allow publishing from this account', value: account.active, onToggle },
              { label: 'Auto-publish',   sub: 'Push articles when published in CMS',  value: account.autoPublish, onToggle: onToggleAutoPublish },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                </div>
                <button onClick={row.onToggle}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row.value ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${row.value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Permissions</p>
            <div className="flex flex-wrap gap-1.5">
              {account.permissions.map(p => (
                <span key={p} className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Check className="h-2.5 w-2.5 text-emerald-500" />{p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 gap-1 text-xs" onClick={() => toast.info('Syncing…')}>
            <RefreshCw className="h-3 w-3" />Sync now
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-8 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={onDisconnect}>
            <Unlink className="h-3 w-3" />Disconnect
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Platform card ─────────────────────────────────────────────────────────────

function PlatformCard({ platform, accounts, onConnect }: {
  platform: Platform; accounts: ConnectedAccount[]; onConnect: (p: Platform) => void
}) {
  const connected  = accounts.filter(a => a.status === 'connected').length
  const hasIssue   = accounts.some(a => a.status === 'error' || a.status === 'expired')
  const canAdd     = accounts.length < platform.maxAccounts

  return (
    <div className={`rounded-xl border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow ${hasIssue ? 'border-amber-200' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlatformIcon id={platform.id} size={28} />
          <div>
            <p className="text-sm font-semibold text-foreground">{platform.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {accounts.length === 0 ? 'Not connected' : `${connected}/${accounts.length} active`}
            </p>
          </div>
        </div>
        {hasIssue && <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
      </div>

      {accounts.length > 0 && (
        <div className="space-y-1.5">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-2.5 py-1.5">
              <div className="h-5 w-5 rounded-full overflow-hidden shrink-0 border border-border">
                {acc.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={acc.avatarUrl} alt={acc.accountName} className="h-full w-full object-cover" />
                  : <div className="h-full w-full bg-muted flex items-center justify-center"><span className="text-[8px] font-bold">{acc.accountName[0]}</span></div>}
              </div>
              <span className="text-xs text-foreground flex-1 truncate">{acc.accountHandle}</span>
              <StatusBadge status={acc.status} />
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <button onClick={() => onConnect(platform)}
          className="h-8 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors mt-auto">
          <Plus className="h-3.5 w-3.5" />{accounts.length === 0 ? `Connect ${platform.name}` : 'Add account'}
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type ViewTab = 'overview' | 'accounts'
type FilterStatus = 'all' | ConnectionStatus

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'connected', label: 'Connected' },
  { value: 'error', label: 'Error' },
  { value: 'expired', label: 'Expired' },
  { value: 'disconnected', label: 'Disconnected' },
]

// ── Platform picker modal ─────────────────────────────────────────────────────

function PlatformPickerModal({ accounts, onPick, onClose }: {
  accounts: ConnectedAccount[]
  onPick: (platform: Platform) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Connect a social account</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Choose the platform you want to connect</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Platform grid */}
        <div className="p-5 grid grid-cols-2 gap-3">
          {PLATFORMS.map(platform => {
            const connected = accounts.filter(a => a.platformId === platform.id && a.status === 'connected').length
            const total     = accounts.filter(a => a.platformId === platform.id).length
            const atMax     = total >= platform.maxAccounts

            return (
              <button key={platform.id} disabled={atMax} onClick={() => { onClose(); onPick(platform) }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all group
                  ${atMax ? 'opacity-40 cursor-not-allowed border-border' : 'border-border hover:border-foreground/30 hover:bg-muted/30 hover:shadow-sm'}`}>
                <div className="shrink-0"><PlatformIcon id={platform.id} size={32} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {total === 0 ? 'Not connected' : `${connected}/${total} connected`}
                  </p>
                  {atMax && <p className="text-[10px] text-amber-600 font-medium">Max accounts reached</p>}
                </div>
                {!atMax && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SocialConnectClient() {
  const [accounts, setAccounts]           = useState<ConnectedAccount[]>(SEED_ACCOUNTS)
  const [activeTab, setActiveTab]         = useState<ViewTab>('overview')
  const [showPicker, setShowPicker]       = useState(false)
  const [connectPlatform, setConnect]     = useState<Platform | null>(null)
  const [disconnectTarget, setDisconnect] = useState<ConnectedAccount | null>(null)
  const [detailAccount, setDetail]        = useState<ConnectedAccount | null>(null)
  const [filterPlatform, setFP]           = useState<PlatformId | 'all'>('all')
  const [filterStatus, setFS]             = useState<FilterStatus>('all')

  const connected   = accounts.filter(a => a.status === 'connected').length
  const withIssues  = accounts.filter(a => a.status === 'error' || a.status === 'expired').length
  const autoPublish = accounts.filter(a => a.autoPublish && a.active).length

  const filtered = accounts.filter(a => {
    if (filterPlatform !== 'all' && a.platformId !== filterPlatform) return false
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    return true
  })

  function addAccounts(newAccts: ConnectedAccount[]) {
    setAccounts(prev => {
      const existing = new Set(prev.map(a => a.platformId + a.accountHandle))
      return [...prev, ...newAccts.filter(a => !existing.has(a.platformId + a.accountHandle))]
    })
    toast.success(`${newAccts.length} account${newAccts.length > 1 ? 's' : ''} connected`)
  }

  function disconnect(id: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'disconnected' as const, active: false } : a))
    setDisconnect(null); setDetail(null)
    toast.success('Account disconnected')
  }

  function update(id: string, patch: Partial<ConnectedAccount>) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    if (detailAccount?.id === id) setDetail(prev => prev ? { ...prev, ...patch } : prev)
  }

  const platformAccounts = (pid: PlatformId) => accounts.filter(a => a.platformId === pid)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-1 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Social Connect</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Connect social accounts to auto-publish content from the CMS</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setShowPicker(true)}>
          <Plus className="h-3.5 w-3.5" />Connect Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total accounts', value: accounts.length,  icon: Link2,         color: 'text-foreground',  bg: 'bg-muted/40' },
          { label: 'Connected',      value: connected,        icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Need attention', value: withIssues,       icon: AlertCircle,   color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Auto-publish on',value: autoPublish,      icon: Zap,           color: 'text-blue-600',    bg: 'bg-blue-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground leading-tight">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        {([{ id: 'overview' as const, label: 'Overview' }, { id: 'accounts' as const, label: 'All Accounts' }]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
            {tab.id === 'accounts' && <span className="ml-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5">{accounts.length}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {PLATFORMS.map(p => (
            <PlatformCard key={p.id} platform={p} accounts={platformAccounts(p.id)} onConnect={setConnect} />
          ))}
        </div>
      )}

      {/* All Accounts */}
      {activeTab === 'accounts' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">Platform:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setFP('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterPlatform === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
                  All
                </button>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setFP(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterPlatform === p.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
                    <PlatformIcon id={p.id} size={12} />{p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-muted-foreground shrink-0">Status:</span>
              {STATUS_FILTERS.map(f => (
                <button key={f.value} onClick={() => setFS(f.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${filterStatus === f.value ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Account', 'Platform', 'Type', 'Followers', 'Status', 'Auto-publish', 'Active', 'Connected', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">No accounts match the selected filters</td></tr>
                ) : filtered.map(acc => (
                  <tr key={acc.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetail(acc)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {acc.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={acc.avatarUrl} alt={acc.accountName} className="h-8 w-8 rounded-full object-cover border border-border" />
                            : <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center"><span className="text-xs font-bold">{acc.accountName[0]}</span></div>}
                          <div className="absolute -bottom-0.5 -right-0.5"><PlatformIcon id={acc.platformId} size={12} /></div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground flex items-center gap-1">
                            {acc.accountName}
                            {acc.verified && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{acc.accountHandle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon id={acc.platformId} size={14} />
                        <span className="text-xs">{PLATFORMS.find(p => p.id === acc.platformId)?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{acc.accountType}</span></td>
                    <td className="py-3 px-4 text-xs font-medium whitespace-nowrap">{formatFollowers(acc.followers)}</td>
                    <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={acc.status} /></td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <button onClick={() => update(acc.id, { autoPublish: !acc.autoPublish })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${acc.autoPublish ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${acc.autoPublish ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <button onClick={() => update(acc.id, { active: !acc.active })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${acc.active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${acc.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDate(acc.connectedAt)}</td>
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {(acc.status === 'expired' || acc.status === 'error') && (
                          <button title="Reconnect" onClick={() => setConnect(PLATFORMS.find(p => p.id === acc.platformId) ?? null)}
                            className="h-7 px-2 flex items-center gap-1 rounded-md text-[11px] font-medium border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                            <RefreshCw className="h-3 w-3" />Fix
                          </button>
                        )}
                        <button title="Details" onClick={() => setDetail(acc)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button title="Disconnect" onClick={() => setDisconnect(acc)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Unlink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPicker && (
        <PlatformPickerModal
          accounts={accounts}
          onPick={p => { setShowPicker(false); setConnect(p) }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {connectPlatform && (
        <OAuthModal platform={connectPlatform} onClose={() => setConnect(null)} onConnected={addAccounts} />
      )}
      {disconnectTarget && (
        <DisconnectModal account={disconnectTarget} onConfirm={() => disconnect(disconnectTarget.id)} onCancel={() => setDisconnect(null)} />
      )}
      {detailAccount && (
        <AccountDetailPanel
          account={detailAccount}
          onClose={() => setDetail(null)}
          onToggle={() => update(detailAccount.id, { active: !detailAccount.active })}
          onToggleAutoPublish={() => update(detailAccount.id, { autoPublish: !detailAccount.autoPublish })}
          onReconnect={() => { setDetail(null); setConnect(PLATFORMS.find(p => p.id === detailAccount.platformId) ?? null) }}
          onDisconnect={() => { setDetail(null); setDisconnect(detailAccount) }}
        />
      )}
    </div>
  )
}
