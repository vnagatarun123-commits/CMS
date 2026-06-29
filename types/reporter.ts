// Approved contributor who actively submits content.
// Distinct from Contributor (applicant in approval flow).

export type ReporterStatus    = 'active' | 'inactive' | 'suspended'
export type ReporterType      = 'full_time' | 'part_time' | 'freelancer' | 'intern'
export type PaymentMethodType = 'upi' | 'bank_transfer'
export type Designation       =
  | 'Reporter' | 'Stringer' | 'Video Reporter'
  | 'Contributor' | 'Photographer' | 'Anchor' | 'Editor'

export interface ReporterPaymentInfo {
  method: PaymentMethodType | null
  upiId: string | null
  bankAccountNo: string | null
  bankIfsc: string | null
  bankName: string | null
  accountHolderName: string | null
  panNumber: string | null
  isVerified: boolean
}

export interface ReporterContentStats {
  totalImagePosts: number
  totalVideoPosts: number
  totalShortPosts: number
  totalLiveSessions: number
  totalPublished: number
  totalImpressions: number
  publishedThisMonth: number
  pendingReview: number
}

export interface Reporter {
  id: string
  contributorId: string
  organizationId: string
  name: string
  photoUrl: string | null
  mobile: string
  email: string
  designation: Designation
  district: string
  state: string
  reporterType: ReporterType
  language: string
  coverageAreas: string[]
  newsGenres: string[]
  status: ReporterStatus
  approvedAt: Date
  approvedBy: string
  commissionRuleId: string   // 'default' | 'premium' | custom rule id
  payment: ReporterPaymentInfo
  stats: ReporterContentStats
  // Aggregated earnings (kept in sync from settlements)
  lifetimeEarnedInr: number
  lifetimeSettledInr: number
  pendingEarningsInr: number
  currentMonthEarningsInr: number
  annualEarnedInr: number    // Jan–Dec, for TDS threshold check
  tdsDeductedInr: number     // cumulative TDS deducted this year
  adminNotes: string | null
  flaggedForReview: boolean
  createdAt: Date
  updatedAt: Date
}
