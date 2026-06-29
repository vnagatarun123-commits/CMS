import { getMockFile } from '@/lib/storage/mock-storage'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const file = getMockFile(key)
  if (!file) return new Response('Not Found', { status: 404 })
  return new Response(file.buffer, {
    headers: {
      'Content-Type':  file.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
