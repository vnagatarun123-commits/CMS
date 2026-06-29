import { getAuditLogPage } from '@/app/actions/audit-log'
import { AuditLogClient } from './_components/audit-log-client'

export default async function AuditLogPage() {
  const result = await getAuditLogPage({})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete record of all admin actions — who did what, and when</p>
      </div>
      <AuditLogClient
        initialEntries={result.ok ? result.data.entries : []}
        initialTotal={result.ok ? result.data.total : 0}
        initialHasMore={result.ok ? result.data.hasMore : false}
      />
    </div>
  )
}
