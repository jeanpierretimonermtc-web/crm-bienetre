import { useState, useMemo } from 'react'
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Platform,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import {
  BUILT_IN_TEMPLATES, CATEGORY_LABELS, CATEGORY_ICONS,
  renderTemplate,
} from '@/features/messages/templates'
import type { TemplateCategory, MessageTemplate } from '@/features/messages/templates'
import type { Client } from '@/shared/lib/types'

const CATEGORIES: TemplateCategory[] = ['prospection', 'lrp', 'recrutement', 'suivi']

interface Props {
  visible:     boolean
  onClose:     () => void
  client:      Client | null
  advisorName: string
  lastProduct?: string
}

export function MessageModal({ visible, onClose, client, advisorName, lastProduct }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('prospection')
  const [selected, setSelected] = useState<MessageTemplate | null>(null)
  const [copied, setCopied] = useState(false)

  const prénom = client?.first_name || client?.full_name?.split(' ')[0] || ''
  const date_lrp = client?.next_lrp_date
    ? new Date(client.next_lrp_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })
    : ''
  const mon_prénom = advisorName.split(' ')[0] || advisorName

  const vars = { prénom, nom_complet: client?.full_name ?? '', date_lrp, produit: lastProduct ?? '', mon_prénom }

  const templates = BUILT_IN_TEMPLATES.filter(t => t.category === activeCategory)
  const rendered  = selected ? renderTemplate(selected.body, vars) : ''

  async function handleCopy() {
    await Clipboard.setStringAsync(rendered)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const phone = client?.phone?.replace(/\D/g, '') ?? ''
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(rendered)}`
      : `https://wa.me/?text=${encodeURIComponent(rendered)}`
    Linking.openURL(url)
  }

  function handleSMS() {
    const phone = client?.phone?.replace(/\D/g, '') ?? ''
    const sep   = Platform.OS === 'ios' ? '&' : '?'
    const url   = phone
      ? `sms:${phone}${sep}body=${encodeURIComponent(rendered)}`
      : `sms:${sep}body=${encodeURIComponent(rendered)}`
    Linking.openURL(url)
  }

  function handleClose() {
    setSelected(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Handle + header */}
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              {selected ? '✉️ Message prêt' : `💬 Message pour ${prénom || 'ce contact'}`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selected ? (
            <>
              {/* Category tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catIcon}>{CATEGORY_ICONS[cat]}</Text>
                    <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Template list */}
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {templates.map(tpl => (
                  <TouchableOpacity
                    key={tpl.id}
                    style={styles.tplCard}
                    onPress={() => setSelected(tpl)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.tplTop}>
                      <Text style={styles.tplName}>{tpl.name}</Text>
                      <View style={[styles.channelBadge, { backgroundColor: tpl.channel === 'whatsapp' ? '#D1FAE5' : tpl.channel === 'sms' ? '#DBEAFE' : colors.bgDim }]}>
                        <Text style={[styles.channelText, { color: tpl.channel === 'whatsapp' ? '#059669' : tpl.channel === 'sms' ? '#1D4ED8' : colors.textSecondary }]}>
                          {tpl.channel === 'whatsapp' ? 'WhatsApp' : tpl.channel === 'sms' ? 'SMS' : 'Tous'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tplPreview} numberOfLines={2}>
                      {renderTemplate(tpl.body, vars)}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={{ height: 24 }} />
              </ScrollView>
            </>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {/* Rendered message */}
              <View style={styles.renderedCard}>
                <Text style={styles.renderedName}>{selected.name}</Text>
                <Text style={styles.renderedBody}>{rendered}</Text>
              </View>

              {/* Actions */}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={handleCopy} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>{copied ? '✓ Copié !' : '📋 Copier le message'}</Text>
              </TouchableOpacity>

              {client?.phone ? (
                <>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp} activeOpacity={0.85}>
                    <Text style={styles.actionBtnText}>💬 Ouvrir WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleSMS} activeOpacity={0.85}>
                    <Text style={styles.actionBtnText}>📱 Ouvrir SMS</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noPhoneNote}>
                  <Text style={styles.noPhoneText}>Aucun téléphone enregistré — WhatsApp et SMS indisponibles</Text>
                </View>
              )}

              {/* Back button */}
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)} activeOpacity={0.7}>
                <Text style={styles.backBtnText}>← Choisir un autre message</Text>
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title:   { fontSize: 16, fontFamily: fonts.bold, color: colors.text, flex: 1 },
  closeBtn:  { padding: 4 },
  closeIcon: { fontSize: 16, color: colors.textTertiary },

  tabsScroll:  { flexGrow: 0 },
  tabsRow:     { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catTab:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg },
  catTabActive:{ borderColor: colors.primary, backgroundColor: colors.primaryLight },
  catIcon:     { fontSize: 14 },
  catLabel:    { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  catLabelActive: { color: colors.primary, fontFamily: fonts.semibold },

  list: { paddingHorizontal: 16 },

  tplCard: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tplTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tplName:     { fontSize: 14, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  channelBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  channelText: { fontSize: 10, fontFamily: fonts.bold },
  tplPreview:  { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },

  renderedCard: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  renderedName: { fontSize: 12, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  renderedBody: { fontSize: 15, fontFamily: fonts.body, color: colors.text, lineHeight: 22 },

  actionBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { fontSize: 15, fontFamily: fonts.semibold, color: '#fff' },

  noPhoneNote: { backgroundColor: colors.bgDim, borderRadius: 10, padding: 12, marginBottom: 10 },
  noPhoneText: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center' },

  backBtn:     { alignItems: 'center', paddingVertical: 12 },
  backBtnText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  })
}
