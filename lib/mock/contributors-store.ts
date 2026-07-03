export type ContributorStatus       = 'pending' | 'approved' | 'rejected' | 'deleted' | 'inactive'
export type ReporterType            = 'Full Time' | 'Part Time' | 'Freelancer' | 'Intern'
export type ContributorSource       = 'APP' | 'CMS'
export type ContributorType         = 'user_applied' | 'team_recruited'
export type RegistrationSource      = 'organic' | 'referral' | 'campaign'
export type VerificationStatus      = 'verified' | 'pending' | 'unverified'
export type CoveragePriorityLevel   = 'high' | 'medium' | 'low'
export type PaymentMethod           = 'bank_transfer' | 'upi'
export type NetworkType             = 'wifi' | 'mobile'
export type ConnectionType         = 'wifi' | '5g' | '4g' | '3g' | '2g' | 'unknown'

export interface Contributor {
  // ── Core identity ──────────────────────────────────────────────────────────
  id: string
  contributorId: string
  name: string
  photoUrl?: string | null
  status: ContributorStatus
  contributorSource: ContributorSource

  // ── Personal information ───────────────────────────────────────────────────
  mobile: string
  alternateMobile?: string
  email: string
  dob?: string
  gender?: string
  occupation?: string
  education?: string
  language?: string
  languagesKnown?: string[]
  bio?: string

  // ── Address ────────────────────────────────────────────────────────────────
  address?: string           // flat string (legacy / fallback)
  houseNumber?: string
  street?: string
  area?: string
  village?: string
  mandal?: string
  district: string
  state?: string
  pincode?: string

  // ── Contributor info ───────────────────────────────────────────────────────
  designation: string
  reporterType: ReporterType
  experience: string
  contributorType?: ContributorType
  registrationSource?: RegistrationSource
  source?: string            // free-text origin label e.g. "Reporter App (Android)"
  recruitedBy?: string
  referralBy?: string
  referralCode?: string
  registrationDate?: Date
  appliedOn: Date
  approvedOn?: Date | null
  approvedBy?: string
  rejectedOn?: Date | null
  remarks?: string

  // ── Verification ───────────────────────────────────────────────────────────
  verificationStatus?: VerificationStatus
  verifiedBy?: string
  verificationDate?: Date | null
  aadhaarMasked?: string
  panMasked?: string

  // ── Coverage ───────────────────────────────────────────────────────────────
  coverageAreas?: string[]
  newsGenres?: string[]
  assignedMandal?: string
  assignedVillage?: string
  coveragePriorityLevel?: CoveragePriorityLevel

  // ── Banking & payout ──────────────────────────────────────────────────────
  accountHolderName?: string
  bankName?: string
  accountNumberMasked?: string
  ifscCode?: string
  branch?: string
  upiId?: string
  preferredPaymentMethod?: PaymentMethod
  payoutStatus?: 'Paid' | 'Processing' | 'Pending'

  // ── Earnings ──────────────────────────────────────────────────────────────
  totalEarnings?: number
  currentMonthEarnings?: number
  pendingEarnings?: number
  lastPaymentAmount?: number
  lastPaymentDate?: Date | null

  // ── Content statistics ────────────────────────────────────────────────────
  totalContentSubmitted?: number
  contentPublished?: number
  pendingStories?: number
  rejectedStories?: number
  draftStories?: number
  imageStories?: number
  videoStories?: number
  liveSessions?: number
  avgApprovalTime?: string
  lastStoryPublished?: Date | null
  mostActiveCategory?: string

  // ── Engagement statistics ─────────────────────────────────────────────────
  contentViews?: number
  totalLikes?: number
  totalShares?: number
  totalComments?: number
  followers?: number
  avgStoryReach?: number
  accuracyRate?: number

  // ── Tags & notes ──────────────────────────────────────────────────────────
  tags?: string[]
  adminNotes?: string

  // ── App & device ──────────────────────────────────────────────────────────
  devicePlatform?: 'android' | 'ios'
  deviceManufacturer?: string
  deviceModel?: string
  deviceOsVersion?: string
  deviceAppVersion?: string
  networkType?: NetworkType
  connectionType?: ConnectionType
  isp?: string
  pushNotificationEnabled?: boolean
  cameraPermission?: boolean
  micPermission?: boolean
  storagePermission?: boolean
  locationPermission?: boolean
  loginCount?: number
  lastLogin?: Date | null
  appInstallDate?: Date | null
  crashCount?: number
  isOnline?: boolean
  lastActive?: Date | null

  // ── Documents ─────────────────────────────────────────────────────────────
  documents?: { label: string; submitted: boolean }[]
}

// ── Shared doc sets ───────────────────────────────────────────────────────────

const DOCS_VERIFIED = [
  { label: 'Aadhaar Front', submitted: true  },
  { label: 'Aadhaar Back',  submitted: true  },
  { label: 'PAN Card',      submitted: true  },
  { label: 'Selfie',        submitted: true  },
  { label: 'Press ID',      submitted: true  },
  { label: 'Bank Proof',    submitted: true  },
]

const DOCS_PARTIAL = [
  { label: 'Aadhaar Front', submitted: true  },
  { label: 'Aadhaar Back',  submitted: true  },
  { label: 'PAN Card',      submitted: false },
  { label: 'Selfie',        submitted: true  },
  { label: 'Press ID',      submitted: false },
  { label: 'Bank Proof',    submitted: false },
]

const DOCS_MINIMAL = [
  { label: 'Aadhaar Front', submitted: true  },
  { label: 'Aadhaar Back',  submitted: false },
  { label: 'PAN Card',      submitted: false },
  { label: 'Selfie',        submitted: true  },
  { label: 'Press ID',      submitted: false },
  { label: 'Bank Proof',    submitted: false },
]

// ── Seed data ─────────────────────────────────────────────────────────────────

const INITIAL_SEED: Contributor[] = [
  // ── PENDING (APP) ──────────────────────────────────────────────────────────
  {
    id: 'c1', contributorId: 'CON250601', name: 'Ramesh Kumar', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9876543210', email: 'ramesh.kumar@gmail.com', dob: '12 Apr 1995 (30 Yrs)', gender: 'Male',
    designation: 'Reporter', reporterType: 'Full Time', experience: '2 Years',
    district: 'Karimnagar', mandal: 'Karimnagar Rural', state: 'Telangana', pincode: '505001',
    houseNumber: '12-3-45', street: 'Street No. 4', area: 'New Colony',
    address: 'H No: 12-3-45, Street No. 4, New Colony, Karimnagar, Telangana - 505001',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu', 'Hindi'],
    bio: 'Passionate about local news and community stories.',
    appliedOn: new Date('2025-06-01T10:30:00'), registrationDate: new Date('2025-05-28T08:00:00'),
    verificationStatus: 'unverified',
    coverageAreas: ['Politics', 'Crime'], newsGenres: ['Breaking News', 'Investigative'],
    assignedMandal: 'Karimnagar', coveragePriorityLevel: 'medium',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Organic'],
    devicePlatform: 'android', deviceManufacturer: 'Xiaomi', deviceModel: 'Redmi Note 12',
    deviceOsVersion: 'Android 13', deviceAppVersion: 'v2.1.0',
    cameraPermission: true, micPermission: true, storagePermission: true, locationPermission: false, pushNotificationEnabled: true,
    loginCount: 4, networkType: 'mobile',
    appInstallDate: new Date('2025-05-28T08:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-06-01T10:30:00'),
    documents: DOCS_PARTIAL,
  },
  {
    id: 'c2', contributorId: 'CON250602', name: 'Shilpa P', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9123456780', email: 'shilpa.p@gmail.com', dob: '05 Aug 1998 (26 Yrs)', gender: 'Female',
    designation: 'Stringer', reporterType: 'Part Time', experience: '1 Year',
    district: 'Warangal', mandal: 'Hanamkonda', state: 'Telangana', pincode: '506001',
    houseNumber: 'Flat 204', street: 'Sai Towers', area: 'Hanamkonda',
    address: 'Flat 204, Sai Towers, Hanamkonda, Warangal, Telangana - 506001',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu', 'English'],
    bio: 'Freelance writer covering politics and culture.',
    appliedOn: new Date('2025-06-01T09:45:00'), registrationDate: new Date('2025-05-30T07:00:00'),
    verificationStatus: 'unverified',
    coverageAreas: ['Education', 'Health'], newsGenres: ['Feature Stories', 'Analysis'],
    assignedMandal: 'Warangal', coveragePriorityLevel: 'low',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Organic'],
    devicePlatform: 'android', deviceManufacturer: 'Samsung', deviceModel: 'Galaxy A34',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0',
    cameraPermission: true, micPermission: false, storagePermission: true, locationPermission: true, pushNotificationEnabled: false,
    loginCount: 2, networkType: 'wifi',
    appInstallDate: new Date('2025-05-30T07:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-06-01T09:45:00'),
    documents: DOCS_MINIMAL,
  },
  {
    id: 'c3', contributorId: 'CON250603', name: 'Venkatesh B', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9988776655', email: 'venkatesh.b@gmail.com', dob: '22 Mar 1990 (35 Yrs)', gender: 'Male',
    designation: 'Reporter', reporterType: 'Full Time', experience: '5 Years',
    district: 'Hyderabad', mandal: 'Jubilee Hills', state: 'Telangana', pincode: '500033',
    houseNumber: 'Plot 8', area: 'Jubilee Hills',
    address: 'Plot 8, Jubilee Hills, Hyderabad, Telangana - 500033',
    source: 'Reporter App (iOS)', language: 'Telugu', languagesKnown: ['Telugu', 'English', 'Hindi'],
    bio: 'Covering crime and political beats in Hyderabad.',
    appliedOn: new Date('2025-05-31T16:20:00'), registrationDate: new Date('2025-05-28T09:00:00'),
    verificationStatus: 'pending',
    coverageAreas: ['Politics', 'Crime'], newsGenres: ['Breaking News', 'Investigative'],
    assignedMandal: 'Hyderabad Central', coveragePriorityLevel: 'high',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Organic', 'Under Review'],
    devicePlatform: 'ios', deviceManufacturer: 'Apple', deviceModel: 'iPhone 13 Pro',
    deviceOsVersion: 'iOS 17.2', deviceAppVersion: 'v2.0.8',
    cameraPermission: true, micPermission: true, storagePermission: true, locationPermission: true, pushNotificationEnabled: true,
    loginCount: 6, networkType: 'wifi',
    appInstallDate: new Date('2025-05-28T09:00:00'), crashCount: 1,
    isOnline: false, lastActive: new Date('2025-05-31T16:20:00'),
    documents: DOCS_PARTIAL,
  },
  {
    id: 'c4', contributorId: 'CON250604', name: 'Lavanya R', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'referral',
    mobile: '9345678901', email: 'lavanya.r@gmail.com', dob: '18 Nov 2000 (24 Yrs)', gender: 'Female',
    designation: 'Video Reporter', reporterType: 'Freelancer', experience: '6 Months',
    district: 'Warangal', mandal: 'Kazipet', state: 'Telangana', pincode: '506003',
    houseNumber: '3-5-89', area: 'Kazipet',
    address: 'Door No. 3-5-89, Kazipet, Warangal, Telangana - 506003',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu'],
    bio: 'Video journalist with a passion for ground-level reporting.',
    appliedOn: new Date('2025-05-30T14:15:00'), registrationDate: new Date('2025-05-29T10:00:00'),
    referralBy: 'Anjali Devi', referralCode: 'REF-C6-2025',
    verificationStatus: 'unverified',
    coverageAreas: ['Sports', 'Entertainment'], newsGenres: ['Live Updates', 'Feature Stories'],
    assignedMandal: 'Warangal', coveragePriorityLevel: 'low',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Referral'],
    devicePlatform: 'android', deviceManufacturer: 'OnePlus', deviceModel: 'CE 3',
    deviceOsVersion: 'Android 13', deviceAppVersion: 'v2.1.0',
    cameraPermission: true, micPermission: true, storagePermission: false, locationPermission: true, pushNotificationEnabled: true,
    loginCount: 3, networkType: 'mobile',
    appInstallDate: new Date('2025-05-29T10:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-05-30T14:15:00'),
    documents: DOCS_PARTIAL,
  },
  {
    id: 'c5', contributorId: 'CON250605', name: 'Kiran N', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'campaign',
    mobile: '9000098765', email: 'kiran.n@gmail.com', dob: '08 Jul 1993 (31 Yrs)', gender: 'Male',
    designation: 'Reporter', reporterType: 'Full Time', experience: '3 Years',
    district: 'Nizamabad', mandal: 'Armoor', state: 'Telangana', pincode: '503001',
    houseNumber: '7-1-22', street: 'Armoor Road', area: 'Nizamabad',
    address: 'H No: 7-1-22, Armoor Road, Nizamabad, Telangana - 503001',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu', 'Urdu'],
    bio: 'Agricultural and rural affairs correspondent.',
    appliedOn: new Date('2025-05-29T11:10:00'), registrationDate: new Date('2025-05-26T06:00:00'),
    verificationStatus: 'unverified',
    coverageAreas: ['Agriculture', 'Health'], newsGenres: ['Feature Stories', 'Interviews'],
    assignedMandal: 'Nizamabad Rural', coveragePriorityLevel: 'medium',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Campaign'],
    devicePlatform: 'android', deviceManufacturer: 'Realme', deviceModel: '11 Pro',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0',
    cameraPermission: false, micPermission: false, storagePermission: true, locationPermission: false, pushNotificationEnabled: true,
    loginCount: 5, networkType: 'mobile',
    appInstallDate: new Date('2025-05-26T06:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-05-29T11:10:00'),
    documents: DOCS_PARTIAL,
  },

  // ── APPROVED (APP) ──────────────────────────────────────────────────────────
  {
    id: 'c6', contributorId: 'CON250606', name: 'Anjali Devi', photoUrl: 'https://i.pravatar.cc/150?img=47',
    status: 'approved', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9394949494', alternateMobile: '9290102030',
    email: 'anjali.devi@gmail.com', dob: '14 Feb 1997 (28 Yrs)', gender: 'Female',
    occupation: 'Journalist', education: 'B.A. Mass Communication',
    designation: 'Contributor', reporterType: 'Freelancer', experience: '1.5 Years',
    district: 'Khammam', mandal: 'Khammam Rural', state: 'Telangana', pincode: '507001',
    houseNumber: '5-4-100', area: 'Mukthinagar',
    address: '5-4-100, Mukthinagar, Khammam, Telangana - 507001',
    source: 'Reporter App (iOS)', language: 'Telugu', languagesKnown: ['Telugu', 'English', 'Hindi'],
    bio: 'Health and lifestyle contributor with a passion for community welfare stories.',
    appliedOn: new Date('2025-05-28T15:30:00'), registrationDate: new Date('2025-05-20T09:00:00'),
    approvedOn: new Date('2025-05-30T11:00:00'), approvedBy: 'Tarun Admin',
    remarks: 'Approved after document verification.',
    verificationStatus: 'verified', verifiedBy: 'Ravi Admin', verificationDate: new Date('2025-05-30T10:00:00'),
    aadhaarMasked: 'XXXX XXXX 8821', panMasked: 'ANDEF****K',
    coverageAreas: ['Health', 'Agriculture'], newsGenres: ['Feature Stories', 'Analysis'],
    assignedMandal: 'Khammam', assignedVillage: 'Nelakondapalle', coveragePriorityLevel: 'medium',
    accountHolderName: 'Anjali Devi', bankName: 'State Bank of India', accountNumberMasked: 'XXXX XXXX 5541',
    ifscCode: 'SBIN0001234', branch: 'Khammam Main Branch', upiId: 'anjali.devi@sbi',
    preferredPaymentMethod: 'upi', payoutStatus: 'Paid',
    totalEarnings: 15400, currentMonthEarnings: 2800, pendingEarnings: 1200,
    lastPaymentAmount: 3500, lastPaymentDate: new Date('2026-06-01T10:00:00'),
    totalContentSubmitted: 142, contentPublished: 128, pendingStories: 8, rejectedStories: 6, draftStories: 2,
    imageStories: 95, videoStories: 33, liveSessions: 14,
    avgApprovalTime: '4.2 hrs', lastStoryPublished: new Date('2026-06-29T15:00:00'), mostActiveCategory: 'Health',
    contentViews: 48900, totalLikes: 12400, totalShares: 3200, totalComments: 890, followers: 4200, avgStoryReach: 382,
    accuracyRate: 90,
    tags: ['User Applied', 'Organic', 'Verified', 'Top Contributor'],
    adminNotes: 'Reliable contributor. Consistently submits quality health stories. Eligible for district lead consideration.',
    devicePlatform: 'ios', deviceManufacturer: 'Apple', deviceModel: 'iPhone 14',
    deviceOsVersion: 'iOS 17.4', deviceAppVersion: 'v2.0.9', networkType: 'wifi',
    connectionType: 'wifi', isp: 'JioFiber',
    pushNotificationEnabled: true, cameraPermission: true, micPermission: true,
    storagePermission: true, locationPermission: true,
    loginCount: 312, lastLogin: new Date('2026-06-30T08:45:00'),
    appInstallDate: new Date('2025-03-12T10:00:00'), crashCount: 2,
    isOnline: true, lastActive: new Date('2026-06-30T09:00:00'),
    documents: DOCS_VERIFIED,
  },

  // ── REJECTED ───────────────────────────────────────────────────────────────
  {
    id: 'c7', contributorId: 'CON250607', name: 'Mahesh Y', photoUrl: null,
    status: 'rejected', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9512345678', email: 'mahesh.y@gmail.com', dob: '30 Sep 1992 (32 Yrs)', gender: 'Male',
    designation: 'Reporter', reporterType: 'Part Time', experience: '4 Years',
    district: 'Medak', mandal: 'Siddipet', state: 'Telangana', pincode: '502110',
    houseNumber: 'Plot 12-A', street: 'Siddipet Road',
    address: 'Plot 12-A, Siddipet Road, Medak, Telangana - 502110',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu'],
    bio: 'Sports and entertainment reporter.',
    appliedOn: new Date('2025-05-27T10:05:00'), registrationDate: new Date('2025-05-25T07:00:00'),
    rejectedOn: new Date('2025-05-30T14:00:00'),
    remarks: 'Documents incomplete — Aadhaar copy missing.',
    verificationStatus: 'unverified',
    coverageAreas: ['Sports', 'Entertainment'], newsGenres: ['Breaking News'],
    assignedMandal: 'Medak', coveragePriorityLevel: 'low',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Organic'],
    devicePlatform: 'android', deviceManufacturer: 'Vivo', deviceModel: 'T2 Pro',
    deviceOsVersion: 'Android 13', deviceAppVersion: 'v2.1.0',
    cameraPermission: true, micPermission: true, storagePermission: true, locationPermission: false, pushNotificationEnabled: false,
    loginCount: 3, networkType: 'mobile',
    appInstallDate: new Date('2025-05-25T07:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-05-27T10:05:00'),
    documents: DOCS_MINIMAL,
  },
  {
    id: 'c8', contributorId: 'CON250608', name: 'Priya Kumari', photoUrl: null,
    status: 'pending', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9601234567', email: 'priya.k@gmail.com', dob: '25 Jan 2001 (24 Yrs)', gender: 'Female',
    designation: 'Photographer', reporterType: 'Freelancer', experience: '1 Year',
    district: 'Adilabad', mandal: 'Adilabad', state: 'Telangana', pincode: '504001',
    houseNumber: '2-9-67', street: 'Bazaar Street', area: 'Adilabad',
    address: '2-9-67, Bazaar Street, Adilabad, Telangana - 504001',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu', 'Hindi'],
    bio: 'Visual storyteller covering local events.',
    appliedOn: new Date('2025-05-26T09:00:00'), registrationDate: new Date('2025-05-24T08:00:00'),
    verificationStatus: 'unverified',
    coverageAreas: ['Entertainment', 'Sports'], newsGenres: ['Feature Stories'],
    assignedMandal: 'Adilabad', coveragePriorityLevel: 'low',
    totalContentSubmitted: 0, contentPublished: 0, pendingStories: 0, rejectedStories: 0, draftStories: 0,
    imageStories: 0, videoStories: 0, liveSessions: 0,
    contentViews: 0, totalLikes: 0, totalShares: 0, totalComments: 0, followers: 0,
    totalEarnings: 0, currentMonthEarnings: 0, pendingEarnings: 0, accuracyRate: 0,
    payoutStatus: 'Pending', tags: ['User Applied', 'Organic'],
    devicePlatform: 'android', deviceManufacturer: 'Samsung', deviceModel: 'Galaxy F14',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0',
    cameraPermission: true, micPermission: false, storagePermission: true, locationPermission: true, pushNotificationEnabled: true,
    loginCount: 2, networkType: 'mobile',
    appInstallDate: new Date('2025-05-24T08:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2025-05-26T09:00:00'),
    documents: DOCS_MINIMAL,
  },

  // ── INACTIVE (APP) ──────────────────────────────────────────────────────────
  {
    id: 'c9', contributorId: 'CON250609', name: 'Srinivas M', photoUrl: 'https://i.pravatar.cc/150?img=12',
    status: 'inactive', contributorSource: 'APP', contributorType: 'user_applied', registrationSource: 'organic',
    mobile: '9440123456', alternateMobile: '9866700011',
    email: 'srinivas.m@gmail.com', dob: '10 Aug 1988 (37 Yrs)', gender: 'Male',
    occupation: 'Senior Journalist', education: 'M.A. Journalism, Osmania University',
    designation: 'Reporter', reporterType: 'Full Time', experience: '5+ Years',
    district: 'Nalgonda', mandal: 'Nalgonda', state: 'Telangana', pincode: '508001',
    houseNumber: '1-2-34', street: 'Main Road', area: 'Nalgonda Town',
    address: 'H No. 1-2-34, Main Road, Nalgonda, Telangana - 508001',
    source: 'Reporter App (Android)', language: 'Telugu', languagesKnown: ['Telugu', 'English', 'Urdu'],
    bio: 'Senior reporter with 6+ years in district politics and agriculture beats.',
    appliedOn: new Date('2025-05-24T11:00:00'), registrationDate: new Date('2025-05-20T08:00:00'),
    approvedOn: new Date('2025-05-26T09:00:00'), approvedBy: 'Tarun Admin',
    remarks: '',
    verificationStatus: 'verified', verifiedBy: 'Ravi Admin', verificationDate: new Date('2025-05-26T08:30:00'),
    aadhaarMasked: 'XXXX XXXX 4422', panMasked: 'CMSRM****A',
    coverageAreas: ['Politics', 'Agriculture'], newsGenres: ['Breaking News', 'Live Updates'],
    assignedMandal: 'Nalgonda', assignedVillage: 'Miryalaguda', coveragePriorityLevel: 'high',
    accountHolderName: 'Srinivas Manchala', bankName: 'Andhra Bank', accountNumberMasked: 'XXXX XXXX 9903',
    ifscCode: 'ANDB0001102', branch: 'Nalgonda Main', upiId: 'srinivas.m@apl',
    preferredPaymentMethod: 'bank_transfer', payoutStatus: 'Paid',
    totalEarnings: 31000, currentMonthEarnings: 0, pendingEarnings: 0,
    lastPaymentAmount: 4200, lastPaymentDate: new Date('2026-04-30T10:00:00'),
    totalContentSubmitted: 320, contentPublished: 310, pendingStories: 0, rejectedStories: 8, draftStories: 2,
    imageStories: 220, videoStories: 80, liveSessions: 20,
    avgApprovalTime: '3.1 hrs', lastStoryPublished: new Date('2026-06-25T17:30:00'), mostActiveCategory: 'Politics',
    contentViews: 120500, totalLikes: 28900, totalShares: 7200, totalComments: 2100, followers: 11200, avgStoryReach: 890,
    accuracyRate: 97,
    tags: ['User Applied', 'Organic', 'Verified', 'High Earner'],
    adminNotes: 'Inactive since June 2026. Needs reactivation follow-up. Strong contributor previously.',
    devicePlatform: 'android', deviceManufacturer: 'Samsung', deviceModel: 'Galaxy S22',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0', networkType: 'wifi',
    connectionType: '4g', isp: 'Airtel',
    pushNotificationEnabled: false, cameraPermission: true, micPermission: true,
    storagePermission: true, locationPermission: true,
    loginCount: 824, lastLogin: new Date('2026-06-25T17:30:00'),
    appInstallDate: new Date('2024-11-10T08:00:00'), crashCount: 5,
    isOnline: false, lastActive: new Date('2026-06-25T17:30:00'),
    documents: DOCS_VERIFIED,
  },

  // ── APPROVED (CMS) ─────────────────────────────────────────────────────────
  {
    id: 'c10', contributorId: 'CON250610', name: 'Deepika Rao', photoUrl: 'https://i.pravatar.cc/150?img=32',
    status: 'approved', contributorSource: 'CMS', contributorType: 'team_recruited', registrationSource: 'organic',
    mobile: '9701234567', alternateMobile: '9100203040',
    email: 'deepika.rao@puralocal.in', dob: '03 Mar 1991 (35 Yrs)', gender: 'Female',
    occupation: 'Senior Journalist', education: 'M.A. Journalism, University of Hyderabad',
    designation: 'Senior Reporter', reporterType: 'Full Time', experience: '7 Years',
    district: 'Hyderabad', mandal: 'Kondapur', state: 'Telangana', pincode: '500084',
    houseNumber: 'Flat 5B', area: 'Kondapur',
    address: 'Flat 5B, Kondapur, Hyderabad, Telangana - 500084',
    source: 'CMS (Admin Added)', language: 'Telugu', languagesKnown: ['Telugu', 'English', 'Hindi'],
    bio: 'Senior journalist covering politics, governance and city affairs with 7+ years of field experience.',
    appliedOn: new Date('2025-06-10T09:00:00'), registrationDate: new Date('2025-06-10T09:00:00'),
    approvedOn: new Date('2025-06-10T09:00:00'), approvedBy: 'Tarun Admin',
    recruitedBy: 'Tarun Admin', remarks: 'Directly onboarded by admin.',
    verificationStatus: 'verified', verifiedBy: 'Tarun Admin', verificationDate: new Date('2025-06-10T09:00:00'),
    aadhaarMasked: 'XXXX XXXX 7731', panMasked: 'DRPRE****H',
    coverageAreas: ['Politics', 'Governance'], newsGenres: ['Breaking News', 'Investigative'],
    assignedMandal: 'Hyderabad Central', assignedVillage: 'Banjara Hills', coveragePriorityLevel: 'high',
    accountHolderName: 'Deepika Rao', bankName: 'HDFC Bank', accountNumberMasked: 'XXXX XXXX 2219',
    ifscCode: 'HDFC0001234', branch: 'Kondapur Branch', upiId: 'deepika.rao@hdfcbank',
    preferredPaymentMethod: 'bank_transfer', payoutStatus: 'Paid',
    totalEarnings: 42000, currentMonthEarnings: 5800, pendingEarnings: 1800,
    lastPaymentAmount: 6200, lastPaymentDate: new Date('2026-06-01T10:00:00'),
    totalContentSubmitted: 410, contentPublished: 398, pendingStories: 5, rejectedStories: 7, draftStories: 0,
    imageStories: 280, videoStories: 110, liveSessions: 20,
    avgApprovalTime: '2.8 hrs', lastStoryPublished: new Date('2026-06-30T07:00:00'), mostActiveCategory: 'Politics',
    contentViews: 185000, totalLikes: 44200, totalShares: 11800, totalComments: 3400, followers: 22400, avgStoryReach: 1340,
    accuracyRate: 97,
    tags: ['Team Recruited', 'Verified', 'Top Contributor', 'District Lead'],
    adminNotes: 'Star contributor. First point of contact for Hyderabad district coverage.',
    devicePlatform: 'ios', deviceManufacturer: 'Apple', deviceModel: 'iPhone 15 Pro',
    deviceOsVersion: 'iOS 17.5', deviceAppVersion: 'v2.1.0', networkType: 'wifi',
    connectionType: 'wifi', isp: 'JioFiber',
    pushNotificationEnabled: true, cameraPermission: true, micPermission: true,
    storagePermission: true, locationPermission: true,
    loginCount: 510, lastLogin: new Date('2026-06-30T07:10:00'),
    appInstallDate: new Date('2025-06-10T09:00:00'), crashCount: 0,
    isOnline: true, lastActive: new Date('2026-06-30T07:30:00'),
    documents: DOCS_VERIFIED,
  },
  {
    id: 'c11', contributorId: 'CON250611', name: 'Suresh Babu', photoUrl: 'https://i.pravatar.cc/150?img=15',
    status: 'approved', contributorSource: 'CMS', contributorType: 'team_recruited', registrationSource: 'organic',
    mobile: '9812345678', alternateMobile: '9700001122',
    email: 'suresh.babu@puralocal.in', dob: '17 Jun 1994 (32 Yrs)', gender: 'Male',
    occupation: 'Video Journalist', education: 'B.Sc. Electronics & Communication',
    designation: 'Video Journalist', reporterType: 'Full Time', experience: '4 Years',
    district: 'Warangal', mandal: 'Hanamkonda', state: 'Telangana', pincode: '506001',
    houseNumber: '4-2-78', area: 'Hanamkonda',
    address: 'H No: 4-2-78, Hanmakonda, Warangal, Telangana - 506001',
    source: 'CMS (Admin Added)', language: 'Telugu', languagesKnown: ['Telugu', 'English'],
    bio: 'Video journalist specialising in ground-level crime and sports reporting.',
    appliedOn: new Date('2025-06-12T11:30:00'), registrationDate: new Date('2025-06-12T11:30:00'),
    approvedOn: new Date('2025-06-12T11:30:00'), approvedBy: 'Tarun Admin',
    recruitedBy: 'Tarun Admin', remarks: 'Directly onboarded by admin.',
    verificationStatus: 'verified', verifiedBy: 'Tarun Admin', verificationDate: new Date('2025-06-12T11:30:00'),
    aadhaarMasked: 'XXXX XXXX 3308', panMasked: 'SBKWG****J',
    coverageAreas: ['Crime', 'Sports'], newsGenres: ['Live Updates', 'Breaking News'],
    assignedMandal: 'Warangal', assignedVillage: 'Kazipet', coveragePriorityLevel: 'high',
    accountHolderName: 'Suresh Babu K', bankName: 'ICICI Bank', accountNumberMasked: 'XXXX XXXX 7784',
    ifscCode: 'ICIC0001902', branch: 'Warangal Branch', upiId: 'suresh.babu@icici',
    preferredPaymentMethod: 'upi', payoutStatus: 'Processing',
    totalEarnings: 24500, currentMonthEarnings: 3200, pendingEarnings: 3200,
    lastPaymentAmount: 3800, lastPaymentDate: new Date('2026-05-31T10:00:00'),
    totalContentSubmitted: 230, contentPublished: 218, pendingStories: 6, rejectedStories: 6, draftStories: 0,
    imageStories: 80, videoStories: 130, liveSessions: 8,
    avgApprovalTime: '3.5 hrs', lastStoryPublished: new Date('2026-06-29T14:00:00'), mostActiveCategory: 'Crime',
    contentViews: 92000, totalLikes: 21300, totalShares: 5600, totalComments: 1800, followers: 9800, avgStoryReach: 720,
    accuracyRate: 95,
    tags: ['Team Recruited', 'Verified', 'Video Creator'],
    adminNotes: 'Strong video output. Prioritise for live event coverage assignments.',
    devicePlatform: 'android', deviceManufacturer: 'Samsung', deviceModel: 'Galaxy S23',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0', networkType: 'wifi',
    connectionType: '5g', isp: 'Vi (Vodafone Idea)',
    pushNotificationEnabled: true, cameraPermission: true, micPermission: true,
    storagePermission: true, locationPermission: true,
    loginCount: 380, lastLogin: new Date('2026-06-29T14:10:00'),
    appInstallDate: new Date('2025-06-12T11:30:00'), crashCount: 1,
    isOnline: false, lastActive: new Date('2026-06-29T14:30:00'),
    documents: DOCS_VERIFIED,
  },
  {
    id: 'c12', contributorId: 'CON250612', name: 'Meena Iyer', photoUrl: 'https://i.pravatar.cc/150?img=56',
    status: 'approved', contributorSource: 'CMS', contributorType: 'team_recruited', registrationSource: 'referral',
    mobile: '9654321098', email: 'meena.iyer@puralocal.in', dob: '29 Nov 1996 (29 Yrs)', gender: 'Female',
    occupation: 'Freelance Journalist', education: 'B.A. Journalism, Osmania University',
    designation: 'Freelance Contributor', reporterType: 'Freelancer', experience: '2 Years',
    district: 'Nizamabad', mandal: 'Nizamabad', state: 'Telangana', pincode: '503001',
    houseNumber: '8-3-12', area: 'Subhash Nagar',
    address: '8-3-12, Subhash Nagar, Nizamabad, Telangana - 503001',
    source: 'CMS (Admin Added)', language: 'Telugu', languagesKnown: ['Telugu', 'English', 'Tamil'],
    bio: 'Freelance contributor focused on education, women and agriculture stories.',
    appliedOn: new Date('2025-06-18T10:00:00'), registrationDate: new Date('2025-06-18T10:00:00'),
    approvedOn: new Date('2025-06-18T10:00:00'), approvedBy: 'Tarun Admin',
    recruitedBy: 'Tarun Admin', referralBy: 'Deepika Rao', referralCode: 'REF-C10-2025',
    remarks: 'Directly onboarded by admin.',
    verificationStatus: 'verified', verifiedBy: 'Tarun Admin', verificationDate: new Date('2025-06-18T10:00:00'),
    aadhaarMasked: 'XXXX XXXX 9914', panMasked: 'MIYNI****C',
    coverageAreas: ['Education', 'Agriculture'], newsGenres: ['Feature Stories', 'Analysis'],
    assignedMandal: 'Nizamabad', assignedVillage: 'Bodhan', coveragePriorityLevel: 'medium',
    accountHolderName: 'Meena Iyer', bankName: 'Kotak Mahindra Bank', accountNumberMasked: 'XXXX XXXX 6612',
    ifscCode: 'KKBK0001190', branch: 'Nizamabad Branch', upiId: 'meena.iyer@kotak',
    preferredPaymentMethod: 'upi', payoutStatus: 'Pending',
    totalEarnings: 9800, currentMonthEarnings: 1400, pendingEarnings: 1400,
    lastPaymentAmount: 1800, lastPaymentDate: new Date('2026-05-15T10:00:00'),
    totalContentSubmitted: 85, contentPublished: 79, pendingStories: 3, rejectedStories: 3, draftStories: 0,
    imageStories: 65, videoStories: 14, liveSessions: 6,
    avgApprovalTime: '5.1 hrs', lastStoryPublished: new Date('2026-06-28T09:00:00'), mostActiveCategory: 'Education',
    contentViews: 31000, totalLikes: 7400, totalShares: 1900, totalComments: 610, followers: 3100, avgStoryReach: 290,
    accuracyRate: 93,
    tags: ['Team Recruited', 'Referral', 'Verified', 'New Contributor'],
    adminNotes: 'Good depth on education stories. Encourage live reporting training.',
    devicePlatform: 'android', deviceManufacturer: 'OnePlus', deviceModel: 'Nord CE 3',
    deviceOsVersion: 'Android 14', deviceAppVersion: 'v2.1.0', networkType: 'wifi',
    connectionType: '4g', isp: 'BSNL',
    pushNotificationEnabled: true, cameraPermission: true, micPermission: true,
    storagePermission: true, locationPermission: false,
    loginCount: 145, lastLogin: new Date('2026-06-28T09:10:00'),
    appInstallDate: new Date('2025-06-18T10:00:00'), crashCount: 0,
    isOnline: false, lastActive: new Date('2026-06-28T09:30:00'),
    documents: DOCS_VERIFIED,
  },
]

const STORE_KEY = 'puralocal_contributors_v5'

export function getStoredContributors(): Contributor[] {
  if (typeof window === 'undefined') return INITIAL_SEED

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(INITIAL_SEED))
      return INITIAL_SEED
    }

    const d = (v: any) => (v ? new Date(v) : null)

    const parsed = JSON.parse(raw) as any[]
    return parsed.map(c => ({
      ...c,
      appliedOn:         new Date(c.appliedOn),
      registrationDate:  d(c.registrationDate),
      approvedOn:        d(c.approvedOn),
      rejectedOn:        d(c.rejectedOn),
      verificationDate:  d(c.verificationDate),
      lastPaymentDate:   d(c.lastPaymentDate),
      lastStoryPublished:d(c.lastStoryPublished),
      lastLogin:         d(c.lastLogin),
      appInstallDate:    d(c.appInstallDate),
      lastActive:        d(c.lastActive),
    }))
  } catch (e) {
    console.error('Failed to parse stored contributors, returning seed data:', e)
    return INITIAL_SEED
  }
}

export function saveStoredContributors(list: Contributor[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORE_KEY, JSON.stringify(list))
}
