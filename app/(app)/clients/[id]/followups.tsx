import { useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientFollowups } from '@/features/followups/useFollowups'
import { createFollowup, toggleFollowupDone, deleteFollowup } from '@/features/followups/followupService'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Card } from '@/shared/components/ui/Card'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Followup } from '@/shared/lib/types'

export default function ClientFollowupsScreen() {
  const { t, i18n } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { followups, loading, refresh } = useClientFollowups(id)
  const [showModal, setShowModal] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  async function handleToggle(f: Followup) {
    await toggleFollowupDone(f.id, !f.done)
    refresh()
  }

  async function handleDelete(fId: string) {
    await deleteFollowup(fId)
    setConfirmId(null)
    refresh()
  }

  return (
    <>
      <Stack.Screen options={{ title: t('followups.title'), headerRight: () => (
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      )}} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : <FlatList
              data={followups}
              keyExtractor={f => f.id}
              renderItem={({ item }) => (
                <Card style={item.done ? styles.done : undefined}>
                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => handleToggle(item)} style={styles.checkbox}>
                      <Text style={styles.checkboxText}>{item.done ? '✅' : '⬜'}</Text>
                    </TouchableOpacity>
                    <View style={styles.info}>
                      {item.title ? <Text style={[styles.title, item.done && styles.doneText]}>{item.title}</Text> : null}
                      {item.content ? <Text style={[styles.content, item.done && styles.doneText]} numberOfLines={2}>{item.content}</Text> : null}
                      <Text style={styles.date}>
                        {new Date(item.due_date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    {confirmId === item.id ? (
                      <View style={styles.inlineConfirm}>
                        <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmId(null)}>
                          <Text style={styles.confirmCancelText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmDeleteBtn} onPress={() => handleDelete(item.id)}>
                          <Text style={styles.confirmDeleteText}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => setConfirmId(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.deleteIcon}>🗑</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<EmptyState message={t('followups.none')} icon="🔔" />}
            />
        }
      </View>
      {showModal && (
        <FollowupModal
          clientId={id}
          userId={session?.user.id ?? ''}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh() }}
        />
      )}
    </>
  )
}

function FollowupModal({ clientId, userId, onClose, onSaved }: {
  clientId: string; userId: string; onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim() && !content.trim()) {
      setErrorMsg(t('followups.error_title_or_desc'))
      return
    }
    setLoading(true)
    try {
      await createFollowup(userId, {
        client_id: clientId,
        title: title.trim() || null,
        content: content.trim() || null,
        due_date: dueDate,
        done: false,
      })
      onSaved()
    } catch (e) {
      console.error('[createFollowup]', e)
      setErrorMsg(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>{t('common.cancel')}</Text></TouchableOpacity>
        <Text style={styles.modalTitle}>{t('followups.add')}</Text>
        <Button label={t('common.save')} size="sm" onPress={handleSave} loading={loading} />
      </View>
      <ScrollView style={{ padding: 16 }} contentContainerStyle={{ gap: 12 }}>
        <Input label={t('followups.title_label')} value={title} onChangeText={setTitle} />
        <Input label={`${t('followups.description')} (${t('common.optional')})`} value={content} onChangeText={setContent} />
        <Input label={t('followups.due_date')} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
      </ScrollView>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  list:       { padding: 12, gap: 8 },
  loader:     { marginTop: 40 },
  addBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 28 },
  done:       { opacity: 0.5 },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox:   { paddingTop: 2 },
  checkboxText: { fontSize: 20 },
  info:       { flex: 1, gap: 3 },
  title:      { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  content:    { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary },
  doneText:   { textDecorationLine: 'line-through', color: colors.textTertiary },
  date:       { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  deleteIcon: { fontSize: 16, paddingTop: 2 },

  inlineConfirm:      { flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  confirmCancelBtn:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  confirmCancelText:  { fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  confirmDeleteBtn:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.danger },
  confirmDeleteText:  { fontSize: 12, fontFamily: fonts.semibold, color: '#ffffff' },

  errorMsg:    { fontSize: 13, fontFamily: fonts.medium, color: colors.danger },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:  { fontSize: 17, fontFamily: fonts.semibold, color: colors.text },
  modalCancel: { fontSize: 16, fontFamily: fonts.body, color: colors.primary },
  })
}
