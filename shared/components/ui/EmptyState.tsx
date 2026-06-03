import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/shared/theme/colors'

interface Props {
  message: string
  icon?: string
}

export function EmptyState({ message, icon = '📭' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  icon:      { fontSize: 40 },
  message:   { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
})
