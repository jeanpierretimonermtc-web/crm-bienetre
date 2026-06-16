import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClient } from '@/features/clients/useClient'
import { useClientAppointments } from '@/features/appointments/useAppointments'
import { useNotes } from '@/features/notes/useNotes'
import { useClientFollowups } from '@/features/followups/useFollowups'
import { useRecommendations } from '@/features/recommendations/useRecommendations'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { ClientStatus } from '@/shared/lib/types'

type Tab = 'apercu' | 'rdv' | 'notes' | 'relances' | 'reco'

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'apercu',   labelKey: 'clients.tab_overview' },
  { key: 'rdv',      labelKey: 'clients.tab_rdv' },
  { key: 'notes',    labelKey: 'clients.tab_notes' },
  { key: 'relances', labelKey: 'clients.tab_followups' },
  { key: 'reco',     labelKey: 'clients.tab_reco' },
]

function nameInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtShort(d: string | null | undefined, locale: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

export default function ClientDetailScreen() {
  const { t, i18n } = useTranslation()
  const { colors, statusColors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { client, loading } = useClient(id)
  const { appointments } = useClientAppointments(id)
  const { notes } = useNotes(id)
  const { followups } = useClientFollowups(id)
  const { recommendations } = useRecommendations(id)
  const [activeTab, setActiveTab] = useState<Tab>('apercu')

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  const userInitials = (() => {
    const name = session?.user?.user_metadata?.full_name
    if (name) return nameInitials(name)
    return (session?.user?.email ?? 'ME').slice(0, 2).toUpperCase()
  })()

  if (loading || !client) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}><ActivityIndicator color={colors.primaryAction} /></View>
      </>
    )
  }

  // KPI calculations
  const now = new Date()
  const past   = appointments.filter(a => new Date(a.appointment_date) <= now)
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
  const future = appointments.filter(a => new Date(a.appointment_date) > now)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
  const lastDate = past[0]?.appointment_date
  const nextDate = future[0]?.appointment_date
    ?? appointments.find(a => a.next_appointment_date)?.next_appointment_date

  const sc = statusColors[client.status as ClientStatus] ?? { bg: colors.surfaceContainerHigh, text: colors.textSecondary }
  const particularityItems = client.particularities
    ? client.particularities.split('\n').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>

        {/* ── Navigation bar ──────────────────────────────────────── */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.navTitle}>{t('clients.profile_title')}</Text>
          </TouchableOpacity>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.navIconBtn} activeOpacity={0.7}>
              <Text style={styles.navIconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userChip}
              onPress={() => router.push(`/(app)/clients/${id}/edit`)}
              activeOpacity={0.8}
            >
              <Text style={styles.userChipText}>{userInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={[styles.bigAvatar, { backgroundColor: sc.bg }]}>
              <Text style={[styles.bigAvatarText, { color: sc.text }]}>{nameInitials(client.full_name)}</Text>
            </View>
            <Text style={styles.heroName}>{client.full_name}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.heroPill, { backgroundColor: sc.bg }]}>
                <Text style={[styles.heroPillText, { color: sc.text }]}>
                  {t(`clients.status.${client.status}`).toUpperCase()}
                </Text>
              </View>
              {client.client_type ? (
                <View style={[styles.heroPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Text style={[styles.heroPillText, { color: colors.textSecondary }]}>
                    {client.client_type.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
            {/* KPI strip */}
            <View style={styles.kpiStrip}>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiLabel}>{t('clients.kpi_rdv')}</Text>
                <Text style={styles.kpiValue}>{appointments.length}</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiCol}>
                <Text style={styles.kpiLabel}>{t('clients.kpi_last')}</Text>
                <Text style={styles.kpiValue}>{fmtShort(lastDate, locale)}</Text>
              </View>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiCol}>
                <Text style={styles.kpiLabel}>{t('clients.kpi_next')}</Text>
                <Text style={styles.kpiValue}>{fmtShort(nextDate, locale)}</Text>
              </View>
            </View>
          </View>

          {/* ── Tab bar ──────────────────────────────────────────── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Tab content ──────────────────────────────────────── */}
          <View style={styles.tabContent}>

            {/* ─ Aperçu ─ */}
            {activeTab === 'apercu' && (
              <>
                {/* Informations personnelles */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{t('clients.sections.personal')}</Text>
                    <TouchableOpacity onPress={() => router.push(`/(app)/clients/${id}/edit`)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.cardMenu}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                  {client.email ? (
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t('clients.fields.email').toUpperCase()}</Text>
                      <Text style={styles.fieldValue}>{client.email}</Text>
                    </View>
                  ) : null}
                  {client.phone ? (
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t('clients.fields.phone').toUpperCase()}</Text>
                      <Text style={styles.fieldValue}>{client.phone}</Text>
                    </View>
                  ) : null}
                  {client.birth_date ? (
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t('clients.fields.birth_date').toUpperCase()}</Text>
                      <Text style={styles.fieldValue}>
                        {new Date(client.birth_date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  ) : null}
                  {client.profession ? (
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t('clients.fields.profession').toUpperCase()}</Text>
                      <Text style={styles.fieldValue}>{client.profession}</Text>
                    </View>
                  ) : null}
                  {client.children ? (
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{t('clients.fields.children').toUpperCase()}</Text>
                      <Text style={styles.fieldValue}>{client.children}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Antécédents & Notes */}
                {client.medical_notes ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconBox}>
                        <Text style={styles.iconBoxEmoji}>📋</Text>
                      </View>
                      <Text style={styles.cardTitle}>{t('clients.section_medical')}</Text>
                    </View>
                    <Text style={styles.bodyText}>{client.medical_notes}</Text>
                  </View>
                ) : null}

                {/* Particularités */}
                {particularityItems.length > 0 ? (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconBox, { backgroundColor: colors.warningLight }]}>
                        <Text style={[styles.iconBoxEmoji, { color: colors.warning }]}>!</Text>
                      </View>
                      <Text style={styles.cardTitle}>{t('clients.section_particularities')}</Text>
                    </View>
                    {particularityItems.map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Centres d'intérêt */}
                <View style={styles.interestsSection}>
                  <Text style={styles.interestsTitle}>{t('clients.section_interests')}</Text>
                  <View style={styles.pillsWrap}>
                    {(client.interests ?? []).map((interest, i) => (
                      <View key={i} style={styles.interestPill}>
                        <Text style={styles.interestPillText}>{interest}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addPillBtn}
                      onPress={() => router.push(`/(app)/clients/${id}/edit`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.addPillText}>{t('clients.add_interest')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ─ RDV ─ */}
            {activeTab === 'rdv' && (
              <View style={styles.listTab}>
                {appointments.length === 0
                  ? <Text style={styles.emptyText}>{t('appointments.empty')}</Text>
                  : appointments
                      .slice()
                      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                      .map(appt => (
                        <TouchableOpacity
                          key={appt.id}
                          style={styles.listCard}
                          onPress={() => router.push(`/(app)/clients/${id}/appointments`)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.listCardLeft}>
                            <Text style={styles.listCardDate}>
                              {new Date(appt.appointment_date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                            {appt.themes_discussed ? (
                              <Text style={styles.listCardSub} numberOfLines={2}>{appt.themes_discussed}</Text>
                            ) : null}
                          </View>
                          <View style={styles.listCardBadge}>
                            <Text style={styles.listCardBadgeText}>#{appt.appointment_number}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                }
                <TouchableOpacity style={styles.addRowBtn} onPress={() => router.push(`/(app)/clients/${id}/appointments`)} activeOpacity={0.7}>
                  <Text style={styles.addRowBtnText}>+ {t('appointments.add')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─ Notes ─ */}
            {activeTab === 'notes' && (
              <View style={styles.listTab}>
                {notes.length === 0
                  ? <Text style={styles.emptyText}>{t('notes.empty')}</Text>
                  : notes.map(note => (
                      <TouchableOpacity
                        key={note.id}
                        style={styles.listCard}
                        onPress={() => router.push(`/(app)/clients/${id}/notes`)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.listCardDate}>
                          {new Date(note.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                        <Text style={styles.listCardSub} numberOfLines={4}>{note.content}</Text>
                      </TouchableOpacity>
                    ))
                }
                <TouchableOpacity style={styles.addRowBtn} onPress={() => router.push(`/(app)/clients/${id}/notes`)} activeOpacity={0.7}>
                  <Text style={styles.addRowBtnText}>+ {t('notes.add')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─ Relances ─ */}
            {activeTab === 'relances' && (
              <View style={styles.listTab}>
                {followups.length === 0
                  ? <Text style={styles.emptyText}>{t('followups.none')}</Text>
                  : followups
                      .slice()
                      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                      .map(f => (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.listCard, f.done && styles.listCardDone]}
                          onPress={() => router.push(`/(app)/clients/${id}/followups`)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.listCardLeft}>
                            <Text style={[styles.listCardDate, f.done && styles.listCardDateStrike]}>
                              {new Date(f.due_date).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                            </Text>
                            <Text style={styles.listCardSub} numberOfLines={2}>{f.title ?? f.content}</Text>
                          </View>
                          {f.done && (
                            <View style={styles.doneBadge}>
                              <Text style={styles.doneBadgeText}>{t('followups.done')}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                }
                <TouchableOpacity style={styles.addRowBtn} onPress={() => router.push(`/(app)/clients/${id}/followups`)} activeOpacity={0.7}>
                  <Text style={styles.addRowBtnText}>+ {t('followups.add')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─ Reco ─ */}
            {activeTab === 'reco' && (
              <View style={styles.listTab}>
                {recommendations.length === 0
                  ? <Text style={styles.emptyText}>{t('recommendations.empty')}</Text>
                  : recommendations.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        style={styles.listCard}
                        onPress={() => router.push(`/(app)/clients/${id}/recommendations`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.listCardLeft}>
                          <Text style={styles.listCardTitle}>{r.product_name}</Text>
                          {r.reason ? <Text style={styles.listCardSub} numberOfLines={2}>{r.reason}</Text> : null}
                        </View>
                        <View style={[styles.listCardBadge, r.status === 'purchased' && styles.listCardBadgeGreen]}>
                          <Text style={[styles.listCardBadgeText, r.status === 'purchased' && styles.listCardBadgeTextGreen]}>
                            {t(`recommendations.${r.status}`)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                }
                <TouchableOpacity style={styles.addRowBtn} onPress={() => router.push(`/(app)/clients/${id}/recommendations`)} activeOpacity={0.7}>
                  <Text style={styles.addRowBtnText}>+ {t('recommendations.add')}</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>

        {/* ── FAB ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/(app)/clients/${id}/edit`)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>✎</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const CARD_SHADOW = {
  shadowColor: '#1c1a17' as string,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 1,
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, maxWidth: 900, alignSelf: 'center', width: '100%' },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow:    { fontSize: 22, color: colors.text, lineHeight: 26 },
  navTitle:     { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  navRight:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navIconBtn:   { padding: 4 },
  navIconText:  { fontSize: 18 },
  userChip:     { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryAction, alignItems: 'center', justifyContent: 'center' },
  userChipText: { fontSize: 11, fontFamily: fonts.bold, color: colors.textInverse },

  // ── Hero ───────────────────────────────────────────────────────────────────
  hero:          { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 4 },
  bigAvatar:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bigAvatarText: { fontSize: 28, fontFamily: fonts.bold },
  heroName:      { fontSize: 26, fontFamily: fonts.display, color: colors.text, textAlign: 'center', marginBottom: 10 },
  heroBadges:    { flexDirection: 'row', gap: 8, marginBottom: 20 },
  heroPill:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999 },
  heroPillText:  { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8 },

  kpiStrip:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 8, width: '100%', ...CARD_SHADOW },
  kpiCol:    { flex: 1, alignItems: 'center', gap: 5 },
  kpiDivider:{ width: 1, height: 32, backgroundColor: colors.border },
  kpiLabel:  { fontSize: 11, fontFamily: fonts.medium, color: colors.textTertiary },
  kpiValue:  { fontSize: 17, fontFamily: fonts.bold, color: colors.text },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 20 },
  tabRow:    { flexDirection: 'row', paddingHorizontal: 12 },
  tabBtn:    { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 2 },
  tabBtnActive:   { borderBottomColor: colors.primaryAction },
  tabLabel:       { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  tabLabelActive: { color: colors.primaryAction, fontFamily: fonts.semibold },

  // ── Tab content ────────────────────────────────────────────────────────────
  tabContent: { padding: 16, gap: 12 },

  // Section cards
  card:       { backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 14, ...CARD_SHADOW },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle:  { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  cardMenu:   { fontSize: 20, color: colors.textTertiary, lineHeight: 24 },
  iconBox:    { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  iconBoxEmoji: { fontSize: 14 },

  // Field rows
  fieldBlock: { gap: 3 },
  fieldLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.8 },
  fieldValue: { fontSize: 14, fontFamily: fonts.body, color: colors.text, lineHeight: 20 },

  // Body text
  bodyText: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 22 },

  // Bullet list
  bulletRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet:     { fontSize: 14, color: colors.primaryAction, lineHeight: 22 },
  bulletText: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, flex: 1, lineHeight: 22 },

  // Interests
  interestsSection: { gap: 10 },
  interestsTitle:   { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  pillsWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  interestPillText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  addPillBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, borderWidth: 1.5, borderColor: colors.primaryAction },
  addPillText:      { fontSize: 13, fontFamily: fonts.medium, color: colors.primaryAction },

  // List tabs
  listTab:   { gap: 10 },
  emptyText: { textAlign: 'center', color: colors.textTertiary, fontFamily: fonts.body, fontSize: 14, marginTop: 32, marginBottom: 16 },

  listCard:       { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 6, flexDirection: 'row', alignItems: 'flex-start', ...CARD_SHADOW },
  listCardDone:   { opacity: 0.55 },
  listCardLeft:   { flex: 1, gap: 4 },
  listCardTitle:  { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  listCardDate:   { fontSize: 13, fontFamily: fonts.semibold, color: colors.primaryAction },
  listCardDateStrike: { textDecorationLine: 'line-through', color: colors.textTertiary },
  listCardSub:    { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },
  listCardBadge:  { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  listCardBadgeGreen: { backgroundColor: colors.primaryLight },
  listCardBadgeText:  { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary },
  listCardBadgeTextGreen: { color: colors.primaryAction },
  doneBadge:      { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  doneBadgeText:  { fontSize: 11, fontFamily: fonts.bold, color: colors.primaryAction },

  addRowBtn:     { marginTop: 4, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  addRowBtnText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.primaryAction },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1c1a17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  fabIcon: { fontSize: 22, color: colors.textInverse, lineHeight: 26 },
  })
}
