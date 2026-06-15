import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { createAppointment, getNextAppointmentNumber } from '@/features/appointments/appointmentService'
import { Input } from '@/shared/components/ui/Input'
import { TextArea } from '@/shared/components/ui/TextArea'
import { Button } from '@/shared/components/ui/Button'
import { colors, statusColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Client } from '@/shared/lib/types'

function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function NewAppointmentScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { date: paramDate, time: paramTime, clientId: paramClientId } =
    useLocalSearchParams<{ date?: string; time?: string; clientId?: string }>()
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [date,   setDate]   = useState(paramDate ?? new Date().toISOString().split('T')[0])
  const [time,   setTime]   = useState(paramTime ?? '')
  const [themes, setThemes] = useState('')

  const [saving,   setSaving]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Pre-load client when navigating from a client's page
  useEffect(() => {
    if (!paramClientId || !session) return
    supabase
      .from('clients')
      .select('id, full_name, first_name, email, status')
      .eq('id', paramClientId)
      .single()
      .then(({ data }) => { if (data) setSelectedClient(data as Client) })
  }, [paramClientId, session])

  // Live search
  useEffect(() => {
    if (searchQuery.length < 2 || !session) { setSearchResults([]); return }
    let cancelled = false
    setSearchLoading(true)
    supabase
      .from('clients')
      .select('id, full_name, first_name, email, status')
      .eq('user_id', session.user.id)
      .ilike('full_name', `%${searchQuery}%`)
      .limit(8)
      .then(({ data }) => {
        if (!cancelled) {
          setSearchResults((data ?? []) as Client[])
          setSearchLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [searchQuery, session])

  async function handleSave() {
    setErrorMsg(null)
    if (!selectedClient) { setErrorMsg(t('appointments.error_client_required')); return }
    if (!date)           { setErrorMsg(t('appointments.error_date_required'));   return }
    if (!session) return

    const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`

    setSaving(true)
    try {
      const num = await getNextAppointmentNumber(selectedClient.id)
      await createAppointment(session.user.id, {
        client_id: selectedClient.id,
        appointment_number: num,
        appointment_date: iso,
        themes_discussed: themes.trim() || null,
        solutions_proposed: null,
        recap_sent: false,
        next_appointment_date: null,
      })
      router.back()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : t('common.error'))
      console.error('[newAppointment]', e)
    } finally {
      setSaving(false)
    }
  }

  const sc = selectedClient ? (statusColors[selectedClient.status] ?? null) : null

  return (
    <>
      <Stack.Screen options={{ title: t('appointments.add'), headerBackTitle: '' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Client ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('appointments.select_client')}</Text>

        {selectedClient ? (
          <View style={styles.selectedCard}>
            <View style={[styles.avatar, { backgroundColor: sc?.bg ?? colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: sc?.text ?? colors.primaryAction }]}>
                {initials(selectedClient.full_name)}
              </Text>
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selectedClient.full_name}</Text>
              {selectedClient.email ? (
                <Text style={styles.selectedEmail}>{selectedClient.email}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setSelectedClient(null); setSearchQuery('') }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Input
              label=""
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('clients.search')}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={colors.primaryAction} style={styles.searchLoader} />
            ) : null}
            {searchResults.length > 0 && (
              <View style={styles.resultsBox}>
                {searchResults.map((c, idx) => {
                  const csc = statusColors[c.status] ?? null
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.resultRow, idx > 0 && styles.resultRowBorder]}
                      onPress={() => { setSelectedClient(c); setSearchQuery(''); setSearchResults([]) }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.resultAvatar, { backgroundColor: csc?.bg ?? colors.primaryLight }]}>
                        <Text style={[styles.resultAvatarText, { color: csc?.text ?? colors.primaryAction }]}>
                          {initials(c.full_name)}
                        </Text>
                      </View>
                      <View style={styles.resultTexts}>
                        <Text style={styles.resultName}>{c.full_name}</Text>
                        {c.email ? <Text style={styles.resultEmail}>{c.email}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </>
        )}

        {/* ── Date & Heure ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('appointments.date')} & {t('appointments.time')}</Text>
        <View style={isWide ? styles.fieldRow : styles.fieldCol}>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input
              label={t('appointments.date')}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input
              label={`${t('appointments.time')} (${t('common.optional')})`}
              value={time}
              onChangeText={setTime}
              placeholder="09:00"
            />
          </View>
        </View>

        {/* ── Notes ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          {t('appointments.themes')} ({t('common.optional')})
        </Text>
        <TextArea
          label={t('appointments.themes')}
          value={themes}
          onChangeText={setThemes}
          minHeight={80}
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <Button label={t('common.save')} onPress={handleSave} loading={saving} />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { padding: 16, gap: 14, paddingBottom: 48 },
  contentWide: { maxWidth: 640, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },

  sectionLabel: {
    fontSize: 12, fontFamily: fonts.bold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4,
  },

  // ── Selected client card ──────────────────────────────────────────────────
  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: colors.primaryLighter,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: fonts.bold },
  selectedInfo: { flex: 1, gap: 2 },
  selectedName:  { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  selectedEmail: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  clearBtn:     { padding: 6 },
  clearBtnText: { fontSize: 18, color: colors.textTertiary, lineHeight: 20 },

  // ── Search results ─────────────────────────────────────────────────────────
  searchLoader: { marginTop: 4 },
  resultsBox: {
    backgroundColor: colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  resultRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  resultRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resultAvatarText: { fontSize: 13, fontFamily: fonts.bold },
  resultTexts:  { flex: 1, gap: 1 },
  resultName:   { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  resultEmail:  { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },

  // ── Date/time row ──────────────────────────────────────────────────────────
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldCol: { gap: 12 },
  fieldHalf: { flex: 1 },

  // ── Error ─────────────────────────────────────────────────────────────────
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', padding: 10, backgroundColor: colors.dangerLight, borderRadius: 8 },
})
