import type { Content } from '@/types/domain'
import { ContentType, ContentStatus, ContentSource } from '@/types/domain'
import { PURALOCAL_ORG_ID } from './seed'

// ── Recent activity content — relative dates so the dashboard always shows a
//    live 7-day pulse, current review queue and active live streams. Kept in a
//    separate module so it composes cleanly with the static SEEDED_CONTENT. ────

const _now = new Date()
const daysAgo = (days: number, hour = 10): Date => {
  const d = new Date(_now); d.setDate(d.getDate() - days); d.setHours(hour, 0, 0, 0); return d
}

const _REPS = {
  ravi:   { name: 'Ravi Kumar',   photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', role: 'Senior Reporter' },
  anitha: { name: 'Anitha Rajan', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80', role: 'Reporter' },
  suresh: { name: 'Suresh Gowda', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80', role: 'Field Reporter' },
  priya:  { name: 'Priya Reddy',  photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', role: 'Reporter' },
} as const

type RC = {
  id: string; type: ContentType; status: ContentStatus; source: ContentSource; title: string
  cat: string; catName: string; loc: string; locName: string; lang: string; langName: string
  rep: keyof typeof _REPS; trending?: boolean; breaking?: boolean; featured?: boolean
  created: number; published?: number; scheduledIn?: number; thumb: string
}

function rc(o: RC): Content {
  const media = o.type === ContentType.VIDEO || o.type === ContentType.LIVE
  return {
    id: o.id, organizationId: PURALOCAL_ORG_ID, type: o.type, status: o.status, source: o.source,
    title: o.title, slug: o.id, body: o.title, excerpt: o.title,
    mediaUrl: media ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : null,
    youtubeUrl: null, thumbnailUrl: o.thumb, imageUrls: [], orientation: null,
    categoryId: o.cat, locationId: o.loc, languageId: o.lang, reporterId: 'user_reporter',
    tags: [], isBreakingNews: !!o.breaking, isTrending: !!o.trending, isFeatured: !!o.featured,
    scheduledAt: o.scheduledIn != null ? daysAgo(-o.scheduledIn) : null,
    publishedAt: o.published != null ? daysAgo(o.published) : null,
    createdAt: daysAgo(o.created), updatedAt: daysAgo(o.created),
    categoryName: o.catName, locationName: o.locName, languageName: o.langName,
    reporterName: _REPS[o.rep].name, reporterPhotoUrl: _REPS[o.rep].photo, reporterRole: _REPS[o.rep].role,
  }
}

export const RECENT_CONTENT: Content[] = [
  rc({ id:'rc_live_1', type:ContentType.LIVE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'LIVE: Ganesh immersion procession at Tank Bund', cat:'cat_local_news', catName:'Local News', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_te', langName:'Telugu', rep:'ravi', trending:true, created:0, published:0, thumb:'https://picsum.photos/seed/live-procession/640/360' }),
  rc({ id:'rc_live_2', type:ContentType.LIVE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'LIVE: Collector press meet on monsoon relief', cat:'cat_politics', catName:'Politics', loc:'loc_hyd', locName:'Warangal', lang:'lang_te', langName:'Telugu', rep:'anitha', created:0, published:0, thumb:'https://picsum.photos/seed/live-pressmeet/640/360' }),
  rc({ id:'rc_live_3', type:ContentType.LIVE, status:ContentStatus.SCHEDULED, source:ContentSource.CMS, title:'Upcoming: Assembly budget session coverage', cat:'cat_politics', catName:'Politics', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'ravi', created:1, scheduledIn:1, thumb:'https://picsum.photos/seed/live-assembly/640/360' }),
  rc({ id:'rc_rev_1', type:ContentType.IMAGE, status:ContentStatus.UNDER_REVIEW, source:ContentSource.APP, title:'Pothole-ridden road in Kukatpally causing traffic chaos', cat:'cat_local_news', catName:'Local News', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_te', langName:'Telugu', rep:'suresh', created:0, thumb:'https://picsum.photos/seed/pothole-road/640/360' }),
  rc({ id:'rc_rev_2', type:ContentType.VIDEO, status:ContentStatus.UNDER_REVIEW, source:ContentSource.APP, title:'Farmers protest over crop insurance delays', cat:'cat_agriculture', catName:'Agriculture', loc:'loc_hyd', locName:'Nizamabad', lang:'lang_te', langName:'Telugu', rep:'anitha', created:1, thumb:'https://picsum.photos/seed/farmers-protest/640/360' }),
  rc({ id:'rc_rev_3', type:ContentType.IMAGE, status:ContentStatus.UNDER_REVIEW, source:ContentSource.APP, title:'New government school building inaugurated', cat:'cat_education', catName:'Education', loc:'loc_hyd', locName:'Karimnagar', lang:'lang_te', langName:'Telugu', rep:'priya', created:2, thumb:'https://picsum.photos/seed/school-building/640/360' }),
  rc({ id:'rc_pub_1', type:ContentType.IMAGE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'Hyderabad IT corridor adds 50,000 new jobs in 2026', cat:'cat_business', catName:'Business', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'ravi', featured:true, trending:true, created:1, published:1, thumb:'https://picsum.photos/seed/it-corridor/640/360' }),
  rc({ id:'rc_pub_2', type:ContentType.SHORT, status:ContentStatus.PUBLISHED, source:ContentSource.APP, title:'60-second recap: Weekend cultural festival highlights', cat:'cat_entertainment', catName:'Entertainment', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_te', langName:'Telugu', rep:'priya', trending:true, created:2, published:2, thumb:'https://picsum.photos/seed/festival-recap/640/360' }),
  rc({ id:'rc_pub_3', type:ContentType.IMAGE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'Monsoon update: Heavy rainfall alert across Telangana', cat:'cat_local_news', catName:'Local News', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_te', langName:'Telugu', rep:'suresh', breaking:true, created:3, published:3, thumb:'https://picsum.photos/seed/monsoon-alert/640/360' }),
  rc({ id:'rc_pub_4', type:ContentType.VIDEO, status:ContentStatus.PUBLISHED, source:ContentSource.APP, title:'Interview: Startup founder on Hyderabad deep-tech boom', cat:'cat_technology', catName:'Technology', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'anitha', created:4, published:4, thumb:'https://picsum.photos/seed/startup-interview/640/360' }),
  rc({ id:'rc_pub_5', type:ContentType.IMAGE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'City hospitals report 40% spike in seasonal fever cases', cat:'cat_health', catName:'Health', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'ravi', trending:true, created:5, published:5, thumb:'https://picsum.photos/seed/hospital-fever/640/360' }),
  rc({ id:'rc_pub_6', type:ContentType.IMAGE, status:ContentStatus.PUBLISHED, source:ContentSource.CMS, title:'Local market prices: Vegetables costlier ahead of festival', cat:'cat_business', catName:'Business', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_te', langName:'Telugu', rep:'suresh', created:6, published:6, thumb:'https://picsum.photos/seed/market-veggies/640/360' }),
  rc({ id:'rc_sch_1', type:ContentType.IMAGE, status:ContentStatus.SCHEDULED, source:ContentSource.CMS, title:'Preview: Weekend heritage walk at Golconda Fort', cat:'cat_entertainment', catName:'Entertainment', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'priya', created:1, scheduledIn:2, thumb:'https://picsum.photos/seed/golconda-walk/640/360' }),
  rc({ id:'rc_draft_1', type:ContentType.IMAGE, status:ContentStatus.DRAFT, source:ContentSource.CMS, title:'Draft: Civic body budget analysis 2026-27', cat:'cat_politics', catName:'Politics', loc:'loc_hyd', locName:'Hyderabad', lang:'lang_en', langName:'English', rep:'ravi', created:2, thumb:'https://picsum.photos/seed/budget-draft/640/360' }),
]
