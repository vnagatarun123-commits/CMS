import { NextRequest, NextResponse } from 'next/server'
import { getAccounts, disconnectAccount, patchAccount } from '@/lib/social/store'
import type { SocialAccount } from '@/lib/social/types'

const ORG_ID = process.env.PURALOCAL_ORG_ID ?? 'org_puralocal'

function toClient(acc: SocialAccount) {
  // Strip server-only fields before sending to the browser
  const { accessToken: _at, refreshToken: _rt, organizationId: _oi, ...client } = acc
  return client
}

export async function GET() {
  const accounts = getAccounts(ORG_ID).map(toClient)
  return NextResponse.json({ accounts })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { id: string; patch: Partial<Pick<SocialAccount, 'active' | 'autoPublish' | 'status'>> }
  const updated = patchAccount(ORG_ID, body.id, body.patch)
  if (!updated) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  return NextResponse.json({ account: toClient(updated) })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string }
  const ok = disconnectAccount(ORG_ID, id)
  if (!ok) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
