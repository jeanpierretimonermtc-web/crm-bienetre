import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useUpcomingAppointments } from '@/features/appointments/useAppointments'
import { Card } from '@/shared/components/ui/Card'
import { Avatar } from '@/shared/components/ui/Avatar'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { colors } from '@/shared/theme/colors'
import type { AppointmentWithClient } from '@/shared/lib/types'

export default function AppointmentsScreen() {
  const { t } = useTranslation()
  const { appointments, loading, refresh } = useUpcomingAppointments(50)

  return (
    <>
      <Stack.Screen options={{ title: t('appointments.title') }} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : <FlatList
              data={appointments}
              keyExtractor={a => a.id}
              renderItem={({ item }) => <UpcomingCard appt={item} />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={appointments.length === 0 ? styles.empty : styles.list}
              ListEmptyComponent={<EmptyState message={t('appointments.empty')} icon="📅" />}
              onRefresh={refresh}
              refreshing={loading}
            />
        }
      </View>
    </>
  )
}

function UpcomingCard({ appt }: { appt: AppointmentWithClient }) {
  const { t } = useTranslation()
  const date = new Date(appt.appointment_date)
  const isToday = date.toDateString() === new Date().toDateString()
  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString()
  const label = isToday ? "Aujourd'hui" : isTomorrow ? 'Demain' : date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <TouchableOpacity onPress={() => router.push(`/(app)/clients/${appt.client_id}/appointments`)}>
      <Card>
        <View style={styles.row}>
          <View style={[styles.datePill, isToday && styles.datePillToday]}>
            <Text style={[styles.dateLabel, isToday && styles.dateLabelToday]}>{label}</Text>
          </View>
          <Avatar name={appt.client?.full_name ?? '?'} size={36} />
          <View style={styles.info}>
            <Text style={styles.clientName}>{appt.client?.full_name}</Text>
            <Text style={styles.apptNum}>{t('appointments.number', { number: appt.appointment_number })}</Text>
          </View>
          {appt.recap_sent && <Text style={{ fontSize: 16 }}>✉️</Text>}
        </View>
        {appt.themes_discussed && (
          <Text style={styles.themes} numberOfLines={1}>{appt.themes_discussed}</Text>
        )}
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  list:            { padding: 12, gap: 8 },
  empty:           { flex: 1 },
  loader:          { marginTop: 40 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.bg },
  datePillToday:   { backgroundColor: colors.primaryLight },
  dateLabel:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  dateLabelToday:  { color: colors.primary },
  info:            { flex: 1, gap: 2 },
  clientName:      { fontSize: 15, fontWeight: '600', color: colors.text },
  apptNum:         { fontSize: 12, color: colors.textSecondary },
  themes:          { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
})
