import { useState, useEffect } from 'react'
import { getCatalogs, getCatalogProducts } from './catalogService'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import type { Catalog, CatalogProduct } from '@/shared/lib/types'

export function useCatalogs(refreshKey = 0) {
  const { session } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    Promise.all([
      getCatalogs(session.user.id),
      supabase
        .from('profiles')
        .select('active_catalog_slugs')
        .eq('id', session.user.id)
        .single(),
    ])
      .then(([allCatalogs, { data: profile }]) => {
        const active = profile?.active_catalog_slugs as string[] | null
        if (!active || active.length === 0) {
          setCatalogs(allCatalogs)
        } else {
          setCatalogs(allCatalogs.filter(c =>
            c.type === 'custom' || (c.slug && active.includes(c.slug))
          ))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session, refreshKey])

  return { catalogs, loading }
}

export function useCatalogProducts(catalogId: string | null) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!catalogId) { setProducts([]); return }
    setLoading(true)
    getCatalogProducts(catalogId)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [catalogId])

  return { products, loading }
}
