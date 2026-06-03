import { supabase } from '@/shared/lib/supabase'
import type { Client, ClientStatus } from '@/shared/lib/types'

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
  return data as Client
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
