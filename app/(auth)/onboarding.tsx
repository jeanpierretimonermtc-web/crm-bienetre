import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { createClient } from '@/features/clients/clientService'
import { createAppointment } from '@/features/appointments/appointmentService'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { ContactRole } from '@/shared/lib/types'
import i18n from '@/shared/i18n'

const LANGUAGES = [
  { label: 'Français', value: 'fr' },
  { label: 'English',  value: 'en' },
]

const TIMEZONES = [
  { label: 'Paris (GMT+1)',        value: 'Europe/Paris'        },
  { label: 'London (GMT+0)',       value: 'Europe/London'       },
  { label: 'New York (GMT-5)',     value: 'America/New_York'    },
  { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles'  },
  { label: 'Dubai (GMT+4)',        value: 'Asia/Dubai'          },
]

const ROLES: { value: ContactRole; emoji: string }[] = [
  { value: 'prospect',    emoji: '🔍' },
  { value: 'customer',    emoji: '🛒' },
  { value: 'distributor', emoji: '🌐' },
]

const TOTAL_STEPS = 3

// ── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({ step, colors }: { step: number; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {[1, 2, 3].map((n, i) => (
        <View key={n} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: step >= n ? colors.primary : colors.bgDim,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2,
            borderColor: step >= n ? colors.primary : colors.border,
          }}>
            {step > n ? (
              <Text style={{ fontSize: 13, color: '#fff', fontFamily: fonts.bold }}>✓</Text>
            ) : (
              <Text style={{
                fontSize: 13,
                fontFamily: fonts.bold,
                color: step === n ? '#fff' : colors.textTertiary,
              }}>{n}</Text>
            )}
          </View>
          {i < 2 && (
            <View style={{
              width: 48, height: 2,
              backgroundColor: step > n ? colors.primary : colors.border,
            }} />
          )}
        </View>
      ))}
    </View>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { session } = useAuth()

  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Profile
  const [fullName, setFullName]   = useState(session?.user?.user_metadata?.full_name ?? '')
  const [locale, setLocale]       = useState('fr')
  const [timezone, setTimezone]   = useState('Europe/Paris')

  // Step 2 — First contact
  const [cFirstName, setCFirstName] = useState('')
  const [cLastName,  setCLastName]  = useState('')
  const [cRole, setCRole]           = useState<ContactRole>('prospect')
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)

  // Step 3 — First appointment
  const [apptTitle, setApptTitle] = useState('')
  const [apptDate,  setApptDate]  = useState(new Date().toISOString().split('T')[0])
  const [apptTime,  setApptTime]  = useState('09:00')

  async function completeOnboarding() {
    if (!session) return
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', session.user.id)
    router.replace('/(app)')
  }

  async function handleStep1() {
    setError(null)
    if (!fullName.trim()) { setError(t('onboarding.error_name')); return }
    setBusy(true)
    try {
      await supabase.from('profiles').update({
        full_name: fullName.trim(),
        locale,
        timezone,
      }).eq('id', session!.user.id)
      i18n.changeLanguage(locale)
      setStep(2)
    } catch {
      setError(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleStep2() {
    setError(null)
    if (!cFirstName.trim() && !cLastName.trim()) { setError(t('onboarding.error_contact')); return }
    setBusy(true)
    try {
      const displayName = [cFirstName.trim(), cLastName.trim()].filter(Boolean).join(' ')
      const created = await createClient(session!.user.id, {
        first_name: cFirstName.trim() || null,
        full_name:  displayName,
        email: null, phone: null, status: 'prospect',
        inscription_date: new Date().toISOString().split('T')[0],
        birth_date: null, profession: null, children: null,
        source: null, country: null, client_type: null,
        interests: [], particularities: null,
        medical_treatment: false, medical_notes: null,
        doterra_id: null, language: locale,
        next_lrp_date: null, welcome_email_sent: false,
        first_contact_date: null, first_purchase_date: null,
        acquisition_source: null, journey_stage: null,
        next_action_date: null, next_action_type: null,
        referrals_count: 0, referral_count: 0,
        network_potential: null, contact_role: cRole,
        sponsor_id: null,
      })
      setCreatedClientId(created.id)
      setStep(3)
    } catch {
      setError(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleStep3() {
    setError(null)
    if (!apptTitle.trim() || !apptDate) { setError(t('onboarding.error_appt')); return }
    setBusy(true)
    try {
      const startAt = `${apptDate}T${apptTime}:00`
      const endAt   = `${apptDate}T${String(parseInt(apptTime.split(':')[0]) + 1).padStart(2, '0')}:${apptTime.split(':')[1]}:00`
      await createAppointment({
        client_id:        createdClientId ?? undefined,
        title:            apptTitle.trim(),
        appointment_type: 'discovery_call',
        status:           'scheduled',
        start_at:         startAt,
        end_at:           endAt,
        timezone:         timezone,
      })
      await completeOnboarding()
    } catch {
      setError(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const stepTitles = [
    t('onboarding.step1_title'), t('onboarding.step2_title'), t('onboarding.step3_title'),
  ]
  const stepSubs = [
    t('onboarding.step1_sub'), t('onboarding.step2_sub'), t('onboarding.step3_sub'),
  ]

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ─────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.logo}>ORYALIS</Text>
            <Text style={styles.stepLabel}>{t('onboarding.step_of', { current: step, total: TOTAL_STEPS })}</Text>
          </View>

          {/* ── Stepper ────────────────────────────────────── */}
          <Stepper step={step} colors={colors} />

          {/* ── Step card ──────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>
            <Text style={styles.stepSub}>{stepSubs[step - 1]}</Text>

            {/* ─ Step 1 ─ */}
            {step === 1 && (
              <View style={styles.fields}>
                <Input
                  label={t('onboarding.full_name')}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('onboarding.full_name_placeholder')}
                  autoCapitalize="words"
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('onboarding.language')}</Text>
                  <View style={styles.chipRow}>
                    {LANGUAGES.map(l => (
                      <TouchableOpacity
                        key={l.value}
                        style={[styles.chip, locale === l.value && styles.chipActive]}
                        onPress={() => setLocale(l.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, locale === l.value && styles.chipTextActive]}>
                          {l.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('onboarding.timezone')}</Text>
                  <View style={styles.chipRow}>
                    {TIMEZONES.map(tz => (
                      <TouchableOpacity
                        key={tz.value}
                        style={[styles.chip, timezone === tz.value && styles.chipActive]}
                        onPress={() => setTimezone(tz.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, timezone === tz.value && styles.chipTextActive]}>
                          {tz.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ─ Step 2 ─ */}
            {step === 2 && (
              <View style={styles.fields}>
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Input label={t('onboarding.contact_firstname')} value={cFirstName} onChangeText={setCFirstName} autoCapitalize="words" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label={t('onboarding.contact_lastname')} value={cLastName} onChangeText={setCLastName} autoCapitalize="words" />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('onboarding.contact_role')}</Text>
                  <View style={styles.chipRow}>
                    {ROLES.map(r => (
                      <TouchableOpacity
                        key={r.value}
                        style={[styles.chip, cRole === r.value && styles.chipActive]}
                        onPress={() => setCRole(r.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.chipEmoji}>{r.emoji}</Text>
                        <Text style={[styles.chipText, cRole === r.value && styles.chipTextActive]}>
                          {t(`clients.contact_role.${r.value}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ─ Step 3 ─ */}
            {step === 3 && (
              <View style={styles.fields}>
                <Input
                  label={t('onboarding.appt_title')}
                  value={apptTitle}
                  onChangeText={setApptTitle}
                  placeholder={t('onboarding.appt_title_placeholder')}
                />
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Input label={t('onboarding.appt_date')} value={apptDate} onChangeText={setApptDate} placeholder="YYYY-MM-DD" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label={t('onboarding.appt_time')} value={apptTime} onChangeText={setApptTime} placeholder="09:00" />
                  </View>
                </View>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* ── Actions ────────────────────────────────────── */}
          <View style={styles.actions}>
            <Button
              label={step < TOTAL_STEPS ? t('onboarding.next') : t('onboarding.finish')}
              onPress={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}
              loading={busy}
            />
            <TouchableOpacity style={styles.skipBtn} onPress={completeOnboarding} activeOpacity={0.7}>
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { padding: 24, paddingTop: 60, paddingBottom: 48, maxWidth: 480, alignSelf: 'center', width: '100%' },

  header:    { alignItems: 'center', marginBottom: 32, gap: 8 },
  logo:      { fontSize: 28, fontFamily: fonts.display, letterSpacing: 4, color: colors.primary },
  stepLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  stepTitle: { fontSize: 22, fontFamily: fonts.display, color: colors.text, marginBottom: 4 },
  stepSub:   { fontSize: 14, fontFamily: fonts.body,    color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },

  fields:    { gap: 16 },
  fieldRow:  { flexDirection: 'row', gap: 12 },
  fieldGroup:{ gap: 8 },
  fieldLabel:{ fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border },
  chipActive:   { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipEmoji:    { fontSize: 13 },
  chipText:     { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontFamily: fonts.semibold },

  error:  { fontSize: 13, color: colors.danger, backgroundColor: colors.dangerLight, borderRadius: 8, padding: 10, marginTop: 8 },

  actions:  { gap: 12 },
  skipBtn:  { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textTertiary },
  })
}
