export const currentUser = {
  id: 'mialy',
  name: 'Mialy R.',
  handle: '@mialy.r',
  initials: 'MR',
  location: 'Antananarivo',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
}

export const initialProducts = [
  {
    id: 'sac-rafia-voa',
    name: 'Sac en raphia tressé — Voa',
    price: 48000,
    currency: 'Ar',
    stock: 3,
    category: 'Mode',
    sellerId: 'tiana-voa',
    sellerName: 'Tiana R. · Atelier Voa',
    sellerHandle: '@atelier.voa',
  },
  {
    id: 'vase-anja-kanto',
    name: 'Vase Anja en terre cuite',
    price: 32000,
    currency: 'Ar',
    stock: 5,
    category: 'Maison',
    sellerId: 'anja-kanto',
    sellerName: 'Anja · Maison Kanto',
    sellerHandle: '@maison.kanto',
  },
  {
    id: 'soin-baobab-madio',
    name: 'Baume nourrissant au baobab',
    price: 24000,
    currency: 'Ar',
    stock: 8,
    category: 'Bien-être',
    sellerId: 'madio-nature',
    sellerName: 'Soa · Madio Nature',
    sellerHandle: '@madio.nature',
  },
  {
    id: 'casque-mora',
    name: 'Casque audio Studio',
    price: 89000,
    currency: 'Ar',
    stock: 2,
    category: 'Tech',
    sellerId: 'mora-tech',
    sellerName: 'Hery · Mora Tech',
    sellerHandle: '@mora.tech',
  },
]

export const initialPosts = [
  {
    id: 'post-sac-photo',
    productId: 'sac-rafia-voa',
    sellerId: 'tiana-voa',
    sellerName: 'Tiana R.',
    shopName: 'Atelier Voa',
    handle: '@atelier.voa',
    initials: 'TV',
    location: 'Antananarivo · 12 min',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&h=120&q=80',
    mediaType: 'image',
    media:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1100&q=85',
    alt: 'Sac tressé posé dans un intérieur lumineux',
    caption:
      'Un peu de soleil dans votre quotidien ☀️ Tressé à la main avec du raphia de chez nous. Chaque pièce a son propre caractère.',
    likes: 128,
    comments: [
      { author: 'Lova', text: 'Les finitions sont magnifiques !' },
      { author: 'Fara', text: 'Est-ce qu’il existe en plus grand ?' },
    ],
  },
  {
    id: 'post-sac-video',
    productId: 'sac-rafia-voa',
    sellerId: 'tiana-voa',
    sellerName: 'Tiana R.',
    shopName: 'Atelier Voa',
    handle: '@atelier.voa',
    initials: 'TV',
    location: 'Antananarivo · 26 min',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&h=120&q=80',
    mediaType: 'video',
    media:
      'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4',
    poster:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1100&q=85',
    alt: 'Démonstration vidéo du sac en raphia porté à la main',
    caption:
      'Un aperçu du tressage et du format porté. La vidéo et les photos mènent au même sac : une seule fiche, le même stock. 🎥',
    likes: 76,
    comments: [{ author: 'Miora', text: 'Merci pour la vidéo, très pratique !' }],
  },
  {
    id: 'post-vase',
    productId: 'vase-anja-kanto',
    sellerId: 'anja-kanto',
    sellerName: 'Anja',
    shopName: 'Maison Kanto',
    handle: '@maison.kanto',
    initials: 'AK',
    location: 'Fianarantsoa · 1 h',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80',
    mediaType: 'image',
    media:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1100&q=85',
    alt: 'Vase en céramique posé sur une table de bois',
    caption:
      'Modelé puis cuit dans notre atelier à Fianarantsoa. Ces petites irrégularités font partie du charme : chaque vase est unique. 🏺',
    likes: 94,
    comments: [{ author: 'Nina', text: 'Les couleurs sont superbes.' }],
  },
  {
    id: 'post-baobab',
    productId: 'soin-baobab-madio',
    sellerId: 'madio-nature',
    sellerName: 'Soa',
    shopName: 'Madio Nature',
    handle: '@madio.nature',
    initials: 'MN',
    location: 'Toamasina · 2 h',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    mediaType: 'image',
    media:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=85',
    alt: 'Soin naturel et produits de beauté présentés sur une étagère',
    caption:
      'Notre baume au baobab est préparé en petites séries à Toamasina. La texture fond sur la peau, sans parfum ajouté. 🌿',
    likes: 203,
    comments: [{ author: 'Hanitra', text: 'Je l’utilise tous les jours !' }],
  },
  {
    id: 'post-casque',
    productId: 'casque-mora',
    sellerId: 'mora-tech',
    sellerName: 'Hery',
    shopName: 'Mora Tech',
    handle: '@mora.tech',
    initials: 'MT',
    location: 'Antananarivo · 3 h',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    mediaType: 'image',
    media:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85',
    alt: 'Casque audio sans fil présenté en gros plan',
    caption:
      'Votre musique, partout avec vous. Autonomie longue durée, coussinets confortables et connexion sans fil. 🎧',
    likes: 57,
    comments: [{ author: 'Feno', text: 'Vous avez d’autres coloris ?' }],
  },
]

export const suggestedSellers = [
  {
    id: 'anja-kanto',
    name: 'Anja',
    shopName: 'Maison Kanto',
    handle: '@maison.kanto',
    initials: 'AK',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80',
    specialty: 'Céramique & maison',
  },
  {
    id: 'madio-nature',
    name: 'Soa',
    shopName: 'Madio Nature',
    handle: '@madio.nature',
    initials: 'MN',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    specialty: 'Soins naturels',
  },
  {
    id: 'mora-tech',
    name: 'Hery',
    shopName: 'Mora Tech',
    handle: '@mora.tech',
    initials: 'MT',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    specialty: 'Tech & accessoires',
  },
]

export const categories = ['Tout', 'Mode', 'Maison', 'Bien-être', 'Tech']

export const sellerRatingSeeds = {
  'tiana-voa': { average: 4.8, count: 34 },
  'anja-kanto': { average: 4.6, count: 21 },
  'madio-nature': { average: 4.9, count: 58 },
  'mora-tech': { average: 4.3, count: 12 },
  [currentUser.id]: { average: 0, count: 0 },
}

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString()

export const initialOrders = [
  {
    id: 'cmd-demo-1',
    productId: 'panier-mialy',
    productName: 'Panier tressé du marché',
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    buyerId: 'lova',
    buyerName: 'Lova A.',
    price: 27000,
    status: 'pending',
    createdAt: daysAgo(1),
    completedAt: null,
    rating: null,
  },
  {
    id: 'cmd-demo-2',
    productId: 'panier-mialy',
    productName: 'Panier tressé du marché',
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    buyerId: 'fara',
    buyerName: 'Fara N.',
    price: 52000,
    status: 'pending',
    createdAt: daysAgo(2),
    completedAt: null,
    rating: null,
  },
  {
    id: 'cmd-demo-3',
    productId: 'panier-mialy',
    productName: 'Panier tressé du marché',
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    buyerId: 'miora',
    buyerName: 'Miora T.',
    price: 25000,
    status: 'completed',
    createdAt: daysAgo(9),
    completedAt: daysAgo(6),
    rating: { stars: 5, comment: 'Très soigné et livré rapidement, merci !', createdAt: daysAgo(5) },
  },
  {
    id: 'cmd-demo-4',
    productId: 'panier-mialy',
    productName: 'Panier tressé du marché',
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    buyerId: 'nina',
    buyerName: 'Nina H.',
    price: 48000,
    status: 'completed',
    createdAt: daysAgo(15),
    completedAt: daysAgo(12),
    rating: { stars: 4, comment: 'Conforme à la description.', createdAt: daysAgo(11) },
  },
]
