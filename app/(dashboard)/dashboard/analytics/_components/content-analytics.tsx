'use client'

import { Eye, Users, Clock, TrendingUp, FileText, Zap } from 'lucide-react'
import type { ContentAnalytics } from '@/app/actions/analytics'
import {
  KpiCard, Card, HBarChart, VBarChart, DonutChart, LegendItem,
  HeatmapRow, FunnelChart, fmtNum, fmtDuration, TrendBadge,
} from './charts'

export function ContentAnalyticsTab({ data }: { data: ContentAnalytics }) {
  const { overview, viewsByDay, contentByType, topContent, categoryPerformance, publishFunnel, trafficSources, deviceBreakdown, topCities, peakHours } = data

  return (
    <div className="space-y-6">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Views"    value={fmtNum(overview.totalViews)}    trend={overview.viewsTrend}       sparkData={viewsByDay.map(d => d.views)}    sparkColor="#6366F1" icon={<Eye className="w-3.5 h-3.5" />} />
        <KpiCard label="Unique Visitors" value={fmtNum(overview.uniqueVisitors)} trend={overview.visitorsTrend}  sparkData={viewsByDay.map(d => d.visitors)} sparkColor="#0EA5E9" icon={<Users className="w-3.5 h-3.5" />} />
        <KpiCard label="Avg Session"    value={fmtDuration(overview.avgSessionSec)} trend={overview.sessionTrend}  sparkColor="#10B981" icon={<Clock className="w-3.5 h-3.5" />} />
        <KpiCard label="Bounce Rate"    value={`${overview.bounceRate}%`}       trend={overview.bounceTrend}      trendInvert sparkColor="#F59E0B" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <KpiCard label="Published"      value={overview.contentPublished.toLocaleString()} trend={overview.publishedTrend} sparkColor="#8B5CF6" icon={<FileText className="w-3.5 h-3.5" />} />
        <KpiCard label="Engagement Rate" value={`${overview.engagementRate}%`}  trend={overview.engagementTrend} sparkColor="#EF4444" icon={<Zap className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Views trend + Content type ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Daily Views — Last 30 Days" subtitle="Views vs unique visitors" className="lg:col-span-2">
          <VBarChart
            data={viewsByDay.map(d => ({ label: d.date.slice(8), value: d.views, value2: d.visitors }))}
            color="#6366F1" color2="#0EA5E9" height={140}
          />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs text-slate-500">Views</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span className="text-xs text-slate-500">Visitors</span></div>
          </div>
        </Card>

        <Card title="Content by Type" subtitle="Published articles breakdown">
          <div className="flex items-center justify-center py-2">
            <DonutChart
              segments={contentByType.map(t => ({ label: t.label, pct: (t.count / contentByType.reduce((a, b) => a + b.count, 0)) * 100, color: t.color }))}
              size={120} thickness={20}
              centerLabel={fmtNum(contentByType.reduce((a, b) => a + b.count, 0))}
              centerSub="articles"
            />
          </div>
          <div className="space-y-2 mt-3">
            {contentByType.map(t => (
              <LegendItem key={t.type} color={t.color} label={t.label}
                value={fmtNum(t.views)}
                pct={(t.count / contentByType.reduce((a, b) => a + b.count, 0)) * 100}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Top content ─────────────────────────────────────────────────── */}
      <Card title="Top Performing Content" subtitle="Ranked by total views this month">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="text-left pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Views</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Engagement</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Shares</th>
                <th className="text-right pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topContent.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-4 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <p className="text-sm text-slate-800 truncate font-medium">{c.title}</p>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{c.type}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-slate-500">{c.category}</td>
                  <td className="py-2.5 pr-4 text-right text-sm font-semibold text-slate-800 tabular-nums">{fmtNum(c.views)}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={`text-xs font-medium ${c.engagement > 9 ? 'text-emerald-600' : c.engagement > 6 ? 'text-blue-600' : 'text-slate-500'}`}>{c.engagement}%</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-xs text-slate-500 tabular-nums">{fmtNum(c.shares)}</td>
                  <td className="py-2.5 text-right text-xs text-slate-400">{c.publishedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Category performance + Publish funnel ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Category Performance" subtitle="Articles, views and engagement by category">
          <HBarChart
            data={categoryPerformance.map(c => ({ label: c.name, value: c.views, color: '#6366F1' }))}
            valueFormatter={fmtNum}
            barHeight={22}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left pb-1 text-slate-400 font-medium">Category</th>
                <th className="text-right pb-1 text-slate-400 font-medium">Articles</th>
                <th className="text-right pb-1 text-slate-400 font-medium">Engage</th>
                <th className="text-right pb-1 text-slate-400 font-medium">Trend</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {categoryPerformance.map(c => (
                  <tr key={c.name}>
                    <td className="py-1.5 text-slate-700 font-medium">{c.name}</td>
                    <td className="py-1.5 text-right text-slate-500 tabular-nums">{c.articles}</td>
                    <td className="py-1.5 text-right text-slate-500">{c.engagement}%</td>
                    <td className="py-1.5 text-right"><TrendBadge value={c.trend} invert={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Content Status Funnel" subtitle="Current distribution across workflow stages">
            <FunnelChart stages={publishFunnel.map(s => ({ label: s.label, count: s.count, pct: s.pct, color: s.color }))} />
          </Card>

          <Card title="Traffic Sources" subtitle="How readers discover content">
            <div className="space-y-2">
              {trafficSources.map(s => (
                <LegendItem key={s.source} color={s.color} label={s.source} value={fmtNum(s.sessions)} pct={s.pct} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Geo + Device + Peak hours ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Top Cities" subtitle="Views by city this month">
          <div className="space-y-2.5">
            {topCities.map((c, i) => (
              <div key={c.city} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{c.city} <span className="text-slate-400 font-normal">{c.state}</span></span>
                    <span className="text-xs text-slate-500 tabular-nums">{fmtNum(c.views)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Device Breakdown" subtitle="Visitor device categories">
          <div className="flex items-center justify-center py-3">
            <DonutChart
              segments={deviceBreakdown.map(d => ({ label: d.device, pct: d.pct, color: d.color }))}
              size={110} thickness={18}
            />
          </div>
          <div className="space-y-2 mt-2">
            {deviceBreakdown.map(d => (
              <LegendItem key={d.device} color={d.color} label={d.device} value={`${d.pct}%`} pct={d.pct} />
            ))}
          </div>
        </Card>

        <Card title="Peak Viewing Hours" subtitle="Views distributed across 24h (today)">
          <HeatmapRow data={peakHours.map(h => ({ hour: h.hour, value: h.views }))} color="#6366F1" />
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Morning peak', time: '8–10am',  val: fmtNum(Math.max(...peakHours.filter(h => h.hour >= 8 && h.hour <= 10).map(h => h.views))) },
              { label: 'Afternoon peak', time: '12–2pm', val: fmtNum(Math.max(...peakHours.filter(h => h.hour >= 12 && h.hour <= 14).map(h => h.views))) },
              { label: 'Evening peak', time: '7–10pm',  val: fmtNum(Math.max(...peakHours.filter(h => h.hour >= 19 && h.hour <= 22).map(h => h.views))) },
            ].map(p => (
              <div key={p.label} className="text-center rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] text-slate-400">{p.label}</p>
                <p className="text-xs font-semibold text-slate-700">{p.time}</p>
                <p className="text-[10px] text-indigo-600 font-medium">{p.val}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
