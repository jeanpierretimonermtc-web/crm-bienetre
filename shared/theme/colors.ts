// Oryalis Design System — Night × Azure × Dawn premium palette
// Brand swatches (day mode: #371ED9 / #0339A6 / #0477BF / #04BFAD / #F2F2F2)
// Brand swatches (dark mode: #022873 / #01050D / #0B1426 / #0396A6 / #03A696)

export const lightColors = {
  // ── Brand primary — Night (deep navy) ────────────────────────────────────
  primary:              '#0339A6',   // brand navy; logo, header, primary text
  primaryAction:        '#0477BF',   // CTA buttons, links, focus (azure)
  primaryLight:         '#DCEEFA',   // azure-light — badge bg, tinted surfaces
  primaryLighter:       '#EAF2FB',   // hover, subtle tint
  onPrimary:            '#FFFFFF',
  onPrimaryContainer:   '#0339A6',

  // ── Accent — Dawn (warm gold) ─────────────────────────────────────────────
  secondary:            '#C9913D',   // dawn gold — stats, highlight badges
  secondaryContainer:   '#E0A84A',   // lighter dawn fill
  secondaryLight:       '#FDF3E3',   // dawn-light — badge bg, warning surface
  onSecondary:          '#FFFFFF',
  onSecondaryContainer: '#7A5020',

  // ── Tertiary — Teal accent ────────────────────────────────────────────────
  tertiary:             '#04BFAD',
  tertiaryContainer:    '#3DD9C8',
  tertiaryLight:        '#E1F8F5',
  onTertiary:           '#FFFFFF',
  onTertiaryContainer:  '#03857A',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:              '#2E7D32',
  successLight:         '#E8F5E9',
  warning:              '#C9913D',   // = dawn
  warningLight:         '#FDF3E3',   // = dawn-light
  danger:               '#C62828',
  dangerLight:          '#FFEBEE',

  // ── Legacy aliases (backward compat) ─────────────────────────────────────
  purple:               '#371ED9',
  purpleLight:          '#E7E2FB',
  onSurfaceVariant:     '#6B7A99',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg:                      '#F2F2F2',
  surface:                 '#F2F2F2',
  bgDim:                   '#E6E6E6',
  card:                    '#FFFFFF',
  surfaceContainerLow:     '#FAFAFA',
  surfaceContainer:        '#F2F2F2',
  surfaceContainerHigh:    '#EAF2FB',
  surfaceContainerHighest: '#DCEEFA',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:           '#0B1426',
  textSecondary:  '#6B7A99',
  textTertiary:   '#9AA6BD',
  textInverse:    '#FFFFFF',
  inverseText:    '#EAF2FB',

  // ── Borders ───────────────────────────────────────────────────────────────
  border:         '#DCDCDC',
  borderStrong:   '#B5B5B5',
}

export const darkColors: typeof lightColors = {
  // ── Brand primary — Night (deep navy) ────────────────────────────────────
  primary:              '#022873',
  primaryAction:        '#0396A6',   // teal-cyan CTA
  primaryLight:         '#0E3A57',
  primaryLighter:       '#102A47',
  onPrimary:            '#FFFFFF',
  onPrimaryContainer:   '#9FD8E6',

  // ── Accent — Dawn (warm gold) ─────────────────────────────────────────────
  secondary:            '#E0A84A',
  secondaryContainer:   '#C9913D',
  secondaryLight:        '#3A2C12',
  onSecondary:          '#1A1304',
  onSecondaryContainer: '#FDE3B0',

  // ── Tertiary — Teal accent ────────────────────────────────────────────────
  tertiary:             '#03A696',
  tertiaryContainer:    '#0396A6',
  tertiaryLight:        '#0E3530',
  onTertiary:           '#FFFFFF',
  onTertiaryContainer:  '#8FE9DB',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:              '#4CAF50',
  successLight:         '#163A1A',
  warning:              '#E0A84A',
  warningLight:         '#3A2C12',
  danger:               '#E57373',
  dangerLight:          '#3A1414',

  // ── Legacy aliases (backward compat) ─────────────────────────────────────
  purple:               '#7C6FE0',
  purpleLight:          '#241F47',
  onSurfaceVariant:     '#8C9BB5',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg:                      '#01050D',
  surface:                 '#01050D',
  bgDim:                   '#000000',
  card:                    '#0B1426',
  surfaceContainerLow:     '#070B14',
  surfaceContainer:        '#0B1426',
  surfaceContainerHigh:    '#11203A',
  surfaceContainerHighest: '#16294A',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:           '#F2F2F2',
  textSecondary:  '#8C9BB5',
  textTertiary:   '#5C6B85',
  textInverse:    '#0B1426',
  inverseText:    '#0B1426',

  // ── Borders ───────────────────────────────────────────────────────────────
  border:         '#1C2840',
  borderStrong:   '#2C3A56',
}

export type ThemeColors = typeof lightColors

// Default export kept for any straggling static usage — points at the light palette.
export const colors = lightColors

export const lightStatusColors: Record<string, { bg: string; text: string }> = {
  prospect: { bg: '#FDF3E3', text: '#A07530' },
  active:   { bg: '#DCEEFA', text: '#0477BF' },
  inactive: { bg: '#EAE6DF', text: '#6B7A99' },
  vip:      { bg: '#0339A6', text: '#FFFFFF' },
  advisor:  { bg: '#FCEEF5', text: '#C2185B' },
}

export const darkStatusColors: Record<string, { bg: string; text: string }> = {
  prospect: { bg: '#3A2C12', text: '#FDE3B0' },
  active:   { bg: '#0E3A57', text: '#9FD8E6' },
  inactive: { bg: '#1C2840', text: '#8C9BB5' },
  vip:      { bg: '#0396A6', text: '#01050D' },
  advisor:  { bg: '#3A1430', text: '#F0A8C9' },
}

// Backward-compat default export — light status colors.
export const statusColors = lightStatusColors
