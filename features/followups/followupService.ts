import { supabase } from '@/shared/lib/supabase'
import type { Followup } from '@/shared/lib/types'

export type FollowupInput =
  Omit<Followup, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'auto_generated' | 'priority_score'>
  & { auto_generated?: boolean; priority_score?: number | null }

export async function getFollowupsByClient(clientId: string) {
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .eq('client_id', clientId)
    .order('due_date')
  if (error) throw error
  return data as Followup[]
}

export async function getPendingFollowups(userId: string) {
  const { data, error } = await supabase
    .from('followups')
    .select('*, client:clients(id, full_name, status, contact_role)')
    .eq('user_id', userId)
    .eq('done', false)
    .order('due_date')
  if (error) throw error
  return data
}

export async function createFollowup(userId: string, input: FollowupInput) {
  const { data, error } = await supabase
    .from('followups')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Followup
}

export async function toggleFollowupDone(id: string, done: boolean) {
  const { error } = await supabase
    .from('followups')
    .update({ done, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteFollowup(id: string) {
  const { error } = await supabase.from('followups').delete().eq('id', id)
  if (error) throw error
}
