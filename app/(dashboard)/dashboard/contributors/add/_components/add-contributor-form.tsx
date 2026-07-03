'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getStoredContributors, saveStoredContributors } from '@/lib/mock/contributors-store'
import {
  ArrowLeft, ArrowRight, Check, Camera, Upload, Calendar,
  User, Phone, Mail, MapPin, ChevronDown, FileText, Briefcase,
  FileCheck2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Information',    sub: 'Name, contact & photo'        },
  { id: 2, label: 'Professional Details', sub: 'Role, coverage & experience'  },
  { id: 3, label: 'Documents',            sub: 'Identity & verification docs' },
  { id: 4, label: 'Review & Submit',      sub: 'Confirm and add contributor'  },
]

// ── Reference data ────────────────────────────────────────────────────────────

const DESIGNATIONS  = ['Reporter', 'Stringer', 'Video Reporter', 'Contributor', 'Photographer', 'Anchor', 'Editor']
const EXPERIENCES   = ['< 6 Months', '6 Months - 1 Year', '1 - 2 Years', '2 - 5 Years', '5+ Years']
const REPORTER_TYPES = ['Full Time', 'Part Time', 'Freelancer', 'Intern']
const LANGUAGES     = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada', 'Urdu']
const GENDERS       = ['Male', 'Female', 'Other', 'Prefer not to say']
const COVERAGE_AREAS = ['Politics', 'Crime', 'Education', 'Health', 'Sports', 'Entertainment', 'Business', 'Agriculture', 'Technology', 'Others']
const NEWS_GENRES   = ['Breaking News', 'Feature Stories', 'Interviews', 'Investigative', 'Opinion', 'Analysis', 'Live Updates', 'Others']
const DISTRICTS     = ['Hyderabad', 'Karimnagar', 'Warangal', 'Nizamabad', 'Khammam', 'Medak', 'Adilabad', 'Nalgonda', 'Mahbubnagar', 'Rangareddy']
const MANDALS       = ['Charminar', 'Secunderabad', 'LB Nagar', 'Kukatpally', 'Uppal', 'Malkajgiri', 'Serilingampally', 'Medchal', 'Shamirpet', 'Ghatkesar']

// ── Form state shape ──────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  photoUrl: string
  fullName: string
  mobile: string
  email: string
  dob: string
  gender: string
  language: string
  bio: string
  // Step 2
  designation: string
  experience: string
  coverageAreas: string[]
  reporterType: string
  workingSince: string
  newsGenres: string[]
  districts: string[]
  mandals: string[]
  aboutYourself: string
  // Step 3 — just file names for display
  docs: Record<string, string | null>
}

const EMPTY: FormState = {
  photoUrl: '', fullName: '', mobile: '', email: '',
  dob: '', gender: '', language: '', bio: '',
  designation: '', experience: '', coverageAreas: [], reporterType: '',
  workingSince: '', newsGenres: [], districts: [], mandals: [],
  aboutYourself: '',
  docs: {
    aadhaar: null, pan: null, pressCard: null, drivingLicense: null,
    profilePhoto: null, addressProof: null, experienceLetter: null, otherDoc: null,
  },
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="rounded-2xl border bg-card ring-1 ring-border/50 shadow-sm px-8 py-5 mb-6">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done   = step.id < current
          const active = step.id === current
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all
                  ${done || active ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className={`text-sm font-semibold leading-tight truncate ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.sub}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 rounded ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  return (
    <Select value={value || 'none'} onValueChange={v => onChange(v === 'none' ? '' : (v || ''))}>
      <SelectTrigger className="w-full h-9 bg-background border-input text-foreground text-sm rounded-lg">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none" disabled>{placeholder}</SelectItem>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function ChipSelect({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${active ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function UploadBox({ label, subLabel, required, fileName, onFile }: {
  label: string; subLabel: string; required?: boolean; fileName?: string | null; onFile?: (name: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <button type="button" onClick={() => ref.current?.click()}
        className={`w-full rounded-xl border-2 border-dashed transition-colors p-4 flex flex-col items-center gap-2 text-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${fileName
            ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15'
            : 'border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5'}`}>
        <div className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors
          ${fileName ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/25' : 'bg-card border-border group-hover:border-primary/30'}`}>
          {fileName
            ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            : <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">
            {label}{required && <span className="text-destructive ml-0.5">*</span>}
          </p>
          {fileName
            ? <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 truncate max-w-[120px]">{fileName}</p>
            : <p className="text-[10px] text-muted-foreground mt-0.5">{subLabel}</p>
          }
        </div>
      </button>
      <input ref={ref} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onFile?.(f.name)
        }} />
    </div>
  )
}

// ── Step 1: Basic Information ─────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const photoRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-0.5">Basic Information</h2>
      <p className="text-[13px] text-muted-foreground mb-6">Enter the basic details of the contributor</p>

      <div className="flex gap-8">
        {/* Photo upload */}
        <div className="shrink-0">
          <p className="text-xs font-semibold text-foreground mb-1.5">Profile Photo <span className="text-destructive">*</span></p>
          <button type="button" onClick={() => photoRef.current?.click()}
            className="h-32 w-32 rounded-xl border-2 border-dashed border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="Preview" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <>
                <Camera className="h-7 w-7 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                <p className="text-[10px] text-muted-foreground font-medium">Upload Photo</p>
                <p className="text-[9px] text-muted-foreground">JPG, PNG (Max. 2MB)</p>
              </>
            )}
          </button>
          <input ref={photoRef} type="file" className="hidden" accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) setForm(p => ({ ...p, photoUrl: URL.createObjectURL(f) }))
            }} />
        </div>

        {/* Fields grid */}
        <div className="flex-1 grid grid-cols-3 gap-x-5 gap-y-4">
          <Field label="Full Name" required>
            <Input placeholder="Enter full name" value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} className="h-9 text-sm" />
          </Field>

          <Field label="Mobile Number" required>
            <div className="flex gap-1.5">
              <div className="w-20 shrink-0">
                <Select value="+91" disabled>
                  <SelectTrigger aria-label="Country code" className="w-full h-9 bg-background border-input text-xs rounded-lg text-foreground px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Enter mobile number" value={form.mobile} type="tel"
                onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="h-9 text-sm flex-1" />
            </div>
          </Field>

          <Field label="Email Address" required>
            <Input placeholder="Enter email address" value={form.email} type="email"
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" />
          </Field>

          <Field label="Date of Birth" required>
            <div className="relative">
              <input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 pr-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </Field>

          <Field label="Gender" required>
            <SelectField value={form.gender} onChange={v => setForm(p => ({ ...p, gender: v }))}
              options={GENDERS} placeholder="Select gender" />
          </Field>

          <Field label="Preferred Language" required>
            <SelectField value={form.language} onChange={v => setForm(p => ({ ...p, language: v }))}
              options={LANGUAGES} placeholder="Select language" />
          </Field>

          <div className="col-span-3">
            <Field label="Short Bio">
              <div className="relative">
                <textarea rows={3} placeholder="Write a short bio about the contributor…"
                  value={form.bio} maxLength={250}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 pb-6 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {form.bio.length}/250
                </span>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Professional Details ──────────────────────────────────────────────

function Step2({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [showDistricts, setShowDistricts] = useState(false)
  const [showMandals,   setShowMandals]   = useState(false)

  return (
    <div>
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-0.5">Professional Details</h2>
      <p className="text-[13px] text-muted-foreground mb-6">Enter professional and coverage related information</p>

      <div className="grid grid-cols-3 gap-x-5 gap-y-5">

        <Field label="Designation / Role" required>
          <SelectField value={form.designation} onChange={v => setForm(p => ({ ...p, designation: v }))}
            options={DESIGNATIONS} placeholder="Select designation" />
        </Field>

        <Field label="Experience" required>
          <SelectField value={form.experience} onChange={v => setForm(p => ({ ...p, experience: v }))}
            options={EXPERIENCES} placeholder="Select experience" />
        </Field>

        <Field label="Primary Coverage Areas (Select all that apply)" required>
          <ChipSelect options={COVERAGE_AREAS} selected={form.coverageAreas}
            onChange={v => setForm(p => ({ ...p, coverageAreas: v }))} />
        </Field>

        <Field label="Reporter Type" required>
          <SelectField value={form.reporterType} onChange={v => setForm(p => ({ ...p, reporterType: v }))}
            options={REPORTER_TYPES} placeholder="Select reporter type" />
        </Field>

        <Field label="Working Since">
          <div className="relative">
            <input type="date" value={form.workingSince}
              onChange={e => setForm(p => ({ ...p, workingSince: e.target.value }))}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 pr-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </Field>

        <Field label="News Genres (Select all that apply)">
          <ChipSelect options={NEWS_GENRES} selected={form.newsGenres}
            onChange={v => setForm(p => ({ ...p, newsGenres: v }))} />
        </Field>

        {/* Districts — inline multi-select */}
        <Field label="Districts Available For Coverage" required>
          <div className="relative">
            <button type="button" onClick={() => setShowDistricts(s => !s)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring">
              <span className={form.districts.length ? 'text-foreground' : 'text-muted-foreground'}>
                {form.districts.length ? `${form.districts.length} selected` : 'Select districts'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showDistricts ? 'rotate-180' : ''}`} />
            </button>
            {showDistricts && (
              <div className="absolute z-20 w-full mt-1 rounded-lg border border-input bg-popover text-popover-foreground shadow-md max-h-44 overflow-y-auto">
                {DISTRICTS.map(d => (
                  <label key={d} className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                    <input type="checkbox" className="accent-primary h-3.5 w-3.5"
                      checked={form.districts.includes(d)}
                      onChange={() => setForm(p => ({
                        ...p,
                        districts: p.districts.includes(d) ? p.districts.filter(x => x !== d) : [...p.districts, d],
                      }))} />
                    {d}
                  </label>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Mandals */}
        <Field label="Areas / Mandals">
          <div className="relative">
            <button type="button" onClick={() => setShowMandals(s => !s)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring">
              <span className={form.mandals.length ? 'text-foreground' : 'text-muted-foreground'}>
                {form.mandals.length ? `${form.mandals.length} selected` : 'Select areas / mandals'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showMandals ? 'rotate-180' : ''}`} />
            </button>
            {showMandals && (
              <div className="absolute z-20 w-full mt-1 rounded-lg border border-input bg-popover text-popover-foreground shadow-md max-h-44 overflow-y-auto">
                {MANDALS.map(m => (
                  <label key={m} className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm">
                    <input type="checkbox" className="accent-primary h-3.5 w-3.5"
                      checked={form.mandals.includes(m)}
                      onChange={() => setForm(p => ({
                        ...p,
                        mandals: p.mandals.includes(m) ? p.mandals.filter(x => x !== m) : [...p.mandals, m],
                      }))} />
                    {m}
                  </label>
                ))}
              </div>
            )}
          </div>
        </Field>

        <div className="col-span-3">
          <Field label="Tell us about yourself">
            <div className="relative">
              <textarea rows={3} maxLength={500} placeholder="Write about your experience, strengths and the type of stories you cover…"
                value={form.aboutYourself}
                onChange={e => setForm(p => ({ ...p, aboutYourself: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pb-6 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                {form.aboutYourself.length}/500
              </span>
            </div>
          </Field>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Documents ─────────────────────────────────────────────────────────

const DOC_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: 'aadhaar',          label: 'Upload Aadhaar Card',        required: true  },
  { key: 'pan',              label: 'Upload PAN Card',            required: true  },
  { key: 'pressCard',        label: 'Upload ID Card',             required: true  },
  { key: 'drivingLicense',   label: 'Upload License',             required: false },
  { key: 'profilePhoto',     label: 'Upload Photo',               required: true  },
  { key: 'addressProof',     label: 'Upload Address Proof',       required: true  },
  { key: 'experienceLetter', label: 'Upload Experience Letter',   required: false },
  { key: 'otherDoc',         label: 'Upload Other Document',      required: false },
]

const DOC_SECTION_LABELS: Record<string, string> = {
  aadhaar:          'Aadhaar Card',
  pan:              'PAN Card',
  pressCard:        'Reporter ID / Press Card',
  drivingLicense:   'Driving License (Optional)',
  profilePhoto:     'Profile Photo',
  addressProof:     'Address Proof',
  experienceLetter: 'Experience Letter (Optional)',
  otherDoc:         'Other Documents (Optional)',
}

function Step3({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-0.5">Documents</h2>
      <p className="text-[13px] text-muted-foreground mb-6">Upload necessary documents for verification</p>

      <div className="grid grid-cols-4 gap-4">
        {DOC_FIELDS.map(doc => (
          <div key={doc.key}>
            <p className="text-xs font-semibold text-foreground mb-1.5">
              {DOC_SECTION_LABELS[doc.key]}{doc.required && <span className="text-destructive ml-0.5">*</span>}
            </p>
            <UploadBox
              label={doc.label}
              subLabel="JPG, PNG, PDF (Max. 5MB)"
              required={doc.required}
              fileName={form.docs[doc.key]}
              onFile={name => setForm(p => ({ ...p, docs: { ...p.docs, [doc.key]: name } }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 4: Review & Submit ───────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-4 py-2 border-b border-border last:border-0">
      <span className="w-40 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground flex-1">{value || <span className="text-muted-foreground italic">Not provided</span>}</span>
    </div>
  )
}

function ReviewSection({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card ring-1 ring-border/50 overflow-hidden mb-5">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
        {badge}
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

function Step4({ form }: { form: FormState }) {
  const uploadedDocs = Object.entries(DOC_SECTION_LABELS).filter(([k]) => form.docs[k])

  return (
    <div>
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-0.5">Review & Submit</h2>
      <p className="text-[13px] text-muted-foreground mb-6">Review all details before submitting the contributor profile</p>

      <div className="flex gap-6">
        {/* Left — form data */}
        <div className="flex-1 min-w-0">
          <ReviewSection title="Basic Information">
            {form.photoUrl && (
              <div className="py-3 border-b border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-border" />
              </div>
            )}
            <ReviewRow label="Full Name"    value={form.fullName} />
            <ReviewRow label="Mobile"       value={form.mobile ? `+91 ${form.mobile}` : null} />
            <ReviewRow label="Email"        value={form.email} />
            <ReviewRow label="Date of Birth" value={form.dob} />
            <ReviewRow label="Gender"       value={form.gender} />
            <ReviewRow label="Language"     value={form.language} />
            <ReviewRow label="Short Bio"    value={form.bio} />
          </ReviewSection>

          <ReviewSection title="Professional Details">
            <ReviewRow label="Designation"      value={form.designation} />
            <ReviewRow label="Experience"        value={form.experience} />
            <ReviewRow label="Reporter Type"     value={form.reporterType} />
            <ReviewRow label="Working Since"     value={form.workingSince} />
            <ReviewRow label="Coverage Areas"    value={form.coverageAreas.join(', ')} />
            <ReviewRow label="News Genres"       value={form.newsGenres.join(', ')} />
            <ReviewRow label="Districts"         value={form.districts.join(', ')} />
            <ReviewRow label="Mandals"           value={form.mandals.join(', ')} />
            <ReviewRow label="About"             value={form.aboutYourself} />
          </ReviewSection>

          <ReviewSection title="Documents">
            {uploadedDocs.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground italic">No documents uploaded.</p>
            ) : uploadedDocs.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="w-44 shrink-0 text-xs text-muted-foreground">{label}</span>
                <span className="text-xs text-foreground truncate">{form.docs[key]}</span>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto" />
              </div>
            ))}
          </ReviewSection>
        </div>

        {/* Right — summary card */}
        <div className="w-64 shrink-0">
          <div className="rounded-xl border bg-card ring-1 ring-border/50 p-4 sticky top-4">
            <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-border">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/12 border-2 border-primary/15 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary/60" />
                </div>
              )}
              <p className="font-semibold text-foreground text-sm text-center">{form.fullName || 'Full Name'}</p>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 text-[11px] font-semibold px-2.5 py-0.5">
                CMS · Active
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {form.designation && (
                <div className="flex gap-2"><span className="text-muted-foreground w-16 shrink-0">Role</span><span className="text-foreground">{form.designation}</span></div>
              )}
              {form.mobile && (
                <div className="flex gap-2"><Phone className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" /><span className="text-foreground">+91 {form.mobile}</span></div>
              )}
              {form.email && (
                <div className="flex gap-2"><Mail className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" /><span className="text-foreground truncate">{form.email}</span></div>
              )}
              {form.districts.length > 0 && (
                <div className="flex gap-2"><MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" /><span className="text-foreground">{form.districts.slice(0,2).join(', ')}{form.districts.length > 2 ? ` +${form.districts.length - 2}` : ''}</span></div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Completeness</p>
              {[
                { label: 'Basic Info',     done: !!(form.fullName && form.mobile && form.email) },
                { label: 'Professional',   done: !!(form.designation && form.experience) },
                { label: 'Documents',      done: !!(form.docs.aadhaar && form.docs.pan) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 mb-1.5">
                  <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500 dark:bg-emerald-500' : 'bg-muted border border-border'}`}>
                    {item.done && <Check className="h-2 w-2 text-white" />}
                  </div>
                  <span className={`text-[11px] ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function AddContributorForm() {
  const router = useRouter()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState<FormState>(EMPTY)

  function next() { setStep(s => Math.min(4, s + 1)); window.scrollTo(0, 0) }
  function back() { setStep(s => Math.max(1, s - 1)); window.scrollTo(0, 0) }

  function handleSubmit() {
    const list = getStoredContributors()
    const randomSuffix = Math.random().toString(36).substring(2, 9)
    const newId = `c_${randomSuffix}`
    const randomIdNum = Math.floor(100000 + Math.random() * 900000)
    const contributorId = `CON${randomIdNum}`

    const newContributor = {
      id: newId,
      contributorId,
      name: form.fullName,
      photoUrl: form.photoUrl || null,
      mobile: form.mobile,
      email: form.email,
      designation: form.designation || 'Reporter',
      reporterType: (form.reporterType || 'Full Time') as any,
      district: form.districts[0] || 'Hyderabad',
      experience: form.experience || '1 Year',
      appliedOn: new Date(),
      status: 'approved' as const,
      contributorSource: 'CMS' as const,
      approvedOn: new Date(),
      dob: form.dob || '—',
      gender: form.gender || '—',
      address: 'Telangana, India',
      source: 'CMS Web Panel',
      bio: form.bio || '',
      language: form.language || 'Telugu',
      coverageAreas: form.coverageAreas,
      newsGenres: form.newsGenres,
      documents: [
        { label: 'Aadhaar Card', submitted: !!form.docs.aadhaar },
        { label: 'PAN Card', submitted: !!form.docs.pan },
        { label: 'Press Card', submitted: !!form.docs.pressCard },
        { label: 'Profile Photo', submitted: !!form.docs.profilePhoto },
        { label: 'Address Proof', submitted: !!form.docs.addressProof },
      ]
    }

    list.push(newContributor)
    saveStoredContributors(list)

    toast.success('Contributor added successfully')
    router.push('/dashboard/contributors')
  }

  function handleSaveDraft() {
    toast.info('Draft saved')
  }

  const STEP_ICONS = [
    <User      key="1" className="h-3.5 w-3.5 text-primary" />,
    <Briefcase key="2" className="h-3.5 w-3.5 text-primary" />,
    <FileText  key="3" className="h-3.5 w-3.5 text-primary" />,
    <Check     key="4" className="h-3.5 w-3.5 text-primary" />,
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto w-full px-6 py-10">

        {/* Page title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Contributor</h1>
            <p className="text-[14px] text-muted-foreground mt-1">Fill in the details to add a new contributor to the platform</p>
          </div>
          <button onClick={() => router.push('/dashboard/contributors')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="h-4 w-4" /> Back to Contributors
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="rounded-2xl border bg-card ring-1 ring-border/50 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/40">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              {STEP_ICONS[step - 1]}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{STEPS[step - 1]!.label}</h2>
              <p className="text-[13px] text-muted-foreground">{STEPS[step - 1]!.sub}</p>
            </div>
          </div>

          {/* Step content */}
          <div className="px-8 py-7">
            {step === 1 && <Step1 form={form} setForm={setForm} />}
            {step === 2 && <Step2 form={form} setForm={setForm} />}
            {step === 3 && <Step3 form={form} setForm={setForm} />}
            {step === 4 && <Step4 form={form} />}
          </div>

          {/* Footer inside card */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="outline" className="gap-1.5" onClick={step === 1 ? () => router.push('/dashboard/contributors') : back}>
              {step === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" /> Back
                </>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <p className="hidden sm:block text-[12px] text-muted-foreground tabular-nums">
                Step {step} of {STEPS.length}
              </p>
              {step < 4 && (
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px] gap-1.5">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[150px] gap-1.5">
                  <Check className="h-4 w-4" /> Add Contributor
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
