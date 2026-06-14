import { useState, useEffect } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { Input } from '@/shared/components/ui/Input'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import i18n from '@/shared/i18n'

const LANGUAGES = [
  { label: 'Français (FR)', value: 'fr' },
  { label: 'English (EN)', value: 'en' },
]

const TIMEZONES = [
  { label: 'Paris (GMT+1)',      value: 'Europe/Paris'       },
  { label: 'London (GMT+0)',     value: 'Europe/London'      },
  { label: 'New York (GMT-5)',   value: 'America/New_York'   },
  { label: 'Chicago (GMT-6)',    value: 'America/Chicago'    },
  { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles' },
  { label: 'Dubai (GMT+4)',      value: 'Asia/Dubai'         },
  { label: 'Tokyo (GMT+9)',      value: 'Asia/Tokyo'         },
  { label: 'Sydney (GMT+11)',    value: 'Australia/Sydney'   },
]

const PLAN_CONFIG: Record<string, { label: string; descKey: string }> = {
  free:    { label: 'Plan Gratuit', descKey: 'settings.plan_free_desc'    },
  pro:     { label: 'Pro Plan',     descKey: 'settings.plan_pro_desc'     },
  cabinet: { label: 'Cabinet Plan', descKey: 'settings.plan_cabinet_desc' },
}

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()

  const [fullName, setFullName] = useState('')
  const [locale,   setLocale]   = useState('fr')
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [plan,     setPlan]     = useState('free')

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [showTz,  setShowTz]  = useState(false)

  useEffect(() => {
    if (!session) return
    supabase
      .from('profiles')
      .select('full_name, locale, timezone, plan')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '')
          setLocale(data.locale ?? 'fr')
          setTimezone(data.timezone ?? 'Europe/Paris')
          setPlan(data.plan ?? 'free')
        }
      })
      .finally(() => setLoading(false))
  }, [session])

  async function handleSave() {
    if (!session) return
    setSaving(true)
    setSaved(false)
    setSaveErr('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, locale, timezone, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
      if (error) throw error
      if (i18n.language !== locale) await i18n.changeLanguage(locale)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('[settings.save]', e)
      setSaveErr(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const currentTz   = TIMEZONES.find(tz => tz.value === timezone)
  const planCfg     = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free
  const isPaidPlan  = plan === 'pro' || plan === 'cabinet'

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primaryAction} />
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{t('settings.title')}</Text>
          <Text style={styles.pageSub}>{t('settings.subtitle')}</Text>
        </View>

        {/* ── Profil ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
          </View>

          <View style={styles.card}>
            {/* Nom complet */}
            <Input
              label={t('settings.full_name')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jean Dupont"
            />

            {/* Email — read-only */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('settings.email')}</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>{session?.user?.email}</Text>
              </View>
            </View>

            {/* Langue + Fuseau horaire */}
            <View style={styles.twoCol}>
              {/* Language */}
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>{t('settings.language')}</Text>
                <View style={styles.langPicker}>
                  {LANGUAGES.map(lang => (
                    <TouchableOpacity
                      key={lang.value}
                      style={[styles.langBtn, locale === lang.value && styles.langBtnActive]}
                      onPress={() => setLocale(lang.value)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.langBtnText, locale === lang.value && styles.langBtnTextActive]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Timezone */}
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>{t('settings.timezone')}</Text>
                <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTz(true)} activeOpacity={0.75}>
                  <Text style={styles.selectBtnText} numberOfLines={1}>
                    {currentTz?.label ?? timezone}
                  </Text>
                  <Text style={styles.selectArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {saveErr ? <Text style={styles.errText}>{saveErr}</Text> : null}

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, (saving || saved) && styles.saveBtnMuted]}
              onPress={handleSave}
              disabled={saving || saved}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>
                    {saved ? `✓  ${t('settings.saved')}` : t('settings.save')}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Abonnement ───────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionIcon}>💳</Text>
            <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>
          </View>

          <View style={[styles.planCard, isPaidPlan ? styles.planCardPaid : styles.planCardFree]}>
            <View style={styles.planTop}>
              <View>
                <Text style={styles.planHint}>{t('settings.current_plan').toUpperCase()}</Text>
                <Text style={styles.planName}>{planCfg.label}</Text>
              </View>
              {isPaidPlan && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t('settings.plan_active')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.planDesc, !isPaidPlan && styles.planDescDark]}>
              {t(planCfg.descKey)}
            </Text>
            <TouchableOpacity
              style={[styles.upgradeBtn, isPaidPlan && styles.upgradeBtnOnDark]}
              activeOpacity={0.85}
            >
              <Text style={[styles.upgradeBtnText, isPaidPlan && styles.upgradeBtnTextOnDark]}>
                {t('settings.upgrade')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Déconnexion ──────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => supabase.auth.signOut()}
          activeOpacity={0.75}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        {/* ── Footer ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.version}>Lumora v1.0.0</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLink}>{t('settings.privacy')}</Text></TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity><Text style={styles.footerLink}>{t('settings.terms')}</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Timezone picker modal ─────────────────────────── */}
      <Modal visible={showTz} transparent animationType="slide" onRequestClose={() => setShowTz(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowTz(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('settings.timezone')}</Text>
            {TIMEZONES.map(tz => (
              <TouchableOpacity
                key={tz.value}
                style={[styles.tzRow, timezone === tz.value && styles.tzRowActive]}
                onPress={() => { setTimezone(tz.value); setShowTz(false) }}
                activeOpacity={0.75}
              >
                <Text style={[styles.tzLabel, timezone === tz.value && styles.tzLabelActive]}>
                  {tz.label}
                </Text>
                {timezone === tz.value && <Text style={styles.tzCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 80, gap: 22 },

  // Page header
  pageHeader: { gap: 4 },
  pageTitle:  { fontSize: 28, fontFamily: fonts.display, color: colors.text },
  pageSub:    { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },

  // Section
  section:     { gap: 10 },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Fields
  field:        { gap: 6 },
  fieldLabel:   { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  disabledInput: { backgroundColor: colors.surfaceContainerLow, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: colors.border },
  disabledText:  { fontSize: 15, fontFamily: fonts.body, color: colors.textTertiary },

  // Two-column row
  twoCol:    { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1, gap: 6 },

  // Language pills
  langPicker:      { gap: 6 },
  langBtn:         { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, alignItems: 'center' },
  langBtnActive:   { backgroundColor: colors.primaryAction, borderColor: colors.primaryAction },
  langBtnText:     { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  langBtnTextActive: { color: '#ffffff' },

  // Timezone select
  selectBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, minHeight: 40 },
  selectBtnText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  selectArrow:   { fontSize: 18, color: colors.textTertiary, marginLeft: 2 },

  errText: { fontSize: 13, fontFamily: fonts.medium, color: colors.danger },

  // Save button
  saveBtn:      { backgroundColor: colors.primaryAction, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnMuted: { backgroundColor: colors.primaryLighter },
  saveBtnText:  { fontSize: 15, fontFamily: fonts.semibold, color: '#ffffff' },

  // Plan card
  planCard:     { borderRadius: 16, padding: 18, gap: 12 },
  planCardPaid: { backgroundColor: colors.primary },
  planCardFree: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryLighter },
  planTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planHint:     { fontSize: 10, fontFamily: fonts.bold, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, marginBottom: 3 },
  planName:     { fontSize: 20, fontFamily: fonts.display, color: '#ffffff' },
  activeBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  activeBadgeText: { fontSize: 12, fontFamily: fonts.semibold, color: '#ffffff' },
  planDesc:     { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  planDescDark: { color: colors.textSecondary },
  upgradeBtn:       { backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnOnDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
  upgradeBtnText:       { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },
  upgradeBtnTextOnDark: { color: '#ffffff' },

  // Logout
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontFamily: fonts.semibold, color: colors.danger },

  // Footer
  footer:      { alignItems: 'center', gap: 6, paddingTop: 4 },
  version:     { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLink:  { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  footerDot:   { fontSize: 12, color: colors.textTertiary },

  // Timezone modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 44, gap: 2 },
  sheetTitle: { fontSize: 17, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  tzRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  tzRowActive:  { backgroundColor: colors.primaryLight },
  tzLabel:      { fontSize: 15, fontFamily: fonts.body, color: colors.text },
  tzLabelActive: { color: colors.primary, fontFamily: fonts.semibold },
  tzCheck:      { fontSize: 16, color: colors.primaryAction },
})
