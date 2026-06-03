import { View, Text, StyleSheet } from 'react-native'
import { statusColors } from '@/shared/theme/colors'
import { useTranslation } from 'react-i18next'
import type { ClientStatus } from '@/shared/lib/types'

interface Props {
  status: ClientStatus
}

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation()
  const { bg, text } = statusColors[status] ?? { bg: '#eee', text: '#666' }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{t(`clients.status.${status}`)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '600' },
})
