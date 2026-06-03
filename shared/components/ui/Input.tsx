import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { colors } from '@/shared/theme/colors'

interface Props extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper:    { gap: 6 },
  label:      { fontSize: 14, fontWeight: '500', color: colors.text },
  input:      { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, fontSize: 16, backgroundColor: colors.card, color: colors.text },
  inputError: { borderColor: colors.danger },
  error:      { fontSize: 12, color: colors.danger },
})
