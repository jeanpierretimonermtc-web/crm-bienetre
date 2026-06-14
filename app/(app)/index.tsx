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

// ── Quick card (large dark green CTA) ─────────────────────────────────────────
function QuickCard({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.quickCardIcon}>{icon}</Text>
      <Text style={styles.quickCardLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Section header (serif title + Tout voir) ──────────────────────────────────
function SectionHeader({ title, onMore }: { title: string; onMore?: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onMore && (
        <TouchableOpacity onPress={onMore}>
          <Text style={styles.sectionMore}>{t('dashboard.see_all')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Appointment card ───────────────────────────────────────────────────────────
function ApptCard({ appt }: { appt: AppointmentWithClient }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const date = new Date(appt.appointment_date)
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  // Use first line of themes as session type, fall back to appointment number
  const type = appt.themes_discussed?.split(/\n/)[0]?.trim()
    || t('appointments.number', { number: appt.appointment_number })
  const confirmed = appt.recap_sent

  return (
    <TouchableOpacity
      style={styles.apptCard}
      onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments`)}
      activeOpacity={0.75}
    >
      <Avatar name={appt.client?.full_name ?? '?'} size={44} />
      <View style={styles.apptInfo}>
        <Text style={styles.apptName}>{appt.client?.full_name}</Text>
        <Text style={styles.apptMeta}>{time} · {type}</Text>
      </View>
      <View style={[styles.statusBadge, confirmed ? styles.confirmedBadge : styles.pendingBadge]}>
        <Text style={[styles.statusText, confirmed ? styles.confirmedText : styles.pendingText]}>
          {confirmed ? t('dashboard.confirmed') : t('dashboard.pending_appt')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Followup urgent card ───────────────────────────────────────────────────────
function FollowupCard({ f }: { f: FollowupWithClient }) {
  const { t } = useTranslation()
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
      style={styles.followupCard}
      onPress={() => router.push(`/(app)/clients/${f.client_id}/followups`)}
      activeOpacity={0.75}
    >
      <View style={[styles.followupDot, { backgroundColor: urgent ? colors.dangerLight : colors.secondaryLight }]}>
        <Text style={styles.followupDotText}>{urgent ? '!' : '▲'}</Text>
      </View>
      <View style={styles.followupInfo}>
        <Text style={styles.followupName}>{f.client?.full_name}</Text>
        <Text style={styles.followupContent} numberOfLines={1}>{f.title ?? f.content}</Text>
      </View>
      <View style={[styles.fuBadge, { backgroundColor: urgent ? colors.dangerLight : colors.secondaryLight }]}>
        <Text style={[styles.fuBadgeText, { color: urgent ? colors.danger : colors.secondary }]}>
          {badgeText}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── LRP card ──────────────────────────────────────────────────────────────────
function LrpCard({ client }: { client: Client }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const daysUntil = client.next_lrp_date
    ? Math.ceil((new Date(client.next_lrp_date).getTime() - Date.now()) / 86400000)
    : null
  const urgent = daysUntil !== null && daysUntil <= 7

  return (
    <TouchableOpacity style={styles.apptCard} onPress={() => router.push(`/(app)/clients/${client.id}`)} activeOpacity={0.75}>
      <Avatar name={client.full_name} size={44} />
      <View style={styles.apptInfo}>
        <Text style={styles.apptName}>{client.full_name}</Text>
        <Text style={styles.apptMeta}>
          {client.next_lrp_date && new Date(client.next_lrp_date).toLocaleDateString(locale, { day: '2-digit', month: 'long' })}
        </Text>
      </View>
      {daysUntil !== null && (
        <View style={[styles.statusBadge, { backgroundColor: urgent ? colors.dangerLight : colors.primaryLight }]}>
          <Text style={[styles.statusText, { color: urgent ? colors.danger : colors.primary }]}>
            {daysUntil <= 0 ? t('dashboard.lrp_today') : t('dashboard.lrp_days', { days: daysUntil })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t } = useTranslation()
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
  // Shown appointments: prefer today, fall back to upcoming
  const shownAppts = todayAppts.length > 0 ? todayAppts : upcomingAppts

  function refreshAll() { refreshStats(); refreshAppts(); refreshFu(); refreshLrp() }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        refreshControl={<RefreshControl refreshing={statsLoading || apptLoading || fuLoading} onRefresh={refreshAll} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ─────────────────────────────────── */}
        <Text style={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>

        {/* ── Quick action cards ────────────────────────── */}
        <View style={styles.quickRow}>
          <QuickCard icon="👤" label={t('dashboard.new_client')}         onPress={() => router.push('/(app)/clients/new')} />
          <QuickCard icon="📅" label={t('dashboard.quick_appointment')}  onPress={() => router.push('/(app)/appointments')} />
        </View>

        {/* ── KPI strip ─────────────────────────────────── */}
        <TouchableOpacity style={styles.kpiStrip} onPress={() => router.push('/(app)/clients')} activeOpacity={0.85}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('dashboard.stats.total_clients').toUpperCase()}</Text>
            <Text style={styles.kpiValue}>{stats.totalClients}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('dashboard.stats.this_month').toUpperCase()}</Text>
            <Text style={styles.kpiValue}>{stats.newThisMonth}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <TouchableOpacity style={styles.kpiItem} onPress={() => router.push('/(app)/followups')}>
            <Text style={styles.kpiLabel}>{t('dashboard.stats.pending_followups').toUpperCase()}</Text>
            <Text style={[styles.kpiValue, overdueToday.length > 0 && { color: colors.danger }]}>
              {stats.pendingFollowups}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={isWide ? styles.twoCol : styles.oneCol}>
          {/* ── Left column ─────────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>

            {/* Agenda du jour */}
            {shownAppts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('dashboard.today_agenda')}
                  onMore={() => router.push('/(app)/appointments')}
                />
                <View style={styles.cardList}>
                  {shownAppts.map(a => <ApptCard key={a.id} appt={a} />)}
                </View>
              </View>
            )}

          </View>

          {/* ── Right column ────────────────────────────── */}
          <View style={isWide ? styles.col : undefined}>

            {/* Relances urgentes */}
            {overdueToday.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title={t('dashboard.urgent_followups')}
                  onMore={() => router.push('/(app)/followups')}
                />
                <View style={styles.cardList}>
                  {overdueToday.slice(0, 4).map(f => <FollowupCard key={f.id} f={f} />)}
                </View>
              </View>
            )}

            {/* LRP */}
            {lrpClients.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title={t('dashboard.next_lrp')} />
                <View style={styles.cardList}>
                  {lrpClients.map(c => <LrpCard key={c.id} client={c} />)}
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

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 64, gap: 20 },
  contentWide: { paddingHorizontal: 28, paddingTop: 24, gap: 24 },

  // ── Greeting ──────────────────────────────────────────────────────────────
  greeting: { fontSize: 24, fontFamily: fonts.display, color: colors.primary },

  // ── Quick cards ───────────────────────────────────────────────────────────
  quickRow:       { flexDirection: 'row', gap: 12 },
  quickCard:      { flex: 1, backgroundColor: colors.primary, borderRadius: 16, paddingTop: 20, paddingBottom: 16, paddingHorizontal: 16, gap: 10 },
  quickCardIcon:  { fontSize: 26 },
  quickCardLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.textInverse, lineHeight: 18 },

  // ── KPI strip (one card with dividers) ────────────────────────────────────
  kpiStrip:   { backgroundColor: colors.card, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  kpiItem:    { flex: 1, alignItems: 'center', gap: 4 },
  kpiDivider: { width: 1, height: 32, backgroundColor: colors.border },
  kpiLabel:   { fontSize: 9, fontFamily: fonts.bold, color: colors.textSecondary, letterSpacing: 0.5, textAlign: 'center' },
  kpiValue:   { fontSize: 26, fontFamily: fonts.display, color: colors.primary, lineHeight: 32 },

  // ── Layout ────────────────────────────────────────────────────────────────
  oneCol:  { gap: 20 },
  twoCol:  { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  col:     { flex: 1, gap: 20 },
  section: { gap: 12 },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 18, fontFamily: fonts.display, color: colors.text },
  sectionMore:   { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  // ── Card list ─────────────────────────────────────────────────────────────
  cardList: { gap: 8 },

  // ── Appointment / LRP card (shared) ───────────────────────────────────────
  apptCard:       { backgroundColor: colors.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  apptInfo:       { flex: 1 },
  apptName:       { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  apptMeta:       { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 2 },
  statusBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  confirmedBadge: { backgroundColor: colors.successLight },
  pendingBadge:   { backgroundColor: colors.secondaryLight },
  statusText:     { fontSize: 12, fontFamily: fonts.medium },
  confirmedText:  { color: colors.success },
  pendingText:    { color: colors.secondary },

  // ── Followup card ─────────────────────────────────────────────────────────
  followupCard:     { backgroundColor: colors.card, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  followupDot:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  followupDotText:  { fontSize: 15, fontFamily: fonts.bold, color: colors.danger },
  followupInfo:     { flex: 1 },
  followupName:     { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  followupContent:  { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 2 },
  fuBadge:          { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  fuBadgeText:      { fontSize: 11, fontFamily: fonts.bold },

  // ── Empty day ─────────────────────────────────────────────────────────────
  emptyDay:      { alignItems: 'center', paddingVertical: 44, gap: 10, backgroundColor: colors.card, borderRadius: 16 },
  emptyDayEmoji: { fontSize: 40 },
  emptyDayTitle: { fontSize: 18, fontFamily: fonts.display, color: colors.primary },
  emptyDaySub:   { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
})
