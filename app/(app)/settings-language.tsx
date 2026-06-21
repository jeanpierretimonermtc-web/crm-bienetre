import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { useProfileData } from '@/features/settings/useProfileData'
import i18n from '@/shared/i18n'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

const LANGUAGES = [
  { flag: '🇫🇷', label: 'Français', value: 'fr' },
  { flag: '🇬🇧', label: 'English',  value: 'en' },
]
const TIMEZONES = [
  { label: 'Paris (GMT+1)',       value: 'Europe/Paris'       },
  { label: 'London (GMT+0)',      value: 'Europe/London'      },
  { label: 'New York (GMT-5)',    value: 'America/New_York'   },
  { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles'},
  { label: 'Dubai (GMT+4)',       value: 'Asia/Dubai'         },
  { label: 'Tokyo (GMT+9)',       value: 'Asia/Tokyo'         },
  { label: 'Sydney (GMT+11)',     value: 'Australia/Sydney'   },
]

export default function LanguageSettingsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { data, update, save, loading, saving, saved } = useProfileData()
  const [showTz, setShowTz] = useState(false)

  const currentTz   = TIMEZONES.find(tz => tz.value === data.timezone)
  const currentLang = LANGUAGES.find(l  => l.value  === data.locale)

  async function handleSave() {
    const ok = await save({ locale: data.locale, timezone: data.timezone })
    if (ok && i18n.language !== data.locale) await i18n.changeLanguage(data.locale)
  }

  if (loading) return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.nav_preferences'))} />
      <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
    </>
  )

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.nav_preferences'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.label}>{t('settings.language').toUpperCase()}</Text>
        <View style={styles.flagRow}>
          {LANGUAGES.map(l => (
            <TouchableOpacity key={l.value} style={[styles.flagBtn, data.locale === l.value && styles.flagBtnActive]} onPress={() => update({ locale: l.value })} activeOpacity={0.75}>
              <Text style={styles.flagEmoji}>{l.flag}</Text>
              <Text style={[styles.flagLabel, data.locale === l.value && { color: colors.primary, fontFamily: fonts.semibold }]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 8 }]}>{t('settings.timezone').toUpperCase()}</Text>
        <TouchableOpacity style={styles.selectRow} onPress={() => setShowTz(true)} activeOpacity={0.75}>
          <Text style={styles.selectIcon}>🌐</Text>
          <Text style={styles.selectText} numberOfLines={1}>{currentTz?.label ?? data.timezone}</Text>
          <Text style={styles.selectArrow}>›</Text>
        </TouchableOpacity>

        <Button label={saved ? `✓  ${t('settings.saved')}` : t('settings.save')} onPress={handleSave} loading={saving} />
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showTz} transparent animationType="slide" onRequestClose={() => setShowTz(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowTz(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('settings.timezone')}</Text>
            {TIMEZONES.map(tz => (
              <TouchableOpacity key={tz.value} style={[styles.tzRow, data.timezone === tz.value && { backgroundColor: colors.primaryLight }]} onPress={() => { update({ timezone: tz.value }); setShowTz(false) }} activeOpacity={0.75}>
                <Text style={[styles.tzLabel, data.timezone === tz.value && { color: colors.primary, fontFamily: fonts.semibold }]}>{tz.label}</Text>
                {data.timezone === tz.value && <Text style={{ color: colors.primary }}>✓</Text>}
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
  content: { padding: 16, gap: 12, maxWidth: 720, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  label: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.6 },
  flagRow: { flexDirection: 'row', gap: 10 },
  flagBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  flagBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  flagEmoji: { fontSize: 22 },
  flagLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 14 },
  selectIcon: { fontSize: 18 },
  selectText: { flex: 1, fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  selectArrow: { fontSize: 20, color: colors.textTertiary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 44, gap: 2 },
  sheetTitle: { fontSize: 17, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8, textAlign: 'center' },
  tzRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  tzLabel: { fontSize: 15, fontFamily: fonts.body, color: colors.text },
  })
}
