import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ClientStatus } from '@/shared/lib/types'
import { fonts } from '@/shared/theme/fonts'
import { useAppConfig } from '@/features/settings/AppConfigProvider'

interface Props {
  status: ClientStatus
}

export function StatusBadge({ status }: Props) {
  const { statusColors } = useTheme()
  const { getStatusLabel } = useAppConfig()
  const { bg, text } = statusColors[status] ?? { bg: '#F1F5F9', text: '#475569' }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{getStatusLabel(status)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontFamily: fonts.semibold },
})
