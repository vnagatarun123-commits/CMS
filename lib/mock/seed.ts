import type { Organization, UserWithRole, RoleDefinition, Category, Location, Language, Content, NotificationRecord, NotificationTemplate, AuditEntry } from '@/types/domain'
import { Role, Permission, ROLE_PERMISSIONS } from '@/lib/rbac/permissions'
import { ContentType, ContentStatus, ContentSource, LocationLevel, NotificationChannel, NotificationAudience, NotificationStatus, NotificationPriority } from '@/types/domain'

export const PURALOCAL_ORG_ID = 'org_puralocal_001'

export const SEEDED_ORG: Organization = {
  id: PURALOCAL_ORG_ID,
  name: 'PuraLocal',
  slug: 'puralocal',
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

const joined = new Date('2024-01-15T00:00:00Z')

export const SEEDED_USERS: UserWithRole[] = [
  { id: 'user_super_admin',       email: 'superadmin@platform.local',  name: 'Platform Super Admin', role: Role.SUPER_ADMIN,       organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_org_admin',         email: 'admin@puralocal.com',        name: 'Org Admin',            role: Role.ORG_ADMIN,         organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_editor',            email: 'editor@puralocal.com',       name: 'Editor',               role: Role.EDITOR,            organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_content_reviewer',  email: 'reviewer@puralocal.com',     name: 'Content Reviewer',     role: Role.CONTENT_REVIEWER,  organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_reporter_manager',  email: 'reportermgr@puralocal.com',  name: 'Reporter Manager',     role: Role.REPORTER_MANAGER,  organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_ad_manager',        email: 'ads@puralocal.com',          name: 'Ad Manager',           role: Role.AD_MANAGER,        organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_marketing_manager', email: 'marketing@puralocal.com',    name: 'Marketing Manager',    role: Role.MARKETING_MANAGER, organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_finance_manager',   email: 'finance@puralocal.com',      name: 'Finance Manager',      role: Role.FINANCE_MANAGER,   organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_support_executive', email: 'support@puralocal.com',      name: 'Support Executive',    role: Role.SUPPORT_EXECUTIVE, organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_analytics_viewer',  email: 'analytics@puralocal.com',    name: 'Analytics Viewer',     role: Role.ANALYTICS_VIEWER,  organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
  { id: 'user_reporter',          email: 'reporter@puralocal.com',     name: 'Reporter',             role: Role.REPORTER,          organizationId: PURALOCAL_ORG_ID, invitedAt: joined, joinedAt: joined },
]

export const MOCK_USER_PASSWORDS: Record<string, string> = Object.fromEntries(
  SEEDED_USERS.map(u => [u.email, 'password']),
)

// ── Role definitions ──────────────────────────────────────────────────────────

const rd = new Date('2024-01-01T00:00:00Z')

const ROLE_NAMES: Record<string, string> = {
  [Role.SUPER_ADMIN]:       'Super Admin',
  [Role.ORG_ADMIN]:         'Org Admin',
  [Role.EDITOR]:            'Editor',
  [Role.CONTENT_REVIEWER]:  'Content Reviewer',
  [Role.REPORTER_MANAGER]:  'Reporter Manager',
  [Role.AD_MANAGER]:        'Ad Manager',
  [Role.MARKETING_MANAGER]: 'Marketing Manager',
  [Role.FINANCE_MANAGER]:   'Finance Manager',
  [Role.SUPPORT_EXECUTIVE]: 'Support Executive',
  [Role.ANALYTICS_VIEWER]:  'Analytics Viewer',
  [Role.REPORTER]:          'Reporter',
}

export const SEED_ROLE_DEFINITIONS: RoleDefinition[] = Object.values(Role).map(roleId => ({
  id: roleId,
  organizationId: PURALOCAL_ORG_ID,
  name: ROLE_NAMES[roleId]!,
  permissions: [...(ROLE_PERMISSIONS[roleId] ?? [])] as Permission[],
  isSystem: true,
  createdAt: rd,
}))

// ── Reference data ────────────────────────────────────────────────────────────

const r = new Date('2024-01-01T00:00:00Z')

export const SEEDED_CATEGORIES: Category[] = [
  { id: 'cat_local_news',    organizationId: PURALOCAL_ORG_ID, code: 'LOC', name: 'Local News',    slug: 'local-news',    active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/local-news-street/400/400',    color: '#ef4444', sortOrder: 1,  description: 'Hyper-local stories from your neighbourhood' },
  { id: 'cat_sports',        organizationId: PURALOCAL_ORG_ID, code: 'SPT', name: 'Sports',        slug: 'sports',        active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/sports-stadium/400/400',        color: '#22c55e', sortOrder: 2,  description: 'Local and national sports coverage' },
  { id: 'cat_politics',      organizationId: PURALOCAL_ORG_ID, code: 'POL', name: 'Politics',      slug: 'politics',      active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/parliament-building/400/400',   color: '#3b82f6', sortOrder: 3,  description: 'State, district and panchayat level political news' },
  { id: 'cat_entertainment', organizationId: PURALOCAL_ORG_ID, code: 'ENT', name: 'Entertainment', slug: 'entertainment', active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/entertainment-lights/400/400',  color: '#ec4899', sortOrder: 4,  description: 'Movies, music, events and celebrity news' },
  { id: 'cat_business',      organizationId: PURALOCAL_ORG_ID, code: 'BIZ', name: 'Business',      slug: 'business',      active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/business-city/400/400',         color: '#f59e0b', sortOrder: 5,  description: 'Local trade, economy and market news' },
  { id: 'cat_technology',    organizationId: PURALOCAL_ORG_ID, code: 'TEC', name: 'Technology',    slug: 'technology',    active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/technology-code/400/400',       color: '#8b5cf6', sortOrder: 6,  description: 'Tech industry, startups and digital trends' },
  { id: 'cat_health',        organizationId: PURALOCAL_ORG_ID, code: 'HLT', name: 'Health',        slug: 'health',        active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/health-medical/400/400',        color: '#14b8a6', sortOrder: 7,  description: 'Health, wellness and medical news' },
  { id: 'cat_education',     organizationId: PURALOCAL_ORG_ID, code: 'EDU', name: 'Education',     slug: 'education',     active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/education-school/400/400',      color: '#f97316', sortOrder: 8,  description: 'Schools, colleges, exams and skill development' },
  { id: 'cat_agriculture',   organizationId: PURALOCAL_ORG_ID, code: 'AGR', name: 'Agriculture',   slug: 'agriculture',   active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/agriculture-farm/400/400',      color: '#84cc16', sortOrder: 9,  description: 'Farming, crop prices, weather and rural news' },
  { id: 'cat_crime',         organizationId: PURALOCAL_ORG_ID, code: 'CRM', name: 'Crime',         slug: 'crime',         active: true, deletedAt: null, createdAt: r, icon: 'https://picsum.photos/seed/crime-police/400/400',          color: '#dc2626', sortOrder: 10, description: 'Law enforcement, accidents and public safety' },
]

// ── Locations — State → District → Mandal → Village ───────────────────────────

const st = (id: string, name: string, slug: string, active = false): Location => ({
  id, organizationId: PURALOCAL_ORG_ID, name, slug, level: LocationLevel.STATE,
  parentId: null, parentName: null, active, deletedAt: null, createdAt: r,
})
const di = (id: string, name: string, slug: string, parentId: string, parentName: string, active = false): Location => ({
  id, organizationId: PURALOCAL_ORG_ID, name, slug, level: LocationLevel.DISTRICT,
  parentId, parentName, active, deletedAt: null, createdAt: r,
})
const ma = (id: string, name: string, slug: string, parentId: string, parentName: string, active = false): Location => ({
  id, organizationId: PURALOCAL_ORG_ID, name, slug, level: LocationLevel.MANDAL,
  parentId, parentName, active, deletedAt: null, createdAt: r,
})
const vi = (id: string, name: string, slug: string, parentId: string, parentName: string, active = false): Location => ({
  id, organizationId: PURALOCAL_ORG_ID, name, slug, level: LocationLevel.VILLAGE,
  parentId, parentName, active, deletedAt: null, createdAt: r,
})

export const SEEDED_LOCATIONS: Location[] = [
  // ── States (28 states + 8 UTs) ───────────────────────────────────────────────
  st('loc_ap',  'Andhra Pradesh',              'andhra-pradesh'),
  st('loc_ar',  'Arunachal Pradesh',           'arunachal-pradesh'),
  st('loc_as',  'Assam',                       'assam'),
  st('loc_br',  'Bihar',                       'bihar'),
  st('loc_cg',  'Chhattisgarh',               'chhattisgarh'),
  st('loc_ga',  'Goa',                         'goa'),
  st('loc_gj',  'Gujarat',                     'gujarat'),
  st('loc_hr',  'Haryana',                     'haryana'),
  st('loc_hp',  'Himachal Pradesh',            'himachal-pradesh'),
  st('loc_jh',  'Jharkhand',                   'jharkhand'),
  st('loc_ka',  'Karnataka',                   'karnataka'),
  st('loc_kl',  'Kerala',                      'kerala'),
  st('loc_mp',  'Madhya Pradesh',              'madhya-pradesh'),
  st('loc_mh',  'Maharashtra',                 'maharashtra'),
  st('loc_mn',  'Manipur',                     'manipur'),
  st('loc_ml',  'Meghalaya',                   'meghalaya'),
  st('loc_mz',  'Mizoram',                     'mizoram'),
  st('loc_nl',  'Nagaland',                    'nagaland'),
  st('loc_or',  'Odisha',                      'odisha'),
  st('loc_pb',  'Punjab',                      'punjab'),
  st('loc_rj',  'Rajasthan',                   'rajasthan'),
  st('loc_sk',  'Sikkim',                      'sikkim'),
  st('loc_tn',  'Tamil Nadu',                  'tamil-nadu'),
  st('loc_ts',  'Telangana',                   'telangana',                   true),
  st('loc_tr',  'Tripura',                     'tripura'),
  st('loc_up',  'Uttar Pradesh',               'uttar-pradesh'),
  st('loc_uk',  'Uttarakhand',                 'uttarakhand'),
  st('loc_wb',  'West Bengal',                 'west-bengal'),
  // Union Territories
  st('loc_an',  'Andaman & Nicobar Islands',   'andaman-nicobar'),
  st('loc_ch',  'Chandigarh',                  'chandigarh'),
  st('loc_dd',  'Dadra & Nagar Haveli and Daman & Diu', 'dadra-nagar-haveli'),
  st('loc_dl',  'Delhi',                       'delhi'),
  st('loc_jk',  'Jammu & Kashmir',             'jammu-kashmir'),
  st('loc_la',  'Ladakh',                      'ladakh'),
  st('loc_ld',  'Lakshadweep',                 'lakshadweep'),
  st('loc_py',  'Puducherry',                  'puducherry'),

  // ── Districts (Andhra Pradesh) ────────────────────────────────────────────────
  di('loc_vsk', 'Visakhapatnam', 'visakhapatnam', 'loc_ap', 'Andhra Pradesh'),
  di('loc_vja', 'Vijayawada',    'vijayawada',    'loc_ap', 'Andhra Pradesh'),
  di('loc_gnt', 'Guntur',        'guntur',        'loc_ap', 'Andhra Pradesh'),
  di('loc_tpt', 'Tirupati',      'tirupati',      'loc_ap', 'Andhra Pradesh'),

  // ── Districts (Assam) ─────────────────────────────────────────────────────────
  di('loc_gwh', 'Kamrup Metropolitan', 'kamrup-metropolitan', 'loc_as', 'Assam'),
  di('loc_jor', 'Jorhat',             'jorhat',               'loc_as', 'Assam'),

  // ── Districts (Bihar) ─────────────────────────────────────────────────────────
  di('loc_pat', 'Patna',  'patna',  'loc_br', 'Bihar'),
  di('loc_gya', 'Gaya',   'gaya',   'loc_br', 'Bihar'),
  di('loc_muz', 'Muzaffarpur', 'muzaffarpur', 'loc_br', 'Bihar'),

  // ── Districts (Chhattisgarh) ──────────────────────────────────────────────────
  di('loc_rai', 'Raipur',  'raipur',  'loc_cg', 'Chhattisgarh'),
  di('loc_bil', 'Bilaspur', 'bilaspur', 'loc_cg', 'Chhattisgarh'),

  // ── Districts (Gujarat) ───────────────────────────────────────────────────────
  di('loc_ahm', 'Ahmedabad',  'ahmedabad',  'loc_gj', 'Gujarat'),
  di('loc_sur', 'Surat',      'surat',      'loc_gj', 'Gujarat'),
  di('loc_vad', 'Vadodara',   'vadodara',   'loc_gj', 'Gujarat'),
  di('loc_gan', 'Gandhinagar','gandhinagar','loc_gj', 'Gujarat'),

  // ── Districts (Haryana) ───────────────────────────────────────────────────────
  di('loc_grg', 'Gurugram',  'gurugram',  'loc_hr', 'Haryana'),
  di('loc_far', 'Faridabad', 'faridabad', 'loc_hr', 'Haryana'),
  di('loc_amb', 'Ambala',    'ambala',    'loc_hr', 'Haryana'),

  // ── Districts (Jharkhand) ─────────────────────────────────────────────────────
  di('loc_ran', 'Ranchi',   'ranchi',   'loc_jh', 'Jharkhand'),
  di('loc_jam', 'Jamshedpur','jamshedpur','loc_jh', 'Jharkhand'),

  // ── Districts (Karnataka) ─────────────────────────────────────────────────────
  di('loc_blr', 'Bengaluru Urban', 'bengaluru-urban', 'loc_ka', 'Karnataka'),
  di('loc_mys', 'Mysuru',          'mysuru',          'loc_ka', 'Karnataka'),
  di('loc_hub', 'Hubli-Dharwad',   'hubli-dharwad',   'loc_ka', 'Karnataka'),
  di('loc_man', 'Mangaluru',       'mangaluru',       'loc_ka', 'Karnataka'),

  // ── Districts (Kerala) ────────────────────────────────────────────────────────
  di('loc_tvm', 'Thiruvananthapuram', 'thiruvananthapuram', 'loc_kl', 'Kerala'),
  di('loc_koc', 'Ernakulam',          'ernakulam',          'loc_kl', 'Kerala'),
  di('loc_kzh', 'Kozhikode',          'kozhikode',          'loc_kl', 'Kerala'),

  // ── Districts (Madhya Pradesh) ────────────────────────────────────────────────
  di('loc_bho', 'Bhopal',  'bhopal',  'loc_mp', 'Madhya Pradesh'),
  di('loc_ind', 'Indore',  'indore',  'loc_mp', 'Madhya Pradesh'),
  di('loc_jab', 'Jabalpur','jabalpur','loc_mp', 'Madhya Pradesh'),
  di('loc_gwa', 'Gwalior', 'gwalior', 'loc_mp', 'Madhya Pradesh'),

  // ── Districts (Maharashtra) ───────────────────────────────────────────────────
  di('loc_mum',  'Mumbai',  'mumbai',  'loc_mh', 'Maharashtra'),
  di('loc_pune', 'Pune',    'pune',    'loc_mh', 'Maharashtra'),
  di('loc_nag',  'Nagpur',  'nagpur',  'loc_mh', 'Maharashtra'),
  di('loc_nas',  'Nashik',  'nashik',  'loc_mh', 'Maharashtra'),
  di('loc_aur',  'Aurangabad','aurangabad','loc_mh', 'Maharashtra'),

  // ── Districts (Odisha) ────────────────────────────────────────────────────────
  di('loc_bhu', 'Khordha',  'khordha', 'loc_or', 'Odisha'),
  di('loc_cut', 'Cuttack',  'cuttack', 'loc_or', 'Odisha'),

  // ── Districts (Punjab) ────────────────────────────────────────────────────────
  di('loc_lud', 'Ludhiana', 'ludhiana', 'loc_pb', 'Punjab'),
  di('loc_ami', 'Amritsar', 'amritsar', 'loc_pb', 'Punjab'),
  di('loc_jal', 'Jalandhar','jalandhar','loc_pb', 'Punjab'),

  // ── Districts (Rajasthan) ─────────────────────────────────────────────────────
  di('loc_jai', 'Jaipur',  'jaipur',  'loc_rj', 'Rajasthan'),
  di('loc_jod', 'Jodhpur', 'jodhpur', 'loc_rj', 'Rajasthan'),
  di('loc_uda', 'Udaipur', 'udaipur', 'loc_rj', 'Rajasthan'),
  di('loc_kot', 'Kota',    'kota',    'loc_rj', 'Rajasthan'),

  // ── Districts (Tamil Nadu) ────────────────────────────────────────────────────
  di('loc_chn', 'Chennai',         'chennai',          'loc_tn', 'Tamil Nadu'),
  di('loc_coi', 'Coimbatore',      'coimbatore',       'loc_tn', 'Tamil Nadu'),
  di('loc_mad', 'Madurai',         'madurai',          'loc_tn', 'Tamil Nadu'),
  di('loc_tri', 'Tiruchirappalli', 'tiruchirappalli',  'loc_tn', 'Tamil Nadu'),

  // ── Districts (Telangana — all 33) ───────────────────────────────────────────
  // 6 active (major urban/coverage hubs); remaining 27 seeded inactive
  di('loc_adl', 'Adilabad',                'adilabad',                'loc_ts', 'Telangana'),
  di('loc_bkt', 'Bhadradri Kothagudem',    'bhadradri-kothagudem',    'loc_ts', 'Telangana'),
  di('loc_hnk', 'Hanumakonda',             'hanumakonda',             'loc_ts', 'Telangana'),
  di('loc_hyd', 'Hyderabad',               'hyderabad',               'loc_ts', 'Telangana', true),
  di('loc_jgt', 'Jagtial',                 'jagtial',                 'loc_ts', 'Telangana'),
  di('loc_jgn', 'Jangaon',                 'jangaon',                 'loc_ts', 'Telangana'),
  di('loc_jsb', 'Jayashankar Bhupalpally', 'jayashankar-bhupalpally', 'loc_ts', 'Telangana'),
  di('loc_jgd', 'Jogulamba Gadwal',        'jogulamba-gadwal',        'loc_ts', 'Telangana'),
  di('loc_kmd', 'Kamareddy',               'kamareddy',               'loc_ts', 'Telangana'),
  di('loc_kar', 'Karimnagar',              'karimnagar',              'loc_ts', 'Telangana', true),
  di('loc_khm', 'Khammam',                 'khammam',                 'loc_ts', 'Telangana'),
  di('loc_kub', 'Kumuram Bheem',           'kumuram-bheem',           'loc_ts', 'Telangana'),
  di('loc_mhb', 'Mahabubabad',             'mahabubabad',             'loc_ts', 'Telangana'),
  di('loc_mhn', 'Mahabubnagar',            'mahabubnagar',            'loc_ts', 'Telangana'),
  di('loc_mch', 'Mancherial',              'mancherial',              'loc_ts', 'Telangana'),
  di('loc_mdk', 'Medak',                   'medak',                   'loc_ts', 'Telangana'),
  di('loc_mmc', 'Medchal-Malkajgiri',      'medchal-malkajgiri',      'loc_ts', 'Telangana', true),
  di('loc_mlg', 'Mulugu',                  'mulugu',                  'loc_ts', 'Telangana'),
  di('loc_ngk', 'Nagarkurnool',            'nagarkurnool',            'loc_ts', 'Telangana'),
  di('loc_nlg', 'Nalgonda',                'nalgonda',                'loc_ts', 'Telangana'),
  di('loc_nrp', 'Narayanpet',              'narayanpet',              'loc_ts', 'Telangana'),
  di('loc_nrm', 'Nirmal',                  'nirmal',                  'loc_ts', 'Telangana'),
  di('loc_niz', 'Nizamabad',               'nizamabad',               'loc_ts', 'Telangana', true),
  di('loc_pdp', 'Peddapalli',              'peddapalli',              'loc_ts', 'Telangana'),
  di('loc_rjs', 'Rajanna Sircilla',        'rajanna-sircilla',        'loc_ts', 'Telangana'),
  di('loc_rr',  'Rangareddy',              'rangareddy',              'loc_ts', 'Telangana', true),
  di('loc_sgr', 'Sangareddy',              'sangareddy',              'loc_ts', 'Telangana'),
  di('loc_sdp', 'Siddipet',               'siddipet',                'loc_ts', 'Telangana'),
  di('loc_sry', 'Suryapet',               'suryapet',                'loc_ts', 'Telangana'),
  di('loc_vkb', 'Vikarabad',              'vikarabad',               'loc_ts', 'Telangana'),
  di('loc_wnp', 'Wanaparthy',             'wanaparthy',              'loc_ts', 'Telangana'),
  di('loc_war', 'Warangal',               'warangal',                'loc_ts', 'Telangana', true),
  di('loc_ydb', 'Yadadri Bhuvanagiri',    'yadadri-bhuvanagiri',     'loc_ts', 'Telangana'),

  // ── Districts (Uttar Pradesh) ─────────────────────────────────────────────────
  di('loc_lko', 'Lucknow',    'lucknow',    'loc_up', 'Uttar Pradesh'),
  di('loc_agr', 'Agra',       'agra',       'loc_up', 'Uttar Pradesh'),
  di('loc_var', 'Varanasi',   'varanasi',   'loc_up', 'Uttar Pradesh'),
  di('loc_kan', 'Kanpur',     'kanpur',     'loc_up', 'Uttar Pradesh'),
  di('loc_pry', 'Prayagraj',  'prayagraj',  'loc_up', 'Uttar Pradesh'),
  di('loc_gzb', 'Ghaziabad',  'ghaziabad',  'loc_up', 'Uttar Pradesh'),
  di('loc_noi', 'Gautam Buddha Nagar', 'gautam-buddha-nagar', 'loc_up', 'Uttar Pradesh'),

  // ── Districts (Uttarakhand) ───────────────────────────────────────────────────
  di('loc_ddn', 'Dehradun', 'dehradun', 'loc_uk', 'Uttarakhand'),
  di('loc_hrd', 'Haridwar', 'haridwar', 'loc_uk', 'Uttarakhand'),

  // ── Districts (West Bengal) ───────────────────────────────────────────────────
  di('loc_kol', 'Kolkata',  'kolkata',  'loc_wb', 'West Bengal'),
  di('loc_how', 'Howrah',   'howrah',   'loc_wb', 'West Bengal'),
  di('loc_asn', 'Asansol',  'asansol',  'loc_wb', 'West Bengal'),

  // ── Districts (Delhi) ─────────────────────────────────────────────────────────
  di('loc_nd',  'New Delhi',     'new-delhi',     'loc_dl', 'Delhi'),
  di('loc_sd',  'South Delhi',   'south-delhi',   'loc_dl', 'Delhi'),
  di('loc_wd',  'West Delhi',    'west-delhi',    'loc_dl', 'Delhi'),
  di('loc_ed',  'East Delhi',    'east-delhi',    'loc_dl', 'Delhi'),

  // ── Districts (Jammu & Kashmir) ───────────────────────────────────────────────
  di('loc_srn', 'Srinagar', 'srinagar', 'loc_jk', 'Jammu & Kashmir'),
  di('loc_jmu', 'Jammu',    'jammu',    'loc_jk', 'Jammu & Kashmir'),

  // ── Mandals (Hyderabad district — 13 mandals) ────────────────────────────────
  ma('loc_sec',  'Secunderabad',  'secunderabad',  'loc_hyd', 'Hyderabad', true),
  ma('loc_chr',  'Charminar',     'charminar',     'loc_hyd', 'Hyderabad', true),
  ma('loc_jub',  'Jubilee Hills', 'jubilee-hills', 'loc_hyd', 'Hyderabad', true),
  ma('loc_beg',  'Begumpet',      'begumpet',      'loc_hyd', 'Hyderabad', true),
  ma('loc_lbn',  'LB Nagar',      'lb-nagar',      'loc_hyd', 'Hyderabad', true),
  ma('loc_glk',  'Golconda',      'golconda',      'loc_hyd', 'Hyderabad', true),
  ma('loc_khr',  'Khairatabad',   'khairatabad',   'loc_hyd', 'Hyderabad', true),
  ma('loc_msh',  'Musheerabad',   'musheerabad',   'loc_hyd', 'Hyderabad', true),
  ma('loc_ambt', 'Amberpet',      'amberpet',      'loc_hyd', 'Hyderabad', true),
  ma('loc_npl',  'Nampally',      'nampally',      'loc_hyd', 'Hyderabad', true),
  ma('loc_sdb',  'Saidabad',      'saidabad',      'loc_hyd', 'Hyderabad', true),
  ma('loc_asf',  'Asifnagar',     'asifnagar',     'loc_hyd', 'Hyderabad', true),
  ma('loc_bhpu', 'Bahadurpura',   'bahadurpura',   'loc_hyd', 'Hyderabad', true),

  // ── Mandals (Medchal-Malkajgiri — 11 mandals) ────────────────────────────────
  ma('loc_kuk',  'Kukatpally',             'kukatpally',             'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_alw',  'Alwal',                  'alwal',                  'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_bcp',  'Bachupally',             'bachupally',             'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_bln',  'Balanagar',              'balanagar',              'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_dng',  'Dundigal-Gandimaisamma', 'dundigal-gandimaisamma', 'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_mdpa', 'Medipally',              'medipally',              'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_upl',  'Uppal',                  'uppal',                  'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_kap',  'Kapra',                  'kapra',                  'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_shpm', 'Shamirpet',              'shamirpet',              'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_mdcl', 'Medchal',                'medchal',                'loc_mmc', 'Medchal-Malkajgiri', true),
  ma('loc_mudc', 'Muduchintalapally',      'muduchintalapally',      'loc_mmc', 'Medchal-Malkajgiri', true),

  // ── Mandals (Rangareddy — 27 mandals) ────────────────────────────────────────
  ma('loc_gac',  'Gachibowli',    'gachibowli',    'loc_rr', 'Rangareddy', true),
  ma('loc_mep',  'Maheswaram',    'maheswaram',    'loc_rr', 'Rangareddy', true),
  ma('loc_rjn',  'Rajendranagar', 'rajendranagar', 'loc_rr', 'Rangareddy', true),
  ma('loc_chv',  'Chevella',      'chevella',      'loc_rr', 'Rangareddy', true),
  ma('loc_sdn',  'Shadnagar',     'shadnagar',     'loc_rr', 'Rangareddy', true),
  ma('loc_ibpm', 'Ibrahimpatnam', 'ibrahimpatnam', 'loc_rr', 'Rangareddy', true),
  ma('loc_ych',  'Yacharam',      'yacharam',      'loc_rr', 'Rangareddy', true),
  ma('loc_gdp',  'Gandipet',      'gandipet',      'loc_rr', 'Rangareddy', true),
  ma('loc_hyt',  'Hayathnagar',   'hayathnagar',   'loc_rr', 'Rangareddy', true),
  ma('loc_sarr', 'Saroornagar',   'saroornagar',   'loc_rr', 'Rangareddy', true),
  ma('loc_moib', 'Moinabad',      'moinabad',      'loc_rr', 'Rangareddy', true),
  ma('loc_skpl', 'Shankarpally',  'shankarpally',  'loc_rr', 'Rangareddy', true),
  ma('loc_abpr', 'Abdullapurmet', 'abdullapurmet', 'loc_rr', 'Rangareddy'),
  ma('loc_bijp', 'Bijapur',       'bijapur-rr',   'loc_rr', 'Rangareddy'),
  ma('loc_prig', 'Parigi',        'parigi',        'loc_rr', 'Rangareddy'),
  ma('loc_nwbp', 'Nawabpet',      'nawabpet',      'loc_rr', 'Rangareddy'),
  ma('loc_doma', 'Doma',          'doma',          'loc_rr', 'Rangareddy'),
  ma('loc_kdgl', 'Kodangal',      'kodangal',      'loc_rr', 'Rangareddy'),
  ma('loc_frqn', 'Farooqnagar',   'farooqnagar',   'loc_rr', 'Rangareddy'),
  ma('loc_kthr', 'Kothur',        'kothur',        'loc_rr', 'Rangareddy'),
  ma('loc_tndr', 'Tandur',        'tandur',        'loc_rr', 'Rangareddy'),
  ma('loc_kulk', 'Kulkacharla',   'kulkacharla',   'loc_rr', 'Rangareddy'),
  ma('loc_bshr', 'Basheerabad',   'basheerabad',   'loc_rr', 'Rangareddy'),
  ma('loc_ylal', 'Yalal',         'yalal',         'loc_rr', 'Rangareddy'),
  ma('loc_mnpr', 'Maheshwaram',   'maheshwaram-m', 'loc_rr', 'Rangareddy'),
  ma('loc_kndr', 'Kandukur',      'kandukur-rr',   'loc_rr', 'Rangareddy'),
  ma('loc_pudr', 'Pudur',         'pudur',         'loc_rr', 'Rangareddy'),

  // ── Mandals (Karimnagar — 16 mandals) ────────────────────────────────────────
  ma('loc_krnm', 'Karimnagar',    'karimnagar-m',  'loc_kar', 'Karimnagar', true),
  ma('loc_hzbd', 'Huzurabad',     'huzurabad',     'loc_kar', 'Karimnagar', true),
  ma('loc_chpd', 'Choppadandi',   'choppadandi',   'loc_kar', 'Karimnagar', true),
  ma('loc_gngd', 'Gangadhara',    'gangadhara',    'loc_kar', 'Karimnagar', true),
  ma('loc_jmkt', 'Jammikunta',    'jammikunta',     'loc_kar', 'Karimnagar', true),
  ma('loc_kmpl', 'Kamalapur',     'kamalapur',     'loc_kar', 'Karimnagar', true),
  ma('loc_mnak', 'Manakondur',    'manakondur',    'loc_kar', 'Karimnagar'),
  ma('loc_mnth', 'Manthani',      'manthani',      'loc_kar', 'Karimnagar'),
  ma('loc_pgdp', 'Pegadapally',   'pegadapally',   'loc_kar', 'Karimnagar'),
  ma('loc_vnkv', 'Veenavanka',    'veenavanka',    'loc_kar', 'Karimnagar'),
  ma('loc_dhpu', 'Dharmapuri',    'dharmapuri',    'loc_kar', 'Karimnagar'),
  ma('loc_hsnb', 'Husnabad',      'husnabad',      'loc_kar', 'Karimnagar'),
  ma('loc_srll', 'Sircilla',      'sircilla',      'loc_kar', 'Karimnagar'),
  ma('loc_vmwd', 'Vemulawada',    'vemulawada',    'loc_kar', 'Karimnagar', true),
  ma('loc_ktrm', 'Kataram',       'kataram',       'loc_kar', 'Karimnagar'),
  ma('loc_elgd', 'Elgandal',      'elgandal',      'loc_kar', 'Karimnagar'),

  // ── Mandals (Warangal — 13 mandals) ──────────────────────────────────────────
  ma('loc_wngl', 'Warangal',      'warangal-m',    'loc_war', 'Warangal', true),
  ma('loc_hnkd', 'Hanamkonda',    'hanamkonda',    'loc_war', 'Warangal', true),
  ma('loc_kzpt', 'Kazipet',       'kazipet',       'loc_war', 'Warangal', true),
  ma('loc_gsgd', 'Geesugonda',    'geesugonda',    'loc_war', 'Warangal'),
  ma('loc_elkr', 'Elkathurthy',   'elkathurthy',   'loc_war', 'Warangal'),
  ma('loc_atmk', 'Atmakur',       'atmakur-war',   'loc_war', 'Warangal'),
  ma('loc_prkl', 'Parkal',        'parkal',        'loc_war', 'Warangal'),
  ma('loc_nrsp', 'Narsampet',     'narsampet',     'loc_war', 'Warangal'),
  ma('loc_sngm', 'Sangem',        'sangem',        'loc_war', 'Warangal'),
  ma('loc_bhpl', 'Bhupalpally',   'bhupalpally',   'loc_war', 'Warangal'),
  ma('loc_dgnd', 'Duggondi',      'duggondi',      'loc_war', 'Warangal'),
  ma('loc_dhms', 'Dharmasagar',   'dharmasagar',   'loc_war', 'Warangal'),
  ma('loc_shym', 'Shayampet',     'shayampet',     'loc_war', 'Warangal'),

  // ── Mandals (Nizamabad — 19 of 33 mandals) ───────────────────────────────────
  ma('loc_nzbd', 'Nizamabad',     'nizamabad-m',   'loc_niz', 'Nizamabad', true),
  ma('loc_armr', 'Armoor',        'armoor',        'loc_niz', 'Nizamabad', true),
  ma('loc_blkd', 'Balkonda',      'balkonda',      'loc_niz', 'Nizamabad', true),
  ma('loc_bhmg', 'Bheemgal',      'bheemgal',      'loc_niz', 'Nizamabad'),
  ma('loc_bdhn', 'Bodhan',        'bodhan',        'loc_niz', 'Nizamabad', true),
  ma('loc_dcpl', 'Dichapally',    'dichapally',    'loc_niz', 'Nizamabad'),
  ma('loc_ktgi', 'Kotagiri',      'kotagiri',      'loc_niz', 'Nizamabad'),
  ma('loc_mdnr', 'Madnur',        'madnur',        'loc_niz', 'Nizamabad'),
  ma('loc_ndpt', 'Nandipet',      'nandipet',      'loc_niz', 'Nizamabad'),
  ma('loc_ptlm', 'Pitlam',        'pitlam',        'loc_niz', 'Nizamabad'),
  ma('loc_rdru', 'Rudrur',        'rudrur',        'loc_niz', 'Nizamabad'),
  ma('loc_vrni', 'Varni',         'varni',         'loc_niz', 'Nizamabad'),
  ma('loc_bnsw', 'Banswada',      'banswada',      'loc_niz', 'Nizamabad'),
  ma('loc_jkkl', 'Jukkal',        'jukkal',        'loc_niz', 'Nizamabad'),
  ma('loc_ylrd', 'Yellareddy',    'yellareddy',    'loc_niz', 'Nizamabad'),
  ma('loc_nvpt', 'Navipet',       'navipet',       'loc_niz', 'Nizamabad'),
  ma('loc_mhur', 'Mahoor',        'mahoor',        'loc_niz', 'Nizamabad'),
  ma('loc_mpkl', 'Mupkal',        'mupkal',        'loc_niz', 'Nizamabad'),
  ma('loc_ktlp', 'Kotlapur',      'kotlapur',      'loc_niz', 'Nizamabad'),

  // ── Mandals (Bengaluru Urban) ─────────────────────────────────────────────────
  ma('loc_kor', 'Koramangala',  'koramangala',  'loc_blr', 'Bengaluru Urban'),
  ma('loc_whi', 'Whitefield',   'whitefield',   'loc_blr', 'Bengaluru Urban'),
  ma('loc_yen', 'Yeshwanthpur', 'yeshwanthpur', 'loc_blr', 'Bengaluru Urban'),

  // ── Mandals (Mumbai) ─────────────────────────────────────────────────────────
  ma('loc_and', 'Andheri',   'andheri',   'loc_mum', 'Mumbai'),
  ma('loc_bor', 'Borivali',  'borivali',  'loc_mum', 'Mumbai'),
  ma('loc_dah', 'Dahisar',   'dahisar',   'loc_mum', 'Mumbai'),

  // ── Mandals (Chennai) ─────────────────────────────────────────────────────────
  ma('loc_ann', 'Anna Nagar',  'anna-nagar',  'loc_chn', 'Chennai'),
  ma('loc_vel', 'Velachery',   'velachery',   'loc_chn', 'Chennai'),
  ma('loc_tno', 'T. Nagar',    'tnagar',      'loc_chn', 'Chennai'),

  // ── Villages (Secunderabad mandal) ────────────────────────────────────────────
  vi('loc_bow',  'Bowenpally',     'bowenpally',     'loc_sec', 'Secunderabad', true),
  vi('loc_mar',  'Marredpally',    'marredpally',    'loc_sec', 'Secunderabad', true),
  vi('loc_mkj',  'Malkajgiri',     'malkajgiri',     'loc_sec', 'Secunderabad', true),
  vi('loc_rslp', 'Rasoolpura',     'rasoolpura',     'loc_sec', 'Secunderabad', true),

  // ── Villages (Charminar mandal) ───────────────────────────────────────────────
  vi('loc_ldbz', 'Laad Bazaar',    'laad-bazaar',    'loc_chr', 'Charminar', true),
  vi('loc_shbn', 'Shalibanda',     'shalibanda',     'loc_chr', 'Charminar', true),
  vi('loc_mgpr', 'Moghalpura',     'moghalpura',     'loc_chr', 'Charminar', true),

  // ── Villages (Jubilee Hills mandal) ──────────────────────────────────────────
  vi('loc_bnjr', 'Banjara Hills',  'banjara-hills',  'loc_jub', 'Jubilee Hills', true),
  vi('loc_mdhp', 'Madhpur',        'madhpur',        'loc_jub', 'Jubilee Hills', true),

  // ── Villages (Golconda mandal) ────────────────────────────────────────────────
  vi('loc_glkv', 'Golconda Fort',  'golconda-fort',  'loc_glk', 'Golconda', true),
  vi('loc_toli', 'Tolichowki',     'tolichowki',     'loc_glk', 'Golconda', true),

  // ── Villages (Nampally mandal) ────────────────────────────────────────────────
  vi('loc_abds', 'Abids',          'abids',          'loc_npl', 'Nampally', true),
  vi('loc_koti', 'Koti',           'koti',           'loc_npl', 'Nampally', true),

  // ── Villages (Kukatpally mandal — under Medchal-Malkajgiri) ──────────────────
  vi('loc_kphb', 'KPHB Colony',    'kphb-colony',    'loc_kuk', 'Kukatpally', true),
  vi('loc_miyr', 'Miyapur',        'miyapur',        'loc_kuk', 'Kukatpally', true),
  vi('loc_pwdg', 'Pragathi Nagar', 'pragathi-nagar', 'loc_kuk', 'Kukatpally', true),

  // ── Villages (Bachupally mandal) ─────────────────────────────────────────────
  vi('loc_bach', 'Bachupally',     'bachupally-v',   'loc_bcp', 'Bachupally', true),
  vi('loc_nkrs', 'Nizampet',       'nizampet',       'loc_bcp', 'Bachupally', true),

  // ── Villages (Alwal mandal) ───────────────────────────────────────────────────
  vi('loc_alwv', 'Alwal',          'alwal-v',        'loc_alw', 'Alwal', true),
  vi('loc_jdmt', 'Jeedimetla',     'jeedimetla',     'loc_alw', 'Alwal', true),

  // ── Villages (Uppal mandal) ───────────────────────────────────────────────────
  vi('loc_uplv', 'Uppal',          'uppal-v',        'loc_upl', 'Uppal', true),
  vi('loc_nchr', 'Nacharam',       'nacharam',       'loc_upl', 'Uppal', true),

  // ── Villages (Gachibowli mandal) ─────────────────────────────────────────────
  vi('loc_htch', 'HiTech City',    'hitech-city',    'loc_gac', 'Gachibowli', true),
  vi('loc_kndr', 'Kondapur',       'kondapur',       'loc_gac', 'Gachibowli', true),
  vi('loc_mdpr', 'Madhapur',       'madhapur',       'loc_gac', 'Gachibowli', true),
  vi('loc_gcbv', 'Gachibowli',     'gachibowli-v',   'loc_gac', 'Gachibowli', true),

  // ── Villages (Rajendranagar mandal) ──────────────────────────────────────────
  vi('loc_bndg', 'Bandlaguda',     'bandlaguda',     'loc_rjn', 'Rajendranagar', true),
  vi('loc_hmyn', 'Himayatnagar',   'himayatnagar',   'loc_rjn', 'Rajendranagar', true),

  // ── Villages (Karimnagar mandal) ─────────────────────────────────────────────
  vi('loc_krnv', 'Karimnagar Main','karimnagar-main','loc_krnm', 'Karimnagar', true),
  vi('loc_mkrm', 'Mukarampura',    'mukarampura',    'loc_krnm', 'Karimnagar', true),

  // ── Villages (Vemulawada mandal) ─────────────────────────────────────────────
  vi('loc_vmlv', 'Vemulawada',     'vemulawada-v',   'loc_vmwd', 'Vemulawada', true),

  // ── Villages (Warangal mandal) ────────────────────────────────────────────────
  vi('loc_wngv', 'Warangal Main',  'warangal-main',  'loc_wngl', 'Warangal', true),
  vi('loc_hnkv', 'Hanamkonda',     'hanamkonda-v',   'loc_hnkd', 'Hanamkonda', true),
  vi('loc_kzpv', 'Kazipet',        'kazipet-v',      'loc_kzpt', 'Kazipet', true),

  // ── Villages (Bodhan mandal — Nizamabad) ─────────────────────────────────────
  vi('loc_bdnv', 'Bodhan',         'bodhan-v',       'loc_bdhn', 'Bodhan', true),

  // ── Villages (Armoor mandal — Nizamabad) ─────────────────────────────────────
  vi('loc_armv', 'Armoor',         'armoor-v',       'loc_armr', 'Armoor', true),

  // ── Villages (Koramangala mandal — Bengaluru) ─────────────────────────────────
  vi('loc_hbr', 'HSR Layout',  'hsr-layout',  'loc_kor', 'Koramangala'),
  vi('loc_inj', 'Indiranagar', 'indiranagar', 'loc_kor', 'Koramangala'),
]

// ── Languages ─────────────────────────────────────────────────────────────────

export const SEEDED_LANGUAGES: Language[] = [
  { id: 'lang_te', organizationId: PURALOCAL_ORG_ID, code: 'te', name: 'Telugu',  slug: 'telugu',  active: true, deletedAt: null, createdAt: r, nativeName: 'తెలుగు',    direction: 'ltr', sortOrder: 1 },
  { id: 'lang_en', organizationId: PURALOCAL_ORG_ID, code: 'en', name: 'English', slug: 'english', active: true, deletedAt: null, createdAt: r, nativeName: 'English',    direction: 'ltr', sortOrder: 2 },
  { id: 'lang_hi', organizationId: PURALOCAL_ORG_ID, code: 'hi', name: 'Hindi',   slug: 'hindi',   active: true, deletedAt: null, createdAt: r, nativeName: 'हिन्दी',    direction: 'ltr', sortOrder: 3 },
  { id: 'lang_kn', organizationId: PURALOCAL_ORG_ID, code: 'kn', name: 'Kannada', slug: 'kannada', active: true, deletedAt: null, createdAt: r, nativeName: 'ಕನ್ನಡ',    direction: 'ltr', sortOrder: 4 },
  { id: 'lang_ta', organizationId: PURALOCAL_ORG_ID, code: 'ta', name: 'Tamil',   slug: 'tamil',   active: true, deletedAt: null, createdAt: r, nativeName: 'தமிழ்',    direction: 'ltr', sortOrder: 5 },
  { id: 'lang_ur', organizationId: PURALOCAL_ORG_ID, code: 'ur', name: 'Urdu',    slug: 'urdu',    active: true, deletedAt: null, createdAt: r, nativeName: 'اردو',      direction: 'rtl', sortOrder: 6 },
]

// ── Seeded content ─────────────────────────────────────────────────────────────
// Thumbnails: https://picsum.photos (free, no auth)
// Reporter photos: https://i.pravatar.cc (free, no auth)

export const SEEDED_CONTENT: Content[] = [
  // ── 1. Telugu · Local News · Published ────────────────────────────────────
  {
    id: 'content_001',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.PUBLISHED, source: ContentSource.CMS,
    title: 'హైదరాబాద్ మెట్రో విస్తరణ: పాత నగరానికి కొత్త కనెక్టివిటీ',
    slug: 'hyderabad-metro-expansion-old-city-te',
    body: 'హైదరాబాద్ మెట్రో రైల్ ప్రాజెక్ట్ పాత నగరానికి మెట్రో సేవలను విస్తరింపజేస్తున్నది. చార్మినార్ నుండి ఎంజీబీఎస్ వరకు కొత్త కారిడార్ నిర్మాణం త్వరలో ప్రారంభం కానుంది.',
    excerpt: 'HMRL చార్మినార్-ఎంజీబీఎస్ కారిడార్ ప్రకటన చేసింది, 12 కొత్త స్టేషన్లు నిర్మించనున్నారు.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/metro-hyderabad/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_hyd', languageId: 'lang_te',
    reporterId: 'user_reporter',
    tags: ['మెట్రో', 'infrastructure', 'hyderabad'], isBreakingNews: true, isTrending: true, isFeatured: false,
    scheduledAt: null, publishedAt: new Date('2024-06-20T10:00:00Z'),
    createdAt: new Date('2024-06-19T09:00:00Z'), updatedAt: new Date('2024-06-20T10:00:00Z'),
    categoryName: 'Local News', locationName: 'Hyderabad', languageName: 'Telugu',
    reporterName: 'Ravi Kumar', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=12', reporterRole: 'Senior Reporter',
  },

  // ── 2. English · Sports · Under Review ────────────────────────────────────
  {
    id: 'content_002',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.VIDEO, status: ContentStatus.UNDER_REVIEW, source: ContentSource.APP,
    title: 'IPL 2024: Sunrisers Hyderabad Smash Record 277 Runs Against Mumbai Indians',
    slug: 'ipl-2024-srh-record-277-vs-mi',
    body: 'Sunrisers Hyderabad set a new IPL record by scoring 277 runs in their clash against Mumbai Indians. Travis Head and Abhishek Sharma put on a stunning 182-run opening partnership.',
    excerpt: 'SRH shatter IPL scoring record with 277/3 against MI; Head scores 89 off 39 balls.',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/cricket-stadium/360/640',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_sports', locationId: 'loc_hyd', languageId: 'lang_en',
    reporterId: 'user_reporter',
    tags: ['ipl', 'cricket', 'srh', 'record'], isBreakingNews: true, isTrending: true, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-21T14:00:00Z'), updatedAt: new Date('2024-06-21T14:00:00Z'),
    categoryName: 'Sports', locationName: 'Hyderabad', languageName: 'English',
    reporterName: 'Sai Kiran Reddy', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=33', reporterRole: 'Staff Reporter',
  },

  // ── 3. Telugu · Politics · Draft ──────────────────────────────────────────
  {
    id: 'content_003',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.DRAFT, source: ContentSource.CMS,
    title: 'తెలంగాణ బడ్జెట్ 2024: హైదరాబాద్‌కు ₹18,000 కోట్లు కేటాయింపు',
    slug: 'telangana-budget-2024-hyderabad-te',
    body: 'తెలంగాణ రాష్ట్ర ప్రభుత్వం నేటి బడ్జెట్‌లో హైదరాబాద్ అభివృద్ధికి భారీగా నిధులు కేటాయించింది. మౌలిక సదుపాయాలు, మెట్రో విస్తరణ, రహదారుల నిర్మాణంపై ప్రత్యేక దృష్టి సారించింది.',
    excerpt: 'ఆర్థిక మంత్రి హైదరాబాద్ అవస్థాపనకు ₹18,000 కోట్లు ప్రకటించారు.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/parliament-budget/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_politics', locationId: 'loc_hyd', languageId: 'lang_te',
    reporterId: 'user_editor',
    tags: ['budget', 'telangana', 'politics', 'హైదరాబాద్'], isBreakingNews: false, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-22T11:00:00Z'), updatedAt: new Date('2024-06-22T11:00:00Z'),
    categoryName: 'Politics', locationName: 'Hyderabad', languageName: 'Telugu',
    reporterName: 'Priya Reddy', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=5', reporterRole: 'Contributor',
  },

  // ── 4. English · Local News · Needs Clarification ─────────────────────────
  {
    id: 'content_004',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.VIDEO, status: ContentStatus.NEEDS_CLARIFICATION, source: ContentSource.APP,
    title: 'Bengaluru Outer Ring Road: Weekend Closure Map & Alternate Routes',
    slug: 'bengaluru-orr-weekend-closure-routes',
    body: 'BBMP has announced partial closures on the Outer Ring Road between Marathahalli and Sarjapur from Saturday 10 PM to Monday 6 AM for emergency pothole repair work.',
    excerpt: 'BBMP shuts ORR stretch for repairs; commuters advised to use Hosur Road and NH-44 as alternatives.',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/city-traffic-road/360/640',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_blr', languageId: 'lang_en',
    reporterId: 'user_reporter',
    tags: ['traffic', 'bengaluru', 'orr', 'bbmp'], isBreakingNews: false, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-23T08:00:00Z'), updatedAt: new Date('2024-06-23T09:30:00Z'),
    categoryName: 'Local News', locationName: 'Bengaluru Urban', languageName: 'English',
    reporterName: 'Vijay Kumar', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=52', reporterRole: 'Staff Reporter',
    rejectionNote: 'Video quality is below broadcast standard. Please re-shoot in 1080p and ensure no shaky footage.',
  },

  // ── 5. English · Local News · Scheduled ───────────────────────────────────
  {
    id: 'content_005',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.SCHEDULED, source: ContentSource.CMS,
    title: 'Mumbai Monsoon 2024: IMD Issues Red Alert, Trains Delayed Across Western Line',
    slug: 'mumbai-monsoon-2024-red-alert',
    body: 'The India Meteorological Department has issued a red alert for Mumbai Metropolitan Region, predicting 200mm rainfall in 24 hours. Western Railway has cancelled 14 local trains citing safety concerns on the waterlogged tracks.',
    excerpt: 'IMD red alert for Mumbai: 200mm rain forecast; 14 Western Railway trains cancelled.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/mumbai-rain-monsoon/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_mum', languageId: 'lang_en',
    reporterId: 'user_editor',
    tags: ['monsoon', 'mumbai', 'imd', 'trains'], isBreakingNews: true, isTrending: false, isFeatured: true,
    scheduledAt: new Date('2024-06-25T06:00:00Z'), publishedAt: null,
    createdAt: new Date('2024-06-24T16:00:00Z'), updatedAt: new Date('2024-06-24T16:30:00Z'),
    categoryName: 'Local News', locationName: 'Mumbai', languageName: 'English',
    reporterName: 'Preethi Mehta', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=47', reporterRole: 'Senior Reporter',
  },

  // ── 6. Telugu · Entertainment · Published ─────────────────────────────────
  {
    id: 'content_006',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.SHORT, status: ContentStatus.PUBLISHED, source: ContentSource.APP,
    title: 'చార్మినార్ బిర్యాని ఫెస్టివల్: 50 స్టాల్స్, లక్ష మంది హాజరు అంచనా',
    slug: 'charminar-biryani-festival-2024-te',
    body: 'చార్మినార్ వద్ద జరుగుతున్న వార్షిక బిర్యాని ఫెస్టివల్‌లో హైదరాబాద్ శైలి, రాయలసీమ శైలి తదితర రకాల బిర్యానీలు అందుబాటులో ఉన్నాయి. మూడు రోజుల పండుగలో లక్ష మంది పాల్గొంటారని నిర్వాహకులు చెప్పారు.',
    excerpt: 'చార్మినార్ 3-రోజుల బిర్యాని ఫెస్టివల్: 50+ స్టాల్స్, నేరుగా వంట ప్రదర్శనలు.',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/indian-food-festival/360/640',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_entertainment', locationId: 'loc_chr', languageId: 'lang_te',
    reporterId: 'user_reporter',
    tags: ['food', 'festival', 'charminar', 'biryani'], isBreakingNews: false, isTrending: true, isFeatured: true,
    scheduledAt: null, publishedAt: new Date('2024-06-22T12:00:00Z'),
    createdAt: new Date('2024-06-22T10:00:00Z'), updatedAt: new Date('2024-06-22T12:00:00Z'),
    categoryName: 'Entertainment', locationName: 'Charminar', languageName: 'Telugu',
    reporterName: 'Lakshmi Devi', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=25', reporterRole: 'Contributor',
  },

  // ── 7. Tamil · Local News · Under Review ──────────────────────────────────
  {
    id: 'content_007',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.UNDER_REVIEW, source: ContentSource.CMS,
    title: 'சென்னை நீர் நெருக்கடி: நான்கு ஏரிகளும் 40% திறனில் உள்ளன',
    slug: 'chennai-water-crisis-reservoirs-2024-ta',
    body: 'சென்னையின் முக்கிய நான்கு ஏரிகளான பூண்டி, செம்பரம்பாக்கம், ரெட் ஹில்ஸ் மற்றும் சோழவரம் ஆகியவை 40% திறனில் மட்டுமே உள்ளன. கோடை காலத்தில் நீர் தட்டுப்பாடு ஏற்படும் என அதிகாரிகள் எச்சரிக்கின்றனர்.',
    excerpt: 'CMWSSB நீர் சேமிப்பு வேண்டுகோள்; நகர ஏரிகள் ஆபத்தான அளவில் குறைந்தன.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/reservoir-water-india/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_chn', languageId: 'lang_ta',
    reporterId: 'user_editor',
    tags: ['water', 'chennai', 'crisis', 'ஏரி'], isBreakingNews: true, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-24T09:00:00Z'), updatedAt: new Date('2024-06-24T09:00:00Z'),
    categoryName: 'Local News', locationName: 'Chennai', languageName: 'Tamil',
    reporterName: 'Anitha Rajan', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=35', reporterRole: 'Contributor',
  },

  // ── 8. Hindi · Local News · Published ─────────────────────────────────────
  {
    id: 'content_008',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.SHORT, status: ContentStatus.PUBLISHED, source: ContentSource.CMS,
    title: 'दिल्ली वायु गुणवत्ता सुधरी: ऑड-ईवन नियम के बाद AQI 180 पर',
    slug: 'delhi-aqi-improves-odd-even-hi',
    body: 'दिल्ली सरकार के ऑड-ईवन वाहन योजना के पहले सप्ताह के बाद राष्ट्रीय राजधानी में वायु गुणवत्ता सूचकांक (AQI) 280 से घटकर 180 पर आ गया है। पर्यावरण मंत्री ने इसे एक सकारात्मक संकेत बताया।',
    excerpt: 'ऑड-ईवन के एक हफ्ते बाद दिल्ली AQI 280 से 180 पर पहुंचा; सरकार ने योजना जारी रखने का फैसला किया।',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/delhi-city-smog/360/640',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_nd', languageId: 'lang_hi',
    reporterId: 'user_reporter',
    tags: ['delhi', 'aqi', 'pollution', 'odd-even'], isBreakingNews: false, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: new Date('2024-06-23T18:00:00Z'),
    createdAt: new Date('2024-06-23T14:00:00Z'), updatedAt: new Date('2024-06-23T18:00:00Z'),
    categoryName: 'Local News', locationName: 'New Delhi', languageName: 'Hindi',
    reporterName: 'Meera Singh', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=44', reporterRole: 'Staff Reporter',
  },

  // ── 9. Kannada · Technology · Published ───────────────────────────────────
  {
    id: 'content_009',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.PUBLISHED, source: ContentSource.CMS,
    title: 'ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ಹಂತ-3: ಹೊಸ 44 ಕಿಮೀ ರೇಖೆಗೆ ಕೇಂದ್ರ ಅನುಮೋದನೆ',
    slug: 'bengaluru-metro-phase3-approval-kn',
    body: 'ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ರೈಲ್ ನಿಗಮ (BMRCL) ಹಂತ-3 ಯೋಜನೆಗೆ ಕೇಂದ್ರ ಸಚಿವ ಸಂಪುಟ ಅನುಮೋದನೆ ನೀಡಿದೆ. 44.65 ಕಿಮೀ ಹೊಸ ರೇಖೆಯು ಜೆಪಿ ನಗರ ಮತ್ತು ಕೆಂಗೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಲಿದೆ.',
    excerpt: 'BMRCL ಹಂತ-3: 44km ಹೊಸ ಮೆಟ್ರೋ ಮಾರ್ಗ ₹15,611 ಕೋಟಿ ವೆಚ್ಚದಲ್ಲಿ ನಿರ್ಮಾಣ.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/bangalore-metro-tech/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_technology', locationId: 'loc_blr', languageId: 'lang_kn',
    reporterId: 'user_reporter',
    tags: ['metro', 'bengaluru', 'bmrcl', 'infrastructure'], isBreakingNews: false, isTrending: true, isFeatured: true,
    scheduledAt: null, publishedAt: new Date('2024-06-21T08:00:00Z'),
    createdAt: new Date('2024-06-20T15:00:00Z'), updatedAt: new Date('2024-06-21T08:00:00Z'),
    categoryName: 'Technology', locationName: 'Bengaluru Urban', languageName: 'Kannada',
    reporterName: 'Suresh Gowda', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=62', reporterRole: 'Senior Reporter',
  },

  // ── 10. Telugu · Local News · Draft ───────────────────────────────────────
  {
    id: 'content_010',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.VIDEO, status: ContentStatus.DRAFT, source: ContentSource.APP,
    title: 'హైదరాబాద్ వర్షాకాలం 2024: మూసీ నది పరిస్థితి తీవ్రం',
    slug: 'hyderabad-monsoon-musi-river-2024-te',
    body: 'హైదరాబాద్‌లో భారీ వర్షాల కారణంగా మూసీ నది జలమట్టం పెరిగింది. నాంపల్లి, కింగ్‌కోఠి ప్రాంతాల్లో నీరు చేరింది. GHMC అధికారులు అప్రమత్తంగా ఉన్నారు.',
    excerpt: 'మూసీ జలమట్టం ప్రమాద మర్యాదను దాటింది; GHMC నివాసులకు అప్రమత్తత హెచ్చరిక జారీ.',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/river-flood-rain/360/640',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_local_news', locationId: 'loc_hyd', languageId: 'lang_te',
    reporterId: 'user_reporter',
    tags: ['వర్షాలు', 'musi', 'hyderabad', 'flood'], isBreakingNews: true, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-25T07:00:00Z'), updatedAt: new Date('2024-06-25T07:30:00Z'),
    categoryName: 'Local News', locationName: 'Hyderabad', languageName: 'Telugu',
    reporterName: 'Kiran Babu', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=8', reporterRole: 'Contributor',
  },

  // ── 11. Hindi · Business · Scheduled ──────────────────────────────────────
  {
    id: 'content_011',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.SCHEDULED, source: ContentSource.CMS,
    title: 'हैदराबाद IT कॉरिडोर: 2025 तक 50,000 नई नौकरियां, ₹12,000 करोड़ निवेश',
    slug: 'hyderabad-it-corridor-jobs-2025-hi',
    body: 'तेलंगाना सरकार ने हैदराबाद के IT कॉरिडोर में ₹12,000 करोड़ के निवेश की घोषणा की है। माइक्रोसॉफ्ट, गूगल और अमेज़न तीनों कंपनियों ने विस्तार योजनाएं साझा की हैं।',
    excerpt: 'तेलंगाना IT नीति 2024: Microsoft, Google, Amazon से ₹12,000 करोड़; 50k नई नौकरियों का वादा।',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/it-tech-office-india/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_business', locationId: 'loc_hyd', languageId: 'lang_hi',
    reporterId: 'user_editor',
    tags: ['it', 'hyderabad', 'investment', 'jobs'], isBreakingNews: false, isTrending: false, isFeatured: true,
    scheduledAt: new Date('2024-06-26T09:00:00Z'), publishedAt: null,
    createdAt: new Date('2024-06-25T12:00:00Z'), updatedAt: new Date('2024-06-25T12:00:00Z'),
    categoryName: 'Business', locationName: 'Hyderabad', languageName: 'Hindi',
    reporterName: 'Ramesh Gupta', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=20', reporterRole: 'Freelancer',
  },

  // ── 12. English · Health · Under Review ───────────────────────────────────
  {
    id: 'content_012',
    organizationId: PURALOCAL_ORG_ID,
    type: ContentType.IMAGE, status: ContentStatus.UNDER_REVIEW, source: ContentSource.APP,
    title: 'Hyderabad Hospitals Report 40% Spike in Viral Fever Cases Amid Monsoon',
    slug: 'hyderabad-viral-fever-spike-monsoon-2024',
    body: 'Major hospitals in Hyderabad including KIMS, Apollo and Yashoda report a 40% increase in viral fever, dengue and malaria cases since the onset of the monsoon season. Doctors urge citizens to take preventive measures.',
    excerpt: 'KIMS, Apollo and Yashoda hospitals see 40% surge in monsoon-related fever cases; doctors advise mosquito prevention.',
    mediaUrl: null, youtubeUrl: null,
    thumbnailUrl: 'https://picsum.photos/seed/hospital-health-india/640/360',
    imageUrls: [],
    orientation: null,
    categoryId: 'cat_health', locationId: 'loc_hyd', languageId: 'lang_en',
    reporterId: 'user_reporter',
    tags: ['health', 'dengue', 'monsoon', 'hyderabad'], isBreakingNews: false, isTrending: false, isFeatured: false,
    scheduledAt: null, publishedAt: null,
    createdAt: new Date('2024-06-25T10:00:00Z'), updatedAt: new Date('2024-06-25T10:30:00Z'),
    categoryName: 'Health', locationName: 'Hyderabad', languageName: 'English',
    reporterName: 'Arun Sharma', reporterPhotoUrl: 'https://i.pravatar.cc/150?img=10', reporterRole: 'Contributor',
  },
]

// ── Seeded notifications ───────────────────────────────────────────────────────

export const SEEDED_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif_001',
    organizationId: PURALOCAL_ORG_ID,
    title: 'Breaking: Hyderabad Metro Phase 3 Approved',
    body: 'The central government has approved the Hyderabad Metro Phase 3 project. 44km of new lines, 31 new stations. Read the full story on PuraLocal.',
    imageUrl: null, deepLink: 'puralocal://article/hyderabad-metro-phase3-approval-kn',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    audience: NotificationAudience.APP_USERS, audienceValue: null,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.SENT,
    templateId: null,
    scheduledAt: null, sentAt: new Date('2024-06-21T08:05:00Z'),
    sentBy: 'user_editor', sentByName: 'Editor',
    estimatedRecipients: 24500, deliveredCount: 23100, openedCount: 8200, failedCount: 1400,
    createdAt: new Date('2024-06-21T08:00:00Z'), updatedAt: new Date('2024-06-21T08:05:00Z'),
  },
  {
    id: 'notif_002',
    organizationId: PURALOCAL_ORG_ID,
    title: 'Mumbai Monsoon Red Alert — Stay Safe',
    body: 'IMD has issued a Red Alert for Mumbai. Heavy rainfall expected. Avoid waterlogged areas. Check PuraLocal for live updates.',
    imageUrl: null, deepLink: 'puralocal://article/mumbai-monsoon-2024-red-alert',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
    audience: NotificationAudience.ALL, audienceValue: null,
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.SENT,
    templateId: null,
    scheduledAt: null, sentAt: new Date('2024-06-25T06:02:00Z'),
    sentBy: 'user_org_admin', sentByName: 'Org Admin',
    estimatedRecipients: 24553, deliveredCount: 24100, openedCount: 14200, failedCount: 453,
    createdAt: new Date('2024-06-25T06:00:00Z'), updatedAt: new Date('2024-06-25T06:02:00Z'),
  },
  {
    id: 'notif_003',
    organizationId: PURALOCAL_ORG_ID,
    title: 'Weekly Digest: Top Stories This Week',
    body: 'Catch up on the biggest local stories from across India — metro expansions, monsoon updates, election results and more.',
    imageUrl: null, deepLink: 'puralocal://digest/weekly',
    channels: [NotificationChannel.EMAIL],
    audience: NotificationAudience.APP_USERS, audienceValue: null,
    priority: NotificationPriority.NORMAL,
    status: NotificationStatus.SCHEDULED,
    templateId: 'tpl_weekly_digest',
    scheduledAt: new Date('2024-06-30T08:00:00Z'), sentAt: null,
    sentBy: 'user_marketing_manager', sentByName: 'Marketing Manager',
    estimatedRecipients: 24500, deliveredCount: 0, openedCount: 0, failedCount: 0,
    createdAt: new Date('2024-06-26T10:00:00Z'), updatedAt: new Date('2024-06-26T10:00:00Z'),
  },
  {
    id: 'notif_004',
    organizationId: PURALOCAL_ORG_ID,
    title: 'New Story Assignment: Monsoon Coverage',
    body: 'You have been assigned to cover the Hyderabad monsoon beat. Check your Reporter dashboard for details.',
    imageUrl: null, deepLink: 'puralocal://reporter/assignments',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    audience: NotificationAudience.REPORTERS, audienceValue: null,
    priority: NotificationPriority.NORMAL,
    status: NotificationStatus.SENT,
    templateId: 'tpl_reporter_assignment',
    scheduledAt: null, sentAt: new Date('2024-06-25T09:00:00Z'),
    sentBy: 'user_reporter_manager', sentByName: 'Reporter Manager',
    estimatedRecipients: 42, deliveredCount: 40, openedCount: 35, failedCount: 2,
    createdAt: new Date('2024-06-25T09:00:00Z'), updatedAt: new Date('2024-06-25T09:00:00Z'),
  },
  {
    id: 'notif_005',
    organizationId: PURALOCAL_ORG_ID,
    title: 'System Maintenance Tonight 2–4 AM',
    body: 'PuraLocal CMS will be under scheduled maintenance from 2 AM to 4 AM IST. Save your work before 1:55 AM.',
    imageUrl: null, deepLink: null,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    audience: NotificationAudience.ALL_CMS_USERS, audienceValue: null,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.DRAFT,
    templateId: 'tpl_system_maintenance',
    scheduledAt: null, sentAt: null,
    sentBy: 'user_super_admin', sentByName: 'Platform Super Admin',
    estimatedRecipients: 11, deliveredCount: 0, openedCount: 0, failedCount: 0,
    createdAt: new Date('2024-06-26T14:00:00Z'), updatedAt: new Date('2024-06-26T14:00:00Z'),
  },
  {
    id: 'notif_006',
    organizationId: PURALOCAL_ORG_ID,
    title: 'IPL Final: SRH vs KKR — Watch Live on PuraLocal',
    body: 'The IPL 2024 Final is live! Sunrisers Hyderabad face Kolkata Knight Riders. Watch ball-by-ball updates on the PuraLocal app.',
    imageUrl: null, deepLink: 'puralocal://live/ipl-final-2024',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    audience: NotificationAudience.APP_USERS, audienceValue: null,
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.FAILED,
    templateId: null,
    scheduledAt: null, sentAt: null,
    sentBy: 'user_editor', sentByName: 'Editor',
    estimatedRecipients: 24500, deliveredCount: 1200, openedCount: 0, failedCount: 23300,
    createdAt: new Date('2024-06-23T19:00:00Z'), updatedAt: new Date('2024-06-23T19:05:00Z'),
  },
]

// ── Seeded notification templates ─────────────────────────────────────────────

export const SEEDED_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl_breaking_news',
    organizationId: PURALOCAL_ORG_ID,
    name: 'Breaking News Alert',
    description: 'Push alert for urgent breaking news stories',
    title: 'Breaking: {headline}',
    body: '{summary}. Read the full story on PuraLocal.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    audience: NotificationAudience.APP_USERS,
    priority: NotificationPriority.HIGH,
    category: 'content',
  },
  {
    id: 'tpl_weekly_digest',
    organizationId: PURALOCAL_ORG_ID,
    name: 'Weekly Digest',
    description: 'Weekly email digest of top stories',
    title: 'Your Weekly PuraLocal Digest',
    body: 'Here are the top stories from your region this week. Open the app to read them all.',
    channels: [NotificationChannel.EMAIL],
    audience: NotificationAudience.APP_USERS,
    priority: NotificationPriority.NORMAL,
    category: 'marketing',
  },
  {
    id: 'tpl_reporter_assignment',
    organizationId: PURALOCAL_ORG_ID,
    name: 'Reporter Assignment',
    description: 'Notify reporters of a new story assignment',
    title: 'New Assignment: {beat}',
    body: 'You have been assigned to cover {beat}. Check your Reporter dashboard for details and deadlines.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    audience: NotificationAudience.REPORTERS,
    priority: NotificationPriority.NORMAL,
    category: 'reporter',
  },
  {
    id: 'tpl_system_maintenance',
    organizationId: PURALOCAL_ORG_ID,
    name: 'System Maintenance',
    description: 'Alert CMS staff of scheduled downtime',
    title: 'Scheduled Maintenance: {time_window}',
    body: 'PuraLocal CMS will be under scheduled maintenance {time_window}. Please save all work before the window begins.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    audience: NotificationAudience.ALL_CMS_USERS,
    priority: NotificationPriority.HIGH,
    category: 'system',
  },
  {
    id: 'tpl_content_published',
    organizationId: PURALOCAL_ORG_ID,
    name: 'Content Published',
    description: 'Notify the reporter when their story goes live',
    title: 'Your story is live!',
    body: '"{title}" has been published on PuraLocal. Tap to see it.',
    channels: [NotificationChannel.IN_APP],
    audience: NotificationAudience.REPORTERS,
    priority: NotificationPriority.NORMAL,
    category: 'content',
  },
  {
    id: 'tpl_promo_offer',
    organizationId: PURALOCAL_ORG_ID,
    name: 'Promotional Offer',
    description: 'Marketing campaign for app engagement',
    title: '{promo_headline}',
    body: '{promo_body} Open PuraLocal to claim your offer.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
    audience: NotificationAudience.APP_USERS,
    priority: NotificationPriority.LOW,
    category: 'marketing',
  },
]

// ── Audit log entries ─────────────────────────────────────────────────────────

function d(offsetDays: number, hour = 10, min = 0): Date {
  const dt = new Date('2026-06-27T00:00:00Z')
  dt.setDate(dt.getDate() - offsetDays)
  dt.setHours(hour, min, 0, 0)
  return dt
}

export const SEEDED_AUDIT_ENTRIES: AuditEntry[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { id: 'a001', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'auth.login', targetType: 'auth', targetId: 'user_org_admin', targetLabel: 'Org Admin', metadata: { ip: '49.206.12.34', device: 'Chrome / macOS' }, createdAt: d(0, 9, 2) },
  { id: 'a002', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'auth.login', targetType: 'auth', targetId: 'user_editor', targetLabel: 'Editor', metadata: { ip: '49.206.12.35', device: 'Chrome / Windows' }, createdAt: d(0, 9, 15) },
  { id: 'a003', organizationId: PURALOCAL_ORG_ID, actorId: 'user_content_reviewer', actorName: 'Content Reviewer', action: 'auth.login', targetType: 'auth', targetId: 'user_content_reviewer', targetLabel: 'Content Reviewer', metadata: { ip: '103.21.54.12', device: 'Safari / iPhone' }, createdAt: d(0, 9, 22) },
  { id: 'a004', organizationId: PURALOCAL_ORG_ID, actorId: 'user_reporter_manager', actorName: 'Reporter Manager', action: 'auth.login', targetType: 'auth', targetId: 'user_reporter_manager', targetLabel: 'Reporter Manager', metadata: { ip: '49.206.98.11', device: 'Firefox / Ubuntu' }, createdAt: d(1, 8, 44) },
  { id: 'a005', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'auth.password_changed', targetType: 'auth', targetId: 'user_org_admin', targetLabel: 'Org Admin', metadata: { method: 'settings' }, createdAt: d(3, 11, 5) },
  { id: 'a006', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'auth.logout', targetType: 'auth', targetId: 'user_editor', targetLabel: 'Editor', metadata: { sessionDuration: '6h 42m' }, createdAt: d(0, 18, 30) },

  // ── User management ───────────────────────────────────────────────────────
  { id: 'a010', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'user.invited', targetType: 'user', targetId: 'user_new_1', targetLabel: 'kavitha.nair@puralocal.com', metadata: { role: 'CONTENT_REVIEWER', inviteMethod: 'email' }, createdAt: d(2, 14, 10) },
  { id: 'a011', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'user.invited', targetType: 'user', targetId: 'user_new_2', targetLabel: 'ravi.kumar@puralocal.com', metadata: { role: 'REPORTER_MANAGER', inviteMethod: 'email' }, createdAt: d(5, 10, 30) },
  { id: 'a012', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'user.role_assigned', targetType: 'user', targetId: 'user_marketing_manager', targetLabel: 'Marketing Manager', metadata: { fromRole: 'EDITOR', toRole: 'MARKETING_MANAGER', reason: 'Promotion' }, createdAt: d(7, 11, 0) },
  { id: 'a013', organizationId: PURALOCAL_ORG_ID, actorId: 'user_super_admin', actorName: 'Platform Super Admin', action: 'user.role_assigned', targetType: 'user', targetId: 'user_finance_manager', targetLabel: 'Finance Manager', metadata: { fromRole: 'SUPPORT_EXECUTIVE', toRole: 'FINANCE_MANAGER' }, createdAt: d(14, 9, 30) },
  { id: 'a014', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'user.role_removed', targetType: 'user', targetId: 'user_old_1', targetLabel: 'Suresh Babu', metadata: { role: 'AD_MANAGER', reason: 'Left organization' }, createdAt: d(10, 16, 20) },
  { id: 'a015', organizationId: PURALOCAL_ORG_ID, actorId: 'user_super_admin', actorName: 'Platform Super Admin', action: 'user.removed', targetType: 'user', targetId: 'user_old_2', targetLabel: 'Anand Prakash', metadata: { role: 'REPORTER', reason: 'Account deactivated' }, createdAt: d(12, 15, 0) },

  // ── Org settings ──────────────────────────────────────────────────────────
  { id: 'a020', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'org.settings_updated', targetType: 'organization', targetId: PURALOCAL_ORG_ID, targetLabel: 'PuraLocal', metadata: { fields: ['defaultLanguage', 'timezone'], from: { timezone: 'Asia/Kolkata' }, to: { timezone: 'Asia/Kolkata' } }, createdAt: d(6, 10, 0) },
  { id: 'a021', organizationId: PURALOCAL_ORG_ID, actorId: 'user_super_admin', actorName: 'Platform Super Admin', action: 'org.role_created', targetType: 'role', targetId: 'role_field_reporter', targetLabel: 'Field Reporter (custom)', metadata: { permissions: ['content:edit'] }, createdAt: d(8, 14, 0) },
  { id: 'a022', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'org.role_updated', targetType: 'role', targetId: 'EDITOR', targetLabel: 'Editor', metadata: { added: ['analytics:view'], removed: [] }, createdAt: d(9, 11, 30) },

  // ── Content ───────────────────────────────────────────────────────────────
  { id: 'a030', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.created', targetType: 'content', targetId: 'cnt_001', targetLabel: 'New metro line approved for Phase 3 expansion', metadata: { type: 'IMAGE', source: 'CMS', initialStatus: 'DRAFT' }, createdAt: d(3, 10, 15) },
  { id: 'a031', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.updated', targetType: 'content', targetId: 'cnt_001', targetLabel: 'New metro line approved for Phase 3 expansion', metadata: { fields: ['title', 'body', 'coverImage'] }, createdAt: d(3, 11, 5) },
  { id: 'a032', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.transitioned', targetType: 'content', targetId: 'cnt_001', targetLabel: 'New metro line approved…', metadata: { from: 'DRAFT', to: 'UNDER_REVIEW', note: null }, createdAt: d(3, 11, 20) },
  { id: 'a033', organizationId: PURALOCAL_ORG_ID, actorId: 'user_content_reviewer', actorName: 'Content Reviewer', action: 'content.transitioned', targetType: 'content', targetId: 'cnt_001', targetLabel: 'New metro line approved…', metadata: { from: 'UNDER_REVIEW', to: 'PUBLISHED', note: 'Verified sources, approved.' }, createdAt: d(2, 9, 45) },
  { id: 'a034', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.created', targetType: 'content', targetId: 'cnt_002', targetLabel: 'Monsoon arrives 3 days early', metadata: { type: 'VIDEO', source: 'CMS', initialStatus: 'DRAFT' }, createdAt: d(2, 14, 0) },
  { id: 'a035', organizationId: PURALOCAL_ORG_ID, actorId: 'user_content_reviewer', actorName: 'Content Reviewer', action: 'content.transitioned', targetType: 'content', targetId: 'cnt_002', targetLabel: 'Monsoon arrives 3 days early', metadata: { from: 'UNDER_REVIEW', to: 'NEEDS_CLARIFICATION', note: 'Please add source attribution for rainfall data.' }, createdAt: d(1, 15, 30) },
  { id: 'a036', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.transitioned', targetType: 'content', targetId: 'cnt_002', targetLabel: 'Monsoon arrives 3 days early', metadata: { from: 'NEEDS_CLARIFICATION', to: 'UNDER_REVIEW', note: 'Added IMD source link.' }, createdAt: d(1, 16, 10) },
  { id: 'a037', organizationId: PURALOCAL_ORG_ID, actorId: 'user_content_reviewer', actorName: 'Content Reviewer', action: 'content.published', targetType: 'content', targetId: 'cnt_002', targetLabel: 'Monsoon arrives 3 days early', metadata: { from: 'UNDER_REVIEW', to: 'PUBLISHED', directPublish: false }, createdAt: d(0, 9, 0) },
  { id: 'a038', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.scheduled', targetType: 'content', targetId: 'cnt_003', targetLabel: 'Independence Day special coverage', metadata: { type: 'IMAGE', scheduledAt: '2026-08-15T06:00:00Z', status: 'SCHEDULED' }, createdAt: d(1, 10, 0) },
  { id: 'a039', organizationId: PURALOCAL_ORG_ID, actorId: 'user_marketing_manager', actorName: 'Marketing Manager', action: 'content.transitioned', targetType: 'content', targetId: 'cnt_004', targetLabel: 'Local startup raises ₹48Cr Series A', metadata: { from: 'DRAFT', to: 'PUBLISHED', directPublish: true }, createdAt: d(4, 13, 30) },
  { id: 'a040', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'content.deleted', targetType: 'content', targetId: 'cnt_005', targetLabel: 'Duplicate: Water supply notice', metadata: { reason: 'Duplicate article — original retained' }, createdAt: d(5, 16, 0) },

  // ── Notifications ─────────────────────────────────────────────────────────
  { id: 'a050', organizationId: PURALOCAL_ORG_ID, actorId: 'user_marketing_manager', actorName: 'Marketing Manager', action: 'notification.sent', targetType: 'notification', targetId: 'notif_001', targetLabel: 'Breaking: Metro Phase 3 approved', metadata: { channels: ['IN_APP', 'PUSH'], audience: 'APP_USERS', estimatedRecipients: 24500, priority: 'HIGH' }, createdAt: d(2, 10, 0) },
  { id: 'a051', organizationId: PURALOCAL_ORG_ID, actorId: 'user_editor', actorName: 'Editor', action: 'notification.sent', targetType: 'notification', targetId: 'notif_002', targetLabel: 'Review reminder to reporters', metadata: { channels: ['IN_APP', 'EMAIL'], audience: 'REPORTERS', estimatedRecipients: 42, priority: 'NORMAL' }, createdAt: d(3, 9, 0) },
  { id: 'a052', organizationId: PURALOCAL_ORG_ID, actorId: 'user_marketing_manager', actorName: 'Marketing Manager', action: 'notification.scheduled', targetType: 'notification', targetId: 'notif_003', targetLabel: 'Independence Day offer', metadata: { channels: ['IN_APP', 'PUSH', 'EMAIL'], audience: 'APP_USERS', scheduledAt: '2026-08-15T07:00:00Z', priority: 'HIGH' }, createdAt: d(1, 14, 0) },
  { id: 'a053', organizationId: PURALOCAL_ORG_ID, actorId: 'user_marketing_manager', actorName: 'Marketing Manager', action: 'notification.cancelled', targetType: 'notification', targetId: 'notif_004', targetLabel: 'Promo: Weekend deals', metadata: { reason: 'Campaign postponed by advertiser' }, createdAt: d(0, 15, 45) },
  { id: 'a054', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'notification.deleted', targetType: 'notification', targetId: 'notif_005', targetLabel: 'Test notification (draft)', metadata: { status: 'DRAFT' }, createdAt: d(6, 12, 0) },

  // ── Reporter / contributor ────────────────────────────────────────────────
  { id: 'a060', organizationId: PURALOCAL_ORG_ID, actorId: 'user_reporter_manager', actorName: 'Reporter Manager', action: 'reporter.approved', targetType: 'reporter', targetId: 'rep_001', targetLabel: 'Priya Sharma', metadata: { verificationLevel: 'standard', location: 'Hyderabad' }, createdAt: d(4, 11, 0) },
  { id: 'a061', organizationId: PURALOCAL_ORG_ID, actorId: 'user_reporter_manager', actorName: 'Reporter Manager', action: 'reporter.approved', targetType: 'reporter', targetId: 'rep_002', targetLabel: 'Arjun Reddy', metadata: { verificationLevel: 'standard', location: 'Hyderabad' }, createdAt: d(7, 10, 30) },
  { id: 'a062', organizationId: PURALOCAL_ORG_ID, actorId: 'user_reporter_manager', actorName: 'Reporter Manager', action: 'reporter.rejected', targetType: 'reporter', targetId: 'rep_009', targetLabel: 'Unknown Applicant', metadata: { reason: 'Invalid ID proof submitted', verificationAttempt: 2 }, createdAt: d(8, 15, 0) },
  { id: 'a063', organizationId: PURALOCAL_ORG_ID, actorId: 'user_finance_manager', actorName: 'Finance Manager', action: 'reporter.earnings_released', targetType: 'reporter', targetId: 'rep_001', targetLabel: 'Priya Sharma', metadata: { amount: 18400, period: '2026-05', paymentMethod: 'UPI', utrNo: 'UTR2406001' }, createdAt: d(1, 12, 0) },
  { id: 'a064', organizationId: PURALOCAL_ORG_ID, actorId: 'user_finance_manager', actorName: 'Finance Manager', action: 'reporter.earnings_released', targetType: 'reporter', targetId: 'rep_002', targetLabel: 'Arjun Reddy', metadata: { amount: 15800, period: '2026-05', paymentMethod: 'UPI', utrNo: 'UTR2406002' }, createdAt: d(1, 12, 15) },
  { id: 'a065', organizationId: PURALOCAL_ORG_ID, actorId: 'user_reporter_manager', actorName: 'Reporter Manager', action: 'reporter.commission_updated', targetType: 'reporter', targetId: 'rep_001', targetLabel: 'Priya Sharma', metadata: { from: { ratePerArticle: 400 }, to: { ratePerArticle: 500 }, effectiveFrom: '2026-07-01' }, createdAt: d(0, 11, 30) },

  // ── Reference data ────────────────────────────────────────────────────────
  { id: 'a070', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'category.created', targetType: 'category', targetId: 'cat_health', targetLabel: 'Health & Wellness', metadata: { code: 'HLT', icon: '🏥', color: '#10b981' }, createdAt: d(10, 10, 0) },
  { id: 'a071', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'category.updated', targetType: 'category', targetId: 'cat_sports', targetLabel: 'Sports', metadata: { fields: ['description'], from: { description: 'Sports news' }, to: { description: 'Local and national sports coverage' } }, createdAt: d(15, 11, 0) },
  { id: 'a072', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'category.toggled', targetType: 'category', targetId: 'cat_crypto', targetLabel: 'Crypto (deactivated)', metadata: { active: false, reason: 'Out of editorial scope' }, createdAt: d(20, 14, 0) },
  { id: 'a073', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'location.created', targetType: 'location', targetId: 'loc_warangal', targetLabel: 'Warangal Urban', metadata: { level: 'DISTRICT', state: 'Telangana' }, createdAt: d(12, 9, 0) },
  { id: 'a074', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'language.created', targetType: 'language', targetId: 'lang_tamil', targetLabel: 'Tamil (தமிழ்)', metadata: { code: 'ta', locale: 'ta-IN' }, createdAt: d(18, 11, 0) },
  { id: 'a075', organizationId: PURALOCAL_ORG_ID, actorId: 'user_org_admin', actorName: 'Org Admin', action: 'language.toggled', targetType: 'language', targetId: 'lang_french', targetLabel: 'French', metadata: { active: false }, createdAt: d(25, 10, 0) },
]
