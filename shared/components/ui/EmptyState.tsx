import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

interface Props {
  message: string
  icon?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, icon = '📭', actionLabel, onAction }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    icon:       { fontSize: 40 },
    message:    { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary, textAlign: 'center' },
    actionBtn:  { marginTop: 4, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
    actionText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.textInverse },
  })
}
