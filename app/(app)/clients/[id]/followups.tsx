import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientFollowups } from '@/features/followups/useFollowups'
import { createFollowup, toggleFollowupDone, deleteFollowup } from '@/features/followups/followupService'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Card } from '@/shared/components/ui/Card'
import { colors } from '@/shared/theme/colors'
import type { Followup } from '@/shared/lib/types'

export default function ClientFollowupsScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { followups, loading, refresh } = useClientFollowups(id)
  const [showModal, setShowModal] = useState(false)

  async function handleToggle(f: Followup) {
    await toggleFollowupDone(f.id, !f.done); refresh()
  }

  async function handleDelete(fId: string) {
    Alert.alert(t('common.delete'), t('common.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteFollowup(fId); refresh() } },
    ])
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
                      {item.title && <Text style={[styles.title, item.done && styles.doneText]}>{item.title}</Text>}
                      <Text style={[styles.content, item.done && styles.doneText]} numberOfLines={2}>{item.content}</Text>
                      <Text style={styles.date}>{new Date(item.due_date).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
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
        <FollowupModal clientId={id} userId={session?.user.id ?? ''} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refresh() }} />
      )}
    </>
  )
}

function FollowupModal({ clientId, userId, onClose, onSaved }: { clientId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!content.trim()) return
    setLoading(true)
    try {
      await createFollowup(userId, { client_id: clientId, title: title || null, content: content.trim(), due_date: dueDate, done: false })
      onSaved()
    } finally { setLoading(false) }
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>{t('common.cancel')}</Text></TouchableOpacity>
        <Text style={styles.modalTitle}>{t('followups.add')}</Text>
        <Button label={t('common.save')} size="sm" onPress={handleSave} loading={loading} />
      </View>
      <ScrollView style={{ padding: 16 }} contentContainerStyle={{ gap: 12 }}>
        <Input label={`${t('followups.title_label')} (${t('common.optional')})`} value={title} onChangeText={setTitle} />
        <Input label="Description" value={content} onChangeText={setContent} />
        <Input label="Échéance" value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-JJ" />
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  list:       { padding: 12, gap: 8 },
  loader:     { marginTop: 40 },
  addBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 28 },
  done:       { opacity: 0.5 },
  row:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox:   { paddingTop: 2 },
  checkboxText:{ fontSize: 20 },
  info:       { flex: 1, gap: 3 },
  title:      { fontSize: 15, fontWeight: '600', color: colors.text },
  content:    { fontSize: 14, color: colors.text },
  doneText:   { textDecorationLine: 'line-through', color: colors.textSecondary },
  date:       { fontSize: 12, color: colors.textSecondary },
  deleteIcon: { fontSize: 16, paddingTop: 2 },
  modalHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  modalCancel:{ fontSize: 16, color: colors.primary },
})
