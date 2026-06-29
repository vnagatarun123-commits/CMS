'use client'

import { Eye, MousePointerClick, Percent, DollarSign, BarChart3, Zap } from 'lucide-react'
import type { AdsAnalytics } from '@/app/actions/analytics'
import {
  KpiCard, Card, HBarChart, VBarChart, DonutChart, LegendItem,
  ProgressBar, StatusPill, fmtNum, fmtINR, TrendBadge,
} from './charts'

export function AdsAnalyticsTab({ data }: { data: AdsAnalytics }) {
  const { overview, revenueTrend, topCampaigns, bySlot, byFormat, revenueByType } = data

  return (
    <div className="space-y-6">
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Impressions"  value={fmtNum(overview.impressions)} trend={overview.impressionsTrend} sparkData={revenueTrend.map(d => d.impressions)} sparkColor="#6366F1" icon={<Eye className="w-3.5 h-3.5" />} />
        <KpiCard label="Clicks"       value={fmtNum(overview.clicks)}      trend={overview.clicksTrend}       sparkData={revenueTrend.map(d => d.clicks)}     sparkColor="#0EA5E9" icon={<MousePointerClick className="w-3.5 h-3.5" />} />
        <KpiCard label="CTR"          value={`${overview.ctr}%`}           trend={overview.ctrTrend}           sparkColor="#10B981"                             icon={<Percent className="w-3.5 h-3.5" />} />
        <KpiCard label="Ad Revenue"   value={fmtINR(overview.revenue)}     trend={overview.revenueTrend}       sparkData={revenueTrend.map(d => d.revenue)}    sparkColor="#F59E0B" icon={<DollarSign className="w-3.5 h-3.5" />} />
        <KpiCard label="CPM"          value={`₹${overview.cpm}`}           trend={overview.cpmTrend}           sparkColor="#8B5CF6"                             icon={<BarChart3 className="w-3.5 h-3.5" />} />
        <KpiCard label="Fill Rate"    value={`${overview.fillRate}%`}       trend={overview.fillTrend}          sparkColor="#EF4444"                             icon={<Zap className="w-3.5 h-3.5" />} />
      </div>

      {/* ── Revenue trend + Revenue breakdown ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Revenue & Impressions — Last 30 Days" subtitle="Daily ad revenue vs impression volume" className="lg:col-span-2">
          <VBarChart
            data={revenueTrend.map(d => ({ label: d.date.slice(8), value: d.revenue, value2: Math.round(d.clicks / 10) }))}
            color="#F59E0B" color2="#6366F1" height={140}
            valueFormatter={v => `₹${fmtNum(v)}`}
          />
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-xs text-slate-500">Revenue (₹)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs text-slate-500">Clicks (/10)</span></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Revenue by Ad Type">
            <div className="flex items-center justify-center py-1">
              <DonutChart
                segments={revenueByType.map(r => ({ label: r.type, pct: r.pct, color: r.color }))}
                size={110} thickness={18}
                centerLabel={fmtINR(overview.revenue)}
                centerSub="total"
              />
            </div>
            <div className="space-y-1.5 mt-2">
              {revenueByType.map(r => (
                <LegendItem key={r.type} color={r.color} label={r.type} value={fmtINR(r.revenue)} pct={r.pct} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Top campaigns ───────────────────────────────────────────────── */}
      <Card title="Campaign Performance" subtitle="Top campaigns ranked by revenue">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign</th>
                <th className="text-left pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Advertiser</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Impressions</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Clicks</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">CTR</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">CPM</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                <th className="text-right pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Used</th>
                <th className="text-center pb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topCampaigns.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500">{c.advertiser}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-slate-600">{fmtNum(c.impressions)}</td>
                  <td className="py-3 pr-4 text-right text-sm tabular-nums text-slate-600">{fmtNum(c.clicks)}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-xs font-medium ${c.ctr >= 2 ? 'text-emerald-600' : c.ctr >= 1.5 ? 'text-blue-600' : 'text-amber-600'}`}>{c.ctr}%</span>
                  </td>
                  <td className="py-3 pr-4 text-right text-xs text-slate-500 tabular-nums">₹{c.cpm}</td>
                  <td className="py-3 pr-4 text-right text-sm font-bold text-slate-800 tabular-nums">{fmtINR(c.revenue)}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16">
                        <ProgressBar value={c.spent} max={c.budget} color="#10B981" height={4} />
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums">{Math.round((c.spent / c.budget) * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center"><StatusPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Ad slot performance + Format breakdown ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ad Slot Performance" subtitle="Impressions, CTR and fill rate by slot placement">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-slate-400 font-semibold uppercase tracking-wider">Slot</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold uppercase tracking-wider">Impressions</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold uppercase tracking-wider">CTR</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold uppercase tracking-wider">Fill</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bySlot.map(s => (
                  <tr key={s.slot} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-slate-700">{s.slot}</p>
                      <p className="text-slate-400">{s.placement}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{fmtNum(s.impressions)}</td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className={`font-medium ${s.ctr >= 2 ? 'text-emerald-600' : s.ctr >= 1.2 ? 'text-blue-600' : 'text-amber-600'}`}>{s.ctr}%</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-10">
                          <ProgressBar value={s.fillRate} max={100} color={s.fillRate >= 90 ? '#10B981' : '#6366F1'} height={4} />
                        </div>
                        <span className="text-slate-600 font-medium">{s.fillRate}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800 tabular-nums">{fmtINR(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Performance by Ad Format" subtitle="CTR and revenue by creative format">
          <HBarChart
            data={byFormat.map(f => ({ label: f.format, value: f.revenue, color: f.color }))}
            valueFormatter={fmtINR} barHeight={24}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left pb-1.5 text-slate-400 font-semibold uppercase tracking-wider">Format</th>
                <th className="text-right pb-1.5 text-slate-400 font-semibold uppercase tracking-wider">Impressions</th>
                <th className="text-right pb-1.5 text-slate-400 font-semibold uppercase tracking-wider">CTR</th>
                <th className="text-right pb-1.5 text-slate-400 font-semibold uppercase tracking-wider">Share</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {byFormat.map(f => (
                  <tr key={f.format}>
                    <td className="py-2 text-slate-700 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                      {f.format}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">{fmtNum(f.impressions)}</td>
                    <td className="py-2 text-right">
                      <span className={`font-medium ${f.ctr >= 1.8 ? 'text-emerald-600' : f.ctr >= 1.2 ? 'text-blue-600' : 'text-amber-600'}`}>{f.ctr}%</span>
                    </td>
                    <td className="py-2 text-right text-slate-500">{f.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
