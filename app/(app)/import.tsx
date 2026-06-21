import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import * as DocumentPicker from 'expo-document-picker'
import { useAuth } from '@/features/auth/AuthProvider'
import { parseCSV, mapHeaders, importCSVClients } from '@/features/clients/importService'
import type { ParsedCSV } from '@/features/clients/importService'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import { settingsScreenOptions } from '@/features/settings/SettingsBackButton'

const EXAMPLE_COLUMNS = 'full_name, email, phone, status, notes, country, language, contact_role, next_followup_date'
const EXAMPLE_ROW     = 'Sophie Martin, sophie@email.fr, 0612345678, prospect, Intéressée doTERRA, France, fr, prospect, 2026-07-15'

export default function ImportScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { session } = useAuth()

  const [parsed,   setParsed]   = useState<ParsedCSV | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [result,   setResult]     = useState<{ created: number; skipped: number; errors: number; msgs: string[] } | null>(null)
  const [error,    setError]      = useState<string | null>(null)

  const mapping = parsed ? mapHeaders(parsed.headers) : {}
  const detectedFields = Object.keys(mapping)
  const preview = parsed?.rows.slice(0, 5) ?? []

  async function pickFile() {
    setError(null)
    setResult(null)
    setParsed(null)

    try {
      if (Platform.OS === 'web') {
        // Web: use hidden file input
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv,text/csv'
        input.onchange = async (e: any) => {
          const file: File = e.target.files[0]
          if (!file) return
          setFileName(file.name)
          const text = await file.text()
          const p = parseCSV(text)
          if (p.headers.length === 0) { setError(t('settings.import_error_empty')); return }
          setParsed(p)
        }
        input.click()
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
          copyToCacheDirectory: true,
        })
        if (result.canceled) return
        const asset = result.assets[0]
        setFileName(asset.name)
        const response = await fetch(asset.uri)
        const text = await response.text()
        const p = parseCSV(text)
        if (p.headers.length === 0) { setError(t('settings.import_error_empty')); return }
        setParsed(p)
      }
    } catch (e: any) {
      setError(e.message ?? t('common.error'))
    }
  }

  async function startImport() {
    if (!parsed || !session) return
    setImporting(true)
    setResult(null)
    setProgress(0)
    try {
      const res = await importCSVClients(
        session.user.id,
        parsed,
        (done, total) => setProgress(total > 0 ? Math.round((done / total) * 100) : 0)
      )
      setResult({ created: res.created, skipped: res.skipped, errors: res.errors, msgs: res.errorMessages })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Stack.Screen options={settingsScreenOptions(t('settings.import_title'))} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Format attendu ─────────────────────────────────────────────── */}
        <View style={styles.formatCard}>
          <Text style={styles.formatTitle}>{t('settings.import_format_title')}</Text>
          <Text style={styles.formatDesc}>{t('settings.import_format_desc')}</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeHeader}>{EXAMPLE_COLUMNS}</Text>
            <Text style={styles.codeRow}>{EXAMPLE_ROW}</Text>
          </View>
          <Text style={styles.columnsLabel}>{t('settings.import_columns')}</Text>
          <Text style={styles.columnsText}>{EXAMPLE_COLUMNS}</Text>
        </View>

        {/* ── Picker ─────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.pickBtn} onPress={pickFile} activeOpacity={0.85} disabled={importing}>
          <Text style={styles.pickBtnIcon}>📂</Text>
          <Text style={styles.pickBtnText}>
            {fileName ?? t('settings.import_pick')}
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ── Preview ────────────────────────────────────────────────────── */}
        {parsed && !result && (
          <>
            {/* Detected columns */}
            <View style={styles.detectedCard}>
              <Text style={styles.detectedTitle}>{t('settings.import_col_detected')}</Text>
              <View style={styles.pillsRow}>
                {detectedFields.map(f => (
                  <View key={f} style={styles.fieldPill}>
                    <Text style={styles.fieldPillText}>{f}</Text>
                  </View>
                ))}
                {detectedFields.length === 0 && (
                  <Text style={styles.warnText}>{t('settings.import_error_no_name')}</Text>
                )}
              </View>
            </View>

            {/* Preview table */}
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>{t('settings.import_preview_title')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Header row */}
                  <View style={styles.tableRow}>
                    {parsed.headers.map((h, i) => (
                      <View key={i} style={styles.tableCell}>
                        <Text style={styles.tableHeaderText} numberOfLines={1}>{h}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Data rows */}
                  {preview.map((row, ri) => (
                    <View key={ri} style={[styles.tableRow, ri % 2 === 1 && styles.tableRowAlt]}>
                      {row.map((cell, ci) => (
                        <View key={ci} style={styles.tableCell}>
                          <Text style={styles.tableCellText} numberOfLines={1}>{cell}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.rowCount}>{parsed.rows.length} lignes au total</Text>
            </View>

            {/* Import button */}
            {detectedFields.length > 0 && (
              <TouchableOpacity
                style={[styles.importBtn, importing && { opacity: 0.6 }]}
                onPress={startImport}
                disabled={importing}
                activeOpacity={0.85}
              >
                {importing ? (
                  <View style={styles.importBtnInner}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.importBtnText}>{t('settings.import_importing')} {progress}%</Text>
                  </View>
                ) : (
                  <Text style={styles.importBtnText}>
                    {t('settings.import_start', { count: parsed.rows.length })}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Résultats ──────────────────────────────────────────────────── */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✓ {t('settings.import_done')}</Text>
            <View style={styles.resultRows}>
              <View style={[styles.resultRow, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.resultNum, { color: colors.success }]}>{result.created}</Text>
                <Text style={[styles.resultLabel, { color: colors.success }]}>
                  {t('settings.import_result_created', { n: result.created })}
                </Text>
              </View>
              {result.skipped > 0 && (
                <View style={[styles.resultRow, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.resultNum, { color: colors.warning }]}>{result.skipped}</Text>
                  <Text style={[styles.resultLabel, { color: colors.warning }]}>
                    {t('settings.import_result_skipped', { n: result.skipped })}
                  </Text>
                </View>
              )}
              {result.errors > 0 && (
                <View style={[styles.resultRow, { backgroundColor: colors.dangerLight }]}>
                  <Text style={[styles.resultNum, { color: colors.danger }]}>{result.errors}</Text>
                  <Text style={[styles.resultLabel, { color: colors.danger }]}>
                    {t('settings.import_result_errors', { n: result.errors })}
                  </Text>
                </View>
              )}
            </View>
            {result.msgs.length > 0 && (
              <ScrollView style={styles.errList}>
                {result.msgs.map((m, i) => (
                  <Text key={i} style={styles.errItem}>{m}</Text>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => { setParsed(null); setResult(null); setFileName(null) }}
              activeOpacity={0.8}
            >
              <Text style={styles.pickBtnText}>Importer un autre fichier</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { padding: 16, gap: 14, maxWidth: 800, alignSelf: 'center', width: '100%' },

  formatCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.border },
  formatTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  formatDesc:  { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },
  codeBlock:   { backgroundColor: colors.bg, borderRadius: 8, padding: 10, gap: 4, borderWidth: 1, borderColor: colors.border },
  codeHeader:  { fontSize: 10, fontFamily: fonts.semibold, color: colors.primary, lineHeight: 16 },
  codeRow:     { fontSize: 10, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 16 },
  columnsLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  columnsText:  { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary, lineHeight: 17 },

  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primaryLight, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
  },
  pickBtnIcon: { fontSize: 22 },
  pickBtnText: { fontSize: 15, fontFamily: fonts.semibold, color: colors.primary },

  errorText: { fontSize: 13, color: colors.danger, backgroundColor: colors.dangerLight, borderRadius: 8, padding: 10 },
  warnText:  { fontSize: 12, color: colors.warning, fontFamily: fonts.medium },

  detectedCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border },
  detectedTitle:{ fontSize: 12, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  pillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldPill:    { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  fieldPillText:{ fontSize: 11, fontFamily: fonts.semibold, color: colors.primary },

  previewCard:  { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border },
  previewTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.text },
  tableRow:     { flexDirection: 'row' },
  tableRowAlt:  { backgroundColor: colors.bgDim },
  tableCell:    { width: 120, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  tableHeaderText: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSecondary, textTransform: 'uppercase' },
  tableCellText:   { fontSize: 11, fontFamily: fonts.body, color: colors.text },
  rowCount: { fontSize: 11, fontFamily: fonts.medium, color: colors.textTertiary, textAlign: 'right' },

  importBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  importBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  importBtnText:  { fontSize: 15, fontFamily: fonts.semibold, color: '#fff' },

  resultCard:  { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border },
  resultTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.success },
  resultRows:  { gap: 8 },
  resultRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 12 },
  resultNum:   { fontSize: 24, fontFamily: fonts.display, lineHeight: 28 },
  resultLabel: { fontSize: 13, fontFamily: fonts.medium, flex: 1 },
  errList:     { maxHeight: 120, backgroundColor: colors.bgDim, borderRadius: 8, padding: 8 },
  errItem:     { fontSize: 11, fontFamily: fonts.body, color: colors.danger, lineHeight: 18 },
  })
}
