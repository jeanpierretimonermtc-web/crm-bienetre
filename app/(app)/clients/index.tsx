import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack, useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { useClients, useClientSearch } from '@/features/clients/useClients'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { colors, statusColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Client, ClientStatus } from '@/shared/lib/types'

const STATUS_FILTERS: (ClientStatus | 'all')[] = ['all', 'active', 'prospect', 'inactive', 'vip', 'advisor']

function initials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ClientAvatar({ name, status }: { name: string; status: ClientStatus }) {
  const sc = statusColors[status] ?? { bg: colors.surfaceContainerHigh, text: colors.textSecondary }
  return (
    <View style={[styles.avatar, { backgroundColor: sc.bg }]}>
      <Text style={[styles.avatarText, { color: sc.text }]}>{initials(name)}</Text>
    </View>
  )
}

function StatusPill({ status }: { status: ClientStatus }) {
  const { t } = useTranslation()
  const sc = statusColors[status] ?? { bg: colors.surfaceContainerHighest, text: colors.textTertiary }
  return (
    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
      <Text style={[styles.pillText, { color: sc.text }]}>{t(`clients.status.${status}`)}</Text>
    </View>
  )
}

function ClientCard({ client, lastRdv }: { client: Client; lastRdv?: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  const rdvText = lastRdv
    ? `${t('clients.last_rdv')} : ${new Date(lastRdv).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}`
    : t('clients.no_rdv')

  return (
    <View style={styles.card}>
      {/* Top: avatar + name/badge + menu */}
      <View style={styles.cardTop}>
        <ClientAvatar name={client.full_name} status={client.status} />
        <View style={styles.cardTitle}>
          <Text style={styles.cardName}>{client.full_name}</Text>
          <StatusPill status={client.status} />
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => router.push(`/(app)/clients/${client.id}`)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Info rows */}
      {client.email ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>✉</Text>
          <Text style={styles.infoText} numberOfLines={1}>{client.email}</Text>
        </View>
      ) : null}
      {client.phone ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{client.phone}</Text>
        </View>
      ) : null}
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🕐</Text>
        <Text style={[styles.infoText, !lastRdv && styles.infoMuted]}>{rdvText}</Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => router.push(`/(app)/clients/${client.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.btnOutlineText}>{t('clients.view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnFill}
          onPress={() => router.push(`/(app)/clients/${client.id}/appointments`)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnFillText}>{t('clients.add_appt')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ClientsScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const { clients, loading, refresh } = useClients()
  const { results, search } = useClientSearch()
  const [lastRdvMap, setLastRdvMap] = useState<Record<string, string>>({})

  useFocusEffect(useCallback(() => { refresh() }, []))

  useEffect(() => {
    if (query.length > 0) search(query, statusFilter === 'all' ? undefined : statusFilter)
  }, [query, statusFilter])

  // Single query: most-recent appointment per client
  useEffect(() => {
    if (!session || clients.length === 0) return
    supabase
      .from('appointments')
      .select('client_id, appointment_date')
      .eq('user_id', session.user.id)
      .order('appointment_date', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        for (const row of data) {
          if (!map[row.client_id]) map[row.client_id] = row.appointment_date
        }
        setLastRdvMap(map)
      })
  }, [session, clients.length])

  const displayed: Client[] = query.length > 0
    ? results
    : statusFilter === 'all' ? clients : clients.filter(c => c.status === statusFilter)

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('clients.title')}</Text>
          {clients.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{clients.length}</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('clients.search')}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={colors.textTertiary}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={s => s}
          style={styles.filtersList}
          contentContainerStyle={styles.filtersContent}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item: s }) => {
            const active = statusFilter === s
            const cs = s === 'all' ? null : (statusColors[s] ?? null)
            const bg     = active
              ? (cs ? cs.bg         : colors.primaryAction)
              : (cs ? cs.bg + '55'  : colors.primaryLight)
            const txtClr = active
              ? (cs ? cs.text       : '#ffffff')
              : (cs ? cs.text       : colors.textSecondary)
            const border = active
              ? (cs ? cs.text       : colors.primaryAction)
              : (cs ? cs.bg         : colors.border)
            return (
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: bg, borderColor: border }]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: txtClr, fontFamily: active ? fonts.bold : fonts.medium }]}>
                  {t(`clients.filter_labels.${s}`)}
                </Text>
              </TouchableOpacity>
            )
          }}
        />

        {/* List */}
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primaryAction} />
          : (
            <FlatList
              data={displayed}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <ClientCard client={item} lastRdv={lastRdvMap[item.id]} />
              )}
              ListEmptyComponent={<EmptyState message={t('clients.empty')} icon="👥" />}
              contentContainerStyle={[styles.list, displayed.length === 0 && styles.listEmpty]}
              onRefresh={refresh}
              refreshing={loading}
            />
          )
        }

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/clients/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ── Page header ────────────────────────────────────────────────────────────
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  pageTitle:  { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  countPill:  { backgroundColor: colors.primaryLight, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 },
  countText:  { fontSize: 13, fontFamily: fonts.bold, color: colors.primaryAction },

  // ── Search ─────────────────────────────────────────────────────────────────
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  searchEmoji: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.text, paddingVertical: 11 },

  // ── Filter chips ───────────────────────────────────────────────────────────
  filtersList:    { flexGrow: 0, flexShrink: 0 },
  filtersContent: { paddingHorizontal: 16, paddingBottom: 14, alignItems: 'center' },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },

  // ── FlatList ───────────────────────────────────────────────────────────────
  list:      { padding: 16, gap: 12, paddingBottom: 100 },
  listEmpty: { flex: 1 },
  loader:    { marginTop: 48 },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#1c1a17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { flex: 1, gap: 5 },
  cardName:  { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, lineHeight: 20 },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatar:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontFamily: fonts.bold },

  // ── Status pill ────────────────────────────────────────────────────────────
  pill:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999 },
  pillText: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.3 },

  // ── Three-dot menu ─────────────────────────────────────────────────────────
  menuBtn:  { paddingTop: 2 },
  menuDots: { fontSize: 20, color: colors.textTertiary, lineHeight: 24 },

  // ── Info rows ──────────────────────────────────────────────────────────────
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 13, width: 18, textAlign: 'center' },
  infoText: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, flex: 1 },
  infoMuted: { color: colors.textTertiary, fontStyle: 'italic' },

  // ── Action buttons ─────────────────────────────────────────────────────────
  cardActions:    { flexDirection: 'row', gap: 10, marginTop: 2 },
  btnOutline:     { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  btnOutlineText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  btnFill:        { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primaryAction, alignItems: 'center' },
  btnFillText:    { fontSize: 14, fontFamily: fonts.semibold, color: colors.textInverse },

  // ── FAB ────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryAction,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryAction,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: colors.textInverse, lineHeight: 32 },
})
