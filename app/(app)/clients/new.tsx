import { useState } from 'react'
import { ScrollView, View, Text, Switch, StyleSheet } from 'react-native'
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

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<ClientStatus>('prospect')
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

  async function handleSave() {
    setErrorMsg(null)
    if (!fullName.trim()) { setErrorMsg(t('clients.fields.full_name') + ' requis'); return }
    if (!session) { setErrorMsg('Session expirée, reconnectez-vous'); return }
    setLoading(true)
    try {
      await createClient(session.user.id, {
        full_name: fullName.trim(),
        email: email || null,
        phone: phone || null,
        status,
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <Text style={styles.section}>{t('clients.sections.personal')}</Text>
        <Input label={t('clients.fields.full_name')} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <Input label={t('clients.fields.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label={t('clients.fields.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label={`${t('clients.fields.birth_date')} (${t('common.optional')})`} value={birthDate} onChangeText={setBirthDate} placeholder="AAAA-MM-JJ" />
        <Input label={`${t('clients.fields.profession')} (${t('common.optional')})`} value={profession} onChangeText={setProfession} />
        <Input label={`${t('clients.fields.children')} (${t('common.optional')})`} value={children} onChangeText={setChildren} />
        <Input label={`${t('clients.fields.source')} (${t('common.optional')})`} value={source} onChangeText={setSource} />

        <Text style={styles.section}>Statut</Text>
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
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { padding: 16, gap: 12, paddingBottom: 40 },
  section:    { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  statusRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 10 },
  switchLabel:{ fontSize: 16, color: colors.text },
  error:      { color: '#dc2626', fontSize: 14, textAlign: 'center', padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
})
