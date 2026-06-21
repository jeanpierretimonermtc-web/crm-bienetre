import { useMemo } from 'react'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { useProfileData } from '@/features/settings/useProfileData'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

export default function OrgSettingsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { data, update, save, loading, saving, saved } = useProfileData()

  if (loading) return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_org'))} />
      <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
    </>
  )

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_org'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input label={t('settings.company')} value={data.company ?? ''} onChangeText={v => update({ company: v })} placeholder="Cabinet Bien-Être Paris" />
        <Input label={t('settings.city')} value={data.city ?? ''} onChangeText={v => update({ city: v })} placeholder="Paris" />
        <Button label={saved ? `✓  ${t('settings.saved')}` : t('settings.save')} onPress={() => save({ company: data.company, city: data.city })} loading={saving} />
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
  })
}
