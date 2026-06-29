import { getContentAnalytics } from '@/app/actions/analytics'
import { ContentAnalyticsTab } from '../_components/content-analytics'

export default async function ContentAnalyticsPage() {
  const result = await getContentAnalytics()
  if (!result.ok) return <p className="text-sm text-red-500 p-4">Failed to load analytics: {result.error.message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Content Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Views, engagement, reach and content performance</p>
      </div>
      <ContentAnalyticsTab data={result.data} />
    </div>
  )
}
