'use client'

import { Play, Users, Clock, Tv, Radio, TrendingUp, Monitor } from 'lucide-react'
import type { VideoAnalytics } from '@/app/actions/analytics'
import {
  KpiCard, Card, HBarChart, VBarChart, DonutChart, LegendItem,
  HeatmapRow, ProgressBar, fmtNum, fmtDuration,
} from './charts'

export function VideoAnalyticsTab({ data }: { data: VideoAnalytics }) {
  const { overview, byType, topVideos, playsTrend, peakHours, qualityBreakdown, completionBuckets } = data

  return (
    <div className="space-y-6">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total Plays"      value={fmtNum(overview.totalPlays)}      trend={overview.playsTrend}       sparkData={playsTrend.map(d => d.plays)}     sparkColor="#6366F1" icon={<Play className="w-3.5 h-3.5" />} />
        <KpiCard label="Unique Viewers"   value={fmtNum(overview.uniqueViewers)}   trend={overview.viewersTrend}     sparkData={playsTrend.map(d => d.liveViews)} sparkColor="#0EA5E9" icon={<Users className="w-3.5 h-3.5" />} />
        <KpiCard label="Avg Watch Time"   value={fmtDuration(overview.avgWatchSec)} trend={overview.watchTrend}       sparkColor="#10B981" icon={<Clock className="w-3.5 h-3.5" />} />
        <KpiCard label="Completion Rate"  value={`${overview.completionRate}%`}     trend={overview.completionTrend}  sparkColor="#8B5CF6" icon={<TrendingUp className="w-3.5 h-3.5" />} />
        <KpiCard label="Watch Hours"      value={fmtNum(overview.totalWatchHours)} sub="total this month"            sparkColor="#F59E0B" icon={<Monitor className="w-3.5 h-3.5" />} />
        <KpiCard label="Live Streams"     value={overview.liveStreamCount.toString()} sub={`${fmtNum(overview.liveViewers)} peak concurrent`} sparkColor="#EF4444" icon={<Radio className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Plays trend + By type ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Daily Plays — Last 30 Days" subtitle="Total plays vs live concurrent views" className="lg:col-span-2">
          <VBarChart
            data={playsTrend.map(d => ({ label: d.date.slice(8), value: d.plays, value2: d.liveViews }))}
            color="#6366F1" color2="#EF4444" height={140}
          />
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs text-slate-500">Total Plays</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-slate-500">Live Concurrent</span></div>
          </div>
        </Card>

        <Card title="Performance by Video Type" subtitle="Plays, watch time, completion">
          <div className="space-y-4">
            {byType.map(t => (
              <div key={t.type} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-semibold text-slate-700">{t.label}</span>
                    <span className="text-[10px] text-slate-400">{t.count} items</span>
                  </div>
                  <span className="text-xs font-medium text-slate-600 tabular-nums">{fmtNum(t.plays)} plays</span>
                </div>
                <ProgressBar value={t.plays} max={byType[0]?.plays ?? 1} color={t.color} height={5} />
                <div className="flex items-center gap-4 text-[10px] text-slate-400 pl-4">
                  <span>Avg watch: {fmtDuration(t.avgWatchSec)}</span>
                  <span>Completion: <span className="text-slate-600 font-medium">{t.completion}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Top videos ──────────────────────────────────────────────────── */}
      <Card title="Top Performing Videos" subtitle="Ranked by total plays this month">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plays</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Likes</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Shares</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topVideos.map((v, i) => {
                const typeConf = byType.find(t => t.type === v.type)
                return (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-2 text-xs text-slate-400">{i + 1}</td>
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="text-sm font-medium text-slate-800 truncate">{v.title}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${typeConf?.color ?? '#94A3B8'}20`, color: typeConf?.color ?? '#64748B' }}>
                        {v.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-sm font-bold text-slate-800 tabular-nums">{fmtNum(v.plays)}</td>
                    <td className="py-3 pr-4 text-right text-xs text-slate-500">{fmtDuration(v.durationSec)}</td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14">
                          <ProgressBar value={v.completion} max={100} color={v.completion >= 80 ? '#10B981' : v.completion >= 60 ? '#6366F1' : '#F59E0B'} height={4} />
                        </div>
                        <span className={`text-xs font-medium ${v.completion >= 80 ? 'text-emerald-600' : v.completion >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>{v.completion}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-xs text-slate-500 tabular-nums">{fmtNum(v.likes)}</td>
                    <td className="py-3 pr-4 text-right text-xs text-slate-500 tabular-nums">{fmtNum(v.shares)}</td>
                    <td className="py-3 text-right text-xs text-slate-400">{v.publishedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Completion buckets + Quality + Peak hours ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Completion Rate Buckets" subtitle="Where viewers drop off">
          <div className="space-y-4">
            {completionBuckets.map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-600">{b.label}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{fmtNum(b.viewers)} viewers</span>
                </div>
                <ProgressBar value={b.pct} max={100} color={
                  b.label === '75–100%' ? '#10B981' : b.label === '50–75%' ? '#6366F1' : b.label === '25–50%' ? '#F59E0B' : '#EF4444'
                } height={8} />
                <p className="text-[10px] text-slate-400 mt-0.5 text-right">{b.pct}% of viewers</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Playback Quality" subtitle="Quality distribution across plays">
          <div className="flex items-center justify-center py-2">
            <DonutChart
              segments={qualityBreakdown.map(q => ({ label: q.quality, pct: q.pct, color: q.color }))}
              size={110} thickness={18}
              centerLabel={`${qualityBreakdown.find(q => q.quality === '1080p')?.pct ?? 0}%`}
              centerSub="HD+"
            />
          </div>
          <div className="space-y-2 mt-2">
            {qualityBreakdown.map(q => (
              <LegendItem key={q.quality} color={q.color} label={q.quality} value={`${q.pct}%`} pct={q.pct} />
            ))}
          </div>
        </Card>

        <Card title="Peak Play Hours" subtitle="Plays distributed across 24h">
          <HeatmapRow data={peakHours.map(h => ({ hour: h.hour, value: h.plays }))} color="#6366F1" />
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Shorts peak', time: '7–10pm', note: 'High short-form consumption' },
              { label: 'Live peak',   time: '8–10pm', note: 'Evening live stream slot' },
              { label: 'Long-form',   time: '9–11pm', note: 'Full video viewing window' },
            ].map(p => (
              <div key={p.label} className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">{p.label} <span className="text-slate-400 font-normal">({p.time})</span></p>
                  <p className="text-[10px] text-slate-400">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
