import { defineConfig } from 'prisma/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readDotEnv(): Record<string, string> {
  try {
    const content = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    const vars: Record<string, string> = {}
    for (const raw of content.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
    }
    return vars
  } catch {
    return {}
  }
}

const e = readDotEnv()

const migrateUrl = e.DIRECT_URL ?? e.DATABASE_URL
if (!migrateUrl) throw new Error('Set DIRECT_URL or DATABASE_URL in .env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: migrateUrl,
  },
})
