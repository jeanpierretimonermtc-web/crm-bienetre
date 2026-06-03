import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useClient } from '@/features/clients/useClient'
import { deleteClient } from '@/features/clients/clientService'
import { Avatar } from '@/shared/components/ui/Avatar'
import { StatusBadge } from '@/shared/components/ui/Badge'
import { Card } from '@/shared/components/ui/Card'
import { colors } from '@/shared/theme/colors'

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function ActionBtn({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function ClientDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { client, loading } = useClient(id)

  async function handleDelete() {
    Alert.alert(t('common.delete'), t('common.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await deleteClient(id)
        router.back()
      }},
    ])
  }

  if (loading || !client) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  }

  return (
    <>
      <Stack.Screen options={{
        title: client.full_name,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push(`/(app)/clients/${id}/edit`)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        )
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Avatar name={client.full_name} size={64} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{client.full_name}</Text>
            <StatusBadge status={client.status} />
          </View>
        </View>

        {/* Actions rapides */}
        <Card style={styles.actionsCard} padding={12}>
          <ActionBtn emoji="📅" label={t('appointments.title')}   onPress={() => router.push(`/(app)/clients/${id}/appointments`)} />
          <ActionBtn emoji="📝" label={t('notes.title')}          onPress={() => router.push(`/(app)/clients/${id}/notes`)} />
          <ActionBtn emoji="🔔" label={t('followups.title')}      onPress={() => router.push(`/(app)/clients/${id}/followups`)} />
          <ActionBtn emoji="🌿" label={t('recommendations.title')} onPress={() => router.push(`/(app)/clients/${id}/recommendations`)} />
        </Card>

        {/* Infos personnelles */}
        <Text style={styles.section}>{t('clients.sections.personal')}</Text>
        <Card>
          <InfoRow label={t('clients.fields.phone')}      value={client.phone} />
          <InfoRow label={t('clients.fields.email')}      value={client.email} />
          <InfoRow label={t('clients.fields.birth_date')} value={client.birth_date} />
          <InfoRow label={t('clients.fields.profession')} value={client.profession} />
          <InfoRow label={t('clients.fields.children')}   value={client.children} />
          <InfoRow label={t('clients.fields.source')}     value={client.source} />
        </Card>

        {/* Médical */}
        {(client.medical_treatment || client.particularities) && (
          <>
            <Text style={styles.section}>{t('clients.sections.medical')}</Text>
            <Card>
              {client.medical_treatment && (
                <InfoRow label={t('clients.fields.medical_treatment')} value={t('common.yes')} />
              )}
              <InfoRow label={t('clients.fields.medical_notes')}   value={client.medical_notes} />
              <InfoRow label={t('clients.fields.particularities')} value={client.particularities} />
            </Card>
          </>
        )}

        {/* DoTerra */}
        {(client.doterra_id || client.next_lrp_date) && (
          <>
            <Text style={styles.section}>{t('clients.sections.doterra')}</Text>
            <Card>
              <InfoRow label={t('clients.fields.doterra_id')}    value={client.doterra_id} />
              <InfoRow label={t('clients.fields.next_lrp_date')} value={client.next_lrp_date} />
            </Card>
          </>
        )}

        {/* Supprimer */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  content:      { padding: 16, gap: 12, paddingBottom: 40 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, padding: 16, borderRadius: 12 },
  headerText:   { gap: 8 },
  name:         { fontSize: 20, fontWeight: '700', color: colors.text },
  actionsCard:  { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn:    { alignItems: 'center', gap: 4, flex: 1 },
  actionEmoji:  { fontSize: 24 },
  actionLabel:  { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  section:      { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:    { fontSize: 14, color: colors.textSecondary, flex: 1 },
  infoValue:    { fontSize: 14, color: colors.text, flex: 2, textAlign: 'right' },
  deleteBtn:    { marginTop: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' },
  deleteBtnText:{ color: colors.danger, fontWeight: '600' },
  editBtn:      { marginRight: 8 },
  editBtnText:  { color: colors.primary, fontSize: 16 },
})
