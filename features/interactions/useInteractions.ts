import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { getInteractionsByClient, getUpcomingInteractions } from './interactionService'
import type { Interaction, InteractionWithClient } from '@/shared/lib/types'

export function useClientInteractions(clientId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setInteractions(await getInteractionsByClient(clientId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'error')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { interactions, loading, error, refresh: fetch }
}

export function useUpcomingInteractions(limit = 10) {
  const { session } = useAuth()
  const [interactions, setInteractions] = useState<InteractionWithClient[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await getUpcomingInteractions(session.user.id, limit)
      setInteractions(data as InteractionWithClient[])
    } finally {
      setLoading(false)
    }
  }, [session, limit])

  useEffect(() => { fetch() }, [fetch])
  return { interactions, loading, refresh: fetch }
}
