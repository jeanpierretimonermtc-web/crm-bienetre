import { supabase } from '@/shared/lib/supabase'
import type { Client, ClientStatus, ProspectTemperature } from '@/shared/lib/types'
import { triggerNewClient } from '@/features/automations/automationService'

export interface ProspectScoreInput {
  client: Client
  lastRdvDate?: string | null
  totalRdv?: number
  followupTemperature?: ProspectTemperature | null
  pipelineStage?: string | null
}

export function computeProspectScore({
  client, lastRdvDate, totalRdv = 0, followupTemperature, pipelineStage,
}: ProspectScoreInput): number {
  let score = 0

  // Temperature signal (from most recent followup)
  if (followupTemperature === 'very_hot') score += 35
  else if (followupTemperature === 'hot') score += 20

  // Pipeline stage signal
  if (pipelineStage === 'follow_up' || pipelineStage === 'proposal_sent') score += 20

  // Recent appointment bonus
  if (lastRdvDate) {
    const days = Math.floor((Date.now() - new Date(lastRdvDate).getTime()) / 86400000)
    if (days < 7) score += 15
  }

  // Engagement depth bonus
  if (totalRdv > 2) score += 10

  // Network role bonus
  if (client.contact_role === 'distributor' || client.contact_role === 'leader') score += 10

  // Inactivity penalty
  if (client.updated_at) {
    const days = Math.floor((Date.now() - new Date(client.updated_at).getTime()) / 86400000)
    if (days > 30) score -= 20
  }

  return Math.max(0, Math.min(100, score))
}

export type ClientInput = Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export async function getClients(userId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('full_name')
  if (error) throw error
  return data as Client[]
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Client
}

export async function createClient(userId: string, input: ClientInput) {
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  const client = data as Client
  const prénom = client.first_name || client.full_name.split(' ')[0]
  triggerNewClient(userId, client.id, prénom).catch(console.error)
  return client
}

export async function updateClient(id: string, input: Partial<ClientInput>) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Client
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function searchClients(userId: string, query: string, status?: ClientStatus) {
  let q = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .ilike('full_name', `%${query}%`)
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('full_name')
  if (error) throw error
  return data as Client[]
}
