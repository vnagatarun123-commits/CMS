'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Check, Camera, Upload, Calendar,
  User, Phone, Mail, MapPin, ChevronDown, FileText, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Professional Details' },
  { id: 3, label: 'Documents' },
  { id: 4, label: 'Review & Submit' },
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

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done    = step.id < current
        const active  = step.id === current
        const isLast  = i === STEPS.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                ${done   ? 'bg-emerald-500 border-emerald-500 text-white'
                : active ? 'bg-primary border-primary text-primary-foreground'
                :          'bg-white border-gray-300 text-gray-400'}`}>
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {/* Label */}
              <span className={`text-[11px] font-medium whitespace-nowrap
                ${done ? 'text-emerald-600' : active ? 'text-red-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors
                ${step.id < current ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
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
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors
              ${active ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelectDropdown({ options, selected, onChange, placeholder }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
  }
  return (
    <div className="relative">
      <div className="min-h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm flex flex-wrap gap-1.5 items-center">
        {selected.length === 0
          ? <span className="text-muted-foreground text-sm">{placeholder}</span>
          : selected.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-xs font-medium">
                {s}
                <button type="button" onClick={() => toggle(s)} className="hover:text-red-900">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))
        }
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
      </div>
      {/* Dropdown options appear below — simple always-visible for now */}
      <div className="mt-1 rounded-md border border-input bg-background shadow-md divide-y divide-border max-h-40 overflow-y-auto absolute z-20 w-full">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer text-sm">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
              className="accent-red-600 h-3.5 w-3.5" />
            {opt}
          </label>
        ))}
      </div>
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
        className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-colors p-4 flex flex-col items-center gap-2 text-center group">
        <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-primary/30 transition-colors">
          <Upload className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          {fileName
            ? <p className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate max-w-[120px]">{fileName}</p>
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
      <h2 className="text-base font-semibold text-foreground mb-0.5">Basic Information</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter the basic details of the contributor</p>

      <div className="flex gap-8">
        {/* Photo upload */}
        <div className="shrink-0">
          <p className="text-xs font-semibold text-foreground mb-1.5">Profile Photo <span className="text-red-500">*</span></p>
          <button type="button" onClick={() => photoRef.current?.click()}
            className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-colors group">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
            ) : (
              <>
                <Camera className="h-7 w-7 text-gray-300 group-hover:text-primary transition-colors" />
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
              <div className="relative w-16 shrink-0">
                <select className="w-full h-9 appearance-none rounded-md border border-input bg-background px-2 pr-6 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>+91</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
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
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
      <h2 className="text-base font-semibold text-foreground mb-0.5">Professional Details</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter professional and coverage related information</p>

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
              className="w-full h-9 rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring">
              <span className={form.districts.length ? 'text-foreground' : 'text-muted-foreground'}>
                {form.districts.length ? `${form.districts.length} selected` : 'Select districts'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showDistricts && (
              <div className="absolute z-20 w-full mt-1 rounded-md border border-input bg-background shadow-md max-h-44 overflow-y-auto">
                {DISTRICTS.map(d => (
                  <label key={d} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer text-sm">
                    <input type="checkbox" className="accent-red-600 h-3.5 w-3.5"
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
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring">
              <span className={form.mandals.length ? 'text-foreground' : 'text-muted-foreground'}>
                {form.mandals.length ? `${form.mandals.length} selected` : 'Select areas / mandals'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {showMandals && (
              <div className="absolute z-20 w-full mt-1 rounded-md border border-input bg-background shadow-md max-h-44 overflow-y-auto">
                {MANDALS.map(m => (
                  <label key={m} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted cursor-pointer text-sm">
                    <input type="checkbox" className="accent-red-600 h-3.5 w-3.5"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
      <h2 className="text-base font-semibold text-foreground mb-0.5">Documents</h2>
      <p className="text-sm text-muted-foreground mb-6">Upload necessary documents for verification</p>

      <div className="grid grid-cols-4 gap-4">
        {DOC_FIELDS.map(doc => (
          <div key={doc.key}>
            <p className="text-xs font-semibold text-foreground mb-1.5">
              {DOC_SECTION_LABELS[doc.key]}{doc.required && <span className="text-red-500 ml-0.5">*</span>}
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

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden mb-5">
      <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

function Step4({ form }: { form: FormState }) {
  const uploadedDocs = Object.entries(DOC_SECTION_LABELS).filter(([k]) => form.docs[k])

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-0.5">Review & Submit</h2>
      <p className="text-sm text-muted-foreground mb-6">Review all details before submitting the contributor profile</p>

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
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="w-44 shrink-0 text-xs text-muted-foreground">{label}</span>
                <span className="text-xs text-foreground truncate">{form.docs[key]}</span>
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
              </div>
            ))}
          </ReviewSection>
        </div>

        {/* Right — summary card */}
        <div className="w-64 shrink-0">
          <div className="rounded-lg border border-border bg-card p-4 sticky top-4">
            <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-border">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-red-300" />
                </div>
              )}
              <p className="font-semibold text-foreground text-sm text-center">{form.fullName || 'Full Name'}</p>
              <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-2.5 py-0.5">
                Pending Approval
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
                  <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
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
    toast.success('Contributor submitted for approval')
    router.push('/dashboard/contributors/approvals')
  }

  function handleSaveDraft() {
    toast.info('Draft saved')
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add New Contributor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in the details to add a new contributor to the platform</p>
        </div>
        <button onClick={() => router.push('/dashboard/contributors/approvals')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Contributors
        </button>
      </div>

      {/* Form body */}
      <div className="flex-1 px-8 py-6 max-w-5xl w-full mx-auto">
        <StepBar current={step} />

        <div className="bg-card rounded-xl border border-border px-8 py-7 min-h-[400px]">
          {step === 1 && <Step1 form={form} setForm={setForm} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
          {step === 4 && <Step4 form={form} />}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border bg-card px-8 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {step === 1 ? (
            <button onClick={() => router.push('/dashboard/contributors/approvals')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          ) : (
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={back}>
              <ArrowLeft className="h-3.5 w-3.5" />Back
            </Button>
          )}

          <div className="flex items-center gap-2.5">
            {step < 4 && (
              <Button variant="outline" size="sm" className="h-9" onClick={handleSaveDraft}>
                Save Draft
              </Button>
            )}
            {step < 4 ? (
              <Button size="sm" className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={next}>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
                <Check className="h-3.5 w-3.5" />Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
