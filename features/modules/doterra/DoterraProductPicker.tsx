import { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { searchProducts, DOTERRA_PRODUCTS, type DoterraProduct } from './products'
import { colors } from '@/shared/theme/colors'
import { useTranslation } from 'react-i18next'

interface Props {
  onSelect: (product: DoterraProduct) => void
  onClose: () => void
}

export function DoterraProductPicker({ onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const results = query.length >= 1 ? searchProducts(query) : DOTERRA_PRODUCTS

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>doTERRA</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder={t('clients.search')}
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholderTextColor={colors.textTertiary}
        />
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => { onSelect(item); onClose() }}>
              <View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  title:       { fontSize: 18, fontWeight: '700', color: colors.text },
  close:       { fontSize: 16, color: colors.primary },
  search:      { margin: 16, marginTop: 0, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: colors.card, color: colors.text },
  row:         { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card },
  productName: { fontSize: 16, fontWeight: '500', color: colors.text },
  category:    { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sep:         { height: 1, backgroundColor: colors.border, marginLeft: 16 },
})
