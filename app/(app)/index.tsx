import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboardStats, useUpcomingLrp } from '@/features/dashboard/useDashboard'
import { useUpcomingAppointments } from '@/features/appointments/useAppointments'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { Avatar } from '@/shared/components/ui/Avatar'
import { colors } from '@/shared/theme/colors'
import type { AppointmentWithClient, FollowupWithClient, Client } from '@/shared/lib/types'

function useLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'fr' ? 'fr-FR' : 'en-US'
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, value, label, sub, accent, onPress }: {
  icon: string; value: number; label: string; sub?: string; accent: string; onPress?: () => void
}) {
  return (
    <TouchableOpacity style={[styles.kpiCard, { borderTopColor: accent }]} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <View style={[styles.kpiIcon, { backgroundColor: accent + '18' }]}>
        <Text style={styles.kpiIconText}>{icon}</Text>
      </View>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </TouchableOpacity>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, onPress, accent }: { icon: string; label: string; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity style={[styles.qaBtn, { borderColor: accent + '40' }]} onPress={onPress} activeOpacity={0.75}>
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
        <Text style={[styles.sectionTitle, { color: accent }]}>{title}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {onMore && <TouchableOpacity onPress={onMore}><Text style={styles.seeAll}>{t('dashboard.see_all')} →</Text></TouchableOpacity>}
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
        <View style={[styles.daysChip, urgent && styles.daysChipUrgent]}>
          <Text style={[styles.daysText, urgent && styles.daysTextUrgent]}>
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
          <View>
            <Text style={styles.heroGreeting}>{greeting}{firstName ? `, ${firstName}` : ''} 👋</Text>
            <Text style={styles.heroDate}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
          </View>
          <View style={styles.quickActions}>
            <QuickAction icon="+" label={t('dashboard.quick_client')}      accent={colors.primary} onPress={() => router.push('/(app)/clients/new')} />
            <QuickAction icon="📅" label={t('dashboard.quick_appointment')} accent={colors.success} onPress={() => router.push('/(app)/appointments')} />
            <QuickAction icon="🔔" label={t('dashboard.quick_followup')}   accent={colors.warning} onPress={() => router.push('/(app)/followups')} />
          </View>
        </View>

        {/* ── KPIs ─────────────────────────────────────── */}
        <View style={[styles.kpiRow, isWide && styles.kpiRowWide]}>
          <KpiCard icon="👥" value={stats.totalClients}     label={t('dashboard.stats.total_clients')}    accent={colors.primary} onPress={() => router.push('/(app)/clients')} />
          <KpiCard icon="✅" value={stats.activeClients}    label={t('dashboard.stats.active_clients')}   accent={colors.success} sub={`${stats.totalClients > 0 ? Math.round(stats.activeClients / stats.totalClients * 100) : 0}%`} />
          <KpiCard icon="🆕" value={stats.newThisMonth}     label={t('dashboard.stats.this_month')}       accent={colors.warning} />
          <KpiCard icon="🔔" value={stats.pendingFollowups} label={t('dashboard.stats.pending_followups')} accent={overdueToday.length > 0 ? colors.danger : colors.textSecondary} onPress={() => router.push('/(app)/followups')} />
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
  content:      { padding: 16, gap: 20, paddingBottom: 48 },
  contentWide:  { padding: 24, gap: 24 },

  hero:         { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  heroGreeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroDate:     { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 10 },
  qaBtn:        { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 4 },
  qaIcon:       { fontSize: 18 },
  qaLabel:      { fontSize: 12, fontWeight: '700' },

  kpiRow:     { flexDirection: 'row', gap: 10 },
  kpiRowWide: { gap: 14 },
  kpiCard:    { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 4 },
  kpiIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiIconText:{ fontSize: 18 },
  kpiValue:   { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel:   { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiSub:     { fontSize: 12, color: colors.textTertiary },

  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badge:       { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText:   { fontSize: 11, color: '#fff', fontWeight: '700' },
  seeAll:      { fontSize: 13, color: colors.primary, fontWeight: '500' },

  block: { gap: 0 },

  timeline: { gap: 0 },
  apptItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  apptTimeCol: { alignItems: 'center', width: 44, paddingTop: 8 },
  apptTime:   { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  apptDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  apptLine:   { flex: 1, width: 1, backgroundColor: colors.border, minHeight: 20, marginTop: 2 },
  apptCard:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 10, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  apptInfo:   { flex: 1 },
  apptClient: { fontSize: 14, fontWeight: '600', color: colors.text },
  apptSub:    { fontSize: 12, color: colors.textSecondary },
  recapBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.successLight },
  recapText:  { fontSize: 11, fontWeight: '600', color: colors.success },
  recapPending:{ backgroundColor: colors.warningLight },

  fuList:    { gap: 6 },
  fuItem:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  fuAccent:  { width: 4, alignSelf: 'stretch' },
  fuContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  fuClient:  { fontSize: 14, fontWeight: '600', color: colors.text },
  fuTitle:   { fontSize: 12, color: colors.textSecondary },
  fuMeta:    { paddingRight: 14 },
  fuDate:    { fontSize: 13, fontWeight: '700' },

  lrpList:      { gap: 6 },
  lrpItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 10, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  lrpInfo:      { flex: 1, gap: 2 },
  lrpName:      { fontSize: 14, fontWeight: '600', color: colors.text },
  lrpDate:      { fontSize: 12, color: colors.textSecondary },
  daysChip:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f0f0ff' },
  daysChipUrgent:{ backgroundColor: colors.dangerLight },
  daysText:     { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  daysTextUrgent:{ color: colors.danger },

  emptyDay:      { alignItems: 'center', paddingVertical: 40, gap: 8, backgroundColor: colors.card, borderRadius: 16 },
  emptyDayEmoji: { fontSize: 36 },
  emptyDayTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyDaySub:   { fontSize: 13, color: colors.textSecondary },

  twoCol: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  col:    { flex: 1, gap: 20 },
})
