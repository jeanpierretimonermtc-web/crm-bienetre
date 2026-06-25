import { supabase } from '@/shared/lib/supabase'
import type { Order, OrderStatus, OrderProduct } from '@/shared/lib/types'
import { triggerOrder } from '@/features/automations/automationService'

export interface OrderFilters {
  client_id?: string
  from?: string
  to?: string
  is_lrp?: boolean
  status?: OrderStatus
}

export interface OrderInput {
  client_id: string
  product_name: string
  catalog_id?: string | null
  product_id?: string | null
  quantity?: number
  amount?: number | null
  currency?: string
  order_date?: string
  order_number?: string | null
  is_lrp?: boolean
  products?: OrderProduct[] | null
  status?: OrderStatus
  notes?: string | null
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .order('order_date', { ascending: false })

  if (filters.client_id)           query = query.eq('client_id', filters.client_id)
  if (filters.from)                query = query.gte('order_date', filters.from)
  if (filters.to)                  query = query.lte('order_date', filters.to)
  if (filters.is_lrp !== undefined) query = query.eq('is_lrp', filters.is_lrp)
  if (filters.status)              query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as Order[]
}

export async function getOrdersByClient(clientId: string): Promise<Order[]> {
  return fetchOrders({ client_id: clientId })
}

export async function createOrder(userId: string, input: OrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  const order = data as Order

  // Trigger automation: récupère le prénom du client en background
  supabase.from('clients').select('first_name, full_name').eq('id', order.client_id).single()
    .then(({ data: c }) => {
      if (!c) return
      const prénom = c.first_name || c.full_name.split(' ')[0]
      return triggerOrder(userId, order.client_id, prénom)
    })
    .catch(console.error)

  return order
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}
