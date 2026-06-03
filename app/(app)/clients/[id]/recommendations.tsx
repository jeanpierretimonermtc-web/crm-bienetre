import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useRecommendations } from '@/features/recommendations/useRecommendations'
import { createRecommendation, updateRecommendationStatus, deleteRecommendation } from '@/features/recommendations/recommendationService'
import { DoterraProductPicker } from '@/features/modules/doterra/DoterraProductPicker'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { colors } from '@/shared/theme/colors'
import type { Recommendation } from '@/shared/lib/types'

export default function ClientRecommendationsScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { recommendations, loading, refresh } = useRecommendations(id)
  const [showModal, setShowModal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [productName, setProductName] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!productName.trim() || !session) return
    setSaving(true)
    try {
      await createRecommendation(session.user.id, id, productName.trim(), reason || null)
      setShowModal(false); setProductName(''); setReason(''); refresh()
    } finally { setSaving(false) }
  }

  async function handleToggle(rec: Recommendation) {
    await updateRecommendationStatus(rec.id, rec.status === 'advised' ? 'purchased' : 'advised')
    refresh()
  }

  async function handleDelete(recId: string) {
    Alert.alert(t('common.delete'), t('common.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteRecommendation(recId); refresh() } },
    ])
  }

  return (
    <>
      <Stack.Screen options={{ title: t('recommendations.title'), headerRight: () => (
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      )}} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : <FlatList
              data={recommendations}
              keyExtractor={r => r.id}
              renderItem={({ item }) => (
                <Card style={styles.recCard}>
                  <View style={styles.recRow}>
                    <View style={styles.recInfo}>
                      <Text style={styles.recName}>{item.product_name}</Text>
                      {item.reason && <Text style={styles.recReason}>{item.reason}</Text>}
                    </View>
                    <View style={styles.recActions}>
                      <TouchableOpacity style={[styles.statusBtn, item.status === 'purchased' && styles.statusBtnActive]} onPress={() => handleToggle(item)}>
                        <Text style={[styles.statusBtnText, item.status === 'purchased' && styles.statusBtnTextActive]}>
                          {t(`recommendations.${item.status}`)}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Text style={styles.deleteIcon}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<EmptyState message={t('recommendations.empty')} icon="🌿" />}
            />
        }
      </View>

      <Modal animationType="slide" presentationStyle="pageSheet" visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalCancel}>{t('common.cancel')}</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{t('recommendations.add')}</Text>
          <Button label={t('common.save')} size="sm" onPress={handleSave} loading={saving} />
        </View>
        <ScrollView style={styles.modalContent} contentContainerStyle={{ gap: 12 }}>
          <View style={styles.productRow}>
            <TextInput
              style={[styles.productInput, { flex: 1 }]}
              placeholder="Produit"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor={colors.textTertiary}
            />
            <Button label="doTERRA" variant="secondary" size="sm" onPress={() => setShowPicker(true)} />
          </View>
          <TextInput
            style={styles.reasonInput}
            placeholder={t('recommendations.reason')}
            value={reason}
            onChangeText={setReason}
            multiline
            placeholderTextColor={colors.textTertiary}
          />
        </ScrollView>
      </Modal>

      {showPicker && (
        <DoterraProductPicker
          onSelect={p => setProductName(p.name)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bg },
  list:               { padding: 12, gap: 8 },
  loader:             { marginTop: 40 },
  addBtn:             { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  addBtnText:         { color: '#fff', fontSize: 22, lineHeight: 28 },
  recCard:            { },
  recRow:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recInfo:            { flex: 1, gap: 3 },
  recName:            { fontSize: 15, fontWeight: '600', color: colors.text },
  recReason:          { fontSize: 13, color: colors.textSecondary },
  recActions:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBtn:          { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  statusBtnActive:    { backgroundColor: colors.successLight, borderColor: colors.success },
  statusBtnText:      { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  statusBtnTextActive:{ color: colors.success },
  deleteIcon:         { fontSize: 16 },
  modalHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:         { fontSize: 17, fontWeight: '600', color: colors.text },
  modalCancel:        { fontSize: 16, color: colors.primary },
  modalContent:       { padding: 16 },
  productRow:         { flexDirection: 'row', gap: 8, alignItems: 'center' },
  productInput:       { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: colors.card, color: colors.text },
  reasonInput:        { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: colors.card, color: colors.text, minHeight: 80 },
})
