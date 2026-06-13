import { supabase } from '@/shared/lib/supabase'
import type { Recommendation, RecommendationStatus } from '@/shared/lib/types'

export async function getRecommendationsByClient(clientId: string) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*, catalog:catalogs(name, color, icon)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Recommendation[]
}

export async function createRecommendation(
  userId: string,
  clientId: string,
  productName: string,
  reason: string | null,
  status: RecommendationStatus = 'advised',
  catalogId: string | null = null,
  productId: string | null = null
) {
  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      user_id: userId,
      client_id: clientId,
      product_name: productName,
      reason,
      status,
      catalog_id: catalogId,
      product_id: productId,
    })
    .select('*, catalog:catalogs(name, color, icon)')
    .single()
  if (error) throw error
  return data as Recommendation
}

export async function updateRecommendationStatus(id: string, status: RecommendationStatus) {
  const { error } = await supabase
    .from('recommendations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteRecommendation(id: string) {
  const { error } = await supabase.from('recommendations').delete().eq('id', id)
  if (error) throw error
}
