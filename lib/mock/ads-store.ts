// ─────────────────────────────────────────────────────────────
// Ads Mock Store
// ─────────────────────────────────────────────────────────────

// ── Enums / literals ──────────────────────────────────────────

export type AdType = 'Banner' | 'Interstitial' | 'Native' | 'Video'
export type AdStatus = 'Active' | 'Paused' | 'Completed' | 'Pending'
export type PackageTier = 'Bronze' | 'Silver' | 'Gold' | 'Custom'
export type SlotStatus = 'Active' | 'Paused'

// ── Ad Position ───────────────────────────────────────────────

export interface AdPosition {
  id: string
  name: string
  screen: string
  description: string
  dimensions: string
  maxAdsPerSlot: number
  currentBookings: number
}

export const AD_POSITIONS: AdPosition[] = [
  { id: 'pos_splash',          name: 'Splash Screen',         screen: 'App Launch',     description: 'Full-screen on app open',           dimensions: '360×640', maxAdsPerSlot: 1,  currentBookings: 1 },
  { id: 'pos_feed_top',        name: 'Feed Top Banner',       screen: 'Home Feed',      description: 'First position above news feed',    dimensions: '320×50',  maxAdsPerSlot: 2,  currentBookings: 1 },
  { id: 'pos_feed_mid',        name: 'Feed Mid Banner',       screen: 'Home Feed',      description: 'Between articles 5 & 10',          dimensions: '320×50',  maxAdsPerSlot: 3,  currentBookings: 2 },
  { id: 'pos_feed_native',     name: 'Native Feed Card',      screen: 'Home Feed',      description: 'Blends into article list (pos 8)', dimensions: '300×250', maxAdsPerSlot: 2,  currentBookings: 1 },
  { id: 'pos_article_top',     name: 'Article Header',        screen: 'Article Detail', description: 'Top of article page, leaderboard', dimensions: '728×90',  maxAdsPerSlot: 1,  currentBookings: 1 },
  { id: 'pos_article_mid',     name: 'Article Mid-roll',      screen: 'Article Detail', description: 'After 2nd paragraph in article',   dimensions: '300×250', maxAdsPerSlot: 2,  currentBookings: 0 },
  { id: 'pos_article_bottom',  name: 'Article Footer',        screen: 'Article Detail', description: 'Below article content',             dimensions: '320×50',  maxAdsPerSlot: 2,  currentBookings: 1 },
  { id: 'pos_interstitial',    name: 'Full-Screen Inter.',    screen: 'Transition',     description: 'After 3rd video / page transition', dimensions: '360×640', maxAdsPerSlot: 1,  currentBookings: 1 },
  { id: 'pos_video_preroll',   name: 'Video Pre-roll',        screen: 'Video Player',   description: 'Before video content plays',        dimensions: '640×360', maxAdsPerSlot: 1,  currentBookings: 1 },
  { id: 'pos_sidebar',         name: 'Desktop Sidebar',       screen: 'Web / Desktop',  description: 'Right sidebar on web browser',      dimensions: '160×600', maxAdsPerSlot: 2,  currentBookings: 0 },
  { id: 'pos_category_top',    name: 'Category Page Top',     screen: 'Category Feed',  description: 'Banner at top of category listing', dimensions: '320×50',  maxAdsPerSlot: 2,  currentBookings: 1 },
  { id: 'pos_search_top',      name: 'Search Results Top',    screen: 'Search',         description: 'Sponsored result at top of search', dimensions: '300×250', maxAdsPerSlot: 1,  currentBookings: 0 },
]

// ── Ad Package ────────────────────────────────────────────────

export interface PackageRule {
  id: string
  description: string
}

export interface AdPackage {
  id: string
  name: string
  tier: PackageTier
  pricePerDay: number
  minDurationDays: number
  maxDurationDays: number
  maxSlots: number
  includedPositionIds: string[]
  rules: PackageRule[]
  description: string
  isActive: boolean
}

export const MOCK_PACKAGES: AdPackage[] = [
  {
    id: 'pkg_bronze',
    name: 'Bronze Package',
    tier: 'Bronze',
    pricePerDay: 500,
    minDurationDays: 3,
    maxDurationDays: 7,
    maxSlots: 2,
    includedPositionIds: ['pos_feed_top', 'pos_feed_mid'],
    rules: [
      { id: 'r1', description: 'Max 1 banner per screen' },
      { id: 'r2', description: 'No interstitials or video' },
      { id: 'r3', description: 'Content must be approved 24h before go-live' },
    ],
    description: 'Entry-level visibility with feed banner placements.',
    isActive: true,
  },
  {
    id: 'pkg_silver',
    name: 'Silver Package',
    tier: 'Silver',
    pricePerDay: 1200,
    minDurationDays: 7,
    maxDurationDays: 30,
    maxSlots: 4,
    includedPositionIds: ['pos_feed_top', 'pos_feed_mid', 'pos_article_top', 'pos_category_top'],
    rules: [
      { id: 'r1', description: 'Up to 2 banners per screen' },
      { id: 'r2', description: 'Native placements allowed' },
      { id: 'r3', description: 'Weekly performance report included' },
      { id: 'r4', description: 'Content approved within 12h' },
    ],
    description: 'Mid-tier package with article and category placements.',
    isActive: true,
  },
  {
    id: 'pkg_gold',
    name: 'Gold Package',
    tier: 'Gold',
    pricePerDay: 3000,
    minDurationDays: 14,
    maxDurationDays: 90,
    maxSlots: 8,
    includedPositionIds: [
      'pos_splash', 'pos_feed_top', 'pos_feed_mid', 'pos_feed_native',
      'pos_article_top', 'pos_article_mid', 'pos_interstitial', 'pos_video_preroll',
    ],
    rules: [
      { id: 'r1', description: 'Exclusive splash screen rights' },
      { id: 'r2', description: 'Video pre-roll up to 15 seconds' },
      { id: 'r3', description: 'Priority placement during peak hours (6–10 AM, 6–10 PM)' },
      { id: 'r4', description: 'Daily analytics dashboard access' },
      { id: 'r5', description: 'Dedicated account manager' },
    ],
    description: 'Premium full-coverage package with all premium positions.',
    isActive: true,
  },
  {
    id: 'pkg_custom',
    name: 'Custom Package',
    tier: 'Custom',
    pricePerDay: 0,
    minDurationDays: 1,
    maxDurationDays: 365,
    maxSlots: 12,
    includedPositionIds: [],
    rules: [
      { id: 'r1', description: 'Pricing negotiated per campaign' },
      { id: 'r2', description: 'All positions available on request' },
    ],
    description: 'Fully bespoke package — contact sales to configure.',
    isActive: true,
  },
]

// ── Location tree ─────────────────────────────────────────────

export interface LocationNode {
  id: string
  name: string
  districts: {
    id: string
    name: string
    mandals: { id: string; name: string }[]
  }[]
}

export const LOCATION_TREE: LocationNode[] = [
  {
    id: 'ts',
    name: 'Telangana',
    districts: [
      {
        id: 'hyd', name: 'Hyderabad',
        mandals: [
          { id: 'hyd_lb', name: 'LB Nagar' },
          { id: 'hyd_sec', name: 'Secunderabad' },
          { id: 'hyd_kup', name: 'Kukatpally' },
          { id: 'hyd_ban', name: 'Bahadurpura' },
          { id: 'hyd_sar', name: 'Serilingampally' },
        ],
      },
      {
        id: 'rr', name: 'Rangareddy',
        mandals: [
          { id: 'rr_raj', name: 'Rajendranagar' },
          { id: 'rr_sham', name: 'Shamshabad' },
          { id: 'rr_ibr', name: 'Ibrahimpatnam' },
          { id: 'rr_mah', name: 'Maheshwaram' },
        ],
      },
      {
        id: 'med', name: 'Medchal-Malkajgiri',
        mandals: [
          { id: 'med_bad', name: 'Badangpet' },
          { id: 'med_gha', name: 'Ghatkesar' },
          { id: 'med_kee', name: 'Keesara' },
          { id: 'med_med', name: 'Medchal' },
        ],
      },
      {
        id: 'niz', name: 'Nizamabad',
        mandals: [
          { id: 'niz_niz', name: 'Nizamabad Urban' },
          { id: 'niz_bod', name: 'Bodhan' },
          { id: 'niz_arm', name: 'Armoor' },
        ],
      },
      {
        id: 'war', name: 'Warangal',
        mandals: [
          { id: 'war_han', name: 'Hanamkonda' },
          { id: 'war_kaz', name: 'Kazipet' },
          { id: 'war_war', name: 'Warangal Urban' },
          { id: 'war_par', name: 'Parkal' },
        ],
      },
      {
        id: 'kar', name: 'Karimnagar',
        mandals: [
          { id: 'kar_kar', name: 'Karimnagar Urban' },
          { id: 'kar_jam', name: 'Jammikunta' },
          { id: 'kar_huz', name: 'Huzurabad' },
        ],
      },
      {
        id: 'khi', name: 'Khammam',
        mandals: [
          { id: 'khi_khi', name: 'Khammam Urban' },
          { id: 'khi_pal', name: 'Palvancha' },
          { id: 'khi_kha', name: 'Khanapuram' },
        ],
      },
      {
        id: 'nag', name: 'Nalgonda',
        mandals: [
          { id: 'nag_nal', name: 'Nalgonda Urban' },
          { id: 'nag_mir', name: 'Miryalaguda' },
          { id: 'nag_sur', name: 'Suryapet' },
        ],
      },
    ],
  },
  {
    id: 'ap',
    name: 'Andhra Pradesh',
    districts: [
      {
        id: 'viz', name: 'Visakhapatnam',
        mandals: [
          { id: 'viz_gaj', name: 'Gajuwaka' },
          { id: 'viz_bhz', name: 'Bheemunipatnam' },
          { id: 'viz_vis', name: 'Visakha Urban' },
        ],
      },
      {
        id: 'vij', name: 'Vijayawada',
        mandals: [
          { id: 'vij_ban', name: 'Benz Circle' },
          { id: 'vij_one', name: 'One Town' },
          { id: 'vij_myt', name: 'Mylavaram' },
        ],
      },
      {
        id: 'gun', name: 'Guntur',
        mandals: [
          { id: 'gun_gun', name: 'Guntur Urban' },
          { id: 'gun_ten', name: 'Tenali' },
          { id: 'gun_pala', name: 'Palakollu' },
        ],
      },
    ],
  },
]

// ── Campaign (Ad) ─────────────────────────────────────────────

export interface Ad {
  id: string
  name: string
  advertiser: string
  type: AdType
  status: AdStatus
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: string
  startDate: string
  endDate: string
  packageId: string | null
  positionIds: string[]
  locationIds: string[]   // mandal IDs — empty means all India / no filter
  estimatedCost: number
}

export const MOCK_ADS: Ad[] = [
  {
    id: 'a1',
    name: 'Hyderabad Summer Sale',
    advertiser: 'Reliance Retail',
    type: 'Banner',
    status: 'Active',
    budget: 50000,
    spent: 32400,
    impressions: 124000,
    clicks: 3720,
    ctr: '3.0%',
    startDate: '2025-06-01',
    endDate: '2025-07-31',
    packageId: 'pkg_silver',
    positionIds: ['pos_feed_top', 'pos_feed_mid'],
    locationIds: ['hyd_lb', 'hyd_sec', 'hyd_kup'],
    estimatedCost: 50400,
  },
  {
    id: 'a2',
    name: 'Andhra Elections Coverage',
    advertiser: 'News18',
    type: 'Native',
    status: 'Completed',
    budget: 200000,
    spent: 200000,
    impressions: 840000,
    clicks: 16800,
    ctr: '2.0%',
    startDate: '2025-04-01',
    endDate: '2025-05-15',
    packageId: 'pkg_gold',
    positionIds: ['pos_feed_native', 'pos_article_top', 'pos_splash'],
    locationIds: ['viz_vis', 'vij_ban', 'gun_gun'],
    estimatedCost: 210000,
  },
  {
    id: 'a3',
    name: 'School Admissions 2025',
    advertiser: 'Sri Chaitanya',
    type: 'Banner',
    status: 'Active',
    budget: 75000,
    spent: 28500,
    impressions: 95000,
    clicks: 3800,
    ctr: '4.0%',
    startDate: '2025-06-10',
    endDate: '2025-07-20',
    packageId: 'pkg_bronze',
    positionIds: ['pos_feed_top'],
    locationIds: [],
    estimatedCost: 30000,
  },
  {
    id: 'a4',
    name: 'Diwali Mega Offers',
    advertiser: 'Amazon India',
    type: 'Interstitial',
    status: 'Paused',
    budget: 150000,
    spent: 61200,
    impressions: 310000,
    clicks: 7440,
    ctr: '2.4%',
    startDate: '2025-05-20',
    endDate: '2025-06-30',
    packageId: 'pkg_gold',
    positionIds: ['pos_interstitial', 'pos_splash', 'pos_video_preroll'],
    locationIds: [],
    estimatedCost: 165000,
  },
  {
    id: 'a5',
    name: 'Local Restaurant Week',
    advertiser: 'Zomato',
    type: 'Native',
    status: 'Active',
    budget: 25000,
    spent: 11250,
    impressions: 62500,
    clicks: 2500,
    ctr: '4.0%',
    startDate: '2025-06-20',
    endDate: '2025-06-30',
    packageId: 'pkg_bronze',
    positionIds: ['pos_feed_native'],
    locationIds: ['hyd_lb', 'rr_raj'],
    estimatedCost: 12000,
  },
  {
    id: 'a6',
    name: 'New App Launch',
    advertiser: 'PhonePe',
    type: 'Video',
    status: 'Active',
    budget: 90000,
    spent: 18000,
    impressions: 45000,
    clicks: 1800,
    ctr: '4.0%',
    startDate: '2025-06-25',
    endDate: '2025-07-25',
    packageId: 'pkg_gold',
    positionIds: ['pos_video_preroll', 'pos_splash'],
    locationIds: [],
    estimatedCost: 93000,
  },
]
