import { useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import { useClientAppointments } from '@/features/appointments/useAppointments'
import { createAppointment, updateAppointment, deleteAppointment, getNextAppointmentNumber } from '@/features/appointments/appointmentService'
import { Input } from '@/shared/components/ui/Input'
import { TextArea } from '@/shared/components/ui/TextArea'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Card } from '@/shared/components/ui/Card'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import { fonts } from '@/shared/theme/fonts'
import type { Appointment } from '@/shared/lib/types'

export default function ClientAppointmentsScreen() {
  const { t, i18n } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { appointments, loading, refresh } = useClientAppointments(id)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US'

  function openNew() { setEditing(null); setShowModal(true) }
  function openEdit(appt: Appointment) { setEditing(appt); setShowModal(true) }

  async function handleDelete(apptId: string) {
    await deleteAppointment(apptId)
    setConfirmId(null)
    refresh()
  }

  return (
    <>
      <Stack.Screen options={{
        title: t('appointments.title'),
        headerBackTitle: '',
        headerRight: () => (
          <TouchableOpacity onPress={openNew} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        ),
      }} />
      <View style={styles.container}>
        {loading
          ? <ActivityIndicator style={styles.loader} color={colors.primary} />
          : <FlatList
              data={appointments}
              keyExtractor={a => a.id}
              renderItem={({ item }) => (
                <AppointmentCard
                  appt={item}
                  locale={locale}
                  confirmId={confirmId}
                  onEdit={() => openEdit(item)}
                  onDeleteRequest={() => setConfirmId(item.id)}
                  onDeleteCancel={() => setConfirmId(null)}
                  onDeleteConfirm={() => handleDelete(item.id)}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<EmptyState message={t('appointments.empty')} icon="📅" />}
            />
        }
      </View>
      {showModal && (
        <AppointmentModal
          clientId={id}
          userId={session?.user.id ?? ''}
          existing={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); refresh() }}
        />
      )}
    </>
  )
}

function AppointmentCard({ appt, locale, confirmId, onEdit, onDeleteRequest, onDeleteCancel, onDeleteConfirm }: {
  appt: Appointment
  locale: string
  confirmId: string | null
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [expanded, setExpanded] = useState(false)
  const isConfirming = confirmId === appt.id

  const date = new Date(appt.appointment_date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Card>
      <TouchableOpacity onPress={() => setExpanded(e => !e)}>
        <View style={styles.cardHeader}>
          <Text style={styles.apptNumber}>{t('appointments.number', { number: appt.appointment_number })}</Text>
          <Text style={styles.apptDate}>{date}</Text>
          {appt.recap_sent && <Text style={styles.recapBadge}>✉️</Text>}
        </View>
        {appt.themes_discussed && !expanded && (
          <Text style={styles.preview} numberOfLines={1}>{appt.themes_discussed}</Text>
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expandedContent}>
          {appt.themes_discussed && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('appointments.themes')}</Text>
              <Text style={styles.fieldValue}>{appt.themes_discussed}</Text>
            </View>
          )}
          {appt.solutions_proposed && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('appointments.solutions')}</Text>
              <Text style={styles.fieldValue}>{appt.solutions_proposed}</Text>
            </View>
          )}
          {appt.next_appointment_date && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('appointments.next_date')}</Text>
              <Text style={styles.fieldValue}>{appt.next_appointment_date}</Text>
            </View>
          )}

          {isConfirming ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>{t('common.confirm_delete')}</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onDeleteCancel}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteConfirmBtn} onPress={onDeleteConfirm}>
                  <Text style={styles.deleteConfirmText}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.cardActions}>
              <Button label={t('common.edit')} variant="secondary" size="sm" onPress={onEdit} />
              <Button label={t('common.delete')} variant="danger" size="sm" onPress={onDeleteRequest} />
            </View>
          )}
        </View>
      )}
    </Card>
  )
}

function AppointmentModal({ clientId, userId, existing, onClose, onSaved }: {
  clientId: string; userId: string; existing: Appointment | null
  onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [date, setDate] = useState(existing?.appointment_date?.split('T')[0] ?? new Date().toISOString().split('T')[0])
  const [themes, setThemes] = useState(existing?.themes_discussed ?? '')
  const [solutions, setSolutions] = useState(existing?.solutions_proposed ?? '')
  const [recapSent, setRecapSent] = useState(existing?.recap_sent ?? false)
  const [nextDate, setNextDate] = useState(existing?.next_appointment_date ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      if (existing) {
        await updateAppointment(existing.id, {
          appointment_date: date, themes_discussed: themes || null,
          solutions_proposed: solutions || null, recap_sent: recapSent,
          next_appointment_date: nextDate || null,
          client_id: clientId, appointment_number: existing.appointment_number,
        })
      } else {
        const num = await getNextAppointmentNumber(clientId)
        await createAppointment(userId, {
          client_id: clientId, appointment_number: num,
          appointment_date: date, themes_discussed: themes || null,
          solutions_proposed: solutions || null, recap_sent: recapSent,
          next_appointment_date: nextDate || null,
        })
      }
      onSaved()
    } finally { setLoading(false) }
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>{t('common.cancel')}</Text></TouchableOpacity>
        <Text style={styles.modalTitle}>{t(existing ? 'common.edit' : 'appointments.add')}</Text>
        <Button label={t('common.save')} size="sm" onPress={handleSave} loading={loading} />
      </View>
      <ScrollView style={styles.modalContent} contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Input label={t('appointments.date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <TextArea label={t('appointments.themes')} value={themes} onChangeText={setThemes} minHeight={80} />
        <TextArea label={t('appointments.solutions')} value={solutions} onChangeText={setSolutions} minHeight={80} />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('appointments.recap_sent')}</Text>
          <Switch value={recapSent} onValueChange={setRecapSent} trackColor={{ true: colors.primary }} />
        </View>
        <Input label={`${t('appointments.next_date')} (${t('common.optional')})`} value={nextDate} onChangeText={setNextDate} placeholder="YYYY-MM-DD" />
      </ScrollView>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bg },
  list:           { padding: 12, gap: 8 },
  loader:         { marginTop: 40 },
  addBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  addBtnText:     { color: '#fff', fontSize: 22, lineHeight: 28 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apptNumber:     { fontSize: 15, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  apptDate:       { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  recapBadge:     { fontSize: 14 },
  preview:        { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 4 },
  expandedContent:{ marginTop: 12, gap: 10 },
  field:          { gap: 3 },
  fieldLabel:     { fontSize: 12, fontFamily: fonts.semibold, color: colors.textSecondary, textTransform: 'uppercase' },
  fieldValue:     { fontSize: 14, fontFamily: fonts.body, color: colors.text },
  cardActions:    { flexDirection: 'row', gap: 8, marginTop: 8 },

  confirmRow:     { gap: 8, marginTop: 8 },
  confirmText:    { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center' },
  confirmBtns:    { flexDirection: 'row', gap: 8 },
  cancelBtn:      { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText:  { fontSize: 13, fontFamily: fonts.semibold, color: colors.text },
  deleteConfirmBtn:  { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center' },
  deleteConfirmText: { fontSize: 13, fontFamily: fonts.semibold, color: '#ffffff' },

  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:     { fontSize: 17, fontFamily: fonts.semibold, color: colors.text },
  modalCancel:    { fontSize: 16, fontFamily: fonts.body, color: colors.primary },
  modalContent:   { padding: 16 },
  switchRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 10 },
  switchLabel:    { fontSize: 16, fontFamily: fonts.body, color: colors.text },
  })
}
