import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/shared/theme/colors'

const PALETTE = ['#007AFF','#34C759','#FF9500','#AF52DE','#FF3B30','#5AC8FA','#FF2D55']

function colorFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  name: string
  size?: number
}

export function Avatar({ name, size = 44 }: Props) {
  const bg = colorFor(name)
  const fontSize = size * 0.38
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize }]}>{initials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text:   { color: colors.textInverse, fontWeight: '700' },
})
