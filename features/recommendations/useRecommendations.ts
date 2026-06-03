import { useState, useEffect, useCallback } from 'react'
import { getRecommendationsByClient } from './recommendationService'
import type { Recommendation } from '@/shared/lib/types'

export function useRecommendations(clientId: string) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setRecommendations(await getRecommendationsByClient(clientId)) }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { recommendations, loading, refresh: fetch }
}
