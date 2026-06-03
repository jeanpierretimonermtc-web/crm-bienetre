import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { toggleFollowupDone } from '@/features/followups/followupService'
import { Card } from '@/shared/components/ui/Card'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { colors } from '@/shared/theme/colors'
import type { FollowupWithClient } from '@/shared/lib/types'

export default function FollowupsScreen() {
  const { t } = useTranslation()
  const { followups, loading, refresh } = usePendingFollowups()

  const today = new Date().toISOString().split('T')[0]
  const overdue  = followups.filter(f => f.due_date < today)
  const dueToday = followups.filter(f => f.due_date === today)
  const upcoming = followups.filter(f => f.due_date > today)

  async function handleToggle(f: FollowupWithClient) {
    await toggleFollowupDone(f.id, true); refresh()
  }

  function renderSection(label: string, items: FollowupWithClient[], accent: string) {
    if (!items.length) return null
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: accent }]}>{label} ({items.length})</Text>
        {items.map(f => (
          <TouchableOpacity key={f.id} onPress={() => router.push(`/(app)/clients/${f.client_id}/followups`)}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleToggle(f)} style={styles.check}>
                  <Text style={styles.checkText}>⬜</Text>
                </TouchableOpacity>
                <View style={styles.info}>
                  <Text style={styles.clientName}>{f.client?.full_name}</Text>
                  {f.title && <Text style={styles.title}>{f.title}</Text>}
                  <Text style={styles.content} numberOfLines={1}>{f.content}</Text>
                </View>
                <Text style={[styles.date, { color: accent }]}>{new Date(f.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t('followups.title') }} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : followups.length === 0
          ? <EmptyState message={t('followups.none')} icon="✅" />
          : <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={() => (
                <View style={styles.content}>
                  {renderSection(t('followups.overdue'), overdue, colors.danger)}
                  {renderSection(t('followups.today'), dueToday, colors.warning)}
                  {renderSection(t('followups.upcoming'), upcoming, colors.primary)}
                </View>
              )}
              onRefresh={refresh}
              refreshing={loading}
            />
        }
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { padding: 12, gap: 4 },
  loader:      { marginTop: 40 },
  section:     { marginBottom: 16, gap: 6 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card:        { marginBottom: 6 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  check:       { paddingTop: 1 },
  checkText:   { fontSize: 20 },
  info:        { flex: 1, gap: 2 },
  clientName:  { fontSize: 14, fontWeight: '600', color: colors.text },
  title:       { fontSize: 13, fontWeight: '500', color: colors.text },
  content:     { fontSize: 13, color: colors.textSecondary },
  date:        { fontSize: 13, fontWeight: '600' },
})
