import { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNotes } from '@/features/notes/useNotes'
import { createNote, deleteNote } from '@/features/notes/noteService'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { colors } from '@/shared/theme/colors'
import type { Note } from '@/shared/lib/types'

export default function ClientNotesScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { notes, loading, refresh } = useNotes(id)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!text.trim() || !session) return
    setSaving(true)
    try { await createNote(session.user.id, id, text.trim()); setText(''); refresh() }
    finally { setSaving(false) }
  }

  async function handleDelete(noteId: string) {
    Alert.alert(t('common.delete'), t('common.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteNote(noteId); refresh() } },
    ])
  }

  return (
    <>
      <Stack.Screen options={{ title: t('notes.title') }} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : <FlatList
              data={notes}
              keyExtractor={n => n.id}
              renderItem={({ item }) => <NoteRow note={item} onDelete={() => handleDelete(item.id)} />}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              contentContainerStyle={notes.length === 0 ? styles.empty : styles.list}
              ListEmptyComponent={<EmptyState message={t('notes.empty')} icon="📝" />}
            />
        }
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={t('notes.add')}
            value={text}
            onChangeText={setText}
            multiline
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={handleAdd} disabled={saving || !text.trim()}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

function NoteRow({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const date = new Date(note.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <TouchableOpacity style={styles.noteRow} onLongPress={onDelete}>
      <Text style={styles.noteContent}>{note.content}</Text>
      <Text style={styles.noteDate}>{date}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.bg },
  list:              { padding: 12 },
  empty:             { flex: 1 },
  loader:            { marginTop: 40 },
  sep:               { height: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  noteRow:           { padding: 14, backgroundColor: colors.card },
  noteContent:       { fontSize: 15, color: colors.text, lineHeight: 22 },
  noteDate:          { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  inputBar:          { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, gap: 8 },
  input:             { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:   { backgroundColor: colors.textTertiary },
  sendBtnText:       { color: '#fff', fontSize: 20, fontWeight: '700' },
})
