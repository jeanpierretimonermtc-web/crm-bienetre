import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { useAppConfig } from '@/features/settings/AppConfigProvider'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'
import {
  AUTOMATION_RULES, TRIGGER_LABELS, TRIGGER_ICONS, TRIGGER_MODULE,
} from '@/features/automations/automationService'
import type { AutoTrigger, AutomationRule } from '@/features/automations/automationService'
import type { ModuleKey } from '@/shared/lib/types'

const TRIGGERS: AutoTrigger[] = ['new_client', 'order', 'appointment', 'no_contact']

const ACTION_ICONS: Record<string, string> = {
  whatsapp: '💬',
  call:     '📞',
  email:    '✉️',
  sms:      '📱',
  rdv:      '📅',
}

function RuleRow({ rule, colors, styles }: { rule: AutomationRule; colors: ThemeColors; styles: ReturnType<typeof makeStyles> }) {
  const delayLabel = rule.delayDays === 0 ? 'Immédiat' : `J+${rule.delayDays}`
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.delayBadge, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.delayText, { color: colors.primary }]}>{delayLabel}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.ruleTitle} numberOfLines={2}>{rule.title.replace(/\{prénom\}/g, '[prénom]')}</Text>
        <Text style={styles.ruleDesc}>{rule.description}</Text>
      </View>
      <Text style={styles.actionIcon}>{ACTION_ICONS[rule.actionType] ?? '📋'}</Text>
    </View>
  )
}

function TriggerSection({
  trigger, rules, enabled, onToggle, colors, styles,
}: {
  trigger:   AutoTrigger
  rules:     AutomationRule[]
  enabled:   boolean
  onToggle:  () => void
  colors:    ThemeColors
  styles:    ReturnType<typeof makeStyles>
}) {
  return (
    <View style={[styles.section, !enabled && styles.sectionDisabled]}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{TRIGGER_ICONS[trigger]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{TRIGGER_LABELS[trigger]}</Text>
          <Text style={styles.sectionSub}>{rules.length} relance{rules.length > 1 ? 's' : ''} automatique{rules.length > 1 ? 's' : ''}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {/* Rules */}
      {enabled && (
        <View style={styles.rulesList}>
          {rules.map((rule, i) => (
            <View key={rule.id}>
              {i > 0 && <View style={styles.ruleSep} />}
              <RuleRow rule={rule} colors={colors} styles={styles} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default function SettingsAutomationsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { isModuleActive, toggleModule } = useAppConfig()

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.section_automations'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoEmoji}>⚡</Text>
          <Text style={styles.infoText}>
            Les relances automatiques sont créées dans votre liste Relances dès qu'un événement se produit (nouveau client, commande, RDV terminé).
          </Text>
        </View>

        {TRIGGERS.map(trigger => {
          const rules   = AUTOMATION_RULES.filter(r => r.trigger === trigger)
          const modKey  = TRIGGER_MODULE[trigger] as ModuleKey
          const enabled = isModuleActive(modKey)
          return (
            <TriggerSection
              key={trigger}
              trigger={trigger}
              rules={rules}
              enabled={enabled}
              onToggle={() => toggleModule(modKey, !enabled)}
              colors={colors}
              styles={styles}
            />
          )
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Variables disponibles dans les titres</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendChip}><Text style={styles.legendChipText}>{'{prénom}'}</Text></View>
            <Text style={styles.legendDesc}>Prénom du client</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { padding: 16, gap: 14, maxWidth: 720, alignSelf: 'center', width: '100%' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  infoEmoji: { fontSize: 20 },
  infoText:  { flex: 1, fontSize: 13, fontFamily: fonts.body, color: colors.primary, lineHeight: 19 },

  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionDisabled: { opacity: 0.6 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 0,
  },
  sectionEmoji: { fontSize: 24 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  sectionSub:   { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },

  rulesList: { borderTopWidth: 1, borderTopColor: colors.border },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ruleSep:    { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  delayBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', flexShrink: 0, minWidth: 52, alignItems: 'center' },
  delayText:  { fontSize: 11, fontFamily: fonts.bold },
  ruleTitle:  { fontSize: 13, fontFamily: fonts.semibold, color: colors.text, lineHeight: 18 },
  ruleDesc:   { fontSize: 11, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 1 },
  actionIcon: { fontSize: 18, flexShrink: 0, marginTop: 2 },

  legend: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendTitle: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendChip:  { backgroundColor: colors.bgDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  legendChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  legendDesc:  { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  })
}
