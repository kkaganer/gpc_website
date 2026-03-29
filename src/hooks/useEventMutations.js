import { supabase } from '../lib/supabase'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createEvent(data) {
  const slug = data.slug || slugify(data.title)
  const { data: event, error } = await supabase
    .from('gpc_events')
    .insert({ ...data, slug })
    .select()
    .single()
  if (error) throw error
  return event
}

export async function updateEvent(id, data) {
  const { data: event, error } = await supabase
    .from('gpc_events')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return event
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('gpc_events')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function uploadEventImage(file) {
  const ext = file.name.split('.').pop()
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('event-images')
    .upload(name, file)
  if (error) throw error
  const { data } = supabase.storage.from('event-images').getPublicUrl(name)
  return data.publicUrl
}
