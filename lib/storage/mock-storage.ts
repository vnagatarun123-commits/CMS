import type { StorageProvider, UploadResult } from './index'

interface StoredFile { buffer: Uint8Array<ArrayBuffer>; contentType: string }

const G = globalThis as unknown as { __mockFiles?: Map<string, StoredFile> }

function getStore() {
  if (!G.__mockFiles) G.__mockFiles = new Map()
  return G.__mockFiles
}

export class MockStorageProvider implements StorageProvider {
  async upload(file: File | Blob, _path: string, contentType: string): Promise<UploadResult> {
    const key = crypto.randomUUID()
    const buffer = new Uint8Array(await file.arrayBuffer())
    getStore().set(key, { buffer, contentType })
    return { url: `/api/media/${key}`, path: key }
  }

  async delete(path: string): Promise<void> {
    getStore().delete(path)
  }
}

export function getMockFile(key: string): StoredFile | undefined {
  return getStore().get(key)
}
