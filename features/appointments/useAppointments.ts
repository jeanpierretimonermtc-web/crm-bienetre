import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { getAppointmentsByClient, getUpcomingAppointments } from './appointmentService'
import type { Appointment, AppointmentWithClient } from '@/shared/lib/types'

export function useClientAppointments(clientId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAppointments(await getAppointmentsByClient(clientId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'error')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetch() }, [fetch])
  return { appointments, loading, error, refresh: fetch }
}

export function useUpcomingAppointments(limit = 10) {
  const { session } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const data = await getUpcomingAppointments(session.user.id, limit)
      setAppointments(data as AppointmentWithClient[])
    } finally {
      setLoading(false)
    }
  }, [session, limit])

  useEffect(() => { fetch() }, [fetch])
  return { appointments, loading, refresh: fetch }
}
