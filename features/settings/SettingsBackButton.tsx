import { useMemo } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { LineIcon } from '@/shared/components/ui/LineIcon'

export function SettingsBackButton() {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  function handlePress() {
    router.replace('/(app)/settings' as any)
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Retour aux parametres"
      hitSlop={10}
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.75}
    >
      <LineIcon name="chevronLeft" size={20} color={colors.text} strokeWidth={2.4} />
    </TouchableOpacity>
  )
}

export function settingsScreenOptions(title: string) {
  return {
    headerShown: true,
    title,
    headerBackTitle: '',
    headerLeft: () => <SettingsBackButton />,
  }
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDim,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 2,
    },
  })
}
