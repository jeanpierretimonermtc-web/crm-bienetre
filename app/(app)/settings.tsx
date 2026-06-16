import { useState, useEffect } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Switch } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDemoState } from '@/features/demo/DemoProvider'
import { supabase } from '@/shared/lib/supabase'
import { getCatalogs } from '@/features/catalogs/catalogService'
import { Input } from '@/shared/components/ui/Input'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import i18n from '@/shared/i18n'
import type { Catalog } from '@/shared/lib/types'

const LANGUAGES = [
  { label: 'Français', value: 'fr' },
  { label: 'English',  value: 'en' },
]

const TIMEZONES = [
  { label: 'Paris (GMT+1)',        value: 'Europe/Paris'        },
  { label: 'London (GMT+0)',       value: 'Europe/London'       },
  { label: 'New York (GMT-5)',     value: 'America/New_York'    },
  { label: 'Chicago (GMT-6)',      value: 'America/Chicago'     },
  { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles'  },
  { label: 'Dubai (GMT+4)',        value: 'Asia/Dubai'          },
  { label: 'Tokyo (GMT+9)',        value: 'Asia/Tokyo'          },
  { label: 'Sydney (GMT+11)',      value: 'Australia/Sydney'    },
]

const PLAN_CONFIG: Record<string, { label: string; descKey: string }> = {
  free:    { label: 'Plan Gratuit', descKey: 'settings.plan_free_desc'    },
  pro:     { label: 'Pro',          descKey: 'settings.plan_pro_desc'     },
  cabinet: { label: 'Cabinet',      descKey: 'settings.plan_cabinet_desc' },
}

function nameInitials(name: string) {
  const parts = (name ?? '').trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { hideDemoCard, setHideDemoCard } = useDemoState()

  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [locale,    setLocale]    = useState('fr')
  const [timezone,  setTimezone]  = useState('Europe/Paris')
  const [plan,      setPlan]      = useState('free')

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [saveErr,  setSaveErr]  = useState('')
  const [showTz,   setShowTz]   = useState(false)

  const [officialCatalogs, setOfficialCatalogs] = useState<Catalog[]>([])
  const [activeSlugs, setActiveSlugs]           = useState<string[] | null>(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('profiles')
      .select('full_name, specialty, locale, timezone, plan, active_catalog_slugs')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '')
          setSpecialty(data.specialty ?? '')
          setLocale(data.locale ?? 'fr')
          setTimezone(data.timezone ?? 'Europe/Paris')
          setPlan(data.plan ?? 'free')
          setActiveSlugs((data as any).active_catalog_slugs ?? null)
        }
      })
      .finally(() => setLoading(false))

    getCatalogs(session.user.id)
      .then(all => setOfficialCatalogs(all.filter(c => c.type === 'official')))
      .catch(console.error)
  }, [session])

  async function handleSave() {
    if (!session) return
    setSaving(true)
    setSaved(false)
    setSaveErr('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, specialty: specialty || null, locale, timezone, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
      if (error) throw error
      if (i18n.language !== locale) await i18n.changeLanguage(locale)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('[profile.save]', e)
      setSaveErr(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  function isCatalogActive(slug: string | null) {
    if (!slug) return false
    return !activeSlugs || activeSlugs.includes(slug)
  }

  async function toggleCatalog(slug: string) {
    if (!session) return
    const allSlugs = officialCatalogs.map(c => c.slug!).filter(Boolean)
    let newSlugs: string[] | null

    if (!activeSlugs) {
      const updated = allSlugs.filter(s => s !== slug)
      if (updated.length === 0) return
      newSlugs = updated
    } else if (activeSlugs.includes(slug)) {
      const updated = activeSlugs.filter(s => s !== slug)
      if (updated.length === 0) return
      newSlugs = updated
    } else {
      const updated = [...activeSlugs, slug]
      newSlugs = allSlugs.every(s => updated.includes(s)) ? null : updated
    }

    setActiveSlugs(newSlugs)
    supabase
      .from('profiles')
      .update({ active_catalog_slugs: newSlugs })
      .eq('id', session.user.id)
      .then(({ error }) => { if (error) console.error('[profile.catalogs]', error) })
  }

  const currentTz  = TIMEZONES.find(tz => tz.value === timezone)
  const planCfg    = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free
  const isPaidPlan = plan === 'pro' || plan === 'cabinet'
  const initials   = nameInitials(fullName || session?.user?.email || '')

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
        {/* ── Hero ────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{fullName || session?.user?.email}</Text>
          {specialty ? (
            <Text style={styles.heroSpecialty}>{specialty}</Text>
          ) : (
            <Text style={styles.heroSpecialtyEmpty}>{t('settings.specialty_placeholder')}</Text>
          )}
        </View>

        <View style={styles.sectionsInner}>

        {/* ── Informations ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.profile')}</Text>
          <View style={styles.card}>
            <Input
              label={t('settings.full_name')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jean Dupont"
            />
            <Input
              label={t('settings.specialty')}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder={t('settings.specialty_placeholder')}
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('settings.email')}</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>{session?.user?.email}</Text>
              </View>
            </View>

            {saveErr ? <Text style={styles.errText}>{saveErr}</Text> : null}

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

        {/* ── Préférences ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.language')} & {t('settings.timezone')}</Text>
          <View style={styles.card}>
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

        {/* ── Affichage ───────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.display')}</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>{t('settings.hide_demo')}</Text>
                <Text style={styles.switchDesc}>{t('settings.hide_demo_desc')}</Text>
              </View>
              <Switch
                value={hideDemoCard}
                onValueChange={setHideDemoCard}
                trackColor={{ true: colors.primaryAction, false: colors.border }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* ── Catalogues de produits ──────────────────────── */}
        {officialCatalogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.catalogs')}</Text>
            <Text style={styles.sectionDesc}>{t('settings.catalogs_desc')}</Text>
            <View style={styles.card}>
              {officialCatalogs.map((cat, idx) => (
                <View
                  key={cat.id}
                  style={[styles.catalogRow, idx > 0 && styles.catalogRowBorder]}
                >
                  <View style={[styles.catalogIcon, { backgroundColor: cat.color + '20' }]}>
                    <Text style={styles.catalogIconEmoji}>{cat.icon}</Text>
                  </View>
                  <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName}>{cat.name}</Text>
                  </View>
                  <Switch
                    value={isCatalogActive(cat.slug)}
                    onValueChange={() => cat.slug && toggleCatalog(cat.slug)}
                    trackColor={{ true: cat.color, false: colors.border }}
                    thumbColor={colors.card}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Abonnement ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.subscription')}</Text>
          <View style={[styles.planCard, isPaidPlan ? styles.planCardPaid : styles.planCardFree]}>
            <View style={styles.planTop}>
              <View>
                <Text style={[styles.planHint, !isPaidPlan && styles.planHintDark]}>
                  {t('settings.current_plan').toUpperCase()}
                </Text>
                <Text style={[styles.planName, !isPaidPlan && styles.planNameDark]}>{planCfg.label}</Text>
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

        {/* ── Compte ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={() => supabase.auth.signOut()}
              activeOpacity={0.75}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>{t('auth.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.version}>Oryalis v1.0.0</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLink}>{t('settings.privacy')}</Text></TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity><Text style={styles.footerLink}>{t('settings.terms')}</Text></TouchableOpacity>
          </View>
        </View>

        </View>{/* /sectionsInner */}
      </ScrollView>

      {/* ── Timezone picker ─────────────────────────────────── */}
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
  loadingBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container:     { flex: 1, backgroundColor: colors.bg },
  content:       { paddingBottom: 80 },
  sectionsInner: { maxWidth: 720, alignSelf: 'center', width: '100%' },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 4,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroAvatarText:     { fontSize: 30, fontFamily: fonts.bold, color: '#ffffff' },
  heroName:           { fontSize: 22, fontFamily: fonts.display, color: '#ffffff', textAlign: 'center' },
  heroSpecialty:      { fontSize: 14, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  heroSpecialtyEmpty: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center' },

  // ── Sections ────────────────────────────────────────────────────────────────
  section:      { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  sectionLabel: { fontSize: 12, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 2 },

  // ── Card ────────────────────────────────────────────────────────────────────
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

  // ── Fields ──────────────────────────────────────────────────────────────────
  field:         { gap: 6 },
  fieldLabel:    { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  disabledInput: { backgroundColor: colors.surfaceContainerLow, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: colors.border },
  disabledText:  { fontSize: 15, fontFamily: fonts.body, color: colors.textTertiary },

  twoCol:    { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1, gap: 6 },

  // ── Language pills ──────────────────────────────────────────────────────────
  langPicker:        { gap: 6 },
  langBtn:           { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, alignItems: 'center' },
  langBtnActive:     { backgroundColor: colors.primaryAction, borderColor: colors.primaryAction },
  langBtnText:       { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  langBtnTextActive: { color: '#ffffff' },

  // ── Timezone ────────────────────────────────────────────────────────────────
  selectBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, minHeight: 40 },
  selectBtnText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  selectArrow:   { fontSize: 18, color: colors.textTertiary, marginLeft: 2 },

  errText: { fontSize: 13, fontFamily: fonts.medium, color: colors.danger },

  // ── Save button ─────────────────────────────────────────────────────────────
  saveBtn:      { backgroundColor: colors.primaryAction, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnMuted: { backgroundColor: colors.primaryLighter },
  saveBtnText:  { fontSize: 15, fontFamily: fonts.semibold, color: '#ffffff' },

  // ── Section description ─────────────────────────────────────────────────────
  sectionDesc: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, paddingHorizontal: 18, marginTop: -4 },

  // ── Catalog toggles ─────────────────────────────────────────────────────────
  catalogRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  catalogRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, marginTop: 8 },
  catalogIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catalogIconEmoji: { fontSize: 18 },
  catalogInfo:      { flex: 1 },
  catalogName:      { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },

  // ── Display toggle ──────────────────────────────────────────────────────────
  switchRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  switchDesc:  { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 17 },

  // ── Plan card ───────────────────────────────────────────────────────────────
  planCard:     { borderRadius: 16, padding: 18, gap: 12 },
  planCardPaid: { backgroundColor: colors.primary },
  planCardFree: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryLighter },
  planTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planHint:          { fontSize: 10, fontFamily: fonts.bold, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, marginBottom: 3 },
  planHintDark:      { color: colors.textSecondary },
  planName:          { fontSize: 20, fontFamily: fonts.display, color: '#ffffff' },
  planNameDark:      { color: colors.primary },
  activeBadge:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  activeBadgeText:   { fontSize: 12, fontFamily: fonts.semibold, color: '#ffffff' },
  planDesc:          { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  planDescDark:      { color: colors.textSecondary },
  upgradeBtn:        { backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  upgradeBtnOnDark:  { backgroundColor: 'rgba(255,255,255,0.15)' },
  upgradeBtnText:        { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },
  upgradeBtnTextOnDark:  { color: '#ffffff' },

  // ── Compte ──────────────────────────────────────────────────────────────────
  logoutRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontFamily: fonts.semibold, color: colors.danger },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer:      { alignItems: 'center', gap: 6, paddingTop: 28, paddingBottom: 8 },
  version:     { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLink:  { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  footerDot:   { fontSize: 12, color: colors.textTertiary },

  // ── Timezone modal ──────────────────────────────────────────────────────────
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 44, gap: 2 },
  sheetTitle: { fontSize: 17, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  tzRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  tzRowActive:  { backgroundColor: colors.primaryLight },
  tzLabel:      { fontSize: 15, fontFamily: fonts.body, color: colors.text },
  tzLabelActive: { color: colors.primary, fontFamily: fonts.semibold },
  tzCheck:      { fontSize: 16, color: colors.primaryAction },
})
