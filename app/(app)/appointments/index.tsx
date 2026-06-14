import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { AppointmentWithClient } from '@/shared/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────
const DAY_HOUR_H  = 64   // px per hour — day view
const WEEK_HOUR_H = 38   // px per hour — week view
const TIME_COL_W  = 44   // px — time labels column
const WEEK_COL_W  = 72   // px — each day column in week view
const START_HOUR  = 8
const END_HOUR    = 20
const DURATION_MIN = 60

// ── Colour palette cycling by client ──────────────────────────────────────────
const EVENT_PALETTE = [
  { bg: '#ede9f8', text: '#6b4fc8', accent: '#6b4fc8' },
  { bg: '#dbeeff', text: '#2563ab', accent: '#2563ab' },
  { bg: '#caecbc', text: '#3d7534', accent: '#3d7534' },
  { bg: '#fde8d0', text: '#c17b2a', accent: '#c17b2a' },
  { bg: '#fce4ec', text: '#c2185b', accent: '#c2185b' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}
function addDays(d: Date, n: number): Date {
  const date = new Date(d); date.setDate(date.getDate() + n); return date
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function pad2(n: number) { return String(n).padStart(2, '0') }
function formatHHMM(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }
function clientColorIdx(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % EVENT_PALETTE.length
}
function firstName(fullName: string | null | undefined) {
  return (fullName ?? '').split(' ')[0] ?? ''
}

// ── Locale data ───────────────────────────────────────────────────────────────
const DAYS_SHORT_FR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
const DAYS_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAYS_LONG_FR  = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_LONG_EN  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const GRID_HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

// ─────────────────────────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const { t, i18n } = useTranslation()
  const { session } = useAuth()
  const { width: screenW } = useWindowDimensions()
  const isFr = i18n.language === 'fr'

  const daysShort = isFr ? DAYS_SHORT_FR : DAYS_SHORT_EN
  const daysLong  = isFr ? DAYS_LONG_FR  : DAYS_LONG_EN
  const months    = isFr ? MONTHS_FR     : MONTHS_EN

  const today = useRef((() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()).current

  const [viewMode,   setViewMode]   = useState<'week' | 'day'>('week')
  const [weekStart,  setWeekStart]  = useState<Date>(() => getMonday(today))
  const [selectedDay,setSelectedDay]= useState<Date>(today)
  const [weekAppts,  setWeekAppts]  = useState<AppointmentWithClient[]>([])
  const [loadingWeek,setLoadingWeek]= useState(true)

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchWeek = useCallback(async () => {
    if (!session) return
    setLoadingWeek(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, client:clients(id, full_name, status)')
      .eq('user_id', session.user.id)
      .gte('appointment_date', weekStart.toISOString())
      .lt('appointment_date', addDays(weekStart, 7).toISOString())
      .order('appointment_date')
    setWeekAppts((data ?? []) as AppointmentWithClient[])
    setLoadingWeek(false)
  }, [session, weekStart])

  useEffect(() => { fetchWeek() }, [fetchWeek])

  // ── Derived ───────────────────────────────────────────────────────────────
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dayAppts  = weekAppts.filter(a => isSameDay(new Date(a.appointment_date), selectedDay))
  const isToday   = isSameDay(selectedDay, today)
  const weekEnd7  = addDays(weekStart, 6)

  const weekLabel = isFr
    ? `${weekStart.getDate()} ${months[weekStart.getMonth()]} – ${weekEnd7.getDate()} ${months[weekEnd7.getMonth()]} ${weekEnd7.getFullYear()}`
    : `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${months[weekEnd7.getMonth()]} ${weekEnd7.getDate()}, ${weekEnd7.getFullYear()}`

  const dayHeaderText = isFr
    ? `${isToday ? "Aujourd'hui" : daysLong[selectedDay.getDay()]}, ${selectedDay.getDate()} ${months[selectedDay.getMonth()]}`
    : `${isToday ? 'Today' : daysLong[selectedDay.getDay()]}, ${months[selectedDay.getMonth()]} ${selectedDay.getDate()}`

  // ── Navigation ────────────────────────────────────────────────────────────
  function prevWeek() { setWeekStart(addDays(weekStart, -7)); setSelectedDay(addDays(selectedDay, -7)) }
  function nextWeek() { setWeekStart(addDays(weekStart, 7));  setSelectedDay(addDays(selectedDay, 7)) }
  function jumpToToday() { setWeekStart(getMonday(today)); setSelectedDay(today) }

  function selectDay(day: Date, switchToDayView = false) {
    setSelectedDay(day)
    if (switchToDayView) setViewMode('day')
  }

  // ── Appointment block helpers ─────────────────────────────────────────────
  function apptTopPx(appt: AppointmentWithClient, hourH: number) {
    const d = new Date(appt.appointment_date)
    const h = d.getHours(), m = d.getMinutes()
    const hasTime = h > 0 || m > 0
    const frac = hasTime ? h + m / 60 : START_HOUR
    return (Math.max(frac, START_HOUR) - START_HOUR) * hourH
  }
  function apptHeightPx(hourH: number, minH: number) {
    return Math.max((DURATION_MIN / 60) * hourH - 6, minH)
  }

  // ─── WEEK VIEW ─────────────────────────────────────────────────────────────
  const GRID_H = (END_HOUR - START_HOUR) * WEEK_HOUR_H
  const TOTAL_GRID_W = 7 * WEEK_COL_W

  function renderWeekGrid() {
    return (
      <View style={styles.weekGridOuter}>
        {/* Fixed time labels column */}
        <View style={[styles.timeCol, { height: GRID_H + 8 }]}>
          {GRID_HOURS.filter(h => h % 2 === 0).map(h => (
            <View key={h} style={{ position: 'absolute', top: (h - START_HOUR) * WEEK_HOUR_H - 8, width: TIME_COL_W }}>
              <Text style={styles.hourLabelWeek}>{pad2(h)}h</Text>
            </View>
          ))}
        </View>

        {/* Scrollable day columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ width: TOTAL_GRID_W, height: GRID_H, position: 'relative' }}>

            {/* Horizontal hour lines */}
            {GRID_HOURS.map(h => (
              <View key={h} style={[
                styles.weekHourLine,
                { top: (h - START_HOUR) * WEEK_HOUR_H },
                h % 2 === 0 ? styles.weekHourLineMain : styles.weekHourLineMinor,
              ]} />
            ))}

            {/* Vertical column dividers */}
            {weekDays.map((_, i) => (
              <View key={i} style={[styles.weekColDiv, { left: i * WEEK_COL_W }]} />
            ))}

            {/* Appointments per day */}
            {weekDays.map((day, dayIdx) => {
              const appts = weekAppts.filter(a => isSameDay(new Date(a.appointment_date), day))
              return appts.map(appt => {
                const pal  = EVENT_PALETTE[clientColorIdx(appt.client_id)]
                const topPx = apptTopPx(appt, WEEK_HOUR_H)
                const hPx   = apptHeightPx(WEEK_HOUR_H, 24)
                const d     = new Date(appt.appointment_date)
                const hasTime = d.getHours() > 0 || d.getMinutes() > 0

                return (
                  <TouchableOpacity
                    key={appt.id}
                    style={[styles.weekApptBlock, {
                      left: dayIdx * WEEK_COL_W + 3,
                      width: WEEK_COL_W - 6,
                      top: topPx + 2,
                      height: hPx,
                      backgroundColor: pal.bg,
                      borderLeftColor: pal.accent,
                    }]}
                    onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments` as any)}
                    activeOpacity={0.8}
                  >
                    {hasTime && hPx > 30 && (
                      <Text style={[styles.weekApptTime, { color: pal.text }]}>
                        {formatHHMM(d)}
                      </Text>
                    )}
                    <Text style={[styles.weekApptName, { color: pal.text }]} numberOfLines={1}>
                      {firstName(appt.client?.full_name)}
                    </Text>
                  </TouchableOpacity>
                )
              })
            })}

            {/* Tap zones per day to drill into day view */}
            {weekDays.map((day, dayIdx) => (
              <TouchableOpacity
                key={`zone-${dayIdx}`}
                style={{
                  position: 'absolute',
                  left: dayIdx * WEEK_COL_W,
                  width: WEEK_COL_W,
                  top: 0,
                  height: GRID_H,
                  zIndex: 0,
                }}
                onPress={() => selectDay(day, true)}
                activeOpacity={1}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }

  // ─── WEEK VIEW HEADER (day columns) ────────────────────────────────────────
  function renderWeekDayHeaders() {
    return (
      <View style={styles.weekDayHeaders}>
        {/* Space for time column */}
        <View style={{ width: TIME_COL_W }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} scrollEnabled={false}>
          <View style={{ flexDirection: 'row', width: TOTAL_GRID_W }}>
            {weekDays.map((day, i) => {
              const isSel = isSameDay(day, selectedDay)
              const isTod = isSameDay(day, today)
              const hasDot = weekAppts.some(a => isSameDay(new Date(a.appointment_date), day))
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.weekDayHeaderCell, { width: WEEK_COL_W }]}
                  onPress={() => selectDay(day, true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.weekDayShort, (isSel || isTod) && styles.weekDayShortActive]}>
                    {daysShort[day.getDay()]}
                  </Text>
                  <View style={[
                    styles.weekDayCircle,
                    isTod && styles.weekDayCircleToday,
                    isSel && styles.weekDayCircleSel,
                  ]}>
                    <Text style={[
                      styles.weekDayNum,
                      isTod && !isSel && styles.weekDayNumToday,
                      isSel && styles.weekDayNumSel,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  {hasDot && <View style={[styles.dot, isSel && styles.dotSel]} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>
    )
  }

  // ─── DAY VIEW ──────────────────────────────────────────────────────────────
  function renderDayView() {
    return (
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Day info bar */}
        <View style={styles.dayInfoBar}>
          <View>
            <Text style={styles.dayHeaderText}>{dayHeaderText}</Text>
            <Text style={styles.dayApptCount}>
              {dayAppts.length === 0
                ? (isFr ? 'Aucun rendez-vous' : 'No appointments')
                : dayAppts.length === 1
                ? (isFr ? '1 rendez-vous' : '1 appointment')
                : `${dayAppts.length} ${isFr ? 'rendez-vous' : 'appointments'}`}
            </Text>
          </View>
          {loadingWeek && <ActivityIndicator size="small" color={colors.primaryAction} />}
        </View>

        {/* Time grid */}
        <View style={[styles.timeGrid, { height: (END_HOUR - START_HOUR) * DAY_HOUR_H + 32 }]}>

          {GRID_HOURS.map(h => (
            <View key={h} style={[styles.hourRow, { top: (h - START_HOUR) * DAY_HOUR_H }]}>
              <Text style={styles.hourLabel}>{pad2(h)}h</Text>
              <View style={[styles.hourLine, h % 2 === 0 ? styles.hourLineMain : styles.hourLineMinor]} />
            </View>
          ))}

          {/* Appointment blocks */}
          {dayAppts.map(appt => {
            const d      = new Date(appt.appointment_date)
            const end    = new Date(d.getTime() + DURATION_MIN * 60000)
            const hasTime = d.getHours() > 0 || d.getMinutes() > 0
            const topPx  = apptTopPx(appt, DAY_HOUR_H) + 4
            const hPx    = apptHeightPx(DAY_HOUR_H, 56)
            const pal    = EVENT_PALETTE[clientColorIdx(appt.client_id)]

            return (
              <TouchableOpacity
                key={appt.id}
                style={[styles.dayApptBlock, {
                  top: topPx,
                  height: hPx,
                  backgroundColor: pal.bg,
                  borderLeftColor: pal.accent,
                }]}
                onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments` as any)}
                activeOpacity={0.8}
              >
                {/* Time row */}
                <View style={styles.dayApptHeaderRow}>
                  {hasTime ? (
                    <Text style={[styles.dayApptTime, { color: pal.accent }]}>
                      {formatHHMM(d)} – {formatHHMM(end)}
                    </Text>
                  ) : (
                    <Text style={[styles.dayApptTime, { color: pal.accent }]}>Toute la journée</Text>
                  )}
                  <View style={[styles.apptNumBadge, { backgroundColor: pal.accent + '22' }]}>
                    <Text style={[styles.apptNumText, { color: pal.accent }]}>
                      #{appt.appointment_number}
                    </Text>
                  </View>
                  {appt.recap_sent && (
                    <View style={[styles.recapBadge, { backgroundColor: pal.accent }]}>
                      <Text style={styles.recapBadgeText}>{isFr ? 'Récap' : 'Recap'} ✓</Text>
                    </View>
                  )}
                </View>

                {/* Client name */}
                <Text style={[styles.dayApptClient, { color: pal.text }]} numberOfLines={1}>
                  {appt.client?.full_name}
                </Text>

                {/* Themes / notes */}
                {appt.themes_discussed && hPx > 72 ? (
                  <Text style={[styles.dayApptTheme, { color: pal.text }]} numberOfLines={2}>
                    {appt.themes_discussed}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )
          })}

          {/* Empty state */}
          {dayAppts.length === 0 && !loadingWeek && (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayEmoji}>✨</Text>
              <Text style={styles.emptyDayTitle}>{isFr ? 'Journée libre' : 'Free day'}</Text>
              <Text style={styles.emptyDaySub}>
                {isFr ? 'Aucun rendez-vous ce jour' : 'No appointments scheduled'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    )
  }

  // ─── ROOT ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('appointments.title')}</Text>
          <View style={styles.headerRight}>
            {!isToday && (
              <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday} activeOpacity={0.7}>
                <Text style={styles.todayBtnText}>{isFr ? "Auj." : 'Today'}</Text>
              </TouchableOpacity>
            )}
            {loadingWeek && <ActivityIndicator size="small" color={colors.primaryAction} />}
          </View>
        </View>

        {/* ── View mode toggle ─────────────────────────────────────────────── */}
        <View style={styles.viewToggleRow}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
              onPress={() => setViewMode('week')}
              activeOpacity={0.75}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'week' && styles.toggleBtnTextActive]}>
                {isFr ? 'Semaine' : 'Week'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
              onPress={() => setViewMode('day')}
              activeOpacity={0.75}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'day' && styles.toggleBtnTextActive]}>
                {isFr ? 'Jour' : 'Day'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Week navigation */}
          <View style={styles.weekNavCompact}>
            <TouchableOpacity onPress={prevWeek} style={styles.weekArrow} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
              <Text style={styles.weekArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
            <TouchableOpacity onPress={nextWeek} style={styles.weekArrow} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
              <Text style={styles.weekArrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Week view ────────────────────────────────────────────────────── */}
        {viewMode === 'week' && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderWeekDayHeaders()}
            {renderWeekGrid()}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* ── Day view — strip + time grid ─────────────────────────────────── */}
        {viewMode === 'day' && (
          <>
            {/* Day strip */}
            <View style={styles.dayStrip}>
              {weekDays.map((day, i) => {
                const sel = isSameDay(day, selectedDay)
                const tod = isSameDay(day, today)
                const hasDot = weekAppts.some(a => isSameDay(new Date(a.appointment_date), day))
                return (
                  <TouchableOpacity key={i} style={styles.dayCell} onPress={() => setSelectedDay(day)} activeOpacity={0.7}>
                    <Text style={[styles.dayShort, (sel || tod) && styles.dayShortActive]}>
                      {daysShort[day.getDay()]}
                    </Text>
                    <View style={[styles.dayCircle, sel && styles.dayCircleSel, tod && !sel && styles.dayCircleToday]}>
                      <Text style={[styles.dayNum, sel && styles.dayNumSel, tod && !sel && styles.dayNumToday]}>
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
            {renderDayView()}
          </>
        )}

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomWeekLabel}>{isFr ? 'Cette semaine' : 'This week'}</Text>
            <Text style={styles.bottomWeekCount}>
              {weekAppts.length} {isFr ? 'rendez-vous' : weekAppts.length === 1 ? 'appointment' : 'appointments'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newRdvBtn}
            onPress={() => router.push('/(app)/clients' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.newRdvText}>+ {isFr ? 'Rendez-vous' : 'Appointment'}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  pageTitle:  { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayBtn:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.primaryLight },
  todayBtnText: { fontSize: 12, fontFamily: fonts.semibold, color: colors.primaryAction },

  // ── View toggle ───────────────────────────────────────────────────────────
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  viewToggle:          { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: 10, padding: 3, gap: 2 },
  toggleBtn:           { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  toggleBtnActive:     { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleBtnText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  toggleBtnTextActive: { color: colors.text, fontFamily: fonts.semibold },

  // ── Week navigation ───────────────────────────────────────────────────────
  weekNavCompact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekArrow:      { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  weekArrowText:  { fontSize: 24, color: colors.textSecondary, lineHeight: 28 },
  weekLabel:      { fontSize: 12, fontFamily: fonts.semibold, color: colors.text, textAlign: 'center', maxWidth: 120 },

  // ── Week view — day column headers ────────────────────────────────────────
  weekDayHeaders:     { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  weekDayHeaderCell:  { alignItems: 'center', gap: 3 },
  weekDayShort:       { fontSize: 9, fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.5 },
  weekDayShortActive: { color: colors.primaryAction },
  weekDayCircle:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekDayCircleToday: { borderWidth: 1.5, borderColor: colors.primaryAction },
  weekDayCircleSel:   { backgroundColor: colors.primaryAction },
  weekDayNum:         { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  weekDayNumToday:    { color: colors.primaryAction, fontFamily: fonts.semibold },
  weekDayNumSel:      { color: '#ffffff', fontFamily: fonts.bold },

  // ── Week view — grid ──────────────────────────────────────────────────────
  weekGridOuter: { flexDirection: 'row', paddingTop: 8 },
  timeCol:       { width: TIME_COL_W, position: 'relative' },
  hourLabelWeek: { fontSize: 10, fontFamily: fonts.medium, color: colors.textTertiary, textAlign: 'right', paddingRight: 8 },
  weekHourLine:      { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  weekHourLineMain:  { backgroundColor: colors.border, opacity: 0.9 },
  weekHourLineMinor: { backgroundColor: colors.border, opacity: 0.35 },
  weekColDiv:    { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: colors.border, opacity: 0.5 },

  // ── Week appointment block ────────────────────────────────────────────────
  weekApptBlock: {
    position: 'absolute',
    borderRadius: 5,
    borderLeftWidth: 2.5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: 'hidden',
    zIndex: 2,
  },
  weekApptTime: { fontSize: 9, fontFamily: fonts.medium, opacity: 0.85 },
  weekApptName: { fontSize: 11, fontFamily: fonts.bold },

  // ── Day strip (day view) ──────────────────────────────────────────────────
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
  dotWrap:        { height: 5, alignItems: 'center', justifyContent: 'center' },
  dot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryAction },
  dotSel:         { backgroundColor: '#ffffff' },

  // ── Day view — info bar ───────────────────────────────────────────────────
  dayInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dayHeaderText:  { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  dayApptCount:   { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },

  // ── Scroll body ───────────────────────────────────────────────────────────
  body: { flex: 1 },

  // ── Time grid ─────────────────────────────────────────────────────────────
  timeGrid:      { position: 'relative', paddingTop: 4 },
  hourRow:       { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', height: DAY_HOUR_H },
  hourLabel:     { width: TIME_COL_W, fontSize: 11, fontFamily: fonts.medium, color: colors.textTertiary, textAlign: 'right', paddingRight: 10, lineHeight: 16 },
  hourLine:      { flex: 1, height: StyleSheet.hairlineWidth, marginTop: 8, marginRight: 8 },
  hourLineMain:  { backgroundColor: colors.border },
  hourLineMinor: { backgroundColor: colors.border, opacity: 0.4 },

  // ── Day appointment block ─────────────────────────────────────────────────
  dayApptBlock: {
    position: 'absolute',
    left: TIME_COL_W + 4,
    right: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  dayApptHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  dayApptTime:      { fontSize: 11, fontFamily: fonts.medium, opacity: 0.9 },
  apptNumBadge:     { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  apptNumText:      { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.3 },
  recapBadge:       { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  recapBadgeText:   { fontSize: 9, fontFamily: fonts.bold, color: '#ffffff', letterSpacing: 0.3 },
  dayApptClient:    { fontSize: 16, fontFamily: fonts.bold, lineHeight: 20 },
  dayApptTheme:     { fontSize: 12, fontFamily: fonts.body, opacity: 0.72, marginTop: 3, lineHeight: 16 },

  // ── Empty day ─────────────────────────────────────────────────────────────
  emptyDay:      { position: 'absolute', top: 80, left: TIME_COL_W, right: 8, alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyDayEmoji: { fontSize: 36 },
  emptyDayTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  emptyDaySub:   { fontSize: 13, fontFamily: fonts.body, color: colors.textTertiary, textAlign: 'center' },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 12,
  },
  bottomLeft:      { flex: 1, gap: 1 },
  bottomWeekLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textSecondary },
  bottomWeekCount: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  newRdvBtn:       { backgroundColor: colors.primaryAction, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  newRdvText:      { fontSize: 14, fontFamily: fonts.semibold, color: '#ffffff' },
})
