import { getAdsAnalytics } from '@/app/actions/analytics'
import { AdsAnalyticsTab } from '../_components/ads-analytics'

export default async function AdsAnalyticsPage() {
  const result = await getAdsAnalytics()
  if (!result.ok) return <p className="text-sm text-red-500 p-4">Failed to load analytics: {result.error.message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Ads Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Impressions, clicks, CTR, revenue and campaign performance</p>
      </div>
      <AdsAnalyticsTab data={result.data} />
    </div>
  )
}
