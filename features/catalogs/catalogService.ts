import { supabase } from '@/shared/lib/supabase'
import type { Catalog, CatalogProduct } from '@/shared/lib/types'

export async function getCatalogs(userId: string): Promise<Catalog[]> {
  const { data, error } = await supabase
    .from('catalogs')
    .select('*')
    .or(`type.eq.official,user_id.eq.${userId}`)
    .order('name')
  if (error) throw error
  return data as Catalog[]
}

export async function getCatalogProducts(catalogId: string): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .eq('catalog_id', catalogId)
    .order('category')
    .order('name')
  if (error) throw error
  return data as CatalogProduct[]
}

export async function createCustomCatalog(
  userId: string,
  name: string,
  icon: string = '📦',
  color: string = '#007AFF'
): Promise<Catalog> {
  const { data, error } = await supabase
    .from('catalogs')
    .insert({ name, brand: null, type: 'custom', user_id: userId, icon, color })
    .select()
    .single()
  if (error) throw error
  return data as Catalog
}

export async function addProductToCatalog(
  catalogId: string,
  name: string,
  category: string | null = null,
  sku: string | null = null
): Promise<CatalogProduct> {
  const { data, error } = await supabase
    .from('catalog_products')
    .insert({ catalog_id: catalogId, name, category, sku })
    .select()
    .single()
  if (error) throw error
  return data as CatalogProduct
}
