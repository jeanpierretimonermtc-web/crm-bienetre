import { useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNetworkTree } from '@/features/network/useNetwork'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { NetworkNode, ContactRole } from '@/shared/lib/types'

const INDENT = 20

// ── Activity indicator ────────────────────────────────────────────────────────

function activityColor(updatedAt: string | null, colors: ThemeColors): string {
  if (!updatedAt) return colors.textTertiary
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000)
  if (days < 15) return colors.success
  if (days < 30) return colors.warning
  return colors.danger
}

// ── Role badge colors ─────────────────────────────────────────────────────────

function rolePalette(role: ContactRole, colors: ThemeColors) {
  switch (role) {
    case 'leader':      return { bg: colors.tertiaryLight,  text: colors.tertiary  }
    case 'distributor': return { bg: colors.secondaryLight, text: colors.secondary }
    case 'customer':    return { bg: colors.successLight,   text: colors.success   }
    case 'team_member': return { bg: colors.bgDim,          text: colors.textSecondary }
    case 'inactive':    return { bg: colors.warningLight,   text: colors.warning   }
    default:            return { bg: colors.primaryLight,   text: colors.primary   }
  }
}

// ── Flatten tree (DFS) ────────────────────────────────────────────────────────

function flattenDFS(nodes: NetworkNode[], result: NetworkNode[] = []): NetworkNode[] {
  for (const node of nodes) {
    result.push(node)
    flattenDFS(node.children, result)
  }
  return result
}

// ── NodeRow ───────────────────────────────────────────────────────────────────

function NodeRow({ node }: { node: NetworkNode }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const rp         = rolePalette(node.contact_role, colors)
  const dot        = activityColor(node.updated_at, colors)
  const isNetwork  = node.contact_role === 'distributor' || node.contact_role === 'leader'
  const childCount = node.children.length

  return (
    <TouchableOpacity
      style={[styles.row, { paddingLeft: 16 + node.level * INDENT }]}
      onPress={() => router.push(`/(app)/clients/${node.id}` as any)}
      activeOpacity={0.75}
    >
      {/* Indent connector line */}
      {node.level > 0 && (
        <View style={[styles.connector, { left: 16 + (node.level - 1) * INDENT + 8 }]} />
      )}

      {/* Activity dot */}
      <View style={[styles.dot, { backgroundColor: dot }]} />

      {/* Name */}
      <Text
        style={[styles.name, isNetwork && styles.nameStrong]}
        numberOfLines={1}
      >
        {node.full_name}
      </Text>

      {/* Children count (distributors/leaders only) */}
      {isNetwork && childCount > 0 && (
        <View style={[styles.countChip, { backgroundColor: colors.bgDim }]}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {t('network.children_count', { n: childCount })}
          </Text>
        </View>
      )}

      {/* Role badge */}
      <View style={[styles.roleBadge, { backgroundColor: rp.bg }]}>
        <Text style={[styles.roleText, { color: rp.text }]}>
          {t(`clients.contact_role.${node.contact_role}`)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NetworkScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { session } = useAuth()
  const { tree, totalSize, distributors, activeThisMonth, loading, error } = useNetworkTree()

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    ?? session?.user?.email ?? ''

  const flat = useMemo(() => flattenDFS(tree), [tree])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('network.title')}</Text>
          <Text style={styles.subtitle}>{t('network.subtitle')}</Text>

          {totalSize > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statNum}>{totalSize}</Text>
                <Text style={styles.statLabel}>{t('network.members')}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statNum, { color: colors.secondary }]}>{distributors}</Text>
                <Text style={styles.statLabel}>{t('network.distributors')}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={[styles.statNum, { color: colors.success }]}>{activeThisMonth}</Text>
                <Text style={styles.statLabel}>{t('network.active_month')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Content ─────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : flat.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌐</Text>
            <Text style={styles.emptyTitle}>{t('network.empty')}</Text>
            <Text style={styles.emptySub}>{t('network.empty_sub')}</Text>
          </View>
        ) : (
          <FlatList
            data={flat}
            keyExtractor={n => n.id}
            renderItem={({ item }) => <NodeRow node={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              /* "Vous" root node */
              <View style={styles.youRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.name, styles.nameStrong, { color: colors.primary }]} numberOfLines={1}>
                  {firstName ? `${firstName} · ` : ''}{t('network.you')}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header:    { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 3 },
  title:     { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  subtitle:  { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: 8 },

  statsRow:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  statChip:  { flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNum:   { fontSize: 22, fontFamily: fonts.display, color: colors.text },
  statLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },

  list:      { paddingBottom: 80 },

  youRow:    {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingRight: 16,
    backgroundColor: colors.bg,
    minHeight: 44,
  },

  connector: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
  },

  dot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },

  name:       { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  nameStrong: { fontFamily: fonts.bold },

  countChip:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  countText:  { fontSize: 11, fontFamily: fonts.semibold },

  roleBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
  roleText:   { fontSize: 10, fontFamily: fonts.bold },

  separator: { height: 1, backgroundColor: colors.border, marginLeft: 16 },

  loader:    { marginTop: 48 },
  errorText: { margin: 24, fontSize: 14, color: colors.danger, fontFamily: fonts.body, textAlign: 'center' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.semibold, color: colors.text, textAlign: 'center' },
  emptySub:   { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  })
}
