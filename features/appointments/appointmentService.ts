import { supabase } from '@/shared/lib/supabase'
import type { Appointment } from '@/shared/lib/types'

export type AppointmentInput = Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export async function getAppointmentsByClient(clientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
  if (error) throw error
  return data as Appointment[]
}

export async function getUpcomingAppointments(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, client:clients(id, full_name, status)')
    .eq('user_id', userId)
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date')
    .limit(limit)
  if (error) throw error
  return data
}

export async function getNextAppointmentNumber(clientId: string) {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
  if (error) throw error
  return (count ?? 0) + 1
}

export async function createAppointment(userId: string, input: AppointmentInput) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Appointment
}

export async function updateAppointment(id: string, input: Partial<AppointmentInput>) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Appointment
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}
