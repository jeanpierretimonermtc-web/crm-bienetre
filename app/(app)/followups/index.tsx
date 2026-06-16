import { useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native'
import { router, Stack, useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { usePendingFollowups } from '@/features/followups/useFollowups'
import { toggleFollowupDone } from '@/features/followups/followupService'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { FollowupWithClient } from '@/shared/lib/types'

type Tab = 'overdue' | 'today' | 'upcoming'

function getTabConfig(colors: ThemeColors): Record<Tab, { labelKey: string; accent: string; emptyKey: string }> {
  return {
    overdue:  { labelKey: 'followups.overdue',  accent: colors.danger,        emptyKey: 'followups.none_overdue'  },
    today:    { labelKey: 'followups.today',    accent: colors.secondary,     emptyKey: 'followups.none_today'    },
    upcoming: { labelKey: 'followups.upcoming', accent: colors.primaryAction, emptyKey: 'followups.none_upcoming' },
  }
}

function initials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── FollowupCard ─────────────────────────────────────────────────────────────
function FollowupCard({ f, accent, today, onDone }: {
  f: FollowupWithClient; accent: string; today: string; onDone: () => Promise<void>
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [busy, setBusy] = useState(false)

  const isOverdue  = f.due_date < today
  const isToday    = f.due_date === today
  const daysLate   = isOverdue  ? Math.ceil((new Date(today).getTime() - new Date(f.due_date).getTime()) / 86400000) : 0
  const daysAhead  = !isOverdue && !isToday ? Math.ceil((new Date(f.due_date).getTime() - new Date(today).getTime()) / 86400000) : 0

  const dateLabel = isOverdue
    ? t(daysLate === 1 ? 'followups.late_day' : 'followups.late_days', { days: daysLate })
    : isToday
    ? t('followups.today')
    : t(daysAhead === 1 ? 'followups.ahead_day' : 'followups.ahead_days', { days: daysAhead })

  async function handleDone() {
    setBusy(true)
    try { await onDone() } finally { setBusy(false) }
  }

  // Soft tinted avatar bg from accent
  const avatarBg = accent === colors.danger
    ? colors.dangerLight
    : accent === colors.secondary
    ? colors.secondaryLight
    : colors.primaryLight

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/clients/${f.client_id}/followups`)}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Text style={[styles.avatarText, { color: accent }]}>
          {initials(f.client?.full_name ?? '?')}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <Text style={styles.clientName} numberOfLines={1}>{f.client?.full_name}</Text>
        <Text style={styles.taskTitle} numberOfLines={2}>{f.title ?? f.content ?? ''}</Text>
        <View style={styles.datePill}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={[styles.dateText, { color: accent }]}>{dateLabel}</Text>
        </View>
      </View>

      {/* Done button */}
      <TouchableOpacity style={styles.doneBtn} onPress={handleDone} disabled={busy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {busy
          ? <ActivityIndicator size="small" color={colors.textTertiary} />
          : <View style={[styles.doneCircle, { borderColor: accent }]} />
        }
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FollowupsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const TAB_CONFIG = useMemo(() => getTabConfig(colors), [colors])
  const { followups, loading, refresh } = usePendingFollowups()
  const [activeTab, setActiveTab] = useState<Tab>('overdue')
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  useFocusEffect(useCallback(() => { refresh() }, []))

  const today    = new Date().toISOString().split('T')[0]
  const overdue  = followups.filter(f => f.due_date < today)
  const dueToday = followups.filter(f => f.due_date === today)
  const upcoming = followups.filter(f => f.due_date > today)

  const sections: Record<Tab, FollowupWithClient[]> = { overdue, today: dueToday, upcoming }
  const displayed = sections[activeTab]

  async function handleDone(f: FollowupWithClient) {
    await toggleFollowupDone(f.id, true)
    refresh()
  }

  const tabs: Tab[] = ['overdue', 'today', 'upcoming']
  const counts: Record<Tab, number> = { overdue: overdue.length, today: dueToday.length, upcoming: upcoming.length }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.inner, isWide && styles.innerWide]}>

        {/* ── Page header ───────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('followups.title')}</Text>
          <Text style={styles.pageSub}>{t('followups.subtitle')}</Text>
        </View>

        {/* ── Tab bar ───────────────────────────────────── */}
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const cfg    = TAB_CONFIG[tab]
            const active = activeTab === tab
            const count  = counts[tab]
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <View style={styles.tabLabelRow}>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t(cfg.labelKey)}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.tabDot, { backgroundColor: cfg.accent }]} />
                  )}
                </View>
                {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primaryAction }]} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── List ──────────────────────────────────────── */}
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primaryAction} />
          : (
            <FlatList
              data={displayed}
              keyExtractor={f => f.id}
              renderItem={({ item }) => (
                <FollowupCard
                  f={item}
                  accent={TAB_CONFIG[activeTab].accent}
                  today={today}
                  onDone={() => handleDone(item)}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={[styles.list, displayed.length === 0 && styles.listEmpty]}
              ListEmptyComponent={
                <EmptyState message={t(TAB_CONFIG[activeTab].emptyKey)} icon="✅" />
              }
              onRefresh={refresh}
              refreshing={loading}
            />
          )
        }
        </View>
      </View>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner:     { flex: 1, width: '100%' },
  innerWide: { maxWidth: 900, alignSelf: 'center' },

  // Page header
  pageHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4, gap: 3 },
  pageTitle:  { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  pageSub:    { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tabItem:     { flex: 1, alignItems: 'center', paddingBottom: 0 },
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 12 },
  tabLabel:    { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  tabLabelActive: { fontFamily: fonts.semibold, color: colors.text },
  tabDot:      { width: 7, height: 7, borderRadius: 4 },
  tabUnderline: { height: 2, width: '100%', borderRadius: 1, position: 'absolute', bottom: -1 },

  // List
  list:      { paddingHorizontal: 16, paddingBottom: 80 },
  listEmpty: { flex: 1 },
  loader:    { marginTop: 48 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Avatar
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 15, fontFamily: fonts.bold },

  // Card body
  cardBody:   { flex: 1, gap: 3 },
  clientName: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  taskTitle:  { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },
  datePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateIcon:   { fontSize: 12 },
  dateText:   { fontSize: 12, fontFamily: fonts.semibold },

  // Done button
  doneBtn:    { flexShrink: 0, padding: 4 },
  doneCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  })
}
