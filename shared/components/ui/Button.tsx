import { useMemo } from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface Props {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, size = 'md' }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], size === 'sm' && styles.sm, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} size="small" />
        : <Text style={[styles.label, styles[`${variant}Label`], size === 'sm' && styles.smLabel]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    sm:   { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    disabled: { opacity: 0.45 },

    primary:   { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.bgDim },
    danger:    { backgroundColor: colors.danger },
    ghost:     { backgroundColor: 'transparent' },

    label:          { fontSize: 16, fontFamily: fonts.semibold },
    smLabel:        { fontSize: 14 },
    primaryLabel:   { color: colors.textInverse },
    secondaryLabel: { color: colors.text },
    dangerLabel:    { color: colors.textInverse },
    ghostLabel:     { color: colors.primary },
  })
}
