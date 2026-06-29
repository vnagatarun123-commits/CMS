import { readFileSync } from 'node:fs'
import { join } from 'node:path'

;(function loadEnv() {
  try {
    const content = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    for (const raw of content.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key && val && !process.env[key]) process.env[key] = val
    }
  } catch { /* ignore */ }
})()

import { SEEDED_CONTENT } from '../lib/mock/seed'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) as never })

async function main() {
  for (const item of SEEDED_CONTENT) {
    await prisma.content.update({
      where: { id: item.id },
      data: { thumbnailUrl: item.thumbnailUrl ?? null },
    })
    console.log('updated', item.id, '->', item.thumbnailUrl ?? 'null')
  }
  console.log('done')
}

main().finally(() => prisma.$disconnect())
