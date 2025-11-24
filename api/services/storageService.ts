import { supabase } from '../config/supabase.js'

export async function ensureBuckets() {
  const buckets = ['project-assets', 'content-media', 'project-documents']
  for (const name of buckets) {
    const { data: bucket } = await supabase.storage.getBucket(name)
    if (!bucket) {
      await supabase.storage.createBucket(name, {
        public: false,
        fileSizeLimit: 52428800, // 50 MB soft limit (validated app-side)
      })
    }
  }
}

export function validateUpload({
  size,
  mimeType,
}: {
  size: number
  mimeType: string
}) {
  const maxSize = 20 * 1024 * 1024 // Increased to 20MB for documents
  if (size > maxSize) {
    throw new Error('File too large (max 20MB)')
  }
  const allowed = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ]
  if (!allowed.includes(mimeType)) {
    throw new Error('Unsupported file type')
  }
}