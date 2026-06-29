import { randomUUID } from 'crypto'
import type { SocialAccount, ConnectionStatus } from './types'

// In-memory store for dev / mock phase.
// Swap for a Supabase `social_accounts` table when the real DB lands.
// keyed orgId → accounts[]
const store = new Map<string, SocialAccount[]>()

export function getAccounts(orgId: string): SocialAccount[] {
  return store.get(orgId) ?? []
}

export function upsertAccount(
  orgId: string,
  data: Omit<SocialAccount, 'id' | 'organizationId'>,
): SocialAccount {
  const accounts = getAccounts(orgId)
  const key = `${data.platformId}:${data.accountHandle}`
  const existing = accounts.findIndex(
    a => `${a.platformId}:${a.accountHandle}` === key,
  )
  const record: SocialAccount = { ...data, id: existing >= 0 ? accounts[existing]!.id : `sa_${randomUUID()}`, organizationId: orgId }

  if (existing >= 0) {
    accounts[existing] = record
  } else {
    accounts.push(record)
  }
  store.set(orgId, accounts)
  return record
}

export function disconnectAccount(orgId: string, accountId: string): boolean {
  const accounts = getAccounts(orgId)
  const idx = accounts.findIndex(a => a.id === accountId)
  if (idx < 0) return false
  accounts[idx] = { ...accounts[idx]!, status: 'disconnected' as ConnectionStatus, active: false }
  store.set(orgId, accounts)
  return true
}

export function patchAccount(
  orgId: string,
  accountId: string,
  patch: Partial<Pick<SocialAccount, 'active' | 'autoPublish' | 'status'>>,
): SocialAccount | null {
  const accounts = getAccounts(orgId)
  const idx = accounts.findIndex(a => a.id === accountId)
  if (idx < 0) return null
  accounts[idx] = { ...accounts[idx]!, ...patch }
  store.set(orgId, accounts)
  return accounts[idx]!
}
