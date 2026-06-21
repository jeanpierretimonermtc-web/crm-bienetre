import { useState, useEffect, useMemo } from 'react'
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, Platform, Alert } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/shared/lib/supabase'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import i18n from '@/shared/i18n'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

const LANGUAGES = [
  { flag: '🇫🇷', label: 'Français', value: 'fr' },
  { flag: '🇬🇧', label: 'English',  value: 'en' },
]
const TIMEZONES = [
  { label: 'Paris (GMT+1)',        value: 'Europe/Paris'        },
  { label: 'London (GMT+0)',       value: 'Europe/London'       },
  { label: 'New York (GMT-5)',     value: 'America/New_York'    },
  { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles'  },
  { label: 'Dubai (GMT+4)',        value: 'Asia/Dubai'          },
  { label: 'Tokyo (GMT+9)',        value: 'Asia/Tokyo'          },
  { label: 'Sydney (GMT+11)',      value: 'Australia/Sydney'    },
]

function nameInitials(n: string) {
  const p = (n ?? '').trim().split(' ').filter(Boolean)
  if (!p.length) return '?'
  if (p.length === 1) return p[0][0].toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export default function ProfileSettingsScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [showTz,     setShowTz]     = useState(false)
  const [showPhoto,  setShowPhoto]  = useState(false)
  const [showUrl,    setShowUrl]    = useState(false)
  const [urlDraft,   setUrlDraft]   = useState('')

  const [avatarUrl,  setAvatarUrl]  = useState('')
  const [fullName,   setFullName]   = useState('')
  const [specialty,  setSpecialty]  = useState('')
  const [bio,        setBio]        = useState('')
  const [phone,      setPhone]      = useState('')
  const [website,    setWebsite]    = useState('')
  const [linkedin,   setLinkedin]   = useState('')
  const [company,    setCompany]    = useState('')
  const [city,       setCity]       = useState('')
  const [locale,     setLocale]     = useState('fr')
  const [timezone,   setTimezone]   = useState('Europe/Paris')

  useEffect(() => {
    if (!session?.user.id) return
    ;(async () => {
      try {
        const { data } = await supabase.from('profiles')
          .select('full_name,specialty,bio,phone,website,linkedin_url,company,city,locale,timezone,avatar_url')
          .eq('id', session.user.id).single()
        if (data) {
          setFullName(data.full_name ?? '')
          setSpecialty(data.specialty ?? '')
          setBio(data.bio ?? '')
          setPhone(data.phone ?? '')
          setWebsite(data.website ?? '')
          setLinkedin(data.linkedin_url ?? '')
          setCompany(data.company ?? '')
          setCity(data.city ?? '')
          setLocale(data.locale ?? 'fr')
          setTimezone(data.timezone ?? 'Europe/Paris')
          setAvatarUrl(data.avatar_url ?? '')
        }
      } finally { setLoading(false) }
    })()
  }, [session?.user.id])

  async function handleSave() {
    if (!session?.user.id) return
    setSaving(true); setSaved(false)
    try {
      await supabase.from('profiles').update({
        full_name: fullName.trim() || null, specialty: specialty.trim() || null,
        bio: bio.trim() || null, phone: phone.trim() || null,
        website: website.trim() || null, linkedin_url: linkedin.trim() || null,
        company: company.trim() || null, city: city.trim() || null,
        locale, timezone, updated_at: new Date().toISOString(),
      }).eq('id', session.user.id)
      if (i18n.language !== locale) await i18n.changeLanguage(locale)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  async function uploadImage(uri: string) {
    if (!session?.user.id) return
    setUploading(true)
    try {
      const res = await fetch(uri)
      const blob = await res.blob()
      const { error } = await supabase.storage.from('avatars').upload(`${session.user.id}.jpg`, blob, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${session.user.id}.jpg`)
      setAvatarUrl(publicUrl)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id)
    } catch (e) { console.error(e); Alert.alert('Erreur', "Vérifiez que le bucket 'avatars' existe dans Supabase Storage.") }
    finally { setUploading(false) }
  }

  async function pickCamera() {
    setShowPhoto(false)
    if (Platform.OS !== 'web') {
      const p = await ImagePicker.requestCameraPermissionsAsync()
      if (!p.granted) return
    }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.8 })
    if (!r.canceled && r.assets[0]) await uploadImage(r.assets[0].uri)
  }

  async function pickLibrary() {
    setShowPhoto(false)
    if (Platform.OS !== 'web') {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!p.granted) return
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 })
    if (!r.canceled && r.assets[0]) await uploadImage(r.assets[0].uri)
  }

  const initials   = nameInitials(fullName || session?.user?.email || '')
  const currentTz  = TIMEZONES.find(tz => tz.value === timezone)
  const currentLang = LANGUAGES.find(l => l.value === locale)

  if (loading) return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.nav_profile'))} />
      <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
    </>
  )

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.nav_profile'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setShowPhoto(true)} activeOpacity={0.85}>
            {uploading ? (
              <View style={styles.avatarBox}><ActivityIndicator color="#fff" /></View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarBox}><Text style={styles.avatarInitials}>{initials}</Text></View>
            )}
            <View style={styles.avatarEdit}><Text style={{ fontSize: 14 }}>📷</Text></View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>{t('settings.change_photo')}</Text>
        </View>

        {/* Identité */}
        <Text style={styles.sectionLabel}>{t('settings.section_identity').toUpperCase()}</Text>
        <View style={styles.card}>
          <Input label={t('settings.full_name')} value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" />
          <Input label={t('settings.specialty')} value={specialty} onChangeText={setSpecialty} placeholder={t('settings.specialty_placeholder')} />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('settings.bio')}</Text>
            <TextInput style={styles.textArea} value={bio} onChangeText={setBio} placeholder={t('settings.bio_placeholder')} placeholderTextColor={colors.textTertiary} multiline numberOfLines={3} />
          </View>
        </View>

        {/* Contact */}
        <Text style={styles.sectionLabel}>{t('settings.section_contact').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('settings.email')}</Text>
            <View style={styles.disabled}><Text style={styles.disabledText}>{session?.user?.email}</Text></View>
          </View>
          <Input label={t('settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+33 6 12 34 56 78" />
          <Input label={t('settings.website')} value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="https://votresite.com" />
          <Input label={t('settings.linkedin')} value={linkedin} onChangeText={setLinkedin} keyboardType="url" autoCapitalize="none" placeholder="https://linkedin.com/in/…" />
        </View>

        {/* Organisation */}
        <Text style={styles.sectionLabel}>{t('settings.section_org').toUpperCase()}</Text>
        <View style={styles.card}>
          <Input label={t('settings.company')} value={company} onChangeText={setCompany} placeholder="Cabinet Bien-Être Paris" />
          <Input label={t('settings.city')} value={city} onChangeText={setCity} placeholder="Paris" />
        </View>

        {/* Langue & région */}
        <Text style={styles.sectionLabel}>{t('settings.nav_preferences').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('settings.language')}</Text>
            <View style={styles.flagRow}>
              {LANGUAGES.map(l => (
                <TouchableOpacity key={l.value} style={[styles.flagBtn, locale === l.value && styles.flagBtnActive]} onPress={() => setLocale(l.value)} activeOpacity={0.75}>
                  <Text style={styles.flagEmoji}>{l.flag}</Text>
                  <Text style={[styles.flagLabel, locale === l.value && styles.flagLabelActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('settings.timezone')}</Text>
            <TouchableOpacity style={styles.selectRow} onPress={() => setShowTz(true)} activeOpacity={0.75}>
              <Text style={styles.selectRowIcon}>🌐</Text>
              <Text style={styles.selectRowText} numberOfLines={1}>{currentTz?.label ?? timezone}</Text>
              <Text style={styles.selectArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button label={saved ? `✓  ${t('settings.saved')}` : t('settings.save')} onPress={handleSave} loading={saving} />
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Photo menu */}
      <Modal visible={showPhoto} transparent animationType="slide" onRequestClose={() => setShowPhoto(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPhoto(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('settings.change_photo')}</Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.sheetRow} onPress={pickCamera} activeOpacity={0.75}>
                <Text style={styles.sheetIcon}>📷</Text><Text style={styles.sheetText}>{t('settings.photo_camera')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sheetRow} onPress={pickLibrary} activeOpacity={0.75}>
              <Text style={styles.sheetIcon}>🖼️</Text><Text style={styles.sheetText}>{t('settings.photo_library')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetRow} onPress={() => { setShowPhoto(false); setShowUrl(true) }} activeOpacity={0.75}>
              <Text style={styles.sheetIcon}>🔗</Text><Text style={styles.sheetText}>{t('settings.photo_url')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* URL input */}
      <Modal visible={showUrl} transparent animationType="slide" onRequestClose={() => setShowUrl(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowUrl(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('settings.photo_url')}</Text>
            <TextInput style={styles.urlInput} value={urlDraft} onChangeText={setUrlDraft} placeholder={t('settings.photo_url_placeholder')} placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="url" autoFocus />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => { if (!urlDraft.trim() || !session?.user.id) return; setAvatarUrl(urlDraft.trim()); await supabase.from('profiles').update({ avatar_url: urlDraft.trim() }).eq('id', session.user.id); setShowUrl(false); setUrlDraft('') }} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Timezone */}
      <Modal visible={showTz} transparent animationType="slide" onRequestClose={() => setShowTz(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowTz(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('settings.timezone')}</Text>
            {TIMEZONES.map(tz => (
              <TouchableOpacity key={tz.value} style={[styles.sheetRow, timezone === tz.value && { backgroundColor: colors.primaryLight }]} onPress={() => { setTimezone(tz.value); setShowTz(false) }} activeOpacity={0.75}>
                <Text style={[styles.sheetText, timezone === tz.value && { color: colors.primary, fontFamily: fonts.semibold }]}>{tz.label}</Text>
                {timezone === tz.value && <Text style={{ color: colors.primary, fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 10, maxWidth: 720, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatarImg:  { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.primaryLight },
  avatarBox:  { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontFamily: fonts.bold, color: '#fff' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarHint: { fontSize: 12, fontFamily: fonts.medium, color: colors.textTertiary },
  sectionLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.6, paddingHorizontal: 2, paddingTop: 6 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: fonts.body, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
  disabled: { backgroundColor: colors.bgDim, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13 },
  disabledText: { fontSize: 15, fontFamily: fonts.body, color: colors.textTertiary },
  flagRow: { flexDirection: 'row', gap: 8 },
  flagBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg },
  flagBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  flagEmoji: { fontSize: 20 },
  flagLabel: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  flagLabelActive: { color: colors.primary, fontFamily: fonts.semibold },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 12 },
  selectRowIcon: { fontSize: 16 },
  selectRowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  selectArrow: { fontSize: 18, color: colors.textTertiary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 44, gap: 4 },
  sheetTitle: { fontSize: 17, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8, textAlign: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  sheetIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  sheetText: { fontSize: 15, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  urlInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: fonts.body, color: colors.text, marginBottom: 8 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: fonts.semibold, color: '#fff' },
  })
}
