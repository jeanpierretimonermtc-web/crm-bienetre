import { useState } from 'react'
import { Platform } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import {
  getOrCreateOryalisCalendar,
  pushAppointmentToCalendar,
  deleteAppointmentFromCalendar,
  fetchAllNativeEvents,
  getOryalisCalendarEvents,
  type NativeCalendarEvent,
} from './calendarSyncService'

export type { NativeCalendarEvent }

export function useCalendarSync() {
  const { session } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function syncAllToNative() {
    if (!session || Platform.OS === 'web') return
    setSyncing(true)
    setError(null)
    try {
      const calendarId = await getOrCreateOryalisCalendar()
      if (!calendarId) {
        setError('calendar_permission_denied')
        return
      }

      const { data: appts, error: fetchErr } = await supabase
        .from('appointments')
        .select('id, appointment_number, appointment_date, themes_discussed, native_event_id, client:clients(full_name)')
        .eq('user_id', session.user.id)

      if (fetchErr) throw fetchErr

      for (const appt of (appts ?? [])) {
        const clientName = (appt.client as { full_name?: string } | null)?.full_name ?? 'Client'
        const nativeId = await pushAppointmentToCalendar(calendarId, {
          appointment_number: appt.appointment_number,
          appointment_date:   appt.appointment_date,
          themes_discussed:   appt.themes_discussed,
          native_event_id:    appt.native_event_id,
          clientName,
        })
        if (nativeId && !appt.native_event_id) {
          await supabase
            .from('appointments')
            .update({ native_event_id: nativeId })
            .eq('id', appt.id)
        }
      }
    } catch (e) {
      console.error('[useCalendarSync.syncAll]', e)
      setError('sync_failed')
    } finally {
      setSyncing(false)
    }
  }

  async function syncOne(appointmentId: string) {
    if (!session || Platform.OS === 'web') return
    setSyncing(true)
    setError(null)
    try {
      const calendarId = await getOrCreateOryalisCalendar()
      if (!calendarId) {
        setError('calendar_permission_denied')
        return
      }

      const { data: appt, error: fetchErr } = await supabase
        .from('appointments')
        .select('id, appointment_number, appointment_date, themes_discussed, native_event_id, client:clients(full_name)')
        .eq('id', appointmentId)
        .single()

      if (fetchErr) throw fetchErr
      if (!appt)   return

      const clientName = (appt.client as { full_name?: string } | null)?.full_name ?? 'Client'
      const nativeId = await pushAppointmentToCalendar(calendarId, {
        appointment_number: appt.appointment_number,
        appointment_date:   appt.appointment_date,
        themes_discussed:   appt.themes_discussed,
        native_event_id:    appt.native_event_id,
        clientName,
      })
      if (nativeId && !appt.native_event_id) {
        await supabase
          .from('appointments')
          .update({ native_event_id: nativeId })
          .eq('id', appt.id)
      }
    } catch (e) {
      console.error('[useCalendarSync.syncOne]', e)
      setError('sync_failed')
    } finally {
      setSyncing(false)
    }
  }

  // Retourne le nombre de RDV dont la date a été mise à jour dans Supabase
  async function pullFromNative(): Promise<number> {
    if (!session || Platform.OS === 'web') return 0
    setSyncing(true)
    setError(null)
    try {
      // Fenêtre : 6 mois en arrière → 12 mois en avant
      const from = new Date()
      from.setMonth(from.getMonth() - 6)
      const to = new Date()
      to.setFullYear(to.getFullYear() + 1)

      const nativeEvents = await getOryalisCalendarEvents(from, to)
      if (nativeEvents.length === 0) return 0

      const { data: appts, error: fetchErr } = await supabase
        .from('appointments')
        .select('id, appointment_date, native_event_id')
        .eq('user_id', session.user.id)
        .not('native_event_id', 'is', null)

      if (fetchErr) throw fetchErr
      if (!appts || appts.length === 0) return 0

      // Clé : native_event_id → appointment Supabase
      const apptByNativeId = new Map(appts.map(a => [a.native_event_id as string, a]))

      // Comparaison à la minute près pour tolérer les décalages de timezone
      const toMin = (iso: string) => Math.floor(new Date(iso).getTime() / 60000)

      let changes = 0
      for (const nev of nativeEvents) {
        const appt = apptByNativeId.get(nev.id)
        if (!appt) continue

        if (toMin(nev.startDate) !== toMin(appt.appointment_date)) {
          const { error: updateErr } = await supabase
            .from('appointments')
            .update({ appointment_date: new Date(nev.startDate).toISOString() })
            .eq('id', appt.id)
          if (!updateErr) changes++
        }
      }

      return changes
    } catch (e) {
      console.error('[useCalendarSync.pullFromNative]', e)
      setError('sync_failed')
      return 0
    } finally {
      setSyncing(false)
    }
  }

  async function removeFromNative(nativeEventId: string): Promise<void> {
    if (Platform.OS === 'web') return
    await deleteAppointmentFromCalendar(nativeEventId)
  }

  async function fetchMergedCalendar(from: Date, to: Date): Promise<NativeCalendarEvent[]> {
    if (Platform.OS === 'web') return []
    return fetchAllNativeEvents(from, to)
  }

  return { syncAllToNative, syncOne, pullFromNative, removeFromNative, fetchMergedCalendar, syncing, error }
}
