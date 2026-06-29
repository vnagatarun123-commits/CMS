'use client'

// ── Shared chart primitives (CSS + SVG, no library) ────────────────────────────

export function fmtNum(n: number): string {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

export function fmtINR(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`
  return `₹${n}`
}

export function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

interface TrendProps { value: number; unit?: string; invert?: boolean }

export function TrendBadge({ value, unit = '%', invert = false }: TrendProps) {
  const up = invert ? value < 0 : value > 0
  const neutral = value === 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
      neutral ? 'bg-slate-100 text-slate-500' :
      up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
    }`}>
      {neutral ? '—' : value > 0 ? '↑' : '↓'}
      {Math.abs(value)}{unit}
    </span>
  )
}

// ── Area Sparkline (SVG) ───────────────────────────────────────────────────────

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  fill?: boolean
  strokeWidth?: number
}

export function Sparkline({ data, color = '#6366F1', height = 40, fill = true, strokeWidth = 1.5 }: SparklineProps) {
  if (!data.length) return null
  const w = 120
  const h = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ])
  const path = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${(pt[0] ?? 0).toFixed(1)},${(pt[1] ?? 0).toFixed(1)}`).join(' ')
  const area = `${path} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {fill && <path d={area} fill={color} fillOpacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Bar chart (CSS divs) ───────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color?: string; sub?: string }[]
  maxValue?: number
  showValues?: boolean
  valueFormatter?: (v: number) => string
  barHeight?: number
}

export function HBarChart({ data, maxValue, showValues = true, valueFormatter = fmtNum, barHeight = 28 }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map(d => d.value))
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-xs text-slate-600 truncate text-right">{d.label}</div>
          <div className="flex-1 relative" style={{ height: barHeight }}>
            <div className="absolute inset-y-0 left-0 rounded-sm transition-all duration-500"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, backgroundColor: d.color ?? '#6366F1', opacity: 0.85 }} />
          </div>
          {showValues && <div className="w-20 shrink-0 text-xs text-slate-700 font-medium">{valueFormatter(d.value)}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Vertical bar chart (SVG) ───────────────────────────────────────────────────

interface VBarChartProps {
  data: { label: string; value: number; value2?: number }[]
  color?: string
  color2?: string
  height?: number
  valueFormatter?: (v: number) => string
}

export function VBarChart({ data, color = '#6366F1', color2 = '#10B981', height = 140, valueFormatter = fmtNum }: VBarChartProps) {
  const max = Math.max(...data.flatMap(d => [d.value, d.value2 ?? 0]))
  const w = 100
  const barW = data.length > 0 ? (w / data.length) * 0.55 : 4
  const gap = data.length > 0 ? w / data.length : 4

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={height + 24} viewBox={`0 0 ${w} ${height + 24}`} preserveAspectRatio="none" className="overflow-visible">
        {data.map((d, i) => {
          const bh = ((d.value / max) * (height - 8))
          const bh2 = d.value2 !== undefined ? ((d.value2 / max) * (height - 8)) : 0
          const x = i * gap + gap * 0.15
          const x2 = x + (d.value2 !== undefined ? barW * 0.6 : 0)
          return (
            <g key={i}>
              <rect x={x} y={height - bh} width={d.value2 !== undefined ? barW * 0.55 : barW} height={bh} rx="1" fill={color} fillOpacity={0.85} />
              {d.value2 !== undefined && <rect x={x2 + barW * 0.05} y={height - bh2} width={barW * 0.55} height={bh2} rx="1" fill={color2} fillOpacity={0.75} />}
              {data.length <= 14 && (
                <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize="3.5" fill="#64748B" className="font-sans">{d.label}</text>
              )}
            </g>
          )
        })}
        {/* baseline */}
        <line x1="0" y1={height} x2={w} y2={height} stroke="#E2E8F0" strokeWidth="0.5" />
      </svg>
    </div>
  )
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────

interface DonutProps {
  segments: { label: string; pct: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}

export function DonutChart({ segments, size = 120, thickness = 18, centerLabel, centerSub }: DonutProps) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  const gap = 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference - gap
        const space = circumference - dash
        const path = (
          <circle
            key={i}
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${space}`}
            strokeDashoffset={-offset + circumference * 0.25}
            strokeLinecap="round"
          />
        )
        offset += (seg.pct / 100) * circumference
        return path
      })}
      {centerLabel && (
        <>
          <text x={cx} y={cx - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#1E293B">{centerLabel}</text>
          {centerSub && <text x={cx} y={cx + 12} textAnchor="middle" fontSize="8" fill="#64748B">{centerSub}</text>}
        </>
      )}
    </svg>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  trend?: number
  trendUnit?: string
  trendInvert?: boolean
  sub?: string
  sparkData?: number[]
  sparkColor?: string
  icon?: React.ReactNode
}

export function KpiCard({ label, value, trend, trendUnit = '%', trendInvert, sub, sparkData, sparkColor = '#6366F1', icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
        {trend !== undefined && <TrendBadge value={trend} unit={trendUnit} invert={trendInvert} />}
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {sparkData && (
        <div className="mt-1">
          <Sparkline data={sparkData} color={sparkColor} height={32} />
        </div>
      )}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

export function Card({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-slate-100">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Legend item ───────────────────────────────────────────────────────────────

export function LegendItem({ color, label, value, pct }: { color: string; label: string; value?: string; pct?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs text-slate-600 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {pct !== undefined && (
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
        )}
        {value && <span className="text-xs font-medium text-slate-700 tabular-nums w-14 text-right">{value}</span>}
      </div>
    </div>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED:    'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  DRAFT:     'bg-slate-100 text-slate-500 border-slate-200',
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = '#6366F1', height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Heat map row (24h) ────────────────────────────────────────────────────────

export function HeatmapRow({ data, color = '#6366F1' }: { data: { hour: number; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div className="flex gap-0.5">
      {data.map(d => (
        <div
          key={d.hour}
          className="flex-1 rounded-sm"
          style={{ height: 28, backgroundColor: color, opacity: 0.1 + (d.value / max) * 0.85 }}
          title={`${d.hour}:00 — ${fmtNum(d.value)}`}
        />
      ))}
    </div>
  )
}

// ── Funnel ────────────────────────────────────────────────────────────────────

export function FunnelChart({ stages }: { stages: { label: string; count: number; pct: number; color?: string }[] }) {
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-slate-600">{s.label}</span>
            <span className="text-xs font-medium text-slate-700 tabular-nums">{s.count.toLocaleString()}</span>
          </div>
          <div className="h-5 bg-slate-100 rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-700"
              style={{ width: `${s.pct}%`, backgroundColor: s.color ?? '#6366F1', opacity: 0.8 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
