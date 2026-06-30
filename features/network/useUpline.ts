import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  fetchUplineNodes,
  createUplineNode,
  updateUplineNode,
  deleteUplineNode,
} from './uplineService'
import type { UplineNode } from '@/shared/lib/types'

export function useUpline() {
  const { session } = useAuth()
  const [nodes, setNodes] = useState<UplineNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setError(null)
    try {
      setNodes(await fetchUplineNodes(session.user.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (name: string, memberId: string | null) => {
    if (!session?.user?.id) return
    // position = nombre de nœuds existants (le nouveau est le plus haut)
    const position = nodes.length
    const node = await createUplineNode(session.user.id, name, memberId, position)
    setNodes(prev => [node, ...prev])
  }, [session?.user?.id, nodes.length])

  const update = useCallback(async (id: string, name: string, memberId: string | null) => {
    await updateUplineNode(id, name, memberId)
    setNodes(prev => prev.map(n => n.id === id ? { ...n, name, member_id: memberId } : n))
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteUplineNode(id)
    setNodes(prev => prev.filter(n => n.id !== id))
  }, [])

  return { nodes, loading, error, reload: load, add, update, remove }
}
