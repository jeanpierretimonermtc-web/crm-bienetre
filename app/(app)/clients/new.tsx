import { useState } from 'react'
import { ScrollView, View, Text, Switch, StyleSheet, useWindowDimensions } from 'react-native'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { createClient } from '@/features/clients/clientService'
import { Input } from '@/shared/components/ui/Input'
import { TextArea } from '@/shared/components/ui/TextArea'
import { Button } from '@/shared/components/ui/Button'
import { colors } from '@/shared/theme/colors'
import type { ClientStatus } from '@/shared/lib/types'

const STATUSES: ClientStatus[] = ['prospect', 'active', 'inactive', 'vip', 'advisor']

export default function NewClientScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  const [firstName, setFirstName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<ClientStatus>('prospect')
  const [inscriptionDate, setInscriptionDate] = useState(new Date().toISOString().split('T')[0])
  const [birthDate, setBirthDate] = useState('')
  const [profession, setProfession] = useState('')
  const [children, setChildren] = useState('')
  const [source, setSource] = useState('')
  const [particularities, setParticularities] = useState('')
  const [medicalTreatment, setMedicalTreatment] = useState(false)
  const [medicalNotes, setMedicalNotes] = useState('')
  const [doterraId, setDoterraId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const displayName = [firstName.trim(), fullName.trim()].filter(Boolean).join(' ') || firstName.trim() || fullName.trim()

  async function handleSave() {
    setErrorMsg(null)
    if (!firstName.trim() && !fullName.trim()) {
      setErrorMsg(t('clients.error_name_required'))
      return
    }
    if (!session) { setErrorMsg(t('clients.error_session')); return }
    setLoading(true)
    try {
      await createClient(session.user.id, {
        first_name: firstName.trim() || null,
        full_name: displayName,
        email: email || null,
        phone: phone || null,
        status,
        inscription_date: inscriptionDate || null,
        birth_date: birthDate || null,
        profession: profession || null,
        children: children || null,
        source: source || null,
        particularities: particularities || null,
        medical_treatment: medicalTreatment,
        medical_notes: medicalNotes || null,
        doterra_id: doterraId || null,
        interests: [],
        client_type: null,
        language: 'fr',
        next_lrp_date: null,
        welcome_email_sent: false,
      })
      router.back()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error')
      setErrorMsg(msg)
      console.error('[createClient]', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('clients.add') }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>

        <Text style={styles.section}>{t('clients.sections.personal')}</Text>
        <View style={isWide ? styles.fieldRow : undefined}>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.first_name')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholder="Marie" />
          </View>
          <View style={isWide ? styles.fieldHalf : undefined}>
            <Input label={t('clients.fields.last_name')} value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholder="Dupont" />
          </View>
        </View>
        {displayName ? (
          <Text style={styles.namePreview}>{t('clients.name_preview')} : <Text style={styles.namePreviewBold}>{displayName}</Text></Text>
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

        <Text style={styles.section}>{t('clients.sections.status')}</Text>
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

        <Text style={styles.section}>{t('clients.sections.medical')}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('clients.fields.medical_treatment')}</Text>
          <Switch value={medicalTreatment} onValueChange={setMedicalTreatment} trackColor={{ true: colors.primary }} />
        </View>
        {medicalTreatment && (
          <TextArea label={t('clients.fields.medical_notes')} value={medicalNotes} onChangeText={setMedicalNotes} />
        )}
        <TextArea label={`${t('clients.fields.particularities')} (${t('common.optional')})`} value={particularities} onChangeText={setParticularities} />

        <Text style={styles.section}>{t('clients.sections.doterra')}</Text>
        <Input label={`${t('clients.fields.doterra_id')} (${t('common.optional')})`} value={doterraId} onChangeText={setDoterraId} />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <Button label={t('common.save')} onPress={handleSave} loading={loading} />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  content:         { padding: 16, gap: 12, paddingBottom: 40 },
  contentWide:     { maxWidth: 720, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },
  fieldRow:        { flexDirection: 'row', gap: 12 },
  fieldHalf:       { flex: 1 },
  section:         { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  statusRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 10 },
  switchLabel:     { fontSize: 16, color: colors.text },
  namePreview:     { fontSize: 13, color: colors.textSecondary, paddingHorizontal: 4 },
  namePreviewBold: { fontWeight: '600', color: colors.primary },
  error:           { color: '#dc2626', fontSize: 14, textAlign: 'center', padding: 10, backgroundColor: '#fef2f2', borderRadius: 8 },
})
