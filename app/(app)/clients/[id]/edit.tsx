import { useState, useEffect } from 'react'
import { ScrollView, View, Text, Switch, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { getClient, updateClient, deleteClient } from '@/features/clients/clientService'
import { Input } from '@/shared/components/ui/Input'
import { TextArea } from '@/shared/components/ui/TextArea'
import { Button } from '@/shared/components/ui/Button'
import { colors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Client, ClientStatus } from '@/shared/lib/types'

const STATUSES: ClientStatus[] = ['prospect', 'active', 'inactive', 'vip', 'advisor']

export default function EditClientScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(true)

  // Form fields
  const [firstName, setFirstName]       = useState('')
  const [lastName, setLastName]         = useState('')
  const [email, setEmail]               = useState('')
  const [phone, setPhone]               = useState('')
  const [status, setStatus]             = useState<ClientStatus>('prospect')
  const [inscriptionDate, setInscriptionDate] = useState('')
  const [birthDate, setBirthDate]       = useState('')
  const [profession, setProfession]     = useState('')
  const [children, setChildren]         = useState('')
  const [source, setSource]             = useState('')
  const [clientType, setClientType]     = useState('')
  const [interests, setInterests]       = useState('')
  const [particularities, setParticularities] = useState('')
  const [medicalTreatment, setMedicalTreatment] = useState(false)
  const [medicalNotes, setMedicalNotes] = useState('')
  const [doterraId, setDoterraId]       = useState('')

  const [saving, setSaving]         = useState(false)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  // Load client and pre-populate
  useEffect(() => {
    if (!id) return
    getClient(id)
      .then(c => {
        setClient(c)
        const fn = (c.first_name ?? '').trim()
        const fullN = (c.full_name ?? '').trim()
        // Extract last name by removing first name prefix
        const ln = fn && fullN.startsWith(fn) ? fullN.slice(fn.length).trim() : fullN
        setFirstName(fn)
        setLastName(ln)
        setEmail(c.email ?? '')
        setPhone(c.phone ?? '')
        setStatus(c.status)
        setInscriptionDate(c.inscription_date ?? '')
        setBirthDate(c.birth_date ?? '')
        setProfession(c.profession ?? '')
        setChildren(c.children ?? '')
        setSource(c.source ?? '')
        setClientType(c.client_type ?? '')
        setInterests((c.interests ?? []).join(', '))
        setParticularities(c.particularities ?? '')
        setMedicalTreatment(c.medical_treatment ?? false)
        setMedicalNotes(c.medical_notes ?? '')
        setDoterraId(c.doterra_id ?? '')
      })
      .catch(e => console.error('[getClient]', e))
      .finally(() => setClientLoading(false))
  }, [id])

  async function handleSave() {
    setErrorMsg(null)
    const fn = firstName.trim()
    const ln = lastName.trim()
    if (!fn && !ln) { setErrorMsg(t('clients.error_name_required')); return }

    const displayName = [fn, ln].filter(Boolean).join(' ')
    const interestList = interests.split(',').map(s => s.trim()).filter(Boolean)

    setSaving(true)
    try {
      await updateClient(id, {
        first_name: fn || null,
        full_name: displayName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
        inscription_date: inscriptionDate || null,
        birth_date: birthDate || null,
        profession: profession.trim() || null,
        children: children.trim() || null,
        source: source.trim() || null,
        client_type: clientType.trim() || null,
        interests: interestList,
        particularities: particularities.trim() || null,
        medical_treatment: medicalTreatment,
        medical_notes: medicalNotes.trim() || null,
        doterra_id: doterraId.trim() || null,
      })
      router.back()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : t('common.error'))
      console.error('[updateClient]', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setSaving(true)
    try {
      await deleteClient(id)
      router.push('/(app)/clients')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : t('common.error'))
      console.error('[deleteClient]', e)
    } finally {
      setSaving(false)
    }
  }

  if (clientLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primaryAction} size="large" />
      </View>
    )
  }

  const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  return (
    <>
      <Stack.Screen options={{ title: client?.full_name ?? t('common.edit'), headerBackTitle: '' }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>

        {/* ── Infos personnelles ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('clients.sections.personal')}</Text>

        <View style={isWide ? styles.fieldRow : undefined}>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.first_name')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholder="Marie" />
          </View>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.last_name')} value={lastName} onChangeText={setLastName} autoCapitalize="words" placeholder="Dupont" />
          </View>
        </View>
        {displayName ? (
          <Text style={styles.namePreview}>
            {t('clients.name_preview')} : <Text style={styles.namePreviewBold}>{displayName}</Text>
          </Text>
        ) : null}
        <View style={isWide ? styles.fieldRow : undefined}>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <View style={isWide ? styles.fieldRow : undefined}>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.inscription_date')} value={inscriptionDate} onChangeText={setInscriptionDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={`${t('clients.fields.birth_date')} (${t('common.optional')})`} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
          </View>
        </View>
        <Input label={`${t('clients.fields.profession')} (${t('common.optional')})`} value={profession} onChangeText={setProfession} />
        <Input label={`${t('clients.fields.children')} (${t('common.optional')})`} value={children} onChangeText={setChildren} />
        <Input label={`${t('clients.fields.source')} (${t('common.optional')})`} value={source} onChangeText={setSource} />
        <Input label={`${t('clients.fields.client_type')} (${t('common.optional')})`} value={clientType} onChangeText={setClientType} />
        <Input
          label={`${t('clients.fields.interests')} (${t('common.optional')})`}
          value={interests}
          onChangeText={setInterests}
          placeholder="Nutrition, Sommeil, Stress"
        />

        {/* ── Statut ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('clients.sections.status')}</Text>
        <View style={styles.statusRow}>
          {STATUSES.map(s => (
            <Button
              key={s}
              label={t(`clients.status.${s}`)}
              variant={status === s ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setStatus(s)}
            />
          ))}
        </View>

        {/* ── Médical ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('clients.sections.medical')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('clients.fields.medical_treatment')}</Text>
          <Switch
            value={medicalTreatment}
            onValueChange={setMedicalTreatment}
            trackColor={{ true: colors.primaryAction }}
          />
        </View>
        {medicalTreatment && (
          <TextArea label={t('clients.fields.medical_notes')} value={medicalNotes} onChangeText={setMedicalNotes} />
        )}
        <TextArea
          label={`${t('clients.fields.particularities')} (${t('common.optional')})`}
          value={particularities}
          onChangeText={setParticularities}
        />

        {/* ── doTERRA ───────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('clients.sections.doterra')}</Text>
        <Input label={`${t('clients.fields.doterra_id')} (${t('common.optional')})`} value={doterraId} onChangeText={setDoterraId} />

        {/* ── Erreur + Sauvegarde ───────────────────────────────────── */}
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <Button label={t('common.save')} onPress={handleSave} loading={saving} />

        {/* ── Zone de danger ────────────────────────────────────────── */}
        <View style={styles.dangerZone}>
          {confirmDel ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>{t('common.confirm_delete')}</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmDel(false)}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
                  <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.deleteTrigger} onPress={() => setConfirmDel(true)}>
              <Text style={styles.deleteTriggerText}>🗑 {t('common.delete')} {client?.full_name}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container:   { flex: 1, backgroundColor: colors.bg },
  content:     { padding: 16, gap: 12, paddingBottom: 40 },
  contentWide: { maxWidth: 720, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },
  fieldRow:    { flexDirection: 'row', gap: 12 },
  fieldHalf:   { flex: 1 },

  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  namePreview:     { fontSize: 13, color: colors.textSecondary, paddingHorizontal: 4 },
  namePreviewBold: { fontFamily: fonts.semibold, color: colors.primary },

  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 10 },
  switchLabel: { fontSize: 16, fontFamily: fonts.body, color: colors.text },

  error: { color: '#dc2626', fontSize: 14, textAlign: 'center', padding: 10, backgroundColor: '#fef2f2', borderRadius: 8 },

  // ── Danger zone ───────────────────────────────────────────────────────────
  dangerZone:   { marginTop: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  deleteTrigger:     { alignItems: 'center', padding: 14 },
  deleteTriggerText: { fontSize: 14, fontFamily: fonts.medium, color: colors.danger },

  confirmRow:  { gap: 12 },
  confirmText: { fontSize: 14, fontFamily: fonts.body, color: colors.text, textAlign: 'center' },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  deleteBtn:   { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontFamily: fonts.semibold, color: '#ffffff' },
})
