import { getVideoAnalytics } from '@/app/actions/analytics'
import { VideoAnalyticsTab } from '../_components/video-analytics'

export default async function VideoAnalyticsPage() {
  const result = await getVideoAnalytics()
  if (!result.ok) return <p className="text-sm text-red-500 p-4">Failed to load analytics: {result.error.message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Video Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Plays, watch time, completion rates and live stream performance</p>
      </div>
      <VideoAnalyticsTab data={result.data} />
    </div>
  )
}
