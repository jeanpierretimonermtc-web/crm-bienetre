import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { colors } from '@/shared/theme/colors'

interface Props extends TextInputProps {
  label?: string
  minHeight?: number
}

export function TextArea({ label, minHeight = 90, style, ...props }: Props) {
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

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { fontSize: 14, fontWeight: '500', color: colors.text },
  input:   { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 16, backgroundColor: colors.card, color: colors.text },
})
