import { useState, useEffect } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useClients, useClientSearch } from '@/features/clients/useClients'
import { Avatar } from '@/shared/components/ui/Avatar'
import { StatusBadge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { colors } from '@/shared/theme/colors'
import type { Client, ClientStatus } from '@/shared/lib/types'

const STATUS_FILTERS: (ClientStatus | 'all')[] = ['all', 'prospect', 'active', 'vip', 'advisor', 'inactive']

export default function ClientsScreen() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const { clients, loading, refresh } = useClients()
  const { results, search } = useClientSearch()

  useEffect(() => {
    if (query.length > 0) search(query, statusFilter === 'all' ? undefined : statusFilter)
  }, [query, statusFilter])

  const displayed: Client[] = query.length > 0
    ? results
    : statusFilter === 'all' ? clients : clients.filter(c => c.status === statusFilter)

  return (
    <>
      <Stack.Screen options={{ title: t('clients.title'), headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/(app)/clients/new')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      )}} />
      <View style={styles.container}>
        <TextInput
          style={styles.search}
          placeholder={t('clients.search')}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.textTertiary}
          clearButtonMode="while-editing"
        />
        <View style={styles.filters}>
          {STATUS_FILTERS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, statusFilter === s && styles.chipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                {s === 'all' ? 'Tous' : t(`clients.status.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : (
            <FlatList
              data={displayed}
              keyExtractor={c => c.id}
              renderItem={({ item }) => <ClientRow client={item} />}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              ListEmptyComponent={<EmptyState message={t('clients.empty')} icon="👥" />}
              contentContainerStyle={displayed.length === 0 && styles.emptyContainer}
              onRefresh={refresh}
              refreshing={loading}
            />
          )
        }
      </View>
    </>
  )
}

function ClientRow({ client }: { client: Client }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => router.push(`/(app)/clients/${client.id}`)}>
      <Avatar name={client.full_name} size={44} />
      <View style={styles.rowContent}>
        <Text style={styles.name}>{client.full_name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[client.phone, client.email].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <StatusBadge status={client.status} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bg },
  search:         { margin: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: colors.card, color: colors.text },
  filters:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 6, marginBottom: 8 },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.card },
  rowContent:     { flex: 1, gap: 3 },
  name:           { fontSize: 16, fontWeight: '600', color: colors.text },
  meta:           { fontSize: 13, color: colors.textSecondary },
  sep:            { height: 1, backgroundColor: colors.border, marginLeft: 70 },
  loader:         { marginTop: 40 },
  emptyContainer: { flex: 1 },
  addBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  addBtnText:     { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '400' },
})
