import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDashboardStats, useUpcomingLrp } from '@/features/dashboard/useDashboard'
import { useUpcomingAppointments } from '@/features/appointments/useAppointments'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { Card } from '@/shared/components/ui/Card'
import { Avatar } from '@/shared/components/ui/Avatar'
import { colors } from '@/shared/theme/colors'
import type { AppointmentWithClient, FollowupWithClient, Client } from '@/shared/lib/types'

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card style={styles.statCard} padding={14}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  )
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>}
    </View>
  )
}

export default function DashboardScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { stats, loading: statsLoading, refresh: refreshStats } = useDashboardStats()
  const { appointments, loading: apptLoading, refresh: refreshAppts } = useUpcomingAppointments(5)
  const { followups, loading: fuLoading, refresh: refreshFu } = usePendingFollowups()
  const { clients: lrpClients, refresh: refreshLrp } = useUpcomingLrp(3)

  const hour = new Date().getHours()
  const greeting = hour < 13 ? t('dashboard.greeting_morning') : t('dashboard.greeting_afternoon')
  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? ''

  const todayStr = new Date().toISOString().split('T')[0]
  const overdueFollowups = followups.filter(f => f.due_date <= todayStr).slice(0, 5)
  const todayAppts = appointments.filter(a => a.appointment_date.startsWith(todayStr))
  const upcomingAppts = appointments.filter(a => !a.appointment_date.startsWith(todayStr))

  function refreshAll() { refreshStats(); refreshAppts(); refreshFu(); refreshLrp() }
  const refreshing = statsLoading || apptLoading || fuLoading

  return (
    <>
      <Stack.Screen options={{ title: t('dashboard.title'), headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{greeting}{firstName ? `, ${firstName}` : ''} 👋</Text>
          <Text style={styles.greetingDate}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={stats.totalClients}    label={t('dashboard.stats.total_clients')}   color={colors.primary} />
          <StatCard value={stats.activeClients}   label={t('dashboard.stats.active_clients')}  color={colors.success} />
          <StatCard value={stats.newThisMonth}    label={t('dashboard.stats.this_month')}      color={colors.warning} />
          <StatCard value={stats.pendingFollowups} label={t('dashboard.stats.pending_followups')} color={colors.danger} />
        </View>

        {/* RDV aujourd'hui */}
        {todayAppts.length > 0 && (
          <View>
            <SectionHeader title="RDV aujourd'hui" onSeeAll={() => router.push('/(app)/appointments')} />
            {todayAppts.map(a => <ApptRow key={a.id} appt={a} />)}
          </View>
        )}

        {/* Relances dues */}
        {overdueFollowups.length > 0 && (
          <View>
            <SectionHeader title={`${t('followups.title')} dues (${overdueFollowups.length})`} onSeeAll={() => router.push('/(app)/followups')} />
            {overdueFollowups.map(f => <FollowupRow key={f.id} followup={f} />)}
          </View>
        )}

        {/* Prochains RDV */}
        {upcomingAppts.length > 0 && (
          <View>
            <SectionHeader title={t('dashboard.upcoming_rdv')} onSeeAll={() => router.push('/(app)/appointments')} />
            {upcomingAppts.slice(0, 3).map(a => <ApptRow key={a.id} appt={a} />)}
          </View>
        )}

        {/* LRP */}
        {lrpClients.length > 0 && (
          <View>
            <SectionHeader title={t('dashboard.upcoming_lrp')} />
            {lrpClients.map(c => <LrpRow key={c.id} client={c} />)}
          </View>
        )}

        {todayAppts.length === 0 && overdueFollowups.length === 0 && upcomingAppts.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayIcon}>✨</Text>
            <Text style={styles.emptyDayText}>{t('dashboard.no_tasks')}</Text>
          </View>
        )}
      </ScrollView>
    </>
  )
}

function ApptRow({ appt }: { appt: AppointmentWithClient }) {
  const { t } = useTranslation()
  const date = new Date(appt.appointment_date)
  const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
  return (
    <TouchableOpacity onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments`)}>
      <Card style={styles.rowCard}>
        <Avatar name={appt.client?.full_name ?? '?'} size={36} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{appt.client?.full_name}</Text>
          <Text style={styles.rowSub}>{t('appointments.number', { number: appt.appointment_number })} · {dateLabel}</Text>
        </View>
        {appt.recap_sent && <Text style={{ fontSize: 14 }}>✉️</Text>}
      </Card>
    </TouchableOpacity>
  )
}

function FollowupRow({ followup }: { followup: FollowupWithClient }) {
  const isOverdue = followup.due_date < new Date().toISOString().split('T')[0]
  return (
    <TouchableOpacity onPress={() => router.push(`/(app)/clients/${followup.client_id}/followups`)}>
      <Card style={styles.rowCard}>
        <Text style={{ fontSize: 18 }}>🔔</Text>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{followup.client?.full_name}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{followup.title ?? followup.content}</Text>
        </View>
        <Text style={[styles.rowDate, isOverdue && { color: colors.danger }]}>
          {new Date(followup.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </Text>
      </Card>
    </TouchableOpacity>
  )
}

function LrpRow({ client }: { client: Client }) {
  return (
    <TouchableOpacity onPress={() => router.push(`/(app)/clients/${client.id}`)}>
      <Card style={styles.rowCard}>
        <Avatar name={client.full_name} size={36} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{client.full_name}</Text>
          {client.next_lrp_date && (
            <Text style={styles.rowSub}>LRP : {new Date(client.next_lrp_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg },
  content:       { padding: 16, gap: 16, paddingBottom: 40 },
  greeting:      { paddingTop: 8, gap: 4 },
  greetingText:  { fontSize: 22, fontWeight: '700', color: colors.text },
  greetingDate:  { fontSize: 14, color: colors.textSecondary, textTransform: 'capitalize' },
  statsRow:      { flexDirection: 'row', gap: 8 },
  statCard:      { flex: 1, alignItems: 'center', gap: 4 },
  statValue:     { fontSize: 22, fontWeight: '800' },
  statLabel:     { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: colors.text },
  seeAll:        { fontSize: 14, color: colors.primary },
  rowCard:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rowInfo:       { flex: 1, gap: 2 },
  rowTitle:      { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub:        { fontSize: 13, color: colors.textSecondary },
  rowDate:       { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  emptyDay:      { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyDayIcon:  { fontSize: 40 },
  emptyDayText:  { fontSize: 16, color: colors.textSecondary },
})
