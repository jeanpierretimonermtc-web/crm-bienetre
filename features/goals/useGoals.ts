import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchGoals, computeCurrentValues, upsertGoal, deleteGoal, currentPeriod } from './goalService'
import type { Goal, GoalMetric } from '@/shared/lib/types'

export interface GoalWithProgress extends Goal {
  pct: number  // 0-100
}

export function useGoals(period?: string) {
  const { session } = useAuth()
  const p = period ?? currentPeriod()

  const [goals, setGoals]     = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const [rawGoals, currents] = await Promise.all([
        fetchGoals(session.user.id, p),
        computeCurrentValues(session.user.id, p),
      ])
      setGoals(
        rawGoals.map(g => ({
          ...g,
          current: currents[g.metric] ?? g.current,
          pct: g.target > 0 ? Math.min(100, Math.round(((currents[g.metric] ?? 0) / g.target) * 100)) : 0,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur objectifs')
    } finally {
      setLoading(false)
    }
  }, [session, p])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (metric: GoalMetric, target: number): Promise<boolean> => {
    if (!session) return false
    try {
      await upsertGoal(session.user.id, metric, target, p)
      await load()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde')
      return false
    }
  }, [session, p, load])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression')
      return false
    }
  }, [])

  return { goals, loading, error, reload: load, save, remove }
}
