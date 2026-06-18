import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { getOryalisCalendarEvents } from './calendarSyncService'

const COOLDOWN_MS = 30_000

export function useCalendarForegroundSync() {
  const { session } = useAuth()
  const lastSync  = useRef(0)
  const prevState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    if (!session || Platform.OS === 'web') return
    const userId = session.user.id

    async function pull() {
      const now = Date.now()
      if (now - lastSync.current < COOLDOWN_MS) return
      lastSync.current = now

      try {
        const from = new Date(); from.setMonth(from.getMonth() - 6)
        const to   = new Date(); to.setFullYear(to.getFullYear() + 1)

        const nativeEvents = await getOryalisCalendarEvents(from, to)
        if (!nativeEvents.length) return

        const { data: appts } = await supabase
          .from('appointments')
          .select('id, appointment_date, native_event_id')
          .eq('user_id', userId)
          .not('native_event_id', 'is', null)

        if (!appts?.length) return

        const byId  = new Map(appts.map(a => [a.native_event_id as string, a]))
        const toMin = (iso: string) => Math.floor(new Date(iso).getTime() / 60000)

        for (const ev of nativeEvents) {
          const appt = byId.get(ev.id)
          if (!appt || toMin(ev.startDate) === toMin(appt.appointment_date)) continue
          await supabase
            .from('appointments')
            .update({ appointment_date: new Date(ev.startDate).toISOString() })
            .eq('id', appt.id)
        }
      } catch (e) {
        console.error('[calendarForegroundSync]', e)
      }
    }

    const sub = AppState.addEventListener('change', (next) => {
      if (prevState.current.match(/inactive|background/) && next === 'active') {
        pull()
      }
      prevState.current = next
    })

    return () => sub.remove()
  }, [session?.user.id])
}
