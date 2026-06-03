export interface DoterraProduct {
  id: string
  name: string
  category: string
}

export const DOTERRA_PRODUCTS: DoterraProduct[] = [
  // Huiles essentielles individuelles
  { id: 'lavender', name: 'Lavande', category: 'Huile essentielle' },
  { id: 'peppermint', name: 'Menthe poivrée', category: 'Huile essentielle' },
  { id: 'lemon', name: 'Citron', category: 'Huile essentielle' },
  { id: 'oregano', name: 'Origan', category: 'Huile essentielle' },
  { id: 'frankincense', name: 'Encens (Frankincense)', category: 'Huile essentielle' },
  { id: 'tea-tree', name: 'Tea Tree (Melaleuca)', category: 'Huile essentielle' },
  { id: 'bergamot', name: 'Bergamote', category: 'Huile essentielle' },
  { id: 'eucalyptus', name: 'Eucalyptus radié', category: 'Huile essentielle' },
  { id: 'rosemary', name: 'Romarin', category: 'Huile essentielle' },
  { id: 'ylang-ylang', name: 'Ylang Ylang', category: 'Huile essentielle' },
  { id: 'geranium', name: 'Géranium', category: 'Huile essentielle' },
  { id: 'clary-sage', name: 'Sauge sclarée', category: 'Huile essentielle' },
  { id: 'ginger', name: 'Gingembre', category: 'Huile essentielle' },
  { id: 'cinnamon', name: 'Cannelle écorce', category: 'Huile essentielle' },
  { id: 'clove', name: 'Clou de girofle', category: 'Huile essentielle' },
  { id: 'thyme', name: 'Thym', category: 'Huile essentielle' },
  { id: 'cardamom', name: 'Cardamome', category: 'Huile essentielle' },
  { id: 'copaiba', name: 'Copaïba', category: 'Huile essentielle' },
  { id: 'helichrysum', name: 'Hélichryse', category: 'Huile essentielle' },
  { id: 'vetiver', name: 'Vétiver', category: 'Huile essentielle' },
  { id: 'sandalwood', name: 'Santal', category: 'Huile essentielle' },
  { id: 'rose', name: 'Rose', category: 'Huile essentielle' },
  { id: 'jasmine', name: 'Jasmin', category: 'Huile essentielle' },
  { id: 'lime', name: 'Lime', category: 'Huile essentielle' },
  { id: 'grapefruit', name: 'Pamplemousse', category: 'Huile essentielle' },
  { id: 'wild-orange', name: 'Orange sauvage', category: 'Huile essentielle' },
  { id: 'cypress', name: 'Cyprès', category: 'Huile essentielle' },
  { id: 'marjoram', name: 'Marjolaine', category: 'Huile essentielle' },
  { id: 'cedarwood', name: 'Cèdre', category: 'Huile essentielle' },
  { id: 'black-pepper', name: 'Poivre noir', category: 'Huile essentielle' },
  { id: 'basil', name: 'Basilic', category: 'Huile essentielle' },
  { id: 'arborvitae', name: 'Arborvitae', category: 'Huile essentielle' },
  // Mélanges
  { id: 'deep-blue', name: 'Deep Blue', category: 'Mélange' },
  { id: 'on-guard', name: 'On Guard', category: 'Mélange' },
  { id: 'breathe', name: 'Breathe', category: 'Mélange' },
  { id: 'digest-zen', name: 'DigestZen', category: 'Mélange' },
  { id: 'past-tense', name: 'Past Tense', category: 'Mélange' },
  { id: 'serenity', name: 'Serenity', category: 'Mélange' },
  { id: 'elevation', name: 'Elevation', category: 'Mélange' },
  { id: 'balance', name: 'Balance', category: 'Mélange' },
  { id: 'motivate', name: 'Motivate', category: 'Mélange' },
  { id: 'cheer', name: 'Cheer', category: 'Mélange' },
  { id: 'console', name: 'Console', category: 'Mélange' },
  { id: 'forgive', name: 'Forgive', category: 'Mélange' },
  { id: 'zendocrine', name: 'Zendocrine', category: 'Mélange' },
  { id: 'purify', name: 'Purify', category: 'Mélange' },
  { id: 'adaptiv', name: 'Adaptiv', category: 'Mélange' },
  // Compléments
  { id: 'lifelong-vitality', name: 'LifeLong Vitality Pack', category: 'Complément' },
  { id: 'ddpdr', name: 'dōTERRA Digestive Blend', category: 'Complément' },
  { id: 'mito2max', name: 'Mito2Max', category: 'Complément' },
  { id: 'phytoestrogen', name: 'PhytoEstrogen Complex', category: 'Complément' },
  { id: 'bone-nutrient', name: 'Bone Nutrient Complex', category: 'Complément' },
]

export function searchProducts(query: string): DoterraProduct[] {
  const q = query.toLowerCase()
  return DOTERRA_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  )
}
