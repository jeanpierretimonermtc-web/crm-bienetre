import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboardStats, useUpcomingLrp } from '@/features/dashboard/useDashboard'
import { useUpcomingAppointments } from '@/features/appointments/useAppointments'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { Avatar } from '@/shared/components/ui/Avatar'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { AppointmentWithClient, FollowupWithClient, Client } from '@/shared/lib/types'

function useLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'fr' ? 'fr-FR' : 'en-US'
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ value, label, sub, accent, onPress }: {
  value: number; label: string; sub?: string; accent: string; onPress?: () => void
}) {
  return (
    <TouchableOpacity style={[styles.kpiCard, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={[styles.kpiSub, { color: accent }]}>{sub}</Text> : null}
    </TouchableOpacity>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, onPress, accent, bg }: { icon: string; label: string; onPress: () => void; accent: string; bg: string }) {
  return (
    <TouchableOpacity style={[styles.qaBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.qaIcon}>{icon}</Text>
      <Text style={[styles.qaLabel, { color: accent }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────
function Section({ title, badge, accent = colors.textSecondary, onMore }: {
  title: string; badge?: number; accent?: string; onMore?: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {onMore && <TouchableOpacity onPress={onMore}><Text style={[styles.seeAll, { color: accent }]}>{t('dashboard.see_all')}</Text></TouchableOpacity>}
    </View>
  )
}

// ─── Appointment item ─────────────────────────────────────────────────────────
function ApptItem({ appt, isToday }: { appt: AppointmentWithClient; isToday: boolean }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const date = new Date(appt.appointment_date)
  const dateStr = isToday
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <TouchableOpacity style={styles.apptItem} onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments`)} activeOpacity={0.75}>
      <View style={styles.apptTimeCol}>
        <Text style={styles.apptTime}>{dateStr}</Text>
        <View style={styles.apptDot} />
        <View style={styles.apptLine} />
      </View>
      <View style={styles.apptCard}>
        <Avatar name={appt.client?.full_name ?? '?'} size={32} />
        <View style={styles.apptInfo}>
          <Text style={styles.apptClient}>{appt.client?.full_name}</Text>
          <Text style={styles.apptSub}>{t('appointments.number', { number: appt.appointment_number })}</Text>
        </View>
        {appt.recap_sent
          ? <View style={styles.recapBadge}><Text style={styles.recapText}>✉ {t('dashboard.recap_sent')}</Text></View>
          : <View style={[styles.recapBadge, styles.recapPending]}><Text style={[styles.recapText, { color: colors.warning }]}>{t('dashboard.recap_pending')}</Text></View>
        }
      </View>
    </TouchableOpacity>
  )
}

// ─── Followup item ─────────────────────────────────────────────────────────────
function FollowupItem({ f }: { f: FollowupWithClient }) {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = f.due_date < today
  const daysLate = isOverdue
    ? Math.ceil((new Date(today).getTime() - new Date(f.due_date).getTime()) / 86400000)
    : 0

  return (
    <TouchableOpacity style={styles.fuItem} onPress={() => router.push(`/(app)/clients/${f.client_id}/followups`)} activeOpacity={0.75}>
      <View style={[styles.fuAccent, { backgroundColor: isOverdue ? colors.danger : colors.warning }]} />
      <View style={styles.fuContent}>
        <Text style={styles.fuClient}>{f.client?.full_name}</Text>
        <Text style={styles.fuTitle} numberOfLines={1}>{f.title ?? f.content}</Text>
      </View>
      <View style={styles.fuMeta}>
        {isOverdue
          ? <Text style={[styles.fuDate, { color: colors.danger }]}>+{daysLate}j</Text>
          : <Text style={[styles.fuDate, { color: colors.warning }]}>{t('dashboard.followup_today')}</Text>
        }
      </View>
    </TouchableOpacity>
  )
}

// ─── LRP item ─────────────────────────────────────────────────────────────────
function LrpItem({ client }: { client: Client }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const daysUntil = client.next_lrp_date
    ? Math.ceil((new Date(client.next_lrp_date).getTime() - Date.now()) / 86400000)
    : null
  const urgent = daysUntil !== null && daysUntil <= 7

  return (
    <TouchableOpacity style={styles.lrpItem} onPress={() => router.push(`/(app)/clients/${client.id}`)} activeOpacity={0.75}>
      <Avatar name={client.full_name} size={36} />
      <View style={styles.lrpInfo}>
        <Text style={styles.lrpName}>{client.full_name}</Text>
        <Text style={styles.lrpDate}>{client.next_lrp_date && new Date(client.next_lrp_date).toLocaleDateString(locale, { day: '2-digit', month: 'long' })}</Text>
      </View>
      {daysUntil !== null && (
        <View style={[styles.daysChip, { backgroundColor: urgent ? colors.dangerLight : colors.primaryLight }]}>
          <Text style={[styles.daysText, { color: urgent ? colors.danger : colors.primary }]}>
            {daysUntil <= 0 ? t('dashboard.lrp_today') : t('dashboard.lrp_days', { days: daysUntil })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation()
  const locale = useLocale()
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

  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppts    = appointments.filter(a => a.appointment_date.startsWith(todayStr))
  const upcomingAppts = appointments.filter(a => !a.appointment_date.startsWith(todayStr)).slice(0, 4)
  const overdueToday  = followups.filter(f => f.due_date <= todayStr)

  function refreshAll() { refreshStats(); refreshAppts(); refreshFu(); refreshLrp() }

  const dateStr = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        refreshControl={<RefreshControl refreshing={statsLoading || apptLoading || fuLoading} onRefresh={refreshAll} tintColor={colors.primary} />}
      >
        {/* ── Hero ─────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroDate}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
            <Text style={styles.heroGreeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
          </View>
          <View style={styles.quickActions}>
            <QuickAction icon="👤" label={t('dashboard.quick_client')}      accent={colors.primary}   bg={colors.primaryLight}   onPress={() => router.push('/(app)/clients/new')} />
            <QuickAction icon="📅" label={t('dashboard.quick_appointment')} accent={colors.secondary} bg={colors.secondaryLight} onPress={() => router.push('/(app)/appointments')} />
            <QuickAction icon="🔔" label={t('dashboard.quick_followup')}   accent={colors.secondary} bg={colors.secondaryLight} onPress={() => router.push('/(app)/followups')} />
          </View>
        </View>

        {/* ── KPIs ─────────────────────────────────────── */}
        <View style={[styles.kpiRow, isWide && styles.kpiRowWide]}>
          <KpiCard value={stats.totalClients}     label={t('dashboard.stats.total_clients')}     accent={colors.primary}                                                       onPress={() => router.push('/(app)/clients')} />
          <KpiCard value={stats.activeClients}    label={t('dashboard.stats.active_clients')}    accent={colors.primary} sub={`${stats.totalClients > 0 ? Math.round(stats.activeClients / stats.totalClients * 100) : 0}%`} />
          <KpiCard value={stats.newThisMonth}     label={t('dashboard.stats.this_month')}        accent={colors.secondary} />
          <KpiCard value={stats.pendingFollowups} label={t('dashboard.stats.pending_followups')} accent={overdueToday.length > 0 ? colors.danger : colors.textSecondary}       onPress={() => router.push('/(app)/followups')} />
        </View>

        <View style={isWide ? styles.twoCol : undefined}>
          {/* ── Colonne gauche ────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>

            {todayAppts.length > 0 && (
              <View style={styles.block}>
                <Section title={t('dashboard.today_agenda')} badge={todayAppts.length} accent={colors.primary} onMore={() => router.push('/(app)/appointments')} />
                <View style={styles.timeline}>
                  {todayAppts.map(a => <ApptItem key={a.id} appt={a} isToday={true} />)}
                </View>
              </View>
            )}

            {overdueToday.length > 0 && (
              <View style={styles.block}>
                <Section title={t('dashboard.priority')} badge={overdueToday.length} accent={colors.danger} onMore={() => router.push('/(app)/followups')} />
                <View style={styles.fuList}>
                  {overdueToday.slice(0, 4).map(f => <FollowupItem key={f.id} f={f} />)}
                </View>
              </View>
            )}

            {todayAppts.length === 0 && overdueToday.length === 0 && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayEmoji}>✨</Text>
                <Text style={styles.emptyDayTitle}>{t('dashboard.free_day')}</Text>
                <Text style={styles.emptyDaySub}>{t('dashboard.free_day_sub')}</Text>
              </View>
            )}
          </View>

          {/* ── Colonne droite ────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>

            {upcomingAppts.length > 0 && (
              <View style={styles.block}>
                <Section title={t('dashboard.next_appointments')} accent={colors.primary} onMore={() => router.push('/(app)/appointments')} />
                <View style={styles.timeline}>
                  {upcomingAppts.map(a => <ApptItem key={a.id} appt={a} isToday={false} />)}
                </View>
              </View>
            )}

            {lrpClients.length > 0 && (
              <View style={styles.block}>
                <Section title={t('dashboard.next_lrp')} accent="#6366f1" />
                <View style={styles.lrpList}>
                  {lrpClients.map(c => <LrpItem key={c.id} client={c} />)}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  content:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48, gap: 24 },
  contentWide:  { paddingHorizontal: 28, paddingTop: 28, gap: 28 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero:          { gap: 20 },
  heroTextBlock: { gap: 3 },
  heroDate:      { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary, textTransform: 'capitalize' },
  heroGreeting:  { fontSize: 30, fontFamily: fonts.display, color: colors.primary, lineHeight: 38 },
  quickActions:  { flexDirection: 'row', gap: 10 },
  qaBtn:         { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, gap: 6 },
  qaIcon:        { fontSize: 20 },
  qaLabel:       { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.2 },

  // ── KPIs ──────────────────────────────────────────────────────────────────
  kpiRow:     { flexDirection: 'row', gap: 8 },
  kpiRowWide: { gap: 12 },
  kpiCard:    { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderLeftWidth: 3, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2, gap: 3 },
  kpiValue:   { fontSize: 28, fontFamily: fonts.display, lineHeight: 34, letterSpacing: -0.5 },
  kpiLabel:   { fontSize: 10, fontFamily: fonts.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub:     { fontSize: 11, fontFamily: fonts.bold, opacity: 0.6 },

  // ── Section header ────────────────────────────────────────────────────────
  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle:  { fontSize: 13, fontFamily: fonts.bold, color: colors.text, textTransform: 'uppercase', letterSpacing: 0.7 },
  badge:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText:     { fontSize: 11, color: '#fff', fontFamily: fonts.bold },
  seeAll:        { fontSize: 12, fontFamily: fonts.medium },

  block: { gap: 0 },

  // ── Appointments timeline ─────────────────────────────────────────────────
  timeline:    { gap: 0 },
  apptItem:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  apptTimeCol: { alignItems: 'center', width: 48, paddingTop: 10 },
  apptTime:    { fontSize: 11, fontFamily: fonts.bold, color: colors.primary, textAlign: 'center' },
  apptDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5, borderWidth: 2, borderColor: colors.primaryLight },
  apptLine:    { flex: 1, width: 1, backgroundColor: colors.border, minHeight: 24, marginTop: 2 },
  apptCard:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  apptInfo:    { flex: 1 },
  apptClient:  { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  apptSub:     { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  recapBadge:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.successLight },
  recapText:   { fontSize: 10, fontFamily: fonts.bold, color: colors.success },
  recapPending:{ backgroundColor: colors.secondaryLight },

  // ── Follow-ups ────────────────────────────────────────────────────────────
  fuList:    { gap: 6 },
  fuItem:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  fuAccent:  { width: 4, alignSelf: 'stretch' },
  fuContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  fuClient:  { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  fuTitle:   { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  fuMeta:    { paddingRight: 14 },
  fuDate:    { fontSize: 13, fontFamily: fonts.bold },

  // ── LRP ───────────────────────────────────────────────────────────────────
  lrpList:  { gap: 6 },
  lrpItem:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  lrpInfo:  { flex: 1, gap: 2 },
  lrpName:  { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  lrpDate:  { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  daysChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  daysText: { fontSize: 12, fontFamily: fonts.bold },

  // ── Empty day ─────────────────────────────────────────────────────────────
  emptyDay:      { alignItems: 'center', paddingVertical: 44, gap: 10, backgroundColor: colors.card, borderRadius: 16 },
  emptyDayEmoji: { fontSize: 40 },
  emptyDayTitle: { fontSize: 18, fontFamily: fonts.display, color: colors.primary },
  emptyDaySub:   { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  twoCol: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  col:    { flex: 1, gap: 24 },
})
