import { useMemo } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'

interface Props extends TextInputProps {
  label?: string
  minHeight?: number
}

export function TextArea({ label, minHeight = 90, style, ...props }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        multiline
        textAlignVertical="top"
        style={[styles.input, { minHeight }, style]}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { gap: 6 },
    label:   { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
    input:   {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 16,
      fontFamily: fonts.body,
      backgroundColor: colors.card,
      color: colors.text,
    },
  })
}
