export const colors = {
  // Primary — forest green (Material Design 3)
  primary: '#334f2b',
  primaryLight: '#caecbc',
  primaryContainer: '#dff5ce',

  // Secondary — warm amber
  secondary: '#8a5100',
  secondaryLight: '#ffdcbe',
  secondaryContainer: '#ffdcbe',

  // Semantic aliases
  success: '#334f2b',
  successLight: '#dff5ce',
  warning: '#8a5100',
  warningLight: '#ffdcbe',
  danger: '#ba1a1a',
  dangerLight: '#ffdad6',

  // Tertiary — muted sage (backward compat alias for purple)
  purple: '#434944',
  purpleLight: '#dee4dc',

  // Surfaces — warm cream palette
  bg: '#fff8f3',
  card: '#ffffff',
  surfaceContainer: '#f3ede7',
  border: '#c3c8bd',

  // Text
  text: '#1d1b18',
  textSecondary: '#434840',
  textTertiary: '#73796f',
  textInverse: '#ffffff',
} as const

export const statusColors: Record<string, { bg: string; text: string }> = {
  prospect:  { bg: colors.warningLight,     text: colors.warning },
  active:    { bg: colors.successLight,     text: colors.success },
  inactive:  { bg: colors.surfaceContainer, text: colors.textSecondary },
  vip:       { bg: colors.purpleLight,      text: colors.purple },
  advisor:   { bg: colors.primaryLight,     text: colors.primary },
}
