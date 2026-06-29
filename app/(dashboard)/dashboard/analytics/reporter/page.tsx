import { getReporterAnalytics } from '@/app/actions/analytics'
import { ReporterAnalyticsTab } from '../_components/reporter-analytics'

export default async function ReporterAnalyticsPage() {
  const result = await getReporterAnalytics()
  if (!result.ok) return <p className="text-sm text-red-500 p-4">Failed to load analytics: {result.error.message}</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Reporter Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Submission rates, approval funnels, leaderboards and earnings</p>
      </div>
      <ReporterAnalyticsTab data={result.data} />
    </div>
  )
}
