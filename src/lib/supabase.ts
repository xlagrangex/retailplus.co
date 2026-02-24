import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

export async function uploadPhoto(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function uploadPlanogramma(file: File, farmaciaId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `planogrammi/${farmaciaId}.${ext}`
  const { data, error } = await supabase.storage.from('photos').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(data.path)
  return urlData.publicUrl
}
