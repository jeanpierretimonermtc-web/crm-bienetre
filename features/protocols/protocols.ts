export type ProtocolRole  = 'principal' | 'complémentaire' | 'optionnel'
export type ProtocolBrand = 'doterra' | 'zinzino' | 'all'

export interface ProtocolProduct {
  name:      string
  role:      ProtocolRole
  usage:     string
  frequency: string
}

export interface Protocol {
  id:       string
  brand:    ProtocolBrand
  category: string
  emoji:    string
  title:    string
  subtitle: string
  duration: string
  tips:     string[]
  products: ProtocolProduct[]
}

export const PROTOCOLS_DOTERRA: Protocol[] = [
  // ── Sommeil ────────────────────────────────────────────────────────────────
  {
    id: 'sommeil', brand: 'doterra', category: 'Bien-être émotionnel', emoji: '😴',
    title: 'Sommeil & Insomnie',
    subtitle: 'Difficultés à s\'endormir, réveils nocturnes, sommeil agité',
    duration: '3–4 semaines',
    tips: [
      'Appliquer les huiles 30 min avant le coucher',
      'Diffuser dans la chambre 30 min avant de dormir puis éteindre',
      'Éviter les écrans 1h avant le coucher',
    ],
    products: [
      { name: 'Lavande',        role: 'principal',      usage: '2 gouttes sur les poignets, la nuque et les plantes des pieds', frequency: 'Chaque soir' },
      { name: 'Sérenité',       role: 'principal',      usage: '3 gouttes en diffusion dans la chambre ou 1 goutte sur l\'oreiller', frequency: 'Chaque soir' },
      { name: 'Vétiver',        role: 'complémentaire', usage: '1 goutte sur la plante des pieds (gros orteil)', frequency: 'Chaque soir' },
      { name: 'Balance',        role: 'complémentaire', usage: '2 gouttes derrière les oreilles pour ancrer les émotions', frequency: 'Soir' },
      { name: 'Roman Chamomile',role: 'optionnel',       usage: '1–2 gouttes sur les tempes diluées avec huile végétale', frequency: 'En cas de rumination' },
    ],
  },

  // ── Stress / Anxiété ───────────────────────────────────────────────────────
  {
    id: 'stress', brand: 'doterra', category: 'Bien-être émotionnel', emoji: '🧘',
    title: 'Stress & Anxiété',
    subtitle: 'Tension nerveuse, inquiétudes, sentiment d\'oppression',
    duration: 'Usage continu',
    tips: [
      'Inhaler directement depuis le flacon en situation de stress aigu',
      'Appliquer sur le sternum pour un effet rapide',
      'Combiner avec des exercices de respiration profonde',
    ],
    products: [
      { name: 'Balance',    role: 'principal',      usage: '2–3 gouttes sur la paume, inhaler profondément, puis appliquer sur la nuque', frequency: 'Matin et en cas de besoin' },
      { name: 'Lavande',    role: 'principal',      usage: '2 gouttes sur les poignets ou en diffusion', frequency: 'Toute la journée' },
      { name: 'Bergamote',  role: 'complémentaire', usage: '2 gouttes sur le plexus solaire (dilué) ou en diffusion', frequency: 'Journée' },
      { name: 'Élévation',  role: 'complémentaire', usage: '1–2 gouttes sur le sternum ou derrière les oreilles', frequency: 'Matin' },
      { name: 'Frankincense', role: 'optionnel',    usage: '1 goutte sous la langue ou sur le dessus du crâne', frequency: 'Méditation ou moments difficiles' },
    ],
  },

  // ── Énergie / Fatigue ─────────────────────────────────────────────────────
  {
    id: 'energie', brand: 'doterra', category: 'Vitalité', emoji: '⚡',
    title: 'Énergie & Fatigue',
    subtitle: 'Coup de fatigue, manque d\'énergie, léthargie',
    duration: '2–3 semaines',
    tips: [
      'Inhaler la menthe poivrée en cas de coup de pompe en milieu de journée',
      'Ne pas utiliser les huiles stimulantes trop tard le soir',
      'Combiner avec une bonne hydratation',
    ],
    products: [
      { name: 'Menthe Poivrée', role: 'principal',      usage: '1–2 gouttes inhalées directement ou sur les tempes et la nuque', frequency: 'Matin + milieu de journée' },
      { name: 'Citrus Bliss',   role: 'principal',      usage: '3 gouttes en diffusion pour booster l\'ambiance', frequency: 'Matin' },
      { name: 'Agrumes',        role: 'complémentaire', usage: '2 gouttes sur les poignets, inhaler', frequency: 'Matin' },
      { name: 'Motivate',       role: 'complémentaire', usage: '2 gouttes sur la paume, inhaler puis appliquer sur les épaules', frequency: 'Matin + après-midi' },
      { name: 'Lifelong Vitality', role: 'optionnel',   usage: 'Compléments alimentaires selon protocole fabricant', frequency: 'Quotidien' },
    ],
  },

  // ── Digestion ─────────────────────────────────────────────────────────────
  {
    id: 'digestion', brand: 'doterra', category: 'Corps & Santé', emoji: '🫶',
    title: 'Digestion & Inconforts digestifs',
    subtitle: 'Ballonnements, gaz, nausées, digestion lente, colon irritable',
    duration: '2–4 semaines',
    tips: [
      'Masser le ventre dans le sens des aiguilles d\'une montre après application',
      'Appliquer 20 min avant les repas pour préparer la digestion',
      'Diluer toujours avec une huile végétale sur l\'abdomen',
    ],
    products: [
      { name: 'DigestZen',      role: 'principal',      usage: '2–3 gouttes diluées sur l\'abdomen, masser', frequency: 'Avant/après repas' },
      { name: 'Gingembre',      role: 'principal',      usage: '1–2 gouttes sur l\'abdomen ou 1 goutte dans eau chaude', frequency: 'Avant repas ou en cas de nausée' },
      { name: 'Fenouil',        role: 'complémentaire', usage: '2 gouttes diluées sur le ventre', frequency: 'En cas de ballonnements' },
      { name: 'Coriandre',      role: 'complémentaire', usage: '2 gouttes sur l\'abdomen mélangées à l\'huile végétale', frequency: 'Quotidien' },
      { name: 'Menthe Poivrée', role: 'optionnel',      usage: '1 goutte dans un verre d\'eau (capsule végétale) ou inhalée', frequency: 'Après repas lourd' },
    ],
  },

  // ── Douleurs musculaires ──────────────────────────────────────────────────
  {
    id: 'douleurs', brand: 'doterra', category: 'Corps & Santé', emoji: '💪',
    title: 'Douleurs musculaires & Articulaires',
    subtitle: 'Courbatures, tensions, douleurs articulaires, raideurs',
    duration: '2–6 semaines',
    tips: [
      'Masser avec des mouvements circulaires sur les zones concernées',
      'Appliquer avant et après le sport',
      'Alterner chaud/froid peut amplifier l\'effet des huiles',
    ],
    products: [
      { name: 'Deep Blue',    role: 'principal',      usage: '3–4 gouttes diluées sur la zone douloureuse, masser', frequency: 'Matin + soir + après effort' },
      { name: 'Helichrysum', role: 'principal',      usage: '2 gouttes (pur ou dilué) sur la zone, masser', frequency: 'Matin et soir' },
      { name: 'Marjolaine',  role: 'complémentaire', usage: '2 gouttes diluées sur les muscles tendus', frequency: 'Avant effort ou soirée' },
      { name: 'Cyprès',      role: 'complémentaire', usage: '2 gouttes diluées sur les membres pour la circulation', frequency: 'Soir' },
      { name: 'Copaïba',     role: 'optionnel',      usage: '1–2 gouttes en interne (capsule) ou diluées en topique', frequency: 'Quotidien' },
    ],
  },

  // ── Immunité ──────────────────────────────────────────────────────────────
  {
    id: 'immunite', brand: 'doterra', category: 'Corps & Santé', emoji: '🛡️',
    title: 'Immunité & Défenses naturelles',
    subtitle: 'Prévention hivernale, récupération, renforcement général',
    duration: '3–4 semaines (cures saisonnières)',
    tips: [
      'Renforcer les défenses en cure de 3 semaines, 1 semaine de pause',
      'On Guard en diffusion assainit l\'air de la maison',
      'Toujours diluer On Guard pour application cutanée',
    ],
    products: [
      { name: 'On Guard',        role: 'principal',      usage: '2 gouttes sur la plante des pieds (dilué) ou 1–2 gouttes dans de l\'eau chaude avec miel', frequency: 'Matin quotidien' },
      { name: 'Arbre à Thé',    role: 'principal',      usage: '2 gouttes sur les ganglions, la gorge (dilué) ou 1 goutte dans eau', frequency: 'Matin et soir' },
      { name: 'Origan',          role: 'complémentaire', usage: '1 goutte en capsule végétale ou sur la plante des pieds (très dilué)', frequency: 'En prévention hivernale' },
      { name: 'Eucalyptus',      role: 'complémentaire', usage: '2–3 gouttes en diffusion ou inhalation vapeur', frequency: 'Matin + soirée' },
      { name: 'Frankincense',    role: 'optionnel',      usage: '1 goutte sous la langue ou 2 gouttes sur la nuque', frequency: 'Quotidien' },
    ],
  },

  // ── Concentration ─────────────────────────────────────────────────────────
  {
    id: 'concentration', brand: 'doterra', category: 'Vitalité', emoji: '🧠',
    title: 'Concentration & Mémoire',
    subtitle: 'Difficultés à se concentrer, brouillard mental, mémoire',
    duration: 'Usage continu',
    tips: [
      'Diffuser pendant le travail ou les révisions',
      'Inhaler directement en cas de baisse d\'attention',
      'La rosemary est particulièrement efficace avant examen',
    ],
    products: [
      { name: 'Romarin',        role: 'principal',      usage: '2 gouttes inhalées ou sur les tempes', frequency: 'Avant séance de travail' },
      { name: 'Menthe Poivrée', role: 'principal',      usage: '1–2 gouttes inhalées ou diffusées', frequency: 'Milieu de matinée + après-midi' },
      { name: 'InTune',         role: 'complémentaire', usage: '2 gouttes sur les tempes et la nuque', frequency: 'Matin et en cas de besoin' },
      { name: 'Vétiver',        role: 'complémentaire', usage: '1 goutte sur les pieds pour ancrer et stabiliser', frequency: 'Avant travail profond' },
      { name: 'Bergamote',      role: 'optionnel',      usage: '2 gouttes en diffusion pour clarifier l\'esprit', frequency: 'Journée' },
    ],
  },

  // ── Émotions ──────────────────────────────────────────────────────────────
  {
    id: 'emotions', brand: 'doterra', category: 'Bien-être émotionnel', emoji: '❤️',
    title: 'Équilibre émotionnel & Humeur',
    subtitle: 'Tristesse, manque de motivation, émotions lourdes, burn-out émotionnel',
    duration: '4–6 semaines',
    tips: [
      'Les huiles émotionnelles agissent sur le système limbique via l\'olfaction',
      'Créer un rituel matinal de 5 min avec les huiles pour ancrer le positif',
      'Le journaling associé aux huiles amplifie les résultats',
    ],
    products: [
      { name: 'Élévation',    role: 'principal',      usage: '2 gouttes sur le plexus solaire ou dans la paume, inhaler', frequency: 'Matin' },
      { name: 'Frankincense', role: 'principal',      usage: '1 goutte sous la langue ou sur le crâne pendant méditation', frequency: 'Matin + méditation' },
      { name: 'Bergamote',    role: 'complémentaire', usage: '2 gouttes derrière les oreilles ou en diffusion', frequency: 'Journée' },
      { name: 'Ylang Ylang',  role: 'complémentaire', usage: '1 goutte sur le cœur (sternum), dilué', frequency: 'Soir' },
      { name: 'Rose',         role: 'optionnel',      usage: '1 goutte derrière les oreilles ou en diffusion légère', frequency: 'Moments de vulnérabilité' },
    ],
  },

  // ── Peau ──────────────────────────────────────────────────────────────────
  {
    id: 'peau', brand: 'doterra', category: 'Corps & Santé', emoji: '✨',
    title: 'Peau & Cicatrisation',
    subtitle: 'Peaux sensibles, imperfections, cicatrices, antiâge',
    duration: '4–8 semaines',
    tips: [
      'Toujours diluer dans une huile végétale de qualité (jojoba, argan, rosehip)',
      'Faire un test cutané sur l\'avant-bras avant première utilisation',
      'Appliquer le soir pour laisser agir pendant le sommeil',
    ],
    products: [
      { name: 'Lavande',       role: 'principal',      usage: '2 gouttes dans 10 ml d\'huile végétale, appliquer sur la zone', frequency: 'Matin et soir' },
      { name: 'Helichrysum',   role: 'principal',      usage: '2 gouttes dans sérum ou crème, appliquer en massage doux', frequency: 'Soir' },
      { name: 'Frankincense',  role: 'complémentaire', usage: '1–2 gouttes dans crème de jour ou sérum', frequency: 'Matin + soir' },
      { name: 'Géranium',      role: 'complémentaire', usage: '2 gouttes dans huile végétale, masser le visage', frequency: 'Soir' },
      { name: 'Arbre à Thé',  role: 'optionnel',      usage: '1 goutte pure sur imperfection localisée (pur possible sur bouton)', frequency: 'En cas de besoin' },
    ],
  },

  // ── Respiration ───────────────────────────────────────────────────────────
  {
    id: 'respiration', brand: 'doterra', category: 'Corps & Santé', emoji: '🌬️',
    title: 'Respiration & Voies respiratoires',
    subtitle: 'Rhume, sinusite, toux, congestion, allergies respiratoires',
    duration: '1–3 semaines ou saisonnier',
    tips: [
      'En cas d\'urgence : mettre 2 gouttes d\'eucalyptus dans bol d\'eau chaude, inhaler',
      'Frotter la poitrine avec huile végétale + huiles essentielles pour dégager les voies',
      'Diffuser la nuit pour faciliter le sommeil en cas de congestion',
    ],
    products: [
      { name: 'Breathe',         role: 'principal',      usage: '2–3 gouttes sur la poitrine (dilué) ou en diffusion', frequency: 'Matin, soir, et selon besoin' },
      { name: 'Eucalyptus',      role: 'principal',      usage: '2 gouttes en inhalation vapeur ou sur la poitrine dilué', frequency: 'Matin + soir' },
      { name: 'Menthe Poivrée',  role: 'complémentaire', usage: '1 goutte sur les narines (côtés) ou inhalée', frequency: 'En cas de congestion aiguë' },
      { name: 'Ravintsara',      role: 'complémentaire', usage: '2 gouttes sur la poitrine, le dos et la plante des pieds (dilué)', frequency: 'Matin et soir' },
      { name: 'Citron',          role: 'optionnel',      usage: '1 goutte dans eau chaude avec miel pour la gorge', frequency: 'Matin' },
    ],
  },

  // ── Hormones ──────────────────────────────────────────────────────────────
  {
    id: 'hormones', brand: 'doterra', category: 'Bien-être émotionnel', emoji: '🌸',
    title: 'Équilibre hormonal féminin',
    subtitle: 'SPM, règles douloureuses, ménopause, déséquilibres hormonaux',
    duration: '2–3 cycles menstruels',
    tips: [
      'Appliquer Clary Calm sur les zones de pouls : poignets, nuque, intérieur cheville',
      'Ajuster le protocole selon la phase du cycle',
      'Associer avec alimentation anti-inflammatoire',
    ],
    products: [
      { name: 'Clary Calm',      role: 'principal',      usage: '2 gouttes sur le ventre bas ou les zones de pouls, selon le cycle', frequency: 'Quotidien ou selon besoin' },
      { name: 'Géranium',        role: 'principal',      usage: '2 gouttes sur le ventre bas dilué, ou en diffusion', frequency: 'Phase prémenstruelle' },
      { name: 'Ylang Ylang',     role: 'complémentaire', usage: '1 goutte sur le plexus ou en diffusion pour l\'humeur', frequency: 'Selon humeur et cycle' },
      { name: 'Lavande',         role: 'complémentaire', usage: '2 gouttes sur le ventre bas dilué pour les crampes', frequency: 'En cas de douleurs' },
      { name: 'Frankincense',    role: 'optionnel',      usage: '1 goutte sous la langue ou sur le crâne pour l\'équilibre général', frequency: 'Quotidien' },
    ],
  },

  // ── Détox ─────────────────────────────────────────────────────────────────
  {
    id: 'detox', brand: 'doterra', category: 'Vitalité', emoji: '🌿',
    title: 'Détox & Drainage',
    subtitle: 'Soutien foie, drainage lymphatique, purification printanière',
    duration: '3 semaines (cure)',
    tips: [
      'Boire au moins 2L d\'eau par jour pendant la cure',
      'Associer avec un programme alimentaire léger',
      'Masser dans le sens du drainage lymphatique : vers le cœur',
    ],
    products: [
      { name: 'Citron',       role: 'principal',      usage: '1–2 gouttes dans 1L d\'eau, boire tout au long de la journée (capsule si sensible)', frequency: 'Quotidien à jeun + journée' },
      { name: 'Zendocrine',   role: 'principal',      usage: '2 gouttes sur le foie (côté droit, sous les côtes), dilué', frequency: 'Matin et soir' },
      { name: 'Genévrier',    role: 'complémentaire', usage: '2 gouttes sur les reins (bas du dos) dilué', frequency: 'Quotidien' },
      { name: 'Coriandre',    role: 'complémentaire', usage: '2 gouttes sous la langue ou diluées sur l\'abdomen', frequency: 'Quotidien' },
      { name: 'Gingembre',    role: 'optionnel',      usage: '1 goutte dans eau chaude le matin pour stimuler la digestion', frequency: 'Matin à jeun' },
    ],
  },
]

// ── Protocoles Zinzino ────────────────────────────────────────────────────────

export const ZINZINO_PROTOCOLS: Protocol[] = [
  {
    id: 'z-balance', brand: 'zinzino', category: 'Équilibre fondamental', emoji: '⚖️',
    title: 'Équilibre Oméga-3 / Oméga-6',
    subtitle: 'Déséquilibre inflammatoire, ratio oméga mal équilibré, inflammation chronique',
    duration: '4–6 mois (rééquilibrage progressif)',
    tips: [
      'Prendre le Balance Oil avec un repas contenant des matières grasses pour optimiser l\'absorption',
      'Faire le Balance Test avant de démarrer pour mesurer le ratio de départ',
      'Faire un contrôle à 4 mois pour voir l\'évolution du ratio',
    ],
    products: [
      { name: 'Balance Oil+',  role: 'principal',      usage: '2 x 10 ml/jour mélangé dans smoothie, yaourt ou jus', frequency: 'Matin et soir avec repas' },
      { name: 'Xtend+',        role: 'complémentaire', usage: '4 comprimés par jour avec de l\'eau', frequency: 'Matin au petit-déjeuner' },
      { name: 'Balance Test',  role: 'optionnel',      usage: 'Test sanguin avant/après cure pour mesurer le ratio Oméga-6:3', frequency: 'Début de cure et à 4 mois' },
    ],
  },
  {
    id: 'z-immunite', brand: 'zinzino', category: 'Vitalité & Immunité', emoji: '🛡️',
    title: 'Immunité & Protection cellulaire',
    subtitle: 'Défenses affaiblies, récupération lente, stress oxydatif',
    duration: '3 mois minimum',
    tips: [
      'L\'effet est progressif — ne pas arrêter avant 3 mois',
      'Combiner avec une alimentation riche en légumes et fruits colorés',
      'Protect+ est particulièrement efficace à prendre le soir',
    ],
    products: [
      { name: 'Xtend+',    role: 'principal',      usage: '4 comprimés par jour avec de l\'eau', frequency: 'Matin' },
      { name: 'Protect+',  role: 'principal',      usage: '2 gélules par jour', frequency: 'Soir avec repas' },
      { name: 'Balance Oil+', role: 'complémentaire', usage: '2 x 10 ml/jour — réduit l\'inflammation de fond', frequency: 'Matin et soir' },
    ],
  },
  {
    id: 'z-digestion', brand: 'zinzino', category: 'Microbiome & Digestion', emoji: '🫶',
    title: 'Flore intestinale & Digestion',
    subtitle: 'Microbiome déséquilibré, ballonnements, transit lent, côlon irritable',
    duration: '6–8 semaines',
    tips: [
      'Prendre ZinoBiotic à jeun ou avant le repas principal',
      'Augmenter progressivement la dose (commencer par 1 cuillère) pour éviter les inconforts',
      'Bien s\'hydrater (au moins 1,5L d\'eau par jour)',
    ],
    products: [
      { name: 'ZinoBiotic+',  role: 'principal',      usage: '2 cuillères à café (5g) dans un grand verre d\'eau ou yaourt, mélanger', frequency: 'Matin à jeun' },
      { name: 'Balance Oil+', role: 'complémentaire', usage: '10 ml/jour pour réduire l\'inflammation intestinale', frequency: 'Avec repas' },
      { name: 'Xtend+',       role: 'optionnel',      usage: '4 comprimés pour les vitamines et minéraux qui soutiennent la muqueuse', frequency: 'Matin' },
    ],
  },
  {
    id: 'z-energie', brand: 'zinzino', category: 'Vitalité & Immunité', emoji: '⚡',
    title: 'Énergie & Vitalité',
    subtitle: 'Fatigue chronique, manque d\'énergie, coup de barre post-repas',
    duration: '4–6 semaines',
    tips: [
      'Prendre Viva+ le matin, jamais après 14h pour ne pas perturber le sommeil',
      'L\'hydratation est clé — la fatigue est souvent liée à un manque d\'eau',
      'Combiner avec un sport léger régulier (marche rapide, yoga)',
    ],
    products: [
      { name: 'Viva+',         role: 'principal',      usage: '2 gélules avec de l\'eau', frequency: 'Matin au réveil' },
      { name: 'Xtend+',        role: 'principal',      usage: '4 comprimés — vitamines B, magnésium et coenzymes de l\'énergie', frequency: 'Matin' },
      { name: 'Balance Oil+',  role: 'complémentaire', usage: '10 ml pour soutenir le cerveau et réduire la fatigue mentale', frequency: 'Matin avec repas' },
    ],
  },
  {
    id: 'z-poids', brand: 'zinzino', category: 'Composition corporelle', emoji: '⚖️',
    title: 'Poids & Composition corporelle',
    subtitle: 'Prise de poids, fringales, perte de masse musculaire, métabolisme lent',
    duration: '3 mois',
    tips: [
      'PeaZin Protein remplace efficacement une collation ou peut compléter le petit-déjeuner',
      'ZinoBiotic augmente la satiété et réduit les envies de sucre',
      'Ne pas prendre comme substitut de repas complet sans suivi',
    ],
    products: [
      { name: 'PeaZin Protein', role: 'principal',      usage: '1–2 portions mélangées dans eau froide ou lait végétal', frequency: 'Post-sport ou collation' },
      { name: 'ZinoBiotic+',    role: 'principal',      usage: '5g dans eau 30 min avant repas pour réduire l\'appétit', frequency: 'Avant les repas principaux' },
      { name: 'Balance Oil+',   role: 'complémentaire', usage: '10 ml — soutient le métabolisme lipidique', frequency: 'Avec repas' },
    ],
  },
  {
    id: 'z-peau', brand: 'zinzino', category: 'Beauté & Peau', emoji: '✨',
    title: 'Peau, Cheveux & Ongles',
    subtitle: 'Peau terne, rides précoces, cheveux fragiles, ongles cassants',
    duration: '2–3 mois (résultats visibles à 6–8 semaines)',
    tips: [
      'Les résultats sur la peau sont visibles à partir de 6–8 semaines de prise régulière',
      'Associer avec une bonne hydratation (eau + huiles essentielles grasses alimentaires)',
      'Protéger la peau du soleil — les oméga-3 rendent la peau plus sensible',
    ],
    products: [
      { name: 'CollaZin',      role: 'principal',      usage: '1 sachet dissous dans eau froide ou tiède (pas chaude)', frequency: 'Matin à jeun' },
      { name: 'Balance Oil+',  role: 'principal',      usage: '10 ml — oméga-3 essentiels pour la barrière cutanée', frequency: 'Avec repas' },
      { name: 'Xtend+',        role: 'complémentaire', usage: '4 comprimés — vitamines C, E, Zinc pour la peau et les cheveux', frequency: 'Matin' },
    ],
  },
  {
    id: 'z-articulations', brand: 'zinzino', category: 'Corps & Mobilité', emoji: '💪',
    title: 'Articulations & Mobilité',
    subtitle: 'Douleurs articulaires, raideurs, récupération sportive, inflammation',
    duration: '3–4 mois',
    tips: [
      'L\'effet anti-inflammatoire des oméga-3 sur les articulations est progressif (6–8 semaines)',
      'Associer avec des exercices de mobilité doux (yoga, stretching)',
      'Prendre CollaZin loin des repas pour une meilleure absorption',
    ],
    products: [
      { name: 'Balance Oil+', role: 'principal',      usage: '2 x 10 ml — réduit l\'inflammation articulaire de fond', frequency: 'Matin et soir avec repas' },
      { name: 'CollaZin',     role: 'principal',      usage: '1 sachet dans eau froide — collagène pour le cartilage', frequency: 'Matin à jeun' },
      { name: 'Xtend+',       role: 'complémentaire', usage: '4 comprimés — vitamine D et magnésium pour les muscles', frequency: 'Matin' },
    ],
  },
]

export const PROTOCOLS: Protocol[] = [...PROTOCOLS_DOTERRA, ...ZINZINO_PROTOCOLS]

export const CATEGORIES_BY_BRAND: Record<ProtocolBrand | 'all', string[]> = {
  doterra: [...new Set(PROTOCOLS_DOTERRA.map(p => p.category))],
  zinzino: [...new Set(ZINZINO_PROTOCOLS.map(p => p.category))],
  all:     [...new Set([...PROTOCOLS_DOTERRA, ...ZINZINO_PROTOCOLS].map(p => p.category))],
}

export const CATEGORIES = [...new Set(PROTOCOLS.map(p => p.category))]

export const ROLE_LABELS: Record<ProtocolRole, string> = {
  principal:      'Principal',
  complémentaire: 'Complémentaire',
  optionnel:      'Optionnel',
}

export const ROLE_COLORS: Record<ProtocolRole, { bg: string; text: string }> = {
  principal:      { bg: '#DBEAFE', text: '#1D4ED8' },
  complémentaire: { bg: '#D1FAE5', text: '#059669' },
  optionnel:      { bg: '#F1F5F9', text: '#64748B' },
}
