import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import type { Client } from '@/shared/lib/types'
import type { Alert } from '@/shared/lib/types'
import { computeAndSaveAlerts, fetchUnreadAlerts, markAlertRead, markAllAlertsRead } from '@/features/alerts/alertService'
import { checkNoContact } from '@/features/automations/automationService'

interface DashboardStats {
  totalClients: number
  activeClients: number
  newThisMonth: number
  pendingFollowups: number
  appointmentsThisMonth: number
  completedThisMonth: number
  prospects: number
  interactionsToday: number
  networkSize: number
  newRecruits: number
}

export function useDashboardStats() {
  const { session } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0, activeClients: 0, newThisMonth: 0,
    pendingFollowups: 0, appointmentsThisMonth: 0, completedThisMonth: 0,
    prospects: 0, interactionsToday: 0, networkSize: 0, newRecruits: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const uid = session.user.id
      const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0)
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

      const [total, active, newMonth, pending, sessions, completedSessions, prospectsRes, todayRes, networkRes, recruitsRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'active'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', firstOfMonth.toISOString()),
        supabase.from('followups').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('done', false),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('start_at', firstOfMonth.toISOString()),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'completed').gte('start_at', firstOfMonth.toISOString()),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).in('status', ['prospect', 'new_client']),
        supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('user_id', uid).is('completed_at', null).gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString()),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).not('sponsor_id', 'is', null),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid).not('sponsor_id', 'is', null).gte('created_at', firstOfMonth.toISOString()),
      ])

      setStats({
        totalClients: total.count ?? 0,
        activeClients: active.count ?? 0,
        newThisMonth: newMonth.count ?? 0,
        pendingFollowups: pending.count ?? 0,
        appointmentsThisMonth: sessions.count ?? 0,
        completedThisMonth: completedSessions.count ?? 0,
        prospects: prospectsRes.count ?? 0,
        interactionsToday: todayRes.count ?? 0,
        networkSize: networkRes.count ?? 0,
        newRecruits: recruitsRes.count ?? 0,
      })
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetch() }, [fetch])
  return { stats, loading, refresh: fetch }
}

export function useMonthlyRevenue() {
  const { session } = useAuth()
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const now = new Date()
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const { data } = await supabase
        .from('orders')
        .select('amount')
        .eq('user_id', session.user.id)
        .gte('order_date', from)
        .lte('order_date', to)
      const total = (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)
      setAmount(total)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetch() }, [fetch])
  return { amount, loading, refresh: fetch }
}

export function usePipelineStats() {
  const { session } = useAuth()
  const [byStatus, setByStatus] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('clients')
        .select('status')
        .eq('user_id', session.user.id)
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        counts[row.status] = (counts[row.status] ?? 0) + 1
      }
      setByStatus(counts)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetch() }, [fetch])
  return { byStatus, loading, refresh: fetch }
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

export function useAlerts() {
  const { session } = useAuth()
  const [alerts, setAlerts]   = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      // Compute new alerts + no-contact automations (fire-and-forget)
      computeAndSaveAlerts(session.user.id).catch(console.error)
      checkNoContact(session.user.id).catch(console.error)
      setAlerts(await fetchUnreadAlerts(session.user.id))
    } catch (e) {
      console.error('[useAlerts]', e)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const dismiss = useCallback(async (id: string) => {
    await markAlertRead(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const dismissAll = useCallback(async () => {
    if (!session) return
    await markAllAlertsRead(session.user.id)
    setAlerts([])
  }, [session])

  return { alerts, unreadCount: alerts.length, loading, reload: load, dismiss, dismissAll }
}
