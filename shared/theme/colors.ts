// Lumora Design System — M3 earth-tone palette
// Source of truth: brand spec (sage green + warm amber + off-white)

export const colors = {
  // ── Primary — Sage Green ──────────────────────────────────────────────────
  primary:              '#334f2b',   // darkest; text/icon on light surface
  primaryAction:        '#4a6741',   // buttons & active UI (primary-container)
  primaryLight:         '#caecbc',   // badge bg, tinted surfaces (primary-fixed)
  primaryLighter:       '#afd0a1',   // inverse-primary / subtle tint
  onPrimary:            '#ffffff',
  onPrimaryContainer:   '#c2e4b4',

  // ── Secondary — Warm Amber ────────────────────────────────────────────────
  secondary:            '#8a5100',
  secondaryContainer:   '#fdad58',   // amber fill (secondary-container)
  secondaryLight:       '#ffdcbe',   // light amber bg (secondary-fixed)
  onSecondary:          '#ffffff',
  onSecondaryContainer: '#724100',

  // ── Tertiary — Muted Sage Gray ────────────────────────────────────────────
  tertiary:             '#434944',
  tertiaryContainer:    '#5b615b',
  tertiaryLight:        '#dee4dc',   // tertiary-fixed
  onTertiary:           '#ffffff',
  onTertiaryContainer:  '#d6dcd4',

  // ── Semantic aliases (success / warning / danger) ─────────────────────────
  success:              '#4a6741',   // = primaryAction
  successLight:         '#caecbc',   // = primaryLight
  warning:              '#8a5100',   // = secondary
  warningLight:         '#ffdcbe',   // = secondaryLight
  danger:               '#ba1a1a',
  dangerLight:          '#ffdad6',   // error-container

  // ── Legacy aliases — kept for backward compat ─────────────────────────────
  purple:               '#434944',   // = tertiary
  purpleLight:          '#dee4dc',   // = tertiaryLight
  onSurfaceVariant:     '#434840',   // = textSecondary (used in Android components)

  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg:                      '#fff8f3',   // background / surface
  surface:                 '#fff8f3',   // alias for bg
  bgDim:                   '#dfd9d4',   // surface-dim
  card:                    '#ffffff',   // surface-container-lowest
  surfaceContainerLow:     '#f9f2ed',
  surfaceContainer:        '#f3ede7',
  surfaceContainerHigh:    '#ede7e2',
  surfaceContainerHighest: '#e7e1dc',   // surface-variant

  // ── Text ──────────────────────────────────────────────────────────────────
  text:           '#1d1b18',   // on-surface
  textSecondary:  '#434840',   // on-surface-variant
  textTertiary:   '#73796f',   // outline
  textInverse:    '#ffffff',
  inverseText:    '#f6f0ea',   // inverse-on-surface

  // ── Borders ───────────────────────────────────────────────────────────────
  border:         '#c3c8bd',   // outline-variant
  borderStrong:   '#73796f',   // outline
} as const

export const statusColors: Record<string, { bg: string; text: string }> = {
  prospect: { bg: '#ffdcbe',  text: '#c17b2a' },   // light amber / warm amber text
  active:   { bg: '#caecbc',  text: '#4a6741' },   // primary-fixed / primaryAction
  inactive: { bg: '#e7e1dc',  text: '#7a7468' },   // surface-variant / muted text
  vip:      { bg: '#dee4dc',  text: '#434944' },   // tertiary-fixed / tertiary
  advisor:  { bg: '#caecbc',  text: '#334f2b' },   // primary-fixed / primary dark
}
