import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

function colorFor(name: string, palette: string[]) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
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
  status?: string
}

export function Avatar({ name, size = 44, status }: Props) {
  const { colors, statusColors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const palette = useMemo(() => [
    colors.primary, colors.secondary, colors.tertiary,
    colors.success, colors.warning, colors.danger,
  ], [colors])

  const statusPalette = status ? statusColors[status as keyof typeof statusColors] : null
  const bg        = statusPalette ? statusPalette.bg   : colorFor(name, palette)
  const textColor = statusPalette ? statusPalette.text : colors.textInverse

  const fontSize = size * 0.38
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize, color: textColor }]}>{initials(name)}</Text>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center' },
    text:   { fontFamily: fonts.bold, color: colors.textInverse },
  })
}
