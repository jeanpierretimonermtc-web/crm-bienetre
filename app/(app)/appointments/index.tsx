import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { AppointmentWithClient } from '@/shared/lib/types'

// ── Time grid constants ────────────────────────────────────────────────────
const HOUR_HEIGHT = 64
const START_HOUR = 8
const END_HOUR = 20
const DURATION_MIN = 60

// ── Appointment card palette (cycling per client) ──────────────────────────
const EVENT_PALETTE = [
  { bg: '#ede9f8', text: '#6b4fc8', accent: '#6b4fc8' },
  { bg: '#dbeeff', text: '#2563ab', accent: '#2563ab' },
  { bg: '#caecbc', text: '#3d7534', accent: '#3d7534' },
  { bg: '#fde8d0', text: '#c17b2a', accent: '#c17b2a' },
]

// ── Date helpers ───────────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatHHMM(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }

function clientColorIdx(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % EVENT_PALETTE.length
}

// ── Locale data ────────────────────────────────────────────────────────────
const DAYS_SHORT_FR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
const DAYS_LONG_FR  = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAYS_LONG_EN  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─────────────────────────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const { t, i18n } = useTranslation()
  const { session } = useAuth()
  const isFr = i18n.language === 'fr'

  const daysShort = isFr ? DAYS_SHORT_FR : DAYS_SHORT_EN
  const daysLong  = isFr ? DAYS_LONG_FR  : DAYS_LONG_EN
  const months    = isFr ? MONTHS_FR     : MONTHS_EN

  // ── State ─────────────────────────────────────────────────────────────────
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today))
  const [selectedDay, setSelectedDay] = useState<Date>(today)
  const [weekAppts, setWeekAppts] = useState<AppointmentWithClient[]>([])
  const [upcoming, setUpcoming] = useState<AppointmentWithClient[]>([])
  const [loadingWeek, setLoadingWeek] = useState(true)

  // ── Fetch week ─────────────────────────────────────────────────────────────
  const fetchWeek = useCallback(async () => {
    if (!session) return
    setLoadingWeek(true)
    const weekEnd = addDays(weekStart, 7)
    const { data } = await supabase
      .from('appointments')
      .select('*, client:clients(id, full_name, status)')
      .eq('user_id', session.user.id)
      .gte('appointment_date', weekStart.toISOString())
      .lt('appointment_date', weekEnd.toISOString())
      .order('appointment_date')
    setWeekAppts((data ?? []) as AppointmentWithClient[])
    setLoadingWeek(false)
  }, [session, weekStart])

  // ── Fetch upcoming ─────────────────────────────────────────────────────────
  const fetchUpcoming = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('appointments')
      .select('*, client:clients(id, full_name, status)')
      .eq('user_id', session.user.id)
      .gt('appointment_date', new Date().toISOString())
      .order('appointment_date')
      .limit(8)
    setUpcoming((data ?? []) as AppointmentWithClient[])
  }, [session])

  useEffect(() => { fetchWeek() }, [fetchWeek])
  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])

  // ── Derived ────────────────────────────────────────────────────────────────
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayAppts   = weekAppts.filter(a => isSameDay(new Date(a.appointment_date), selectedDay))
  const hours      = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const isToday    = isSameDay(selectedDay, today)
  const weekEnd7   = addDays(weekStart, 6)

  const weekLabel = isFr
    ? `${weekStart.getDate()} ${months[weekStart.getMonth()]} – ${weekEnd7.getDate()} ${months[weekEnd7.getMonth()]} ${weekEnd7.getFullYear()}`
    : `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${months[weekEnd7.getMonth()]} ${weekEnd7.getDate()}, ${weekEnd7.getFullYear()}`

  const dayHeaderText = isFr
    ? `${isToday ? "Aujourd'hui, " : ''}${daysLong[selectedDay.getDay()]} ${selectedDay.getDate()} ${months[selectedDay.getMonth()]}`
    : `${isToday ? 'Today, ' : ''}${daysLong[selectedDay.getDay()]} ${months[selectedDay.getMonth()]} ${selectedDay.getDate()}`

  // ── Week navigation ────────────────────────────────────────────────────────
  function prevWeek() {
    setWeekStart(addDays(weekStart, -7))
    setSelectedDay(addDays(selectedDay, -7))
  }
  function nextWeek() {
    setWeekStart(addDays(weekStart, 7))
    setSelectedDay(addDays(selectedDay, 7))
  }
  function jumpToToday() {
    setWeekStart(getMonday(today))
    setSelectedDay(today)
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('appointments.title')}</Text>
          {!isToday && (
            <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday} activeOpacity={0.7}>
              <Text style={styles.todayBtnText}>{isFr ? "Auj." : 'Today'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Week nav ───────────────────────────────────────────────────── */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            onPress={prevWeek}
            style={styles.weekArrow}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text style={styles.weekArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <TouchableOpacity
            onPress={nextWeek}
            style={styles.weekArrow}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text style={styles.weekArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Day strip ──────────────────────────────────────────────────── */}
        <View style={styles.dayStrip}>
          {weekDays.map((day, i) => {
            const sel = isSameDay(day, selectedDay)
            const tod = isSameDay(day, today)
            const hasDot = weekAppts.some(a => isSameDay(new Date(a.appointment_date), day))
            return (
              <TouchableOpacity
                key={i}
                style={styles.dayCell}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayShort, (sel || tod) && styles.dayShortActive]}>
                  {daysShort[day.getDay()]}
                </Text>
                <View style={[
                  styles.dayCircle,
                  sel && styles.dayCircleSel,
                  tod && !sel && styles.dayCircleToday,
                ]}>
                  <Text style={[
                    styles.dayNum,
                    sel && styles.dayNumSel,
                    tod && !sel && styles.dayNumToday,
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.dotWrap}>
                  {hasDot ? <View style={[styles.dot, sel && styles.dotSel]} /> : null}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── Day label ──────────────────────────────────────────────────── */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{dayHeaderText}</Text>
          {loadingWeek && <ActivityIndicator size="small" color={colors.primaryAction} />}
        </View>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

          {/* Time grid */}
          <View style={[styles.timeGrid, { height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 32 }]}>

            {/* Hour rows */}
            {hours.map(h => (
              <View key={h} style={[styles.hourRow, { top: (h - START_HOUR) * HOUR_HEIGHT }]}>
                <Text style={styles.hourLabel}>{pad2(h)}:00</Text>
                <View style={styles.hourLine} />
              </View>
            ))}

            {/* Appointment blocks */}
            {dayAppts.map(appt => {
              const start   = new Date(appt.appointment_date)
              const startH  = start.getHours()
              const startM  = start.getMinutes()
              const hasTime = startH > 0 || startM > 0
              const frac    = hasTime ? startH + startM / 60 : START_HOUR
              const topPx   = (Math.max(frac, START_HOUR) - START_HOUR) * HOUR_HEIGHT + 4
              const heightPx = Math.max((DURATION_MIN / 60) * HOUR_HEIGHT - 8, 44)
              const end     = new Date(start.getTime() + DURATION_MIN * 60000)
              const pal     = EVENT_PALETTE[clientColorIdx(appt.client_id)]
              const isNew   = appt.appointment_number === 1

              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[styles.apptBlock, {
                    top: topPx,
                    height: heightPx,
                    backgroundColor: pal.bg,
                    borderLeftColor: pal.accent,
                  }]}
                  onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.apptTopRow}>
                    {hasTime
                      ? <Text style={[styles.apptTime, { color: pal.text }]}>
                          {formatHHMM(start)} – {formatHHMM(end)}
                        </Text>
                      : <Text style={[styles.apptTime, { color: pal.text }]}>📅</Text>
                    }
                    {isNew && (
                      <View style={[styles.newBadge, { backgroundColor: pal.accent }]}>
                        <Text style={styles.newBadgeText}>{isFr ? 'NOUVEAU' : 'NEW'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.apptClient, { color: pal.text }]} numberOfLines={1}>
                    {appt.client?.full_name}
                  </Text>
                  {appt.themes_discussed ? (
                    <Text style={[styles.apptTheme, { color: pal.text }]} numberOfLines={1}>
                      {appt.themes_discussed}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )
            })}

            {/* Empty state */}
            {dayAppts.length === 0 && !loadingWeek && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayEmoji}>📅</Text>
                <Text style={styles.emptyDayText}>
                  {isFr ? 'Aucun rendez-vous ce jour' : 'No appointments this day'}
                </Text>
              </View>
            )}
          </View>

          {/* ── À venir ──────────────────────────────────────────────────── */}
          {upcoming.length > 0 && (
            <View style={styles.upcoming}>
              <View style={styles.upcomingHead}>
                <Text style={styles.upcomingTitle}>{t('dashboard.upcoming_rdv')}</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.upcomingAll}>{t('dashboard.see_all')}</Text>
                </TouchableOpacity>
              </View>
              {upcoming.slice(0, 5).map(appt => {
                const d = new Date(appt.appointment_date)
                const hasTime = d.getHours() > 0 || d.getMinutes() > 0
                const timeStr = hasTime ? formatHHMM(d) : ''
                const parts = [timeStr, appt.themes_discussed].filter(Boolean)
                const subtitle = parts.join(' · ')
                return (
                  <TouchableOpacity
                    key={appt.id}
                    style={styles.upcomingRow}
                    onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.upcomingDateChip}>
                      <Text style={styles.upcomingDateShort}>{daysShort[d.getDay()]}</Text>
                      <Text style={styles.upcomingDateNum}>{d.getDate()}</Text>
                    </View>
                    <View style={styles.upcomingInfo}>
                      <Text style={styles.upcomingClient} numberOfLines={1}>
                        {appt.client?.full_name}
                      </Text>
                      {subtitle ? (
                        <Text style={styles.upcomingSubtitle} numberOfLines={1}>{subtitle}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.upcomingChevron}>›</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomWeekLabel}>
              {isFr ? 'Cette semaine' : 'This week'}
            </Text>
            <Text style={styles.bottomWeekCount}>
              {weekAppts.length} {isFr
                ? weekAppts.length === 1 ? 'rendez-vous' : 'rendez-vous'
                : weekAppts.length === 1 ? 'appointment' : 'appointments'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newRdvBtn}
            onPress={() => router.push('/(app)/clients' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.newRdvText}>
              + {isFr ? 'Rendez-vous' : 'Appointment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ── Page header ───────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle:    { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  todayBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.primaryLight },
  todayBtnText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.primaryAction },

  // ── Week nav ──────────────────────────────────────────────────────────────
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  weekArrow:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  weekArrowText: { fontSize: 26, color: colors.textSecondary, lineHeight: 30 },
  weekLabel:     { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },

  // ── Day strip ─────────────────────────────────────────────────────────────
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayCell:        { flex: 1, alignItems: 'center', gap: 2 },
  dayShort:       { fontSize: 10, fontFamily: fonts.medium, color: colors.textTertiary, letterSpacing: 0.3 },
  dayShortActive: { color: colors.primaryAction },
  dayCircle:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayCircleSel:   { backgroundColor: colors.primaryAction },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.primaryAction },
  dayNum:         { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  dayNumSel:      { color: '#ffffff', fontFamily: fonts.bold },
  dayNumToday:    { color: colors.primaryAction, fontFamily: fonts.semibold },
  dotWrap:        { height: 6, alignItems: 'center', justifyContent: 'center' },
  dot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryAction },
  dotSel:         { backgroundColor: colors.primaryLighter },

  // ── Day label ─────────────────────────────────────────────────────────────
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dayHeaderText: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },

  // ── Scroll body ───────────────────────────────────────────────────────────
  body: { flex: 1 },

  // ── Time grid ─────────────────────────────────────────────────────────────
  timeGrid:  { position: 'relative', paddingTop: 4 },
  hourRow:   { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', height: HOUR_HEIGHT },
  hourLabel: { width: 48, fontSize: 11, fontFamily: fonts.body, color: colors.textTertiary, textAlign: 'right', paddingRight: 8, lineHeight: 16 },
  hourLine:  { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 8, marginRight: 8 },

  // ── Appointment block ─────────────────────────────────────────────────────
  apptBlock: {
    position: 'absolute',
    left: 56,
    right: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  apptTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  apptTime:   { fontSize: 11, fontFamily: fonts.medium, opacity: 0.85 },
  apptClient: { fontSize: 14, fontFamily: fonts.semibold },
  apptTheme:  { fontSize: 12, fontFamily: fonts.body, opacity: 0.7, marginTop: 1 },

  // ── New badge ─────────────────────────────────────────────────────────────
  newBadge:     { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  newBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: '#ffffff', letterSpacing: 0.5 },

  // ── Empty day ─────────────────────────────────────────────────────────────
  emptyDay:      { position: 'absolute', top: 80, left: 56, right: 8, alignItems: 'center', gap: 8 },
  emptyDayEmoji: { fontSize: 32 },
  emptyDayText:  { fontSize: 14, fontFamily: fonts.body, color: colors.textTertiary, fontStyle: 'italic', textAlign: 'center' },

  // ── Upcoming section ──────────────────────────────────────────────────────
  upcoming: {
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  upcomingHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  upcomingTitle:    { fontSize: 17, fontFamily: fonts.semibold, color: colors.text },
  upcomingAll:      { fontSize: 13, fontFamily: fonts.medium, color: colors.primaryAction },
  upcomingRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  upcomingDateChip: { width: 46, backgroundColor: colors.surfaceContainerLow, borderRadius: 8, paddingVertical: 5, alignItems: 'center', gap: 1 },
  upcomingDateShort:{ fontSize: 9, fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5 },
  upcomingDateNum:  { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  upcomingInfo:     { flex: 1, gap: 2 },
  upcomingClient:   { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  upcomingSubtitle: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  upcomingChevron:  { fontSize: 20, color: colors.textTertiary, lineHeight: 24 },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  bottomLeft:      { flex: 1, gap: 1 },
  bottomWeekLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textSecondary },
  bottomWeekCount: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  newRdvBtn:       { backgroundColor: colors.primaryAction, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  newRdvText:      { fontSize: 14, fontFamily: fonts.semibold, color: '#ffffff' },
})
