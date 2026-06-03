import { supabase } from '@/shared/lib/supabase'
import type { Note } from '@/shared/lib/types'

export async function getNotesByClient(clientId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Note[]
}

export async function createNote(userId: string, clientId: string, content: string) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, client_id: clientId, content })
    .select()
    .single()
  if (error) throw error
  return data as Note
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
