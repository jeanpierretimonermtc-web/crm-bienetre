// Caelys Design System — Night × Azure × Dawn premium palette

export const colors = {
  // ── Brand primary — Night (deep navy) ────────────────────────────────────
  primary:              '#1A2B4A',   // brand; logo, header, primary text
  primaryAction:        '#3570B5',   // CTA buttons, links, focus (azure AA-compliant)
  primaryLight:         '#DDE8F5',   // azure-light — badge bg, tinted surfaces
  primaryLighter:       '#E8EDF5',   // night-light — hover, subtle tint
  onPrimary:            '#FFFFFF',
  onPrimaryContainer:   '#DDE8F5',

  // ── Accent — Dawn (warm gold) ─────────────────────────────────────────────
  secondary:            '#C9913D',   // dawn gold — stats, highlight badges
  secondaryContainer:   '#E0A84A',   // lighter dawn fill
  secondaryLight:       '#FDF3E3',   // dawn-light — badge bg, warning surface
  onSecondary:          '#FFFFFF',
  onSecondaryContainer: '#7A5020',

  // ── Tertiary — Muted blue-gray ────────────────────────────────────────────
  tertiary:             '#5C7490',
  tertiaryContainer:    '#7A8FAA',
  tertiaryLight:        '#EAF0F7',   // mist
  onTertiary:           '#FFFFFF',
  onTertiaryContainer:  '#DDE8F5',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:              '#2E7D32',
  successLight:         '#E8F5E9',
  warning:              '#C9913D',   // = dawn
  warningLight:         '#FDF3E3',   // = dawn-light
  danger:               '#C62828',
  dangerLight:          '#FFEBEE',

  // ── Legacy aliases (backward compat) ─────────────────────────────────────
  purple:               '#7A8FAA',
  purpleLight:          '#EAF0F7',
  onSurfaceVariant:     '#7A8FAA',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg:                      '#F5F2ED',   // earth — page background
  surface:                 '#F5F2ED',
  bgDim:                   '#E8E4DD',
  card:                    '#FFFFFF',   // white — card / modal surface
  surfaceContainerLow:     '#F9F7F3',
  surfaceContainer:        '#F5F2ED',   // earth
  surfaceContainerHigh:    '#EAF0F7',   // mist — inputs, section headers
  surfaceContainerHighest: '#DDE8F5',   // azure-light

  // ── Text ──────────────────────────────────────────────────────────────────
  text:           '#1A2B4A',   // night — primary text
  textSecondary:  '#7A8FAA',   // muted
  textTertiary:   '#B0A99E',   // hint
  textInverse:    '#FFFFFF',
  inverseText:    '#E8EDF5',

  // ── Borders ───────────────────────────────────────────────────────────────
  border:         '#DDD8CF',
  borderStrong:   '#B0A99E',
} as const

export const statusColors: Record<string, { bg: string; text: string }> = {
  prospect: { bg: '#FDF3E3', text: '#A07530' },   // dawn-light / muted dawn
  active:   { bg: '#DDE8F5', text: '#3570B5' },   // azure-light / azure
  inactive: { bg: '#EAE6DF', text: '#7A8FAA' },   // warm gray / muted
  vip:      { bg: '#1A2B4A', text: '#FFFFFF' },   // night inversé — prestige
  advisor:  { bg: '#FCEEF5', text: '#C2185B' },   // rose dusty / rose profond
}
