import { supabase } from '@/shared/lib/supabase'
import type { Interaction, InteractionType, InterestLevel } from '@/shared/lib/types'

export interface InteractionInput {
  client_id: string
  interaction_type: InteractionType
  scheduled_at?: string | null
  completed_at?: string | null
  subject?: string | null
  summary?: string | null
  needs_identified?: string | null
  objections?: string | null
  interest_level?: InterestLevel | null
  notes_brutes?: string | null
}

export async function getInteractionsByClient(clientId: string) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data as Interaction[]
}

export async function getUpcomingInteractions(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, client:clients(id, full_name)')
    .eq('user_id', userId)
    .is('completed_at', null)
    .not('scheduled_at', 'is', null)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(limit)
  if (error) throw error
  return data as (Interaction & { client: { id: string; full_name: string } })[]
}

export async function createInteraction(userId: string, input: InteractionInput) {
  const { data, error } = await supabase
    .from('interactions')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Interaction
}

export async function updateInteraction(id: string, input: Partial<InteractionInput> & {
  completed_at?: string | null
  summary?: string | null
  needs_identified?: string | null
  objections?: string | null
  interest_level?: InterestLevel | null
  notes_brutes?: string | null
}) {
  const { data, error } = await supabase
    .from('interactions')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Interaction
}

export async function markInteractionDone(id: string) {
  const { error } = await supabase
    .from('interactions')
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteInteraction(id: string) {
  const { error } = await supabase.from('interactions').delete().eq('id', id)
  if (error) throw error
}
