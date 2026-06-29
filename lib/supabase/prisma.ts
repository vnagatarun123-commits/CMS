import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// globalThis singleton prevents multiple PrismaClient instances during hot
// reload in Next.js dev mode (separate module bundles share one process).
const G = globalThis as unknown as { __puralocalPrisma?: PrismaClient }

export function getPrismaClient(): PrismaClient {
  if (G.__puralocalPrisma) return G.__puralocalPrisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured')

  const adapter = new PrismaPg(connectionString)
  G.__puralocalPrisma = new PrismaClient({ adapter })
  return G.__puralocalPrisma
}
