import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import type { Client } from '@/shared/lib/types'

interface DashboardStats {
  totalClients: number
  activeClients: number
  newThisMonth: number
  pendingFollowups: number
  appointmentsThisMonth: number
}

export function useDashboardStats() {
  const { session } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalClients: 0, activeClients: 0, newThisMonth: 0, pendingFollowups: 0 })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const uid = session.user.id
      const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0,0,0,0)

      const [total, active, newMonth, pending, sessions] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'active'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', firstOfMonth.toISOString()),
        supabase.from('followups').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('done', false),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('appointment_date', firstOfMonth.toISOString()),
      ])

      setStats({
        totalClients: total.count ?? 0,
        activeClients: active.count ?? 0,
        newThisMonth: newMonth.count ?? 0,
        pendingFollowups: pending.count ?? 0,
        appointmentsThisMonth: sessions.count ?? 0,
      })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetch() }, [fetch])
  return { stats, loading, refresh: fetch }
}

export function useUpcomingLrp(limit = 5) {
  const { session } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .not('next_lrp_date', 'is', null)
        .order('next_lrp_date')
        .limit(limit)
      setClients((data ?? []) as Client[])
    } finally {
      setLoading(false)
    }
  }, [session, limit])

  useEffect(() => { fetch() }, [fetch])
  return { clients, loading, refresh: fetch }
}
