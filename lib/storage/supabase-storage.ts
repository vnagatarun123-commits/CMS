import { createClient } from '@supabase/supabase-js'
import type { StorageProvider, UploadResult } from './index'

const BUCKET = process.env['SUPABASE_STORAGE_BUCKET'] ?? 'media'

export class SupabaseStorageProvider implements StorageProvider {
  private client = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  )

  // Creates the bucket on first use if it doesn't already exist.
  private bucketReady = false
  private async ensureBucket() {
    if (this.bucketReady) return
    const { data: buckets, error } = await this.client.storage.listBuckets()
    if (error) throw new Error(`Could not list storage buckets: ${error.message}`)
    if (!buckets.find(b => b.name === BUCKET)) {
      const { error: ce } = await this.client.storage.createBucket(BUCKET, { public: true })
      if (ce) throw new Error(`Could not create storage bucket "${BUCKET}": ${ce.message}`)
    }
    this.bucketReady = true
  }

  async upload(file: File | Blob, path: string, contentType: string): Promise<UploadResult> {
    await this.ensureBucket()
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .upload(path, file, { contentType, upsert: true })
    if (error) throw new Error(`Storage upload failed: ${error.message}`)
    const { data: { publicUrl } } = this.client.storage.from(BUCKET).getPublicUrl(data.path)
    return { url: publicUrl, path: data.path }
  }

  async delete(path: string): Promise<void> {
    await this.client.storage.from(BUCKET).remove([path])
  }
}
