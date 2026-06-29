// Earnings, commission rules, settlements, and redemptions for reporters.

export type ContentType      = 'image' | 'video' | 'short' | 'live'
export type EarningMode      = 'post_based' | 'impression_based'
export type SettlementStatus = 'pending' | 'processing' | 'settled' | 'on_hold' | 'partially_paid'
export type RedemptionStatus = 'pending' | 'approved' | 'rejected'

// ── Commission rule ───────────────────────────────────────────────────────────

export interface CommissionRule {
  id: string
  organizationId: string
  name: string
  description: string
  isDefault: boolean
  earningMode: EarningMode

  // Post-based rates (₹ per published/approved post)
  imagePostRateInr: number
  videoPostRateInr: number
  shortPostRateInr: number
  liveSessionRateInr: number

  // Impression-based CPM (₹ per 1,000 impressions)
  imageCpmInr: number
  videoCpmInr: number
  shortCpmInr: number
  liveCpmInr: number

  // Bonus rules (null = disabled)
  reachBonusThreshold: number | null    // impressions per post to trigger
  reachBonusAmountInr: number | null    // ₹ bonus per qualifying post
  viralBonusThreshold: number | null    // higher tier impression threshold
  viralBonusAmountInr: number | null    // additional ₹ bonus (stacks with reach)
  volumeBonusThreshold: number | null   // total posts in a month to trigger
  volumeBonusAmountInr: number | null   // flat ₹ bonus for the month
  streakBonusMonths: number | null      // consecutive active months needed
  streakBonusAmountInr: number | null   // flat ₹ bonus per qualifying month

  // TDS (Section 194J — platform deducts before paying)
  tdsApplicable: boolean
  tdsThresholdInr: number     // annual payout above this → TDS kicks in (default ₹15,000)
  tdsRatePercent: number      // default 10%

  createdAt: Date
  updatedAt: Date
}

// ── Monthly earning breakdown ─────────────────────────────────────────────────

export interface MonthlyEarningBreakdown {
  imagePosts: number
  imageEarningsInr: number
  videoPosts: number
  videoEarningsInr: number
  shortPosts: number
  shortEarningsInr: number
  liveSessions: number
  liveEarningsInr: number
  totalImpressions: number
  // Bonuses
  reachBonusCount: number    // posts that crossed reach threshold
  reachBonusInr: number
  viralBonusCount: number
  viralBonusInr: number
  volumeBonusInr: number     // flat monthly bonus
  streakBonusInr: number     // flat monthly bonus
  grossEarningsInr: number   // sum of all above
}

// ── Settlement ────────────────────────────────────────────────────────────────

export interface Settlement {
  id: string
  organizationId: string
  reporterId: string
  reporterName: string
  period: string          // 'YYYY-MM'
  periodLabel: string     // 'June 2026'
  breakdown: MonthlyEarningBreakdown
  manualAdjustmentInr: number          // positive = bonus, negative = deduction
  manualAdjustmentNote: string | null
  tdsDeductedInr: number
  netPayableInr: number
  status: SettlementStatus
  paymentMethod: 'upi' | 'bank_transfer' | null
  paymentReference: string | null      // UTR / UPI transaction ref
  partialAmountPaidInr: number | null  // if partially_paid
  paidAt: Date | null
  paidBy: string | null
  onHoldReason: string | null
  redemptionRequestId: string | null   // links back to a redemption if triggered by one
  createdAt: Date
  settledAt: Date | null
}

// ── Redemption request ────────────────────────────────────────────────────────

export interface RedemptionRequest {
  id: string
  organizationId: string
  reporterId: string
  reporterName: string
  requestedAt: Date
  period: string               // which month's balance they're drawing from
  amountRequestedInr: number
  availableBalanceInr: number  // unsettled balance at time of request
  status: RedemptionStatus
  reporterNote: string | null
  reviewedAt: Date | null
  reviewedBy: string | null
  adminNote: string | null
  settlementId: string | null  // created when approved
}

// ── Manual adjustment ─────────────────────────────────────────────────────────

export interface ManualAdjustment {
  id: string
  organizationId: string
  reporterId: string
  reporterName: string
  period: string
  amountInr: number     // positive = bonus credit, negative = deduction
  reason: string
  createdAt: Date
  createdBy: string
}
