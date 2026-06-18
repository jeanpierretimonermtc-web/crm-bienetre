import { Platform } from 'react-native'

export type NativeCalendarEvent = {
  id: string
  title: string
  startDate: string
  endDate: string
  notes?: string
  calendarId: string
  calendarTitle: string
  calendarColor: string
  isOryalis: boolean
}

type SyncableAppointment = {
  appointment_number: number
  appointment_date: string
  themes_discussed: string | null
  native_event_id?: string | null
  clientName: string
}

const ORYALIS_CALENDAR_TITLE = 'Oryalis'
const DURATION_MS = 60 * 60 * 1000

export const ORYALIS_COLOR_VARIANTS = [
  '#6D3BFF', // violet Oryalis (primaire)
  '#7C3AED', // violet foncé
  '#8B5CF6', // violet moyen
  '#4F46E5', // indigo
  '#9333EA', // violet vif
  '#A855F7', // améthyste
]

function pickAvailableColor(usedColors: string[]): string {
  const norm = (c: string) => c.toLowerCase().trim()
  const used = new Set(usedColors.map(norm))
  return ORYALIS_COLOR_VARIANTS.find(c => !used.has(norm(c))) ?? ORYALIS_COLOR_VARIANTS[0]
}

type CalendarModule = typeof import('expo-calendar')

function cal(): CalendarModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-calendar') as CalendarModule
}

export async function getOrCreateOryalisCalendar(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    const Calendar = cal()
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return null

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    const existing = calendars.find(c => c.title === ORYALIS_CALENDAR_TITLE)
    if (existing) return existing.id

    const usedColors = calendars.map(c => c.color ?? '').filter(Boolean)
    const color = pickAvailableColor(usedColors)

    if (Platform.OS === 'ios') {
      const sources = await Calendar.getSourcesAsync()
      const source =
        sources.find(s => s.type === Calendar.SourceType.LOCAL) ??
        sources.find(s => s.type === Calendar.SourceType.CALDAV) ??
        sources[0]
      if (!source) return null
      return await Calendar.createCalendarAsync({
        title: ORYALIS_CALENDAR_TITLE,
        color,
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: source.id,
        source,
        name: ORYALIS_CALENDAR_TITLE,
      })
    } else {
      return await Calendar.createCalendarAsync({
        title: ORYALIS_CALENDAR_TITLE,
        color,
        entityType: Calendar.EntityTypes.EVENT,
        name: ORYALIS_CALENDAR_TITLE,
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      })
    }
  } catch (e) {
    console.error('[calendar.getOrCreate]', e)
    return null
  }
}

export async function pushAppointmentToCalendar(
  calendarId: string,
  appt: SyncableAppointment,
): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    const Calendar = cal()
    const start = new Date(appt.appointment_date)
    const end   = new Date(start.getTime() + DURATION_MS)

    const details = {
      title: `🟣 ${appt.clientName} — RDV #${appt.appointment_number}`,
      startDate: start,
      endDate: end,
      notes: appt.themes_discussed
        ? `[Oryalis] ${appt.themes_discussed}`
        : '[Oryalis]',
    }

    if (appt.native_event_id) {
      await Calendar.updateEventAsync(appt.native_event_id, details)
      return appt.native_event_id
    } else {
      return await Calendar.createEventAsync(calendarId, details)
    }
  } catch (e) {
    console.error('[calendar.push]', e)
    return null
  }
}

export async function deleteAppointmentFromCalendar(nativeEventId: string): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    const Calendar = cal()
    await Calendar.deleteEventAsync(nativeEventId)
  } catch (e) {
    console.error('[calendar.delete]', e)
  }
}

export type OryalisNativeEvent = {
  id: string
  startDate: string
  endDate: string
  title: string
  notes?: string
}

export async function getOryalisCalendarEvents(from: Date, to: Date): Promise<OryalisNativeEvent[]> {
  if (Platform.OS === 'web') return []
  try {
    const Calendar = cal()
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return []

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    const oryalisCal = calendars.find(c => c.title === ORYALIS_CALENDAR_TITLE)
    if (!oryalisCal) return []

    const events = await Calendar.getEventsAsync([oryalisCal.id], from, to)
    return events.map(ev => ({
      id:        ev.id,
      title:     ev.title,
      startDate: typeof ev.startDate === 'string' ? ev.startDate : (ev.startDate as Date).toISOString(),
      endDate:   typeof ev.endDate   === 'string' ? ev.endDate   : (ev.endDate   as Date).toISOString(),
      notes:     ev.notes ?? undefined,
    }))
  } catch (e) {
    console.error('[calendar.getOryalisEvents]', e)
    return []
  }
}

export async function getOryalisCalendarColor(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    const Calendar = cal()
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return null
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    return calendars.find(c => c.title === ORYALIS_CALENDAR_TITLE)?.color ?? null
  } catch (e) {
    console.error('[calendar.getColor]', e)
    return null
  }
}

export async function changeOryalisCalendarColor(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    const Calendar = cal()
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return null
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    const oryalisCal = calendars.find(c => c.title === ORYALIS_CALENDAR_TITLE)
    if (!oryalisCal) return null

    const norm = (c: string) => c.toLowerCase().trim()
    const currentIdx = ORYALIS_COLOR_VARIANTS.findIndex(c => norm(c) === norm(oryalisCal.color ?? ''))
    const nextColor = ORYALIS_COLOR_VARIANTS[(currentIdx + 1) % ORYALIS_COLOR_VARIANTS.length]

    await Calendar.updateCalendarAsync(oryalisCal.id, { color: nextColor })
    return nextColor
  } catch (e) {
    console.error('[calendar.changeColor]', e)
    return null
  }
}

export async function fetchAllNativeEvents(from: Date, to: Date): Promise<NativeCalendarEvent[]> {
  if (Platform.OS === 'web') return []
  try {
    const Calendar = cal()
    const { status } = await Calendar.requestCalendarPermissionsAsync()
    if (status !== 'granted') return []

    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
    if (allCalendars.length === 0) return []

    const calendarIds = allCalendars.map(c => c.id)
    const events      = await Calendar.getEventsAsync(calendarIds, from, to)
    const calMap      = new Map(allCalendars.map(c => [c.id, c]))

    return events.map(ev => {
      const sourceCal = calMap.get(ev.calendarId ?? '')
      return {
        id:            ev.id,
        title:         ev.title,
        startDate:     typeof ev.startDate === 'string' ? ev.startDate : (ev.startDate as Date).toISOString(),
        endDate:       typeof ev.endDate   === 'string' ? ev.endDate   : (ev.endDate   as Date).toISOString(),
        notes:         ev.notes ?? undefined,
        calendarId:    ev.calendarId ?? '',
        calendarTitle: sourceCal?.title ?? '',
        calendarColor: sourceCal?.color ?? '#94A3B8',
        isOryalis:     sourceCal?.title === ORYALIS_CALENDAR_TITLE,
      }
    })
  } catch (e) {
    console.error('[calendar.fetchAll]', e)
    return []
  }
}
