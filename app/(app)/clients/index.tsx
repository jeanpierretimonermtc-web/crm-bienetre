import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Modal } from 'react-native'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { useClients, useClientSearch } from '@/features/clients/useClients'
import { computeProspectScore, deleteClient } from '@/features/clients/clientService'
import { useAppConfig } from '@/features/settings/AppConfigProvider'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Client, ClientStatus } from '@/shared/lib/types'

const STATUS_FILTERS: (ClientStatus | 'all')[] = ['all', 'active', 'new_client', 'loyal', 'prospect', 'inactive', 'vip', 'advisor']

function initials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ClientAvatar({ name, status }: { name: string; status: ClientStatus }) {
  const { colors, statusColors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const sc = statusColors[status] ?? { bg: colors.surfaceContainerHigh, text: colors.textSecondary }
  return (
    <View style={[styles.avatar, { backgroundColor: sc.bg }]}>
      <Text style={[styles.avatarText, { color: sc.text }]}>{initials(name)}</Text>
    </View>
  )
}

function StatusPill({ status }: { status: ClientStatus }) {
  const { colors, statusColors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { getStatusLabel } = useAppConfig()
  const sc = statusColors[status] ?? { bg: colors.surfaceContainerHighest, text: colors.textTertiary }
  return (
    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
      <Text style={[styles.pillText, { color: sc.text }]}>{getStatusLabel(status)}</Text>
    </View>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const { colors } = useTheme()
  if (score <= 0) return null
  const bg   = score >= 70 ? colors.dangerLight  : score >= 40 ? colors.warningLight : colors.bgDim
  const text = score >= 70 ? colors.danger        : score >= 40 ? colors.warning      : colors.textSecondary
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: bg }}>
      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: text }}>{score}</Text>
    </View>
  )
}

function ClientCard({ client, lastRdv, onMenuPress }: { client: Client; lastRdv?: string; onMenuPress: (c: Client) => void }) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  const rdvText = lastRdv
    ? `${t('clients.last_rdv')} : ${new Date(lastRdv).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}`
    : t('clients.no_rdv')

  const score = computeProspectScore({ client, lastRdvDate: lastRdv })

  return (
    <View style={styles.card}>
      {/* Top: avatar + name/badge + score + menu */}
      <View style={styles.cardTop}>
        <ClientAvatar name={client.full_name} status={client.status} />
        <View style={styles.cardTitle}>
          <Text style={styles.cardName}>{client.full_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StatusPill status={client.status} />
            <ScoreBadge score={score} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => onMenuPress(client)}
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
  const { colors, statusColors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { session } = useAuth()
  const { status: statusParam } = useLocalSearchParams<{ status?: ClientStatus }>()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>(
    statusParam && STATUS_FILTERS.includes(statusParam) ? statusParam : 'all'
  )
  const { clients, loading, refresh } = useClients()
  const { results, search } = useClientSearch()
  const { labels: statusLabels, getStatusLabel } = useAppConfig()
  const [lastRdvMap, setLastRdvMap] = useState<Record<string, string>>({})
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  const [menuClient, setMenuClient]       = useState<Client | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  function closeMenu() { setMenuClient(null); setConfirmDelete(false) }

  async function handleDelete() {
    if (!menuClient) return
    setDeleting(true)
    try {
      await deleteClient(menuClient.id)
      closeMenu()
      refresh()
    } catch (e) {
      console.error('[deleteClient]', e)
    } finally {
      setDeleting(false)
    }
  }

  useFocusEffect(useCallback(() => { refresh() }, []))

  useEffect(() => {
    if (statusParam && STATUS_FILTERS.includes(statusParam)) {
      setStatusFilter(statusParam)
    }
  }, [statusParam])

  useEffect(() => {
    if (query.length > 0) search(query, statusFilter === 'all' ? undefined : statusFilter)
  }, [query, statusFilter])

  // Single query: most-recent appointment per client
  useEffect(() => {
    if (!session || clients.length === 0) return
    supabase
      .from('appointments')
      .select('client_id, start_at')
      .eq('user_id', session.user.id)
      .order('start_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        for (const row of data) {
          if (!map[row.client_id]) map[row.client_id] = row.start_at
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
        <View style={[styles.inner, isWide && styles.innerWide]}>

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
              ? (cs ? cs.bg    : '#2563eb')
              : (cs ? cs.bg + '55' : '#dbeafe')
            const txtClr = active
              ? (cs ? cs.text  : '#ffffff')
              : (cs ? cs.text  : '#1e40af')
            const border = active
              ? (cs ? cs.text  : '#2563eb')
              : (cs ? cs.bg    : '#bfdbfe')
            return (
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: bg, borderColor: border }]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: txtClr, fontFamily: active ? fonts.bold : fonts.medium }]}>
                  {s === 'all' ? t('clients.filter_all') : getStatusLabel(s as ClientStatus)}
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
              key={isWide ? '2-col' : '1-col'}
              numColumns={isWide ? 2 : 1}
              columnWrapperStyle={isWide ? styles.columnWrapper : undefined}
              data={displayed}
              keyExtractor={c => c.id}
              extraData={statusLabels}
              renderItem={({ item }) => (
                <View style={isWide ? styles.colCard : undefined}>
                  <ClientCard client={item} lastRdv={lastRdvMap[item.id]} onMenuPress={setMenuClient} />
                </View>
              )}
              ListEmptyComponent={<EmptyState message={t('clients.empty')} icon="👥" />}
              contentContainerStyle={[styles.list, isWide && styles.listWide, displayed.length === 0 && styles.listEmpty]}
              onRefresh={refresh}
              refreshing={loading}
            />
          )
        }

        </View>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/clients/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Context menu ──────────────────────────────────────────── */}
      <Modal
        visible={!!menuClient}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
          <View style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.menuPill} />
            <Text style={styles.menuSheetName} numberOfLines={1}>{menuClient?.full_name}</Text>

            {!confirmDelete ? (
              <>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { closeMenu(); router.push(`/(app)/clients/${menuClient?.id}` as any) }}>
                  <Text style={styles.menuItemIcon}>👁</Text>
                  <Text style={styles.menuItemText}>{t('clients.view')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { closeMenu(); router.push(`/(app)/clients/${menuClient?.id}/edit` as any) }}>
                  <Text style={styles.menuItemIcon}>✏️</Text>
                  <Text style={styles.menuItemText}>{t('clients.menu_edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { closeMenu(); router.push(`/(app)/clients/${menuClient?.id}/appointments` as any) }}>
                  <Text style={styles.menuItemIcon}>📅</Text>
                  <Text style={styles.menuItemText}>{t('clients.menu_new_rdv')}</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => setConfirmDelete(true)}>
                  <Text style={styles.menuItemIcon}>🗑️</Text>
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>{t('clients.menu_delete')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.menuConfirmText}>
                  {t('clients.menu_delete')} « {menuClient?.full_name} » ?
                </Text>
                <TouchableOpacity
                  style={[styles.menuDangerBtn, deleting && { opacity: 0.6 }]}
                  activeOpacity={0.8}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.menuDangerBtnText}>{t('clients.menu_confirm_delete')}</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => setConfirmDelete(false)}>
                  <Text style={[styles.menuItemText, { textAlign: 'center', color: colors.textSecondary }]}>{t('clients.menu_cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  inner:      { flex: 1, width: '100%' },
  innerWide:  { maxWidth: 1100, alignSelf: 'center' },

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
  list:          { padding: 16, gap: 12, paddingBottom: 100 },
  listWide:      { paddingHorizontal: 0 },
  listEmpty:     { flex: 1 },
  loader:        { marginTop: 48 },
  columnWrapper: { gap: 12, paddingHorizontal: 20 },
  colCard:       { flex: 1 },

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

  // ── Context menu modal ────────────────────────────────────────────────────
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  menuPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuSheetName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuItemText: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  menuDivider:  { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  menuConfirmText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    paddingHorizontal: 4,
    paddingVertical: 12,
    lineHeight: 20,
  },
  menuDangerBtn: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 4,
  },
  menuDangerBtnText: { fontSize: 15, fontFamily: fonts.semibold, color: '#fff' },

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
}
