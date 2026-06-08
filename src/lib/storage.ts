import { supabase } from './supabase'

// Uploads a file to the given bucket and returns its public URL.
export async function uploadImage(bucket: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
