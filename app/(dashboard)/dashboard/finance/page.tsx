import { ShieldCheck } from 'lucide-react'

const STATS = [
  { label: 'Total Revenue (Jun)', value: '₹18,42,000', sub: '+12% vs May', trend: 'up' },
  { label: 'Subscription Revenue', value: '₹12,60,000', sub: '1,260 active subs', trend: 'up' },
  { label: 'Ad Revenue', value: '₹4,32,000', sub: '6 active campaigns', trend: 'up' },
  { label: 'Contributor Payouts', value: '₹1,50,000', sub: '42 contributors paid', trend: 'neutral' },
]

const TRANSACTIONS = [
  { id: 'TXN-2406-001', date: '26 Jun 2026', type: 'Ad Revenue',        amount: '+₹84,000',  status: 'Settled'  },
  { id: 'TXN-2406-002', date: '25 Jun 2026', type: 'Subscription',       amount: '+₹42,000',  status: 'Settled'  },
  { id: 'TXN-2406-003', date: '24 Jun 2026', type: 'Contributor Payout', amount: '-₹18,500',  status: 'Processed'},
  { id: 'TXN-2406-004', date: '24 Jun 2026', type: 'Ad Revenue',         amount: '+₹56,000',  status: 'Settled'  },
  { id: 'TXN-2406-005', date: '23 Jun 2026', type: 'Subscription',       amount: '+₹38,500',  status: 'Settled'  },
  { id: 'TXN-2406-006', date: '22 Jun 2026', type: 'Refund',             amount: '-₹2,400',   status: 'Processed'},
  { id: 'TXN-2406-007', date: '20 Jun 2026', type: 'Contributor Payout', amount: '-₹22,000',  status: 'Processed'},
  { id: 'TXN-2406-008', date: '19 Jun 2026', type: 'Ad Revenue',         amount: '+₹1,12,000', status: 'Pending'  },
]

const statusClass: Record<string, string> = {
  Settled:   'text-emerald-600 bg-emerald-50',
  Processed: 'text-blue-600 bg-blue-50',
  Pending:   'text-amber-600 bg-amber-50',
}

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue overview and transaction history</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted/40 transition-colors">
          Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className={`text-xs ${s.trend === 'up' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Revenue breakdown — June 2026</p>
        <div className="space-y-2">
          {[
            { label: 'Subscriptions', amount: 12_60_000, color: 'bg-blue-500' },
            { label: 'Ad Revenue',    amount:  4_32_000, color: 'bg-emerald-500' },
            { label: 'Other',         amount:   150_000, color: 'bg-violet-400' },
          ].map(row => {
            const total = 18_42_000
            const pct = Math.round((row.amount / total) * 100)
            return (
              <div key={row.label} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-muted-foreground text-xs">{row.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`${row.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                <span className="text-xs font-medium w-24 text-right">
                  ₹{(row.amount / 100).toLocaleString('en-IN')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Recent Transactions</p>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto rounded-t-md">
            <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Transaction ID</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.date}</td>
                  <td className="px-4 py-3">{tx.type}</td>
                  <td className={`px-4 py-3 text-right font-medium ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusClass[tx.status]}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>Full finance module (invoicing, payouts, GST reports) ships in Phase 5.</span>
      </div>
    </div>
  )
}
