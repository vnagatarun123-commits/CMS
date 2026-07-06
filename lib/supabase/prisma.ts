import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Bump this string whenever you run `prisma generate` to invalidate the
// globalThis singleton in a running dev server (hot reload doesn't clear it).
const SCHEMA_VERSION = '2026-07-06-notifications'

type PrismaGlobal = { __puralocalPrisma?: PrismaClient; __puralocalPrismaVersion?: string }
const G = globalThis as unknown as PrismaGlobal

export function getPrismaClient(): PrismaClient {
  if (G.__puralocalPrisma && G.__puralocalPrismaVersion === SCHEMA_VERSION) {
    return G.__puralocalPrisma
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured')

  // Disconnect old client gracefully before replacing it
  if (G.__puralocalPrisma) {
    G.__puralocalPrisma.$disconnect().catch(() => undefined)
  }

  const adapter = new PrismaPg(connectionString)
  G.__puralocalPrisma = new PrismaClient({ adapter })
  G.__puralocalPrismaVersion = SCHEMA_VERSION
  return G.__puralocalPrisma
}
