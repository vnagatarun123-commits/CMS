'use client'

import { Users2, CheckCircle2, TrendingUp, Wallet, Clock, AlertCircle } from 'lucide-react'
import type { ReporterAnalytics } from '@/app/actions/analytics'
import {
  KpiCard, Card, HBarChart, VBarChart, DonutChart, LegendItem,
  FunnelChart, fmtNum, fmtINR, TrendBadge,
} from './charts'

const TIER_COLORS: Record<string, string> = {
  star: '#F59E0B', senior: '#6366F1', mid: '#0EA5E9', junior: '#94A3B8',
}

const TREND_SYMBOL = { up: '↑', down: '↓', stable: '→' } as const
const TREND_CLASS  = { up: 'text-emerald-600', down: 'text-red-500', stable: 'text-slate-400' } as const

export function ReporterAnalyticsTab({ data }: { data: ReporterAnalytics }) {
  const { overview, leaderboard, submissionTrend, contentTypeBreakdown, tierDistribution, approvalFunnel } = data

  return (
    <div className="space-y-6">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Reporters"  value={overview.totalReporters.toString()}  sub={`${overview.activeReporters} active this month`} sparkColor="#6366F1" icon={<Users2 className="w-3.5 h-3.5" />} />
        <KpiCard label="Submissions"      value={overview.submitted.toLocaleString()} trend={overview.submittedTrend}  sparkColor="#0EA5E9" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <KpiCard label="Approval Rate"    value={`${overview.approvalRate}%`}          trend={overview.approvalTrend}   sparkColor="#10B981" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
        <KpiCard label="Avg Views/Article" value={fmtNum(overview.avgViewsPerArticle)} trend={overview.viewsTrend}      sparkColor="#8B5CF6" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <KpiCard label="Total Earnings"   value={fmtINR(overview.totalEarnings)}       trend={overview.earningsTrend}   sparkColor="#F59E0B" icon={<Wallet className="w-3.5 h-3.5" />} />
        <KpiCard label="Pending Review"   value={overview.pendingApprovals.toString()} sub="articles awaiting review"  sparkColor="#EF4444" icon={<AlertCircle className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Submission trend ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Submission Trend — Last 30 Days" subtitle="Submitted vs published vs rejected" className="lg:col-span-2">
          <VBarChart
            data={submissionTrend.map(d => ({ label: d.date.slice(8), value: d.submitted, value2: d.published }))}
            color="#6366F1" color2="#10B981" height={140}
          />
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs text-slate-500">Submitted</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500">Published</span></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Content Type Submitted" subtitle="What reporters send">
            <div className="flex items-center justify-center py-1">
              <DonutChart
                segments={contentTypeBreakdown.map(t => ({ label: t.label, pct: t.pct, color: t.color }))}
                size={100} thickness={16}
                centerLabel={overview.submitted.toString()}
                centerSub="total"
              />
            </div>
            <div className="space-y-1.5 mt-2">
              {contentTypeBreakdown.map(t => (
                <LegendItem key={t.type} color={t.color} label={t.label} value={`${t.count}`} pct={t.pct} />
              ))}
            </div>
          </Card>

          <Card title="Approval Funnel" subtitle="From submission to published">
            <FunnelChart stages={approvalFunnel.map(s => ({ label: s.stage, count: s.count, pct: s.pct }))} />
          </Card>
        </div>
      </div>

      {/* ── Reporter leaderboard ────────────────────────────────────────── */}
      <Card title="Reporter Leaderboard" subtitle="Performance ranking by published articles and views">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reporter</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Published</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Approval</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Earnings</th>
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Content Mix</th>
                <th className="text-center pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaderboard.map(r => (
                <tr key={r.rank} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold
                      ${r.rank === 1 ? 'bg-amber-100 text-amber-600' : r.rank === 2 ? 'bg-slate-100 text-slate-600' : r.rank === 3 ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
                      {r.rank}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.location}</p>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-slate-600">{r.submitted}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums font-medium text-emerald-600">{r.published}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-red-400">{r.rejected}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-xs font-medium ${r.approvalRate >= 90 ? 'text-emerald-600' : r.approvalRate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {r.approvalRate}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums font-semibold text-slate-700">{fmtNum(r.totalViews)}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-indigo-600 font-medium">{fmtINR(r.earnings)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-1 flex-wrap">
                      {r.contentTypes.map(ct => (
                        <span key={ct.type} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{ct.type} {ct.count}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-bold ${TREND_CLASS[r.trend]}`}>{TREND_SYMBOL[r.trend]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Tier distribution + Views by reporter ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Reporter Tier Distribution" subtitle="Performance tiers by submission volume">
          <div className="flex items-center justify-center py-2">
            <DonutChart
              segments={tierDistribution.map(t => ({ label: t.label, pct: (t.count / tierDistribution.reduce((a, b) => a + b.count, 0)) * 100, color: t.color }))}
              size={120} thickness={20}
              centerLabel={overview.totalReporters.toString()}
              centerSub="reporters"
            />
          </div>
          <div className="space-y-3 mt-3">
            {tierDistribution.map(t => (
              <div key={t.tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{t.label}</p>
                    <p className="text-[10px] text-slate-400">{t.range}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{t.count}</span>
                  <span className="text-[10px] text-slate-400">reporters</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Reporters by Views Generated" subtitle="Total views attributed to each reporter">
          <HBarChart
            data={leaderboard.slice(0, 6).map(r => ({ label: r.name.split(' ')[0] ?? r.name, value: r.totalViews, color: '#6366F1' }))}
            valueFormatter={fmtNum} barHeight={24}
          />
          <div className="mt-4 space-y-2">
            {leaderboard.slice(0, 6).map(r => (
              <div key={r.rank} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{r.name}</span>
                <span className="text-slate-500 tabular-nums">{fmtINR(r.earnings)} earned</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
