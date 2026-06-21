import { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { useProfileData } from '@/features/settings/useProfileData'
import { useAuth } from '@/features/auth/AuthProvider'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

export default function ContactSettingsScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { data, update, save, loading, saving, saved } = useProfileData()

  if (loading) return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_contact'))} />
      <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
    </>
  )

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_contact'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('settings.email')}</Text>
          <View style={styles.disabled}><Text style={styles.disabledText}>{session?.user?.email}</Text></View>
        </View>
        <Input label={t('settings.phone')} value={data.phone ?? ''} onChangeText={v => update({ phone: v })} keyboardType="phone-pad" placeholder="+33 6 12 34 56 78" />
        <Input label={t('settings.website')} value={data.website ?? ''} onChangeText={v => update({ website: v })} keyboardType="url" autoCapitalize="none" placeholder="https://votresite.com" />
        <Input label={t('settings.linkedin')} value={data.linkedin_url ?? ''} onChangeText={v => update({ linkedin_url: v })} keyboardType="url" autoCapitalize="none" placeholder="https://linkedin.com/in/…" />
        <Button label={saved ? `✓  ${t('settings.saved')}` : t('settings.save')} onPress={() => save({ phone: data.phone, website: data.website, linkedin_url: data.linkedin_url })} loading={saving} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, maxWidth: 720, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  disabled: { backgroundColor: colors.bgDim, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13 },
  disabledText: { fontSize: 15, fontFamily: fonts.body, color: colors.textTertiary },
  })
}
