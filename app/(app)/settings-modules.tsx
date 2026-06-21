import { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { useAppConfig } from '@/features/settings/AppConfigProvider'
import type { ModuleKey } from '@/shared/lib/types'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

const MODULES: { key: ModuleKey; icon: string; label: string; desc: string }[] = [
  { key: 'products',      icon: '📦', label: 'Catalogue produits',    desc: 'Fiches produits, recommandations clients' },
  { key: 'renewals_lrp',  icon: '🔄', label: 'Renouvellements / LRP', desc: 'Commandes récurrentes, LRP doTERRA' },
  { key: 'downline',      icon: '🌐', label: 'Réseau & Downline',      desc: 'Arbre réseau, gestion de l\'équipe' },
  { key: 'goals',         icon: '🎯', label: 'Objectifs mensuels',     desc: 'Suivi et progression des objectifs' },
  { key: 'calendar_sync', icon: '📅', label: 'Sync agenda',            desc: 'Synchronisation Google Agenda / natif' },
  { key: 'client_import', icon: '📤', label: 'Import clientèle',       desc: 'Import CSV depuis Excel' },
]

export default function ModulesSettingsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { isModuleActive, toggleModule } = useAppConfig()

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_modules'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>Désactiver un module masque son interface. Vos données sont conservées.</Text>
        <View style={styles.card}>
          {MODULES.map((mod, idx) => (
            <View key={mod.key} style={[styles.row, idx > 0 && styles.rowBorder]}>
              <View style={styles.iconWrap}><Text style={{ fontSize: 18 }}>{mod.icon}</Text></View>
              <View style={styles.body}>
                <Text style={styles.label}>{mod.label}</Text>
                <Text style={styles.desc}>{mod.desc}</Text>
              </View>
              <Switch value={isModuleActive(mod.key)} onValueChange={v => toggleModule(mod.key, v)}
                trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.card} />
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, maxWidth: 720, alignSelf: 'center', width: '100%' },
  hint: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 19 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgDim, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  desc: { fontSize: 12, fontFamily: fonts.body, color: colors.textTertiary },
  })
}
