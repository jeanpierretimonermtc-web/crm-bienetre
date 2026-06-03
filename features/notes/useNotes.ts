import { useState, useEffect, useCallback } from 'react'
import { getNotesByClient } from './noteService'
import type { Note } from '@/shared/lib/types'

export function useNotes(clientId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setNotes(await getNotesByClient(clientId)) }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { notes, loading, refresh: fetch }
}
