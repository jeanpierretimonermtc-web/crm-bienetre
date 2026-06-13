import { useState, useEffect } from 'react'
import { getCatalogs, getCatalogProducts } from './catalogService'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Catalog, CatalogProduct } from '@/shared/lib/types'

export function useCatalogs() {
  const { session } = useAuth()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    getCatalogs(session.user.id)
      .then(setCatalogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

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
