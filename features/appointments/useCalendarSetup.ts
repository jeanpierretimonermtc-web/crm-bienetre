import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useAuth } from '@/features/auth/AuthProvider'
import { getOrCreateOryalisCalendar } from './calendarSyncService'

export function useCalendarSetup() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session || Platform.OS === 'web') return
    getOrCreateOryalisCalendar().catch(e => console.error('[calendarSetup]', e))
  }, [session?.user.id])
}
