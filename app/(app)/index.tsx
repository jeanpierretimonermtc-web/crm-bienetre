import { useEffect, useCallback, useRef, useMemo } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions, ActivityIndicator } from 'react-native'
import { router, Stack, useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDemoState } from '@/features/demo/DemoProvider'
import { useDashboardStats, useUpcomingLrp } from '@/features/dashboard/useDashboard'
import { useUpcomingAppointments } from '@/features/appointments/useAppointments'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { Avatar } from '@/shared/components/ui/Avatar'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { AppointmentWithClient, FollowupWithClient, Client } from '@/shared/lib/types'

function useLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'fr' ? 'fr-FR' : 'en-US'
}

// ── Quick card ────────────────────────────────────────────────────────────────
function QuickCard({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.quickCardIcon}>{icon}</Text>
      <Text style={styles.quickCardLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── KPI card — icon square + serif value + label + delta ───────────────────
function KpiCard({ icon, value, label, delta, accent, bg, onPress, wide }: {
  icon: string; value: number; label: string; delta?: string
  accent: string; bg: string; onPress?: () => void; wide?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <TouchableOpacity style={[styles.kpiCard, wide ? styles.kpiCardWide : styles.kpiCardMobile]} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={styles.kpiTop}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <View style={[styles.kpiIconBox, { backgroundColor: bg }]}>
          <Text style={styles.kpiIconText}>{icon}</Text>
        </View>
      </View>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      {delta ? <Text style={styles.kpiDelta}>{delta}</Text> : null}
    </TouchableOpacity>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, onMore }: { title: string; sub?: string; onMore?: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
      {onMore && (
        <TouchableOpacity onPress={onMore}>
          <Text style={styles.sectionMore}>{t('dashboard.see_all')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Appointment row (inside unified card) ────────────────────────────────────
function ApptRow({ appt, isToday }: { appt: AppointmentWithClient; isToday: boolean }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const locale = useLocale()
  const date = new Date(appt.appointment_date)

  const timeMain = isToday
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { weekday: 'short' })
  const timeSub = isToday
    ? t('appointments.number', { number: appt.appointment_number })
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  const type = appt.themes_discussed?.split(/\n/)[0]?.trim()
    || t('appointments.number', { number: appt.appointment_number })
  const confirmed = appt.recap_sent

  return (
    <TouchableOpacity
      style={styles.apptRow}
      onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments`)}
      activeOpacity={0.7}
    >
      <View style={styles.apptTimeCol}>
        <Text style={styles.apptTimeMain}>{timeMain}</Text>
        <Text style={styles.apptTimeSub}>{timeSub}</Text>
      </View>
      <Avatar name={appt.client?.full_name ?? '?'} size={38} />
      <View style={styles.apptInfo}>
        <Text style={styles.apptName} numberOfLines={1}>{appt.client?.full_name}</Text>
        <Text style={styles.apptType} numberOfLines={1}>{type}</Text>
      </View>
      <View style={[styles.statusBadge, confirmed ? styles.confirmedBadge : styles.pendingBadge]}>
        <Text style={[styles.statusText, confirmed ? styles.confirmedText : styles.pendingText]}>
          {confirmed ? t('dashboard.confirmed') : t('dashboard.pending_appt')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Followup card ─────────────────────────────────────────────────────────────
function FollowupCard({ f }: { f: FollowupWithClient }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = f.due_date < today
  const daysLate = isOverdue
    ? Math.ceil((new Date(today).getTime() - new Date(f.due_date).getTime()) / 86400000)
    : 0

  const badgeText = daysLate > 1
    ? t('dashboard.days_late', { days: daysLate })
    : daysLate === 1
    ? t('dashboard.yesterday')
    : t('dashboard.followup_today')
  const urgent = daysLate > 1

  return (
    <TouchableOpacity
      style={styles.followupRow}
      onPress={() => router.push(`/(app)/clients/${f.client_id}/followups`)}
      activeOpacity={0.7}
    >
      <View style={[styles.followupDot, { backgroundColor: urgent ? colors.danger : colors.secondary }]} />
      <Avatar name={f.client?.full_name ?? '?'} size={34} />
      <View style={styles.followupInfo}>
        <Text style={styles.followupName} numberOfLines={1}>{f.client?.full_name}</Text>
        <Text style={styles.followupTask} numberOfLines={1}>{f.title ?? f.content}</Text>
        <Text style={[styles.followupDue, { color: urgent ? colors.danger : colors.secondary }]}>
          🕐 {badgeText}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── LRP card ──────────────────────────────────────────────────────────────────
function LrpCard({ client }: { client: Client }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const locale = useLocale()
  const daysUntil = client.next_lrp_date
    ? Math.ceil((new Date(client.next_lrp_date).getTime() - Date.now()) / 86400000)
    : null
  const urgent = daysUntil !== null && daysUntil <= 7

  return (
    <TouchableOpacity style={styles.apptRow} onPress={() => router.push(`/(app)/clients/${client.id}`)} activeOpacity={0.7}>
      <View style={styles.apptTimeCol}>
        <Text style={styles.apptTimeMain}>
          {daysUntil !== null && daysUntil <= 0
            ? t('dashboard.lrp_today')
            : daysUntil !== null ? t('dashboard.lrp_days', { days: daysUntil }) : '—'}
        </Text>
        <Text style={styles.apptTimeSub}>LRP</Text>
      </View>
      <Avatar name={client.full_name} size={38} />
      <View style={styles.apptInfo}>
        <Text style={styles.apptName}>{client.full_name}</Text>
        <Text style={styles.apptType}>
          {client.next_lrp_date && new Date(client.next_lrp_date).toLocaleDateString(locale, { day: '2-digit', month: 'long' })}
        </Text>
      </View>
      {urgent && (
        <View style={[styles.statusBadge, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.statusText, { color: colors.danger }]}>{t('common.urgent')}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { session } = useAuth()
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  const { stats, loading: statsLoading, refresh: refreshStats } = useDashboardStats()
  const { appointments, loading: apptLoading, refresh: refreshAppts } = useUpcomingAppointments(10)
  const { followups, loading: fuLoading, refresh: refreshFu } = usePendingFollowups()
  const { clients: lrpClients, refresh: refreshLrp } = useUpcomingLrp(5)

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? ''
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('dashboard.greeting_morning')
    : hour < 18
    ? t('dashboard.greeting_afternoon')
    : t('dashboard.greeting_evening')

  // ── Shared demo state (context) ────────────────────────────────────────────
  const { demoCount, demoLoading, demoFailed, demoVersion, hideDemoCard, checkDemo, handleLoadDemo, handleDeleteDemo } = useDemoState()

  function refreshAll() { refreshStats(); refreshAppts(); refreshFu(); refreshLrp() }

  // Refresh on focus (back-navigation, tab switch)
  useFocusEffect(
    useCallback(() => {
      refreshAll()
      checkDemo()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Refresh when sidebar loads or deletes demo (demoVersion increments)
  const mountedVersion = useRef(demoVersion)
  useEffect(() => {
    if (demoVersion !== mountedVersion.current) {
      refreshAll()
    }
  }, [demoVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also keep stats in sync when demoCount changes (for KPI counts)
  useEffect(() => {
    if (!statsLoading) checkDemo()
  }, [statsLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const showLoadDemo   = !statsLoading && stats.totalClients === 0
  const showDemoActive = !statsLoading && demoCount > 0
  const showDemoLink   = !statsLoading && stats.totalClients > 0 && demoCount === 0

  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppts    = appointments.filter(a => a.appointment_date.startsWith(todayStr))
  const upcomingAppts = appointments.filter(a => !a.appointment_date.startsWith(todayStr)).slice(0, 5)
  const overdueToday  = followups.filter(f => f.due_date <= todayStr)

  const shownAppts   = todayAppts.length > 0 ? todayAppts : upcomingAppts
  const showingToday = todayAppts.length > 0

  const activePct = stats.totalClients > 0
    ? Math.round(stats.activeClients / stats.totalClients * 100)
    : 0

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        refreshControl={<RefreshControl refreshing={statsLoading || apptLoading || fuLoading} onRefresh={refreshAll} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ──────────────────────────────────── */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
            <Text style={styles.greetingSub}>{t('dashboard.title')}</Text>
          </View>
          <View style={styles.quickRow}>
            <QuickCard icon="👤" label={t('dashboard.new_client')}        onPress={() => router.push('/(app)/clients/new')} />
            <QuickCard icon="📅" label={t('dashboard.quick_appointment')} onPress={() => router.push('/(app)/appointments')} />
          </View>
        </View>

        {/* ── Demo: bannière "actif" — toujours visible si démo active (pour pouvoir la désactiver) */}
        {showDemoActive && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>🧪 {t('dashboard.demo_active')}</Text>
            <TouchableOpacity onPress={handleDeleteDemo} disabled={demoLoading} activeOpacity={0.7}>
              {demoLoading
                ? <ActivityIndicator size="small" color={colors.textSecondary} />
                : <Text style={styles.demoBannerDelete}>{t('dashboard.demo_delete')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Reste du UI démo — masqué si hideDemoCard et aucune démo active */}
        {!hideDemoCard && !showDemoActive && (
          <>
            {showLoadDemo && (
              <View style={styles.demoCard}>
                <View style={styles.demoCardLeft}>
                  <Text style={styles.demoCardTitle}>{t('dashboard.demo_title')}</Text>
                  <Text style={styles.demoCardSub}>{t('dashboard.demo_subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.demoLoadBtn}
                  onPress={handleLoadDemo}
                  activeOpacity={0.8}
                  disabled={demoLoading}
                >
                  {demoLoading
                    ? <ActivityIndicator size="small" color="#ffffff" />
                    : <Text style={styles.demoLoadBtnText}>{t('dashboard.demo_load')}</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {showDemoLink && (
              <TouchableOpacity style={styles.demoLink} onPress={handleLoadDemo} disabled={demoLoading} activeOpacity={0.7}>
                {demoLoading
                  ? <ActivityIndicator size="small" color={colors.textSecondary} />
                  : <Text style={styles.demoLinkText}>🧪 {t('dashboard.demo_load')}</Text>
                }
              </TouchableOpacity>
            )}

            {demoFailed ? <Text style={styles.demoErrorText}>{t('common.error')}</Text> : null}
          </>
        )}

        {/* ── KPI grid (2×2 mobile / 4-col wide) ──────── */}
        <View style={[styles.kpiGrid, isWide && styles.kpiGridWide]}>
          <KpiCard wide={isWide}
            icon="👥" value={stats.totalClients}
            label={t('dashboard.stats.total_clients')}
            delta={t('dashboard.kpi.new_month', { count: stats.newThisMonth })}
            accent={colors.primary} bg={colors.primaryLight}
            onPress={() => router.push('/(app)/clients')}
          />
          <KpiCard wide={isWide}
            icon="📅" value={stats.appointmentsThisMonth}
            label={t('dashboard.stats.sessions')}
            delta={t('dashboard.kpi.sessions_since')}
            accent={colors.primary} bg={colors.primaryLight}
          />
          <KpiCard wide={isWide}
            icon="⚠️" value={stats.pendingFollowups}
            label={t('dashboard.stats.pending_followups')}
            delta={overdueToday.length > 0
              ? `${overdueToday.length} ${t('dashboard.kpi.overdue')}`
              : t('dashboard.kpi.active_pct', { pct: activePct })}
            accent={overdueToday.length > 0 ? colors.danger : colors.primary}
            bg={overdueToday.length > 0 ? colors.dangerLight : colors.primaryLight}
            onPress={() => router.push('/(app)/followups')}
          />
          <KpiCard wide={isWide}
            icon="✨" value={lrpClients.length}
            label={t('dashboard.next_lrp')}
            delta={t('dashboard.kpi.lrp_delta')}
            accent={colors.secondary} bg={colors.secondaryLight}
          />
        </View>

        <View style={isWide ? styles.twoCol : styles.oneCol}>
          {/* ── Left column ─────────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>
            {shownAppts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('dashboard.today_agenda')}
                  sub={showingToday
                    ? `${todayAppts.length} RDV`
                    : t('dashboard.next_appointments')}
                  onMore={() => router.push('/(app)/appointments')}
                />
                <View style={styles.listCard}>
                  {shownAppts.map((a, i) => (
                    <View key={a.id}>
                      <ApptRow appt={a} isToday={showingToday} />
                      {i < shownAppts.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ── Right column ────────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>
            {overdueToday.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('dashboard.urgent_followups')}
                  sub={t('dashboard.priority')}
                  onMore={() => router.push('/(app)/followups')}
                />
                <View style={styles.listCard}>
                  {overdueToday.slice(0, 4).map((f, i) => (
                    <View key={f.id}>
                      <FollowupCard f={f} />
                      {i < Math.min(overdueToday.length, 4) - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {lrpClients.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={t('dashboard.next_lrp')} />
                <View style={styles.listCard}>
                  {lrpClients.map((c, i) => (
                    <View key={c.id}>
                      <LrpCard client={c} />
                      {i < lrpClients.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Free day ────────────────────────────────────── */}
        {shownAppts.length === 0 && overdueToday.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayEmoji}>✨</Text>
            <Text style={styles.emptyDayTitle}>{t('dashboard.free_day')}</Text>
            <Text style={styles.emptyDaySub}>{t('dashboard.free_day_sub')}</Text>
          </View>
        )}
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 64, gap: 22 },
  contentWide: { paddingHorizontal: 28, paddingTop: 24, gap: 28 },

  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  greeting:    { fontSize: 22, fontFamily: fonts.display, color: colors.primary },
  greetingSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary, marginTop: 2 },
  quickRow:    { flexDirection: 'row', gap: 8, flexShrink: 0 },
  quickCard:   { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 4, minWidth: 70 },
  quickCardIcon:  { fontSize: 18 },
  quickCardLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.textInverse, textAlign: 'center' },

  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiGridWide:   { flexWrap: 'nowrap' },
  kpiCard:       { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  kpiCardMobile: { width: '47.5%' },
  kpiCardWide:   { flex: 1 },
  kpiTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiLabel:    { fontSize: 10, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1, paddingRight: 4 },
  kpiIconBox:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiIconText: { fontSize: 16 },
  kpiValue:    { fontSize: 36, fontFamily: fonts.display, lineHeight: 42, letterSpacing: -1 },
  kpiDelta:    { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary },

  oneCol:  { gap: 22 },
  twoCol:  { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  col:     { flex: 1, gap: 20 },
  section: { gap: 12 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle:  { fontSize: 20, fontFamily: fonts.display, color: colors.text },
  sectionSub:    { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary, marginTop: 1 },
  sectionMore:   { fontSize: 13, fontFamily: fonts.medium, color: colors.primary, paddingTop: 4 },

  listCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  divider:  { height: 1, backgroundColor: colors.border, marginLeft: 16 },

  apptRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  apptTimeCol:  { width: 48, flexShrink: 0, alignItems: 'flex-start' },
  apptTimeMain: { fontSize: 18, fontFamily: fonts.display, color: colors.primary, lineHeight: 22 },
  apptTimeSub:  { fontSize: 10, fontFamily: fonts.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },
  apptInfo:     { flex: 1 },
  apptName:     { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  apptType:     { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },
  statusBadge:    { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  confirmedBadge: { backgroundColor: colors.successLight },
  pendingBadge:   { backgroundColor: colors.secondaryLight },
  statusText:     { fontSize: 11, fontFamily: fonts.medium },
  confirmedText:  { color: colors.success },
  pendingText:    { color: colors.secondary },

  followupRow:   { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  followupDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  followupInfo:  { flex: 1 },
  followupName:  { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  followupTask:  { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },
  followupDue:   { fontSize: 11, fontFamily: fonts.medium, marginTop: 4 },

  emptyDay:      { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: colors.card, borderRadius: 16 },
  emptyDayEmoji: { fontSize: 40 },
  emptyDayTitle: { fontSize: 20, fontFamily: fonts.display, color: colors.primary },
  emptyDaySub:   { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  demoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryLighter,
  },
  demoCardLeft:    { flex: 1, gap: 3 },
  demoCardTitle:   { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },
  demoCardSub:     { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 17 },
  demoLoadBtn:     { backgroundColor: colors.primaryAction, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  demoLoadBtnText: { fontSize: 13, fontFamily: fonts.semibold, color: '#ffffff' },

  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoBannerText:   { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  demoBannerDelete: { fontSize: 13, fontFamily: fonts.medium, color: colors.danger },

  demoLink:      { alignSelf: 'flex-start', paddingVertical: 4 },
  demoLinkText:  { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  demoErrorText: { fontSize: 13, fontFamily: fonts.medium, color: colors.danger },
  })
}
