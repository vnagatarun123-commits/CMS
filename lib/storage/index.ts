export interface UploadResult {
  url:  string
  path: string
}

export interface StorageProvider {
  upload(file: File | Blob, path: string, contentType: string): Promise<UploadResult>
  delete(path: string): Promise<void>
}

const G = globalThis as unknown as { __puralocalStorage?: StorageProvider }

export function getStorage(): StorageProvider {
  if (G.__puralocalStorage) return G.__puralocalStorage

  if (process.env['DATA_BACKEND'] === 'supabase') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SupabaseStorageProvider } = require('./supabase-storage') as typeof import('./supabase-storage')
    G.__puralocalStorage = new SupabaseStorageProvider()
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockStorageProvider } = require('./mock-storage') as typeof import('./mock-storage')
    G.__puralocalStorage = new MockStorageProvider()
  }

  return G.__puralocalStorage!
}
