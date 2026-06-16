import { useMemo, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useCatalogs, useCatalogProducts } from './useCatalog'
import { useTheme } from '@/shared/theme/ThemeProvider'
import type { ThemeColors } from '@/shared/theme/colors'
import type { Catalog, CatalogProduct } from '@/shared/lib/types'

export interface CatalogPickerResult {
  productName: string
  productId: string
  catalogId: string
  catalogName: string
  catalogColor: string
  catalogIcon: string
}

interface Props {
  onSelect: (result: CatalogPickerResult) => void
  onClose: () => void
}

export function CatalogProductPicker({ onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { catalogs, loading: catalogsLoading } = useCatalogs()
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)
  const { products, loading: productsLoading } = useCatalogProducts(selectedCatalog?.id ?? null)
  const [query, setQuery] = useState('')

  // Auto-select first catalog once loaded
  if (!selectedCatalog && catalogs.length > 0) {
    setSelectedCatalog(catalogs[0])
  }

  const filtered = query.length >= 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.category ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : products

  function handleSelect(product: CatalogProduct) {
    if (!selectedCatalog) return
    onSelect({
      productName: product.name,
      productId: product.id,
      catalogId: selectedCatalog.id,
      catalogName: selectedCatalog.name,
      catalogColor: selectedCatalog.color,
      catalogIcon: selectedCatalog.icon,
    })
    onClose()
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Catalogues</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* Catalog tabs */}
        {catalogsLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <View style={styles.tabs}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={catalogs}
              keyExtractor={c => c.id}
              contentContainerStyle={styles.tabList}
              renderItem={({ item }) => {
                const active = selectedCatalog?.id === item.id
                return (
                  <TouchableOpacity
                    style={[styles.tab, active && { borderColor: item.color, backgroundColor: item.color + '15' }]}
                    onPress={() => { setSelectedCatalog(item); setQuery('') }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tabIcon}>{item.icon}</Text>
                    <Text style={[styles.tabLabel, active && { color: item.color, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        )}

        {/* Search */}
        <TextInput
          style={styles.search}
          placeholder={`Rechercher dans ${selectedCatalog?.name ?? ''}...`}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.textTertiary}
        />

        {/* Products */}
        {productsLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.75}>
                <View style={[styles.categoryDot, { backgroundColor: selectedCatalog?.color ?? colors.primary }]} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.category && <Text style={styles.category}>{item.category}</Text>}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.empty}>Aucun produit trouvé</Text>
            }
          />
        )}
      </View>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title:       { fontSize: 18, fontWeight: '700', color: colors.text },
  close:       { fontSize: 16, color: colors.primary },
  loader:      { marginTop: 40 },

  tabs:        { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabList:     { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg },
  tabIcon:     { fontSize: 14 },
  tabLabel:    { fontSize: 13, fontWeight: '500', color: colors.textSecondary },

  search:      { margin: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: colors.card, color: colors.text },

  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card },
  categoryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '500', color: colors.text },
  category:    { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sep:         { height: 1, backgroundColor: colors.border, marginLeft: 36 },
  empty:       { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 14 },
  })
}
