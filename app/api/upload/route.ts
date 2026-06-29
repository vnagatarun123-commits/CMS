import { getStorage } from '@/lib/storage'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const folder = (formData.get('folder') as string | null) ?? 'misc'
    const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path   = `${folder}/${crypto.randomUUID()}.${ext}`

    const { url } = await getStorage().upload(file, path, file.type)
    return Response.json({ url })
  } catch (err) {
    console.error('[/api/upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
