import { useMemo } from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'

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
      activeOpacity={0.75}
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
    base: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    sm:   { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    disabled: { opacity: 0.5 },

    primary:   { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primaryLight },
    danger:    { backgroundColor: colors.danger },
    ghost:     { backgroundColor: 'transparent' },

    label:          { fontSize: 16, fontWeight: '600' },
    smLabel:        { fontSize: 14 },
    primaryLabel:   { color: colors.textInverse },
    secondaryLabel: { color: colors.primary },
    dangerLabel:    { color: colors.textInverse },
    ghostLabel:     { color: colors.primary },
  })
}
