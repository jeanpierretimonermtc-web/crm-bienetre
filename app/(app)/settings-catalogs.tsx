import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { useCatalogPrefs } from '@/features/catalogs/CatalogPrefsProvider'
import { getCatalogs } from '@/features/catalogs/catalogService'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Catalog } from '@/shared/lib/types'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

export default function CatalogsSettingsScreen() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { activeSlugs, setActiveSlugs } = useCatalogPrefs()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!session?.user.id) return
    getCatalogs(session.user.id)
      .then(all => setCatalogs(all.filter(c => c.type === 'official')))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session?.user.id])

  function isActive(slug: string | null) { return !slug ? false : !activeSlugs || activeSlugs.includes(slug) }

  function toggle(slug: string) {
    const all = catalogs.map(c => c.slug!).filter(Boolean)
    let next: string[] | null
    if (!activeSlugs)                   { next = all.filter(s => s !== slug); if (!next.length) return }
    else if (activeSlugs.includes(slug)) { next = activeSlugs.filter(s => s !== slug); if (!next.length) return }
    else { next = [...activeSlugs, slug]; if (all.every(s => next!.includes(s))) next = null }
    setActiveSlugs(next)
  }

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_catalogs'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
          <View style={styles.card}>
            {catalogs.length === 0 && <Text style={styles.empty}>Aucun catalogue disponible.</Text>}
            {catalogs.map((cat, idx) => (
              <View key={cat.id} style={[styles.row, idx > 0 && styles.rowBorder]}>
                <View style={[styles.icon, { backgroundColor: cat.color + '20' }]}><Text style={{ fontSize: 20 }}>{cat.icon}</Text></View>
                <View style={styles.body}>
                  <Text style={styles.name}>{cat.name}</Text>
                  <Text style={styles.slug}>{cat.slug}</Text>
                </View>
                <Switch value={isActive(cat.slug)} onValueChange={(_v: boolean): void => { if (cat.slug) toggle(cat.slug) }} trackColor={{ true: cat.color, false: colors.border }} thumbColor={colors.card} />
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, maxWidth: 720, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  slug: { fontSize: 11, fontFamily: fonts.body, color: colors.textTertiary },
  empty: { fontSize: 14, fontFamily: fonts.body, color: colors.textTertiary, padding: 16, textAlign: 'center' },
  })
}
