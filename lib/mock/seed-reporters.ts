import type { Reporter } from '@/types/reporter'
import type { CommissionRule, Settlement, RedemptionRequest, ManualAdjustment, MonthlyEarningBreakdown } from '@/types/earnings'

const ORG = 'org_puralocal'

// ── Commission rules ──────────────────────────────────────────────────────────

export const COMMISSION_RULES: CommissionRule[] = [
  {
    id: 'rule_standard',
    organizationId: ORG,
    name: 'Standard',
    description: 'Default rule for all reporters — post-based flat rates with reach & volume bonuses',
    isDefault: true,
    earningMode: 'post_based',
    imagePostRateInr: 15,
    videoPostRateInr: 40,
    shortPostRateInr: 25,
    liveSessionRateInr: 100,
    imageCpmInr: 5,
    videoCpmInr: 15,
    shortCpmInr: 10,
    liveCpmInr: 20,
    reachBonusThreshold: 10000,
    reachBonusAmountInr: 50,
    viralBonusThreshold: 50000,
    viralBonusAmountInr: 200,
    volumeBonusThreshold: 20,
    volumeBonusAmountInr: 300,
    streakBonusMonths: 3,
    streakBonusAmountInr: 500,
    tdsApplicable: true,
    tdsThresholdInr: 15000,
    tdsRatePercent: 10,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'rule_premium',
    organizationId: ORG,
    name: 'Premium',
    description: 'High-output reporters with proven track record — higher base rates and higher bonuses',
    isDefault: false,
    earningMode: 'post_based',
    imagePostRateInr: 25,
    videoPostRateInr: 60,
    shortPostRateInr: 40,
    liveSessionRateInr: 150,
    imageCpmInr: 8,
    videoCpmInr: 22,
    shortCpmInr: 15,
    liveCpmInr: 30,
    reachBonusThreshold: 10000,
    reachBonusAmountInr: 100,
    viralBonusThreshold: 50000,
    viralBonusAmountInr: 400,
    volumeBonusThreshold: 25,
    volumeBonusAmountInr: 600,
    streakBonusMonths: 3,
    streakBonusAmountInr: 1000,
    tdsApplicable: true,
    tdsThresholdInr: 15000,
    tdsRatePercent: 10,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
  },
]

// ── Reporters ─────────────────────────────────────────────────────────────────

export const SEED_REPORTERS: Reporter[] = [
  {
    id: 'r001', contributorId: 'CON250101', organizationId: ORG,
    name: 'Venkatesh Rao', photoUrl: null, mobile: '9876543201', email: 'venkatesh.rao@gmail.com',
    designation: 'Reporter', district: 'Hyderabad', state: 'Telangana',
    reporterType: 'full_time', language: 'Telugu',
    coverageAreas: ['Politics', 'Crime'], newsGenres: ['Breaking News', 'Investigative'],
    status: 'active', approvedAt: new Date('2025-02-10'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: 'upi', upiId: 'venkatesh.rao@okaxis', bankAccountNo: null, bankIfsc: null, bankName: null, accountHolderName: 'Venkatesh Rao', panNumber: 'ABCPV1234D', isVerified: true },
    stats: { totalImagePosts: 86, totalVideoPosts: 32, totalShortPosts: 18, totalLiveSessions: 6, totalPublished: 142, totalImpressions: 412000, publishedThisMonth: 8, pendingReview: 2 },
    lifetimeEarnedInr: 9840, lifetimeSettledInr: 8420, pendingEarningsInr: 1420, currentMonthEarningsInr: 750, annualEarnedInr: 6120, tdsDeductedInr: 0,
    adminNotes: null, flaggedForReview: false,
    createdAt: new Date('2025-02-10'), updatedAt: new Date('2026-06-20'),
  },
  {
    id: 'r002', contributorId: 'CON250102', organizationId: ORG,
    name: 'Priya Sharma', photoUrl: null, mobile: '9912345678', email: 'priya.sharma@gmail.com',
    designation: 'Stringer', district: 'Karimnagar', state: 'Telangana',
    reporterType: 'part_time', language: 'Telugu',
    coverageAreas: ['Education', 'Health'], newsGenres: ['Feature Stories', 'Analysis'],
    status: 'active', approvedAt: new Date('2025-03-15'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: 'bank_transfer', upiId: null, bankAccountNo: '****4521', bankIfsc: 'HDFC0001234', bankName: 'HDFC Bank', accountHolderName: 'Priya Sharma', panNumber: 'BCDPS5678E', isVerified: true },
    stats: { totalImagePosts: 42, totalVideoPosts: 8, totalShortPosts: 12, totalLiveSessions: 0, totalPublished: 62, totalImpressions: 168000, publishedThisMonth: 5, pendingReview: 1 },
    lifetimeEarnedInr: 3960, lifetimeSettledInr: 3480, pendingEarningsInr: 480, currentMonthEarningsInr: 320, annualEarnedInr: 2640, tdsDeductedInr: 0,
    adminNotes: null, flaggedForReview: false,
    createdAt: new Date('2025-03-15'), updatedAt: new Date('2026-06-18'),
  },
  {
    id: 'r003', contributorId: 'CON250103', organizationId: ORG,
    name: 'Mohammed Saleem', photoUrl: null, mobile: '9988776601', email: 'saleem.m@gmail.com',
    designation: 'Video Reporter', district: 'Warangal', state: 'Telangana',
    reporterType: 'full_time', language: 'Telugu',
    coverageAreas: ['Politics', 'Sports', 'Entertainment'], newsGenres: ['Breaking News', 'Live Updates', 'Interviews'],
    status: 'active', approvedAt: new Date('2025-01-05'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_premium',
    payment: { method: 'upi', upiId: 'saleem@ybl', bankAccountNo: null, bankIfsc: null, bankName: null, accountHolderName: 'Mohammed Saleem', panNumber: 'CDEPM9012F', isVerified: true },
    stats: { totalImagePosts: 58, totalVideoPosts: 124, totalShortPosts: 76, totalLiveSessions: 18, totalPublished: 276, totalImpressions: 1840000, publishedThisMonth: 22, pendingReview: 4 },
    lifetimeEarnedInr: 38420, lifetimeSettledInr: 34200, pendingEarningsInr: 4220, currentMonthEarningsInr: 3180, annualEarnedInr: 22600, tdsDeductedInr: 760,
    adminNotes: 'Top performer. Premium rule applied. TDS PAN verified.', flaggedForReview: false,
    createdAt: new Date('2025-01-05'), updatedAt: new Date('2026-06-25'),
  },
  {
    id: 'r004', contributorId: 'CON250601', organizationId: ORG,
    name: 'Anjali Devi', photoUrl: null, mobile: '9394949494', email: 'anjali.devi@gmail.com',
    designation: 'Contributor', district: 'Khammam', state: 'Telangana',
    reporterType: 'freelancer', language: 'Telugu',
    coverageAreas: ['Health', 'Agriculture'], newsGenres: ['Feature Stories', 'Analysis'],
    status: 'active', approvedAt: new Date('2025-05-28'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: 'upi', upiId: 'anjali.devi@paytm', bankAccountNo: null, bankIfsc: null, bankName: null, accountHolderName: 'Anjali Devi', panNumber: 'DEFPA3456G', isVerified: false },
    stats: { totalImagePosts: 28, totalVideoPosts: 4, totalShortPosts: 8, totalLiveSessions: 0, totalPublished: 40, totalImpressions: 82000, publishedThisMonth: 4, pendingReview: 0 },
    lifetimeEarnedInr: 2180, lifetimeSettledInr: 1800, pendingEarningsInr: 380, currentMonthEarningsInr: 180, annualEarnedInr: 1580, tdsDeductedInr: 0,
    adminNotes: 'PAN not yet verified — hold TDS if annual crosses ₹15K.', flaggedForReview: false,
    createdAt: new Date('2025-05-28'), updatedAt: new Date('2026-06-15'),
  },
  {
    id: 'r005', contributorId: 'CON250104', organizationId: ORG,
    name: 'Ravi Teja', photoUrl: null, mobile: '9000098701', email: 'ravi.teja@gmail.com',
    designation: 'Reporter', district: 'Nizamabad', state: 'Telangana',
    reporterType: 'full_time', language: 'Telugu',
    coverageAreas: ['Agriculture', 'Politics'], newsGenres: ['Breaking News', 'Feature Stories'],
    status: 'active', approvedAt: new Date('2025-04-01'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: 'bank_transfer', upiId: null, bankAccountNo: '****8834', bankIfsc: 'SBIN0012345', bankName: 'State Bank of India', accountHolderName: 'Ravi Teja', panNumber: 'EFGRT7890H', isVerified: true },
    stats: { totalImagePosts: 64, totalVideoPosts: 18, totalShortPosts: 22, totalLiveSessions: 4, totalPublished: 108, totalImpressions: 296000, publishedThisMonth: 10, pendingReview: 3 },
    lifetimeEarnedInr: 7620, lifetimeSettledInr: 6400, pendingEarningsInr: 1220, currentMonthEarningsInr: 880, annualEarnedInr: 5280, tdsDeductedInr: 0,
    adminNotes: null, flaggedForReview: false,
    createdAt: new Date('2025-04-01'), updatedAt: new Date('2026-06-22'),
  },
  {
    id: 'r006', contributorId: 'CON250105', organizationId: ORG,
    name: 'Suresh Kumar', photoUrl: null, mobile: '9512345601', email: 'suresh.k@gmail.com',
    designation: 'Video Reporter', district: 'Adilabad', state: 'Telangana',
    reporterType: 'part_time', language: 'Telugu',
    coverageAreas: ['Crime', 'Sports'], newsGenres: ['Breaking News', 'Live Updates'],
    status: 'active', approvedAt: new Date('2025-04-20'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: null, upiId: null, bankAccountNo: null, bankIfsc: null, bankName: null, accountHolderName: null, panNumber: null, isVerified: false },
    stats: { totalImagePosts: 18, totalVideoPosts: 28, totalShortPosts: 14, totalLiveSessions: 3, totalPublished: 63, totalImpressions: 142000, publishedThisMonth: 6, pendingReview: 1 },
    lifetimeEarnedInr: 4860, lifetimeSettledInr: 3600, pendingEarningsInr: 1260, currentMonthEarningsInr: 540, annualEarnedInr: 3120, tdsDeductedInr: 0,
    adminNotes: 'Payment info not set up — cannot settle until UPI or bank added.', flaggedForReview: true,
    createdAt: new Date('2025-04-20'), updatedAt: new Date('2026-06-10'),
  },
  {
    id: 'r007', contributorId: 'CON250106', organizationId: ORG,
    name: 'Lakshmi Narayana', photoUrl: null, mobile: '9345678901', email: 'lakshmi.n@gmail.com',
    designation: 'Reporter', district: 'Medak', state: 'Telangana',
    reporterType: 'full_time', language: 'Telugu',
    coverageAreas: ['Politics', 'Business'], newsGenres: ['Investigative', 'Analysis', 'Breaking News'],
    status: 'active', approvedAt: new Date('2025-01-20'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_premium',
    payment: { method: 'bank_transfer', upiId: null, bankAccountNo: '****2267', bankIfsc: 'ICIC0005678', bankName: 'ICICI Bank', accountHolderName: 'Lakshmi Narayana', panNumber: 'GHILN2345I', isVerified: true },
    stats: { totalImagePosts: 72, totalVideoPosts: 46, totalShortPosts: 38, totalLiveSessions: 12, totalPublished: 168, totalImpressions: 920000, publishedThisMonth: 14, pendingReview: 2 },
    lifetimeEarnedInr: 24600, lifetimeSettledInr: 22000, pendingEarningsInr: 2600, currentMonthEarningsInr: 1980, annualEarnedInr: 14400, tdsDeductedInr: 0,
    adminNotes: 'Premium rule. Close to TDS threshold — monitor.', flaggedForReview: false,
    createdAt: new Date('2025-01-20'), updatedAt: new Date('2026-06-24'),
  },
  {
    id: 'r008', contributorId: 'CON250107', organizationId: ORG,
    name: 'Kavitha Reddy', photoUrl: null, mobile: '9601234501', email: 'kavitha.r@gmail.com',
    designation: 'Reporter', district: 'Nalgonda', state: 'Telangana',
    reporterType: 'freelancer', language: 'Telugu',
    coverageAreas: ['Health', 'Education', 'Agriculture'], newsGenres: ['Feature Stories', 'Interviews'],
    status: 'inactive',
    approvedAt: new Date('2025-06-01'), approvedBy: 'admin@puralocal.in',
    commissionRuleId: 'rule_standard',
    payment: { method: 'upi', upiId: 'kavitha.r@gpay', bankAccountNo: null, bankIfsc: null, bankName: null, accountHolderName: 'Kavitha Reddy', panNumber: 'IJKRK6789J', isVerified: true },
    stats: { totalImagePosts: 14, totalVideoPosts: 2, totalShortPosts: 4, totalLiveSessions: 0, totalPublished: 20, totalImpressions: 38000, publishedThisMonth: 0, pendingReview: 0 },
    lifetimeEarnedInr: 1140, lifetimeSettledInr: 1140, pendingEarningsInr: 0, currentMonthEarningsInr: 0, annualEarnedInr: 860, tdsDeductedInr: 0,
    adminNotes: 'Went inactive after July 2025. No posts since.', flaggedForReview: false,
    createdAt: new Date('2025-06-01'), updatedAt: new Date('2025-08-01'),
  },
]

// ── Settlements ───────────────────────────────────────────────────────────────

function bd(
  img: number, vid: number, sht: number, liv: number,
  imgE: number, vidE: number, shtE: number, livE: number,
  impr: number,
  rBonCnt: number, rBon: number, vBonCnt: number, vBon: number,
  volBon: number, strkBon: number,
): MonthlyEarningBreakdown {
  const gross = imgE + vidE + shtE + livE + rBon + vBon + volBon + strkBon
  return {
    imagePosts: img, imageEarningsInr: imgE,
    videoPosts: vid, videoEarningsInr: vidE,
    shortPosts: sht, shortEarningsInr: shtE,
    liveSessions: liv, liveEarningsInr: livE,
    totalImpressions: impr,
    reachBonusCount: rBonCnt, reachBonusInr: rBon,
    viralBonusCount: vBonCnt, viralBonusInr: vBon,
    volumeBonusInr: volBon, streakBonusInr: strkBon,
    grossEarningsInr: gross,
  }
}

export const SEED_SETTLEMENTS: Settlement[] = [
  // ── April 2026 — all settled ────────────────────────────────────────────────
  {
    id: 's001', organizationId: ORG, reporterId: 'r001', reporterName: 'Venkatesh Rao',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(14, 5, 3, 1, 210, 200, 75, 100, 128000, 2, 100, 0, 0, 300, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 985,
    status: 'settled', paymentMethod: 'upi', paymentReference: 'UPI26041234567', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-05'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-05'),
  },
  {
    id: 's002', organizationId: ORG, reporterId: 'r002', reporterName: 'Priya Sharma',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(8, 2, 3, 0, 120, 80, 75, 0, 52000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 275,
    status: 'settled', paymentMethod: 'bank_transfer', paymentReference: 'NEFT2604987654', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-06'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-06'),
  },
  {
    id: 's003', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(10, 22, 14, 3, 250, 1320, 560, 450, 480000, 8, 800, 3, 1200, 600, 1000),
    manualAdjustmentInr: 500, manualAdjustmentNote: 'Bonus for exclusive election coverage',
    tdsDeductedInr: 718, netPayableInr: 6462,
    status: 'settled', paymentMethod: 'upi', paymentReference: 'UPI26041876543', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-04'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-04'),
  },
  {
    id: 's004', organizationId: ORG, reporterId: 'r004', reporterName: 'Anjali Devi',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(6, 1, 2, 0, 90, 40, 50, 0, 28000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 180,
    status: 'settled', paymentMethod: 'upi', paymentReference: 'UPI26042234567', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-07'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-07'),
  },
  {
    id: 's005', organizationId: ORG, reporterId: 'r005', reporterName: 'Ravi Teja',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(12, 4, 5, 1, 180, 160, 125, 100, 88000, 1, 50, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 615,
    status: 'settled', paymentMethod: 'bank_transfer', paymentReference: 'NEFT2604112233', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-05'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-05'),
  },
  {
    id: 's006', organizationId: ORG, reporterId: 'r006', reporterName: 'Suresh Kumar',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(4, 6, 3, 1, 60, 240, 75, 100, 62000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 475,
    status: 'on_hold', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: 'Payment info not configured — UPI/bank account required before release.',
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: null,
  },
  {
    id: 's007', organizationId: ORG, reporterId: 'r007', reporterName: 'Lakshmi Narayana',
    period: '2026-04', periodLabel: 'April 2026',
    breakdown: bd(14, 9, 8, 2, 350, 540, 320, 300, 244000, 5, 500, 2, 800, 600, 1000),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 441, netPayableInr: 3969,
    status: 'settled', paymentMethod: 'bank_transfer', paymentReference: 'NEFT2604334455', partialAmountPaidInr: null,
    paidAt: new Date('2026-05-04'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-05-01'), settledAt: new Date('2026-05-04'),
  },

  // ── May 2026 ────────────────────────────────────────────────────────────────
  {
    id: 's008', organizationId: ORG, reporterId: 'r001', reporterName: 'Venkatesh Rao',
    period: '2026-05', periodLabel: 'May 2026',
    breakdown: bd(16, 7, 4, 1, 240, 280, 100, 100, 168000, 3, 150, 0, 0, 300, 500),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 1670,
    status: 'settled', paymentMethod: 'upi', paymentReference: 'UPI26052345678', partialAmountPaidInr: null,
    paidAt: new Date('2026-06-04'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-01'), settledAt: new Date('2026-06-04'),
  },
  {
    id: 's009', organizationId: ORG, reporterId: 'r002', reporterName: 'Priya Sharma',
    period: '2026-05', periodLabel: 'May 2026',
    breakdown: bd(10, 2, 4, 0, 150, 80, 100, 0, 68000, 1, 50, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 380,
    status: 'settled', paymentMethod: 'bank_transfer', paymentReference: 'NEFT2605123456', partialAmountPaidInr: null,
    paidAt: new Date('2026-06-05'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-01'), settledAt: new Date('2026-06-05'),
  },
  {
    id: 's010', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    period: '2026-05', periodLabel: 'May 2026',
    breakdown: bd(12, 26, 18, 4, 300, 1560, 720, 600, 560000, 10, 1000, 4, 1600, 600, 1000),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 738, netPayableInr: 6642,
    status: 'settled', paymentMethod: 'upi', paymentReference: 'UPI26053456789', partialAmountPaidInr: null,
    paidAt: new Date('2026-06-03'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: 'rd001', createdAt: new Date('2026-06-01'), settledAt: new Date('2026-06-03'),
  },
  {
    id: 's011', organizationId: ORG, reporterId: 'r005', reporterName: 'Ravi Teja',
    period: '2026-05', periodLabel: 'May 2026',
    breakdown: bd(14, 5, 6, 1, 210, 200, 150, 100, 112000, 2, 100, 0, 0, 300, 500),
    manualAdjustmentInr: -200, manualAdjustmentNote: 'Deduction: duplicate content submitted (2 posts rejected after settlement)',
    tdsDeductedInr: 0, netPayableInr: 1360,
    status: 'processing', paymentMethod: 'bank_transfer', paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-01'), settledAt: null,
  },
  {
    id: 's012', organizationId: ORG, reporterId: 'r007', reporterName: 'Lakshmi Narayana',
    period: '2026-05', periodLabel: 'May 2026',
    breakdown: bd(16, 11, 10, 3, 400, 660, 400, 450, 312000, 7, 700, 3, 1200, 600, 1000),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 541, netPayableInr: 4869,
    status: 'settled', paymentMethod: 'bank_transfer', paymentReference: 'NEFT2605445566', partialAmountPaidInr: null,
    paidAt: new Date('2026-06-04'), paidBy: 'admin@puralocal.in', onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-01'), settledAt: new Date('2026-06-04'),
  },

  // ── June 2026 — current month, pending settlement ──────────────────────────
  {
    id: 's013', organizationId: ORG, reporterId: 'r001', reporterName: 'Venkatesh Rao',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(8, 3, 2, 0, 120, 120, 50, 0, 68000, 1, 50, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 340,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's014', organizationId: ORG, reporterId: 'r002', reporterName: 'Priya Sharma',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(5, 1, 2, 0, 75, 40, 50, 0, 32000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 165,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's015', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(9, 22, 14, 3, 225, 1320, 560, 450, 428000, 7, 700, 2, 800, 600, 1000),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 5655,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: 'rd002', createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's016', organizationId: ORG, reporterId: 'r004', reporterName: 'Anjali Devi',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(4, 1, 1, 0, 60, 40, 25, 0, 18000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 125,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's017', organizationId: ORG, reporterId: 'r005', reporterName: 'Ravi Teja',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(10, 4, 5, 1, 150, 160, 125, 100, 92000, 2, 100, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 635,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's018', organizationId: ORG, reporterId: 'r006', reporterName: 'Suresh Kumar',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(3, 5, 2, 1, 45, 200, 50, 100, 48000, 0, 0, 0, 0, 0, 0),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 395,
    status: 'on_hold', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: 'Payment info missing — UPI/bank required.',
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
  {
    id: 's019', organizationId: ORG, reporterId: 'r007', reporterName: 'Lakshmi Narayana',
    period: '2026-06', periodLabel: 'June 2026',
    breakdown: bd(14, 10, 9, 2, 350, 600, 360, 300, 268000, 6, 600, 2, 800, 600, 1000),
    manualAdjustmentInr: 0, manualAdjustmentNote: null,
    tdsDeductedInr: 0, netPayableInr: 4610,
    status: 'pending', paymentMethod: null, paymentReference: null, partialAmountPaidInr: null,
    paidAt: null, paidBy: null, onHoldReason: null,
    redemptionRequestId: null, createdAt: new Date('2026-06-26'), settledAt: null,
  },
]

// ── Redemption requests ───────────────────────────────────────────────────────

export const SEED_REDEMPTIONS: RedemptionRequest[] = [
  {
    id: 'rd001', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    requestedAt: new Date('2026-05-28'), period: '2026-05',
    amountRequestedInr: 6642, availableBalanceInr: 6642,
    status: 'approved',
    reporterNote: 'Requesting May settlement early — need funds for equipment.',
    reviewedAt: new Date('2026-05-29'), reviewedBy: 'admin@puralocal.in',
    adminNote: 'Approved — excellent month. Payment processed via UPI.',
    settlementId: 's010',
  },
  {
    id: 'rd002', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    requestedAt: new Date('2026-06-24'), period: '2026-06',
    amountRequestedInr: 5655, availableBalanceInr: 5655,
    status: 'pending',
    reporterNote: 'Requesting June payout early — partial coverage done.',
    reviewedAt: null, reviewedBy: null, adminNote: null, settlementId: null,
  },
  {
    id: 'rd003', organizationId: ORG, reporterId: 'r001', reporterName: 'Venkatesh Rao',
    requestedAt: new Date('2026-06-20'), period: '2026-06',
    amountRequestedInr: 340, availableBalanceInr: 340,
    status: 'pending',
    reporterNote: null,
    reviewedAt: null, reviewedBy: null, adminNote: null, settlementId: null,
  },
  {
    id: 'rd004', organizationId: ORG, reporterId: 'r004', reporterName: 'Anjali Devi',
    requestedAt: new Date('2026-06-15'), period: '2026-06',
    amountRequestedInr: 125, availableBalanceInr: 125,
    status: 'rejected',
    reporterNote: 'Can I get advance?',
    reviewedAt: new Date('2026-06-16'), reviewedBy: 'admin@puralocal.in',
    adminNote: 'PAN not verified. Cannot release funds until PAN is submitted and verified.',
    settlementId: null,
  },
]

// ── Manual adjustments log ────────────────────────────────────────────────────

export const SEED_ADJUSTMENTS: ManualAdjustment[] = [
  {
    id: 'adj001', organizationId: ORG, reporterId: 'r003', reporterName: 'Mohammed Saleem',
    period: '2026-04', amountInr: 500, reason: 'Bonus for exclusive election coverage',
    createdAt: new Date('2026-05-01'), createdBy: 'admin@puralocal.in',
  },
  {
    id: 'adj002', organizationId: ORG, reporterId: 'r005', reporterName: 'Ravi Teja',
    period: '2026-05', amountInr: -200, reason: 'Deduction: duplicate content submitted (2 posts rejected after settlement)',
    createdAt: new Date('2026-06-01'), createdBy: 'admin@puralocal.in',
  },
]

export function getStoredCommissionRules(): CommissionRule[] {
  if (typeof window === 'undefined') return COMMISSION_RULES
  try {
    const raw = localStorage.getItem('puralocal_commission_rules_v2')
    if (!raw) {
      localStorage.setItem('puralocal_commission_rules_v2', JSON.stringify(COMMISSION_RULES))
      return COMMISSION_RULES
    }
    const parsed = JSON.parse(raw) as any[]
    return parsed.map(r => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    }))
  } catch (e) {
    console.error('Failed to parse stored commission rules:', e)
    return COMMISSION_RULES
  }
}

export function saveStoredCommissionRules(list: CommissionRule[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('puralocal_commission_rules_v2', JSON.stringify(list))
}
