export const colors = {
  primary: '#007AFF',
  primaryLight: '#E8F2FF',
  success: '#34C759',
  successLight: '#E8FAF0',
  warning: '#FF9500',
  warningLight: '#FFF4E5',
  danger: '#FF3B30',
  dangerLight: '#FFF0EF',
  purple: '#AF52DE',
  purpleLight: '#F5EDFC',

  bg: '#F2F2F7',
  card: '#FFFFFF',
  border: '#E5E5EA',

  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  textInverse: '#FFFFFF',
} as const

export const statusColors: Record<string, { bg: string; text: string }> = {
  prospect:  { bg: colors.warningLight,  text: colors.warning },
  active:    { bg: colors.successLight,  text: colors.success },
  inactive:  { bg: '#F2F2F7',            text: colors.textSecondary },
  vip:       { bg: colors.purpleLight,   text: colors.purple },
  advisor:   { bg: colors.primaryLight,  text: colors.primary },
}
