import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const currentUser = {
  id: 'mialy',
  name: 'Mialy R.',
  handle: '@mialy.r',
  initials: 'MR',
  location: 'Antananarivo',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
}

const initialProducts = [
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

const initialPosts = [
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

const suggestedSellers = [
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

const categories = ['Tout', 'Mode', 'Maison', 'Bien-être', 'Tech']

function Icon({ name, size = 20, filled = false }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8m-8 3h5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    heart: <path d="M20.8 8.8c0 4.3-8.8 10-8.8 10s-8.8-5.7-8.8-10a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" />,
    comment: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h8" /></>,
    share: <><path d="M12 15V3m-4 4 4-4 4 4" /><path d="M5 12v8h14v-8" /></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.7 1.6L7 5l-1.3.4L5 7l-.7-1.6L3 5l1.3-.4L5 3Z" /></>,
  }

  return (
    <svg
      className={filled ? 'icon is-filled' : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled && name === 'heart' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Avatar({ src, initials, size = 'normal', className = '' }) {
  return (
    <span className={`avatar avatar-${size} ${className}`}>
      {src ? <img src={src} alt="" /> : <span>{initials}</span>}
    </span>
  )
}

function formatPrice(price) {
  return `${new Intl.NumberFormat('fr-FR').format(price)} Ar`
}

function App() {
  const [products, setProducts] = useState(initialProducts)
  const [posts, setPosts] = useState(initialPosts)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tout')
  const [likedPosts, setLikedPosts] = useState([])
  const [followedSellers, setFollowedSellers] = useState(['tiana-voa'])
  const [expandedComments, setExpandedComments] = useState([])
  const [commentDrafts, setCommentDrafts] = useState({})
  const [modal, setModal] = useState(null)
  const [profileTab, setProfileTab] = useState('publications')
  const [publishProductId, setPublishProductId] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [demoPurchases, setDemoPurchases] = useState([])
  const [feedTab, setFeedTab] = useState('for-you')
  const [toastMessage, setToastMessage] = useState('')
  const [draftMedia, setDraftMedia] = useState(null)
  const [draftError, setDraftError] = useState('')
  const toastTimer = useRef(null)
  const searchRef = useRef(null)
  const feedRef = useRef(null)
  const fileInputRef = useRef(null)
  const postSequence = useRef(0)
  const objectUrls = useRef(new Set())

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current)
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') setModal(null)
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [])

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')

    return posts.filter((post) => {
      const product = productById.get(post.productId)
      const matchesCategory =
        activeCategory === 'Tout' || product?.category === activeCategory
      const matchesQuery =
        !normalizedQuery ||
        `${post.caption} ${post.sellerName} ${post.shopName} ${post.handle} ${product?.name ?? ''}`
          .toLocaleLowerCase('fr')
          .includes(normalizedQuery)
      const matchesFollowing =
        feedTab !== 'following' || followedSellers.includes(post.sellerId)
      return matchesCategory && matchesQuery && matchesFollowing
    })
  }, [activeCategory, feedTab, followedSellers, posts, productById, query])

  function showToast(message) {
    window.clearTimeout(toastTimer.current)
    setToastMessage(message)
    toastTimer.current = window.setTimeout(() => setToastMessage(''), 2800)
  }

  function focusSearch() {
    searchRef.current?.focus()
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function toggleLike(postId) {
    setLikedPosts((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    )
  }

  function toggleFollow(sellerId, sellerName) {
    const isFollowing = followedSellers.includes(sellerId)
    setFollowedSellers((current) =>
      isFollowing
        ? current.filter((id) => id !== sellerId)
        : [...current, sellerId],
    )
    showToast(
      isFollowing
        ? `Vous ne suivez plus ${sellerName}.`
        : `Vous suivez maintenant ${sellerName}.`,
    )
  }

  async function sharePost(post) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.shopName} sur V`, url: shareUrl })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        showToast('Lien de la publication copié.')
      } else {
        showToast(`Lien à partager : ${shareUrl}`)
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(`Lien à partager : ${shareUrl}`)
      }
    }
  }

  function addComment(postId, event) {
    event.preventDefault()
    const text = commentDrafts[postId]?.trim()
    if (!text) return

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, { author: currentUser.name, text }],
            }
          : post,
      ),
    )
    setCommentDrafts((current) => ({ ...current, [postId]: '' }))
  }

  function openProduct(productId) {
    setModal({ type: 'product', productId })
  }

  function openMessages(seller) {
    setMessageDraft('')
    setModal({ type: 'messages', seller: seller ?? null })
  }

  function updateDraftMedia(file) {
    if (draftMedia?.preview) {
      URL.revokeObjectURL(draftMedia.preview)
      objectUrls.current.delete(draftMedia.preview)
    }
    setDraftError('')
    if (!file) {
      setDraftMedia(null)
      return
    }
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      setDraftMedia(null)
      setDraftError('Choisissez une photo ou une courte vidéo.')
      return
    }
    const preview = URL.createObjectURL(file)
    objectUrls.current.add(preview)
    setDraftMedia({
      file,
      type: isVideo ? 'video' : 'image',
      preview,
    })
  }

  function publishPost(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('productName') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const priceValue = Number(formData.get('price'))
    const selectedProduct = productById.get(String(formData.get('existingProductId') ?? ''))
    const existingProduct =
      selectedProduct?.sellerId === currentUser.id ? selectedProduct : null
    if (
      !draftMedia ||
      !description ||
      (!existingProduct && (!name || !Number.isFinite(priceValue) || priceValue <= 0))
    ) {
      setDraftError('Ajoutez un média, une description et les informations du produit.')
      return
    }

    let product = existingProduct
    if (!product) {
      postSequence.current += 1
      product = {
        id: `mialy-${postSequence.current}`,
        name,
        price: priceValue,
        currency: 'Ar',
        stock: 1,
        category: 'Autre',
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerHandle: currentUser.handle,
      }
    }
    const productId = product.id
    const post = {
      id: `post-${productId}-${postSequence.current + posts.length}`,
      productId,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      shopName: 'Mon profil',
      handle: currentUser.handle,
      initials: currentUser.initials,
      location: `${currentUser.location} · à l’instant`,
      avatar: currentUser.avatar,
      mediaType: draftMedia.type,
      media: draftMedia.preview,
      file: draftMedia.file,
      alt: name,
      caption: description,
      likes: 0,
      comments: [],
    }
    if (!existingProduct) setProducts((current) => [product, ...current])
    setPosts((current) => [post, ...current])
    objectUrls.current.delete(draftMedia.preview)
    setDraftMedia(null)
    setDraftError('')
    setPublishProductId('')
    setModal(null)
    setFeedTab('for-you')
    setActiveCategory('Tout')
    showToast('Publication ajoutée au fil de démonstration.')
    window.setTimeout(() => feedRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  function sendMessage(event) {
    event.preventDefault()
    const text = messageDraft.trim()
    if (!text) return
    setMessages((current) => [
      ...current,
      { id: Date.now(), text, seller: modal?.seller?.sellerName ?? 'V' },
    ])
    setMessageDraft('')
    showToast('Message envoyé dans cette démonstration.')
  }

  function startDemoPurchase(product) {
    setDemoPurchases((current) =>
      current.some((item) => item.productId === product.id)
        ? current
        : [
            {
              productId: product.id,
              productName: product.name,
              price: product.price,
              sellerName: product.sellerName,
              status: 'Simulation · aucun paiement effectué',
            },
            ...current,
          ],
    )
    setModal({ type: 'purchase', productId: product.id })
  }

  function handleNavigation(destination) {
    setModal(null)
    if (destination === 'home') {
      setQuery('')
      setActiveCategory('Tout')
      setFeedTab('for-you')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (destination === 'search') {
      focusSearch()
    } else if (destination === 'create') {
      setDraftError('')
      setPublishProductId('')
      setModal({ type: 'create' })
    } else if (destination === 'messages') {
      openMessages(null)
    } else if (destination === 'profile') {
      setProfileTab('publications')
      setModal({ type: 'profile' })
    } else if (destination === 'purchases') {
      setProfileTab('achats')
      setModal({ type: 'profile' })
    }
  }

  function renderMedia(post, className = '') {
    if (post.mediaType === 'video') {
      return (
        <div className={`post-media post-video ${className}`}>
          <video
            src={post.media}
            poster={post.poster}
            controls
            playsInline
            preload="metadata"
            aria-label={`Vidéo produit : ${post.alt}`}
          />
          <span className="media-kind"><Icon name="play" size={13} /> Vidéo</span>
          <button
            className="video-product-link"
            type="button"
            onClick={() => openProduct(post.productId)}
          >
            Voir le produit
          </button>
        </div>
      )
    }

    return (
      <button
        className={`post-media post-image ${className}`}
        type="button"
        aria-label={`Voir la fiche produit : ${productById.get(post.productId)?.name ?? post.alt}`}
        onClick={() => openProduct(post.productId)}
      >
        <img src={post.media} alt={post.alt} loading="lazy" />
      </button>
    )
  }

  function renderPost(post) {
    const product = productById.get(post.productId)
    if (!product) return null
    const liked = likedPosts.includes(post.id)
    const following = followedSellers.includes(post.sellerId)
    const commentsOpen = expandedComments.includes(post.id)
    const postLikeCount = post.likes + (liked ? 1 : 0)

    return (
      <article className="post-card" id={post.id} key={post.id}>
        <div className="post-header">
          <div className="post-author">
            <button
              className="avatar-link"
              type="button"
              aria-label={`Voir le profil de ${post.sellerName}`}
              onClick={() => showToast(`Profil de ${post.sellerName} — démonstration.`)}
            >
              <Avatar src={post.avatar} initials={post.initials} />
            </button>
            <div className="author-details">
              <button
                className="author-name"
                type="button"
                onClick={() => showToast(`Profil de ${post.sellerName} — démonstration.`)}
              >
                {post.sellerName} <span className="verified-mark"><Icon name="check" size={11} /></span>
              </button>
              <span>{post.shopName} · {post.location}</span>
            </div>
          </div>
          {post.sellerId !== currentUser.id && (
            <button
              className={`follow-button${following ? ' is-following' : ''}`}
              type="button"
              aria-pressed={following}
              onClick={() => toggleFollow(post.sellerId, post.shopName)}
            >
              {following ? 'Abonné·e' : 'Suivre'}
            </button>
          )}
        </div>

        <p className="post-caption">{post.caption}</p>
        {renderMedia(post)}

        <div className="post-reactions">
          <button
            className={`reaction-button like-button${liked ? ' is-liked' : ''}`}
            type="button"
            aria-label={liked ? 'Ne plus aimer cette publication' : 'Aimer cette publication'}
            aria-pressed={liked}
            onClick={() => toggleLike(post.id)}
          >
            <Icon name="heart" size={19} filled={liked} />
            <span>{postLikeCount}</span>
          </button>
          <button
            className="reaction-button"
            type="button"
            aria-label={`Afficher les commentaires (${post.comments.length})`}
            aria-expanded={commentsOpen}
            onClick={() =>
              setExpandedComments((current) =>
                current.includes(post.id)
                  ? current.filter((id) => id !== post.id)
                  : [...current, post.id],
              )
            }
          >
            <Icon name="comment" size={19} />
            <span>{post.comments.length}</span>
          </button>
          <button
            className="reaction-button share-button"
            type="button"
            onClick={() => sharePost(post)}
          >
            <Icon name="share" size={18} />
            <span>Partager</span>
          </button>
        </div>

        {commentsOpen && (
          <div className="comments-panel">
            {post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <p className="comment" key={`${post.id}-${index}`}>
                  <strong>{comment.author}</strong> {comment.text}
                </p>
              ))
            ) : (
              <p className="comments-empty">Soyez la première personne à commenter.</p>
            )}
            <form className="comment-form" onSubmit={(event) => addComment(post.id, event)}>
              <Avatar src={currentUser.avatar} initials={currentUser.initials} size="tiny" />
              <input
                aria-label={`Écrire un commentaire sur ${post.shopName}`}
                placeholder="Écrire un commentaire…"
                value={commentDrafts[post.id] ?? ''}
                onChange={(event) =>
                  setCommentDrafts((current) => ({
                    ...current,
                    [post.id]: event.target.value,
                  }))
                }
              />
              <button type="submit" disabled={!commentDrafts[post.id]?.trim()}>Publier</button>
            </form>
          </div>
        )}

        <button
          className="product-attachment"
          type="button"
          onClick={() => openProduct(product.id)}
        >
          <span className={`attachment-thumb attachment-${product.category.toLowerCase().replace('é', 'e')}`}>
            {post.mediaType === 'video' && <span className="thumb-play"><Icon name="play" size={12} /></span>}
            <img src={post.mediaType === 'video' ? post.poster : post.media} alt="" loading="lazy" />
          </span>
          <span className="attachment-details">
            <span className="attachment-label">PRODUIT DE LA PUBLICATION</span>
            <strong>{product.name}</strong>
            <span>{product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'Indisponible'}</span>
          </span>
          <span className="attachment-buy">
            <strong>{formatPrice(product.price)}</strong>
            <span>Voir le produit <span aria-hidden="true">→</span></span>
          </span>
        </button>
      </article>
    )
  }

  function renderProfileContent() {
    if (profileTab === 'achats') {
      return demoPurchases.length ? (
        <div className="profile-purchases">
          {demoPurchases.map((purchase) => (
            <div className="purchase-row" key={purchase.productId}>
              <span className="purchase-icon"><Icon name="bag" /></span>
              <span><strong>{purchase.productName}</strong><small>{purchase.sellerName}</small></span>
              <span><strong>{formatPrice(purchase.price)}</strong><small>{purchase.status}</small></span>
            </div>
          ))}
          <p className="demo-notice">Historique de démonstration : aucun paiement ni envoi n’a eu lieu.</p>
        </div>
      ) : (
        <div className="profile-empty">
          <Icon name="bag" size={25} />
          <strong>Vos achats apparaîtront ici</strong>
          <span>Pour l’instant, vous n’avez aucun achat de démonstration.</span>
        </div>
      )
    }

    const profilePosts = posts.filter((post) =>
      profileTab === 'produits'
        ? productById.get(post.productId)?.sellerId === currentUser.id
        : post.sellerId === currentUser.id,
    )
    return profilePosts.length ? (
      <div className="profile-post-grid">
        {profilePosts.map((post) => (
          <button
            className="profile-post-tile"
            type="button"
            key={post.id}
            onClick={() => setModal({ type: 'product', productId: post.productId })}
          >
            {post.mediaType === 'video' ? (
              <video src={post.media} poster={post.poster} muted playsInline preload="none" />
            ) : (
              <img src={post.media} alt={post.alt} />
            )}
            <span className="tile-product-name">{productById.get(post.productId)?.name}</span>
          </button>
        ))}
      </div>
    ) : (
      <div className="profile-empty">
        <Icon name={profileTab === 'produits' ? 'bag' : 'image'} size={25} />
        <strong>Aucune publication pour le moment</strong>
        <span>Vous pourrez publier ici et proposer un article avec le même compte.</span>
        <button
          className="button-primary"
          type="button"
          onClick={() => handleNavigation('create')}
        >
          Publier / Vendre
        </button>
      </div>
    )
  }

  function renderModal() {
    if (!modal) return null

    if (modal.type === 'product') {
      const product = productById.get(modal.productId)
      if (!product) return null
      const productPosts = posts.filter((post) => post.productId === product.id)
      const sellerPost = productPosts[0]
      return (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-card product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
            <div className="product-modal-media">
              {productPosts.map((post) => (
                <div className="product-gallery-item" key={post.id}>
                  {post.mediaType === 'video' ? (
                    <video src={post.media} poster={post.poster} controls playsInline preload="metadata" />
                  ) : (
                    <img src={post.media} alt={post.alt} />
                  )}
                  <span>{post.mediaType === 'video' ? 'Vidéo' : 'Photo'} · publication de {post.sellerName}</span>
                </div>
              ))}
            </div>
            <div className="product-modal-info">
              <span className="modal-eyebrow">FICHE PRODUIT · UNE SEULE OFFRE</span>
              <h2 id="product-modal-title">{product.name}</h2>
              <div className="modal-seller">
                <Avatar src={sellerPost?.avatar} initials={sellerPost?.initials ?? 'V'} size="small" />
                <span><strong>{product.sellerName}</strong><small>{product.sellerHandle} · vendeur sur V</small></span>
                <button
                  type="button"
                  className={`follow-button${followedSellers.includes(product.sellerId) ? ' is-following' : ''}`}
                  aria-pressed={followedSellers.includes(product.sellerId)}
                  onClick={() => toggleFollow(product.sellerId, product.sellerName)}
                >
                  {followedSellers.includes(product.sellerId) ? 'Abonné·e' : 'Suivre'}
                </button>
              </div>
              <p className="product-modal-price">{formatPrice(product.price)}</p>
              <p className="product-availability">
                <span className={product.stock > 0 ? 'stock-dot' : 'stock-dot is-out'} />
                {product.stock > 0
                  ? `${product.stock} article${product.stock > 1 ? 's' : ''} disponible${product.stock > 1 ? 's' : ''}`
                  : 'Actuellement indisponible'}
              </p>
              <p className="shared-listing-note">
                Toutes les photos et vidéos de cet article renvoient à cette même fiche et partagent le même prix et le même stock.
              </p>
              <button
                className="contact-seller-button"
                type="button"
                onClick={() => openMessages({
                  ...product,
                  name: product.name,
                  avatar: sellerPost?.avatar,
                  initials: sellerPost?.initials,
                })}
              >
                <Icon name="message" size={18} /> Échanger avec le vendeur
              </button>
              <button
                className="buy-demo-button"
                type="button"
                disabled={product.stock === 0}
                onClick={() => startDemoPurchase(product)}
              >
                <Icon name="bag" size={18} /> Simuler un achat
              </button>
              <p className="payment-disclaimer">Démo uniquement · aucun paiement ni livraison n’est effectué.</p>
            </div>
          </section>
        </div>
      )
    }

    if (modal.type === 'create') {
      return (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-card create-modal" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
            <div className="modal-heading">
              <div><span className="modal-eyebrow">ACHETEZ ET VENDEZ AVEC LE MÊME COMPTE</span><h2 id="create-modal-title">Créer une publication</h2></div>
              <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
            </div>
            <form onSubmit={publishPost}>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept="image/*,video/*"
                onChange={(event) => updateDraftMedia(event.target.files?.[0])}
              />
              <button className={`upload-zone${draftMedia ? ' has-media' : ''}`} type="button" onClick={() => fileInputRef.current?.click()}>
                {draftMedia?.type === 'video' ? (
                  <video src={draftMedia.preview} muted playsInline />
                ) : draftMedia?.type === 'image' ? (
                  <img src={draftMedia.preview} alt="Aperçu de la publication" />
                ) : (
                  <><span className="upload-icon"><Icon name="image" size={25} /></span><strong>Ajouter une photo ou une courte vidéo</strong><small>Choisissez un média pour présenter votre article.</small></>
                )}
                {draftMedia && <span className="change-media">Changer le média</span>}
              </button>
              <label className="form-field">
                <span>Votre description</span>
                <textarea name="description" rows="3" placeholder="Racontez ce qui rend votre article unique…" required />
              </label>
              <label className="form-field">
                <span>Article associé</span>
                <select
                  name="existingProductId"
                  value={publishProductId}
                  onChange={(event) => {
                    setPublishProductId(event.target.value)
                    setDraftError('')
                  }}
                >
                  <option value="">Créer une nouvelle fiche produit</option>
                  {products
                    .filter((product) => product.sellerId === currentUser.id)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {formatPrice(product.price)}
                      </option>
                    ))}
                </select>
              </label>
              {publishProductId ? (
                <p className="reused-product-note">
                  Cette publication sera reliée à la fiche produit existante. Son prix et sa disponibilité resteront identiques sur toutes ses photos et vidéos.
                </p>
              ) : (
                <div className="form-row">
                  <label className="form-field">
                    <span>Nom du produit</span>
                    <input name="productName" placeholder="Ex. Panier tressé" required />
                  </label>
                  <label className="form-field">
                    <span>Prix (Ar)</span>
                    <input name="price" type="number" min="1" step="1" inputMode="numeric" placeholder="Ex. 25000" required />
                  </label>
                </div>
              )}
              {draftError && <p className="form-error" role="alert">{draftError}</p>}
              <div className="create-disclaimer"><Icon name="sparkles" size={17} /> Publication de démonstration visible pendant cette session uniquement.</div>
              <button className="button-primary submit-publication" type="submit">Publier sur V <span aria-hidden="true">→</span></button>
            </form>
          </section>
        </div>
      )
    }

    if (modal.type === 'profile') {
      return (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="modal-heading">
              <div><span className="modal-eyebrow">UN COMPTE, TOUTES VOS ACTIVITÉS</span><h2 id="profile-modal-title">Mon profil</h2></div>
              <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
            </div>
            <div className="profile-summary">
              <Avatar src={currentUser.avatar} initials={currentUser.initials} size="large" />
              <span><strong>{currentUser.name}</strong><small>{currentUser.handle} · acheteuse & vendeuse</small><small><Icon name="location" size={13} /> {currentUser.location}</small></span>
              <button className="button-primary profile-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={17} /> Publier / Vendre</button>
            </div>
            <div className="profile-tabs" role="tablist" aria-label="Activités du profil">
              {[['publications', 'Publications'], ['produits', 'En vente'], ['achats', 'Achats']].map(([value, label]) => (
                <button
                  key={value}
                  id={`profile-tab-${value}`}
                  type="button"
                  role="tab"
                  aria-selected={profileTab === value}
                  aria-controls="profile-tab-panel"
                  onClick={() => setProfileTab(value)}
                >
                  {label}
                  {value === 'achats' && demoPurchases.length > 0 && <span className="profile-tab-count">{demoPurchases.length}</span>}
                </button>
              ))}
            </div>
            <div className="profile-tab-panel" id="profile-tab-panel" role="tabpanel" aria-labelledby={`profile-tab-${profileTab}`}>
              {renderProfileContent()}
            </div>
          </section>
        </div>
      )
    }

    if (modal.type === 'messages') {
      return (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-card messages-modal" role="dialog" aria-modal="true" aria-labelledby="messages-modal-title">
            <div className="modal-heading">
              <div><span className="modal-eyebrow">ÉCHANGEZ AVANT D’ACHETER</span><h2 id="messages-modal-title">Messages</h2></div>
              <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
            </div>
            <div className="conversation-context">
              <Avatar src={modal.seller?.avatar} initials={modal.seller?.initials ?? 'V'} />
              <span><strong>{modal.seller?.sellerName ?? 'Vos conversations'}</strong><small>{modal.seller ? `À propos de ${modal.seller.name}` : 'Vos échanges avec les vendeurs apparaîtront ici.'}</small></span>
            </div>
            <div className="message-history" aria-live="polite">
              {messages.length ? messages.map((message) => (
                <p className="message-bubble" key={message.id}><span>Vous · à l’instant</span>{message.text}</p>
              )) : (
                <div className="profile-empty">
                  <Icon name="message" size={26} />
                  <strong>La discussion commence ici</strong>
                  <span>Posez une question au vendeur sur le produit, son état ou sa disponibilité.</span>
                </div>
              )}
            </div>
            <form className="message-form" onSubmit={sendMessage}>
              <input aria-label="Votre message" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Écrire un message…" />
              <button className="button-primary" type="submit" disabled={!messageDraft.trim()}><Icon name="share" size={17} /> Envoyer</button>
            </form>
            <p className="payment-disclaimer">Messagerie de démonstration · vos échanges ne sont pas conservés.</p>
          </section>
        </div>
      )
    }

    if (modal.type === 'purchase') {
      const product = productById.get(modal.productId)
      return (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="modal-card purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-modal-title">
            <button className="modal-close" type="button" aria-label="Fermer" onClick={() => setModal(null)}><Icon name="close" /></button>
            <span className="purchase-demo-icon"><Icon name="bag" size={27} /></span>
            <span className="modal-eyebrow">PARCOURS D’ACHAT DE DÉMONSTRATION</span>
            <h2 id="purchase-modal-title">Votre intérêt est noté !</h2>
            <p>{product?.name} · {product ? formatPrice(product.price) : ''}</p>
            <div className="demo-warning"><strong>Aucun paiement ni livraison n’a été effectué.</strong><span>Le paiement et la livraison ne sont pas encore configurés. Cette simulation apparaît dans l’onglet « Achats » de votre profil.</span></div>
            <button className="button-primary" type="button" onClick={() => { setProfileTab('achats'); setModal({ type: 'profile' }) }}>Voir mes achats de démonstration</button>
          </section>
        </div>
      )
    }

    return null
  }

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="top-header-main">
          <button className="v-brand" type="button" aria-label="V, accueil" onClick={() => handleNavigation('home')}>
            <span className="v-mark">V</span>
            <span className="v-brand-copy"><strong>V</strong><small>LE FIL QUI FAIT VIVRE LE COMMERCE</small></span>
          </button>
          <label className="global-search" role="search">
            <Icon name="search" size={19} />
            <input
              ref={searchRef}
              aria-label="Rechercher un produit ou un vendeur"
              placeholder="Rechercher un produit, un vendeur…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && <button type="button" aria-label="Effacer la recherche" onClick={() => setQuery('')}><Icon name="close" size={16} /></button>}
            <kbd>⌘ K</kbd>
          </label>
          <div className="header-account">
            <button className="header-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={17} /> Publier / Vendre</button>
            <button className="header-profile" type="button" aria-label="Ouvrir mon profil" onClick={() => handleNavigation('profile')}>
              <Avatar src={currentUser.avatar} initials={currentUser.initials} size="small" />
            </button>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="Navigation principale">
          <button className="is-current" type="button" onClick={() => handleNavigation('home')}><Icon name="home" size={18} /> Accueil</button>
          <button type="button" onClick={() => handleNavigation('search')}><Icon name="search" size={18} /> Recherche</button>
          <button type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={18} /> Publier</button>
          <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={18} /> Messages</button>
          <button type="button" onClick={() => handleNavigation('profile')}><Icon name="user" size={18} /> Profil</button>
          <span className="nav-account-note">Achetez et vendez avec le même compte</span>
        </nav>
      </header>

      <div className="feed-layout" ref={feedRef}>
        <aside className="left-sidebar">
          <section className="sidebar-profile">
            <div className="sidebar-cover" />
            <Avatar src={currentUser.avatar} initials={currentUser.initials} size="large" className="sidebar-avatar" />
            <strong>{currentUser.name}</strong>
            <span>{currentUser.handle}</span>
            <div className="sidebar-stats"><span><strong>{posts.filter((post) => post.sellerId === currentUser.id).length}</strong> publications</span><span><strong>{followedSellers.length}</strong> abonnements</span></div>
            <button type="button" onClick={() => handleNavigation('profile')}>Voir mon profil <span aria-hidden="true">→</span></button>
          </section>

          <nav className="sidebar-nav" aria-label="Navigation du fil">
            <p className="sidebar-label">VOTRE ESPACE</p>
            <button className={feedTab === 'for-you' ? 'is-selected' : ''} type="button" onClick={() => setFeedTab('for-you')}><Icon name="sparkles" size={18} /> Pour vous</button>
            <button className={feedTab === 'following' ? 'is-selected' : ''} type="button" onClick={() => setFeedTab('following')}><Icon name="heart" size={18} /> Abonnements</button>
            <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={18} /> Messages</button>
            <button type="button" onClick={() => handleNavigation('purchases')}><Icon name="bag" size={18} /> Mes achats</button>
          </nav>

          <section className="category-sidebar">
            <p className="sidebar-label">EXPLORER LES UNIVERS</p>
            {categories.map((category, index) => (
              <button
                className={activeCategory === category ? 'is-selected' : ''}
                type="button"
                key={category}
                onClick={() => {
                  setActiveCategory(category)
                  setFeedTab('for-you')
                }}
              >
                <span className={`category-dot category-dot-${index}`} />
                {category === 'Tout' ? 'Tout explorer' : category}
              </button>
            ))}
          </section>

          <div className="sidebar-note">
            <Icon name="sparkles" size={18} />
            <p><strong>Un compte, deux possibilités.</strong><span>Achetez ce qui vous plaît, vendez ce que vous créez.</span></p>
            <button type="button" onClick={() => handleNavigation('create')}>Créer une publication →</button>
          </div>
        </aside>

        <main className="feed-column" id="accueil">
          <section className="feed-intro">
            <div className="feed-heading">
              <span className="feed-sparkle"><Icon name="sparkles" size={17} /></span>
              <div><p>LE FIL DU COMMERCE VIVANT</p><h1>Découvrez. Échangez. Trouvez.</h1></div>
            </div>
            <p>Des produits présentés par celles et ceux qui les créent et les vendent.</p>
          </section>

          <section className="composer-card" aria-label="Créer une publication">
            <Avatar src={currentUser.avatar} initials={currentUser.initials} />
            <button className="composer-prompt" type="button" onClick={() => handleNavigation('create')}>Qu’avez-vous envie de partager aujourd’hui ?</button>
            <button className="composer-media" type="button" aria-label="Ajouter une photo ou une vidéo" onClick={() => handleNavigation('create')}><Icon name="image" size={19} /><span>Photo / vidéo</span></button>
            <button className="composer-publish" type="button" onClick={() => handleNavigation('create')}><Icon name="plus" size={18} /></button>
          </section>

          <div className="feed-controls">
            <div className="feed-tabs" role="tablist" aria-label="Publications du fil">
              <button className={feedTab === 'for-you' ? 'is-selected' : ''} role="tab" aria-selected={feedTab === 'for-you'} type="button" onClick={() => setFeedTab('for-you')}>Pour vous</button>
              <button className={feedTab === 'following' ? 'is-selected' : ''} role="tab" aria-selected={feedTab === 'following'} type="button" onClick={() => setFeedTab('following')}>Abonnements</button>
            </div>
            <span className="feed-live"><span /> Fil de démonstration</span>
          </div>

          {filteredPosts.length ? (
            <div className="post-list">{filteredPosts.map(renderPost)}</div>
          ) : (
            <div className="feed-empty">
              <Icon name="search" size={27} />
              <h2>Aucune publication trouvée</h2>
              <p>Essayez un autre produit, vendeur ou univers.</p>
              <button type="button" onClick={() => { setQuery(''); setActiveCategory('Tout'); setFeedTab('for-you') }}>Afficher tout le fil</button>
            </div>
          )}

          <div className="feed-footer"><Icon name="sparkles" size={16} /> Vous êtes à jour dans votre fil.</div>
        </main>

        <aside className="right-sidebar">
          <section className="sidebar-panel trend-panel">
            <div className="panel-title"><span><Icon name="sparkles" size={17} /> En ce moment</span><span className="panel-dot" /></div>
            <p className="trend-caption">LES UNIVERS QUI FONT PARLER</p>
            {[
              ['#Raphia', 'Des pièces uniques, créées près de chez vous'],
              ['#Vase', 'Des objets qui racontent une histoire'],
              ['#Baobab', 'Les essentiels fabriqués ici'],
            ].map(([tag, description], index) => (
              <button className="trend-item" type="button" key={tag} onClick={() => { setQuery(tag.slice(1)); focusSearch() }}>
                <span>0{index + 1} · TENDANCE</span><strong>{tag}</strong><small>{description}</small>
              </button>
            ))}
          </section>

          <section className="sidebar-panel seller-panel">
            <div className="panel-title"><span>À découvrir</span><Icon name="sparkles" size={16} /></div>
            <p className="trend-caption">DES VENDEURS À SUIVRE</p>
            {suggestedSellers.map((seller) => (
              <div className="suggested-seller" key={seller.id}>
                <Avatar src={seller.avatar} initials={seller.initials} size="small" />
                <div><strong>{seller.name} <span className="verified-mark"><Icon name="check" size={10} /></span></strong><small>{seller.specialty}</small></div>
                <button
                  type="button"
                  aria-label={followedSellers.includes(seller.id) ? `Ne plus suivre ${seller.shopName}` : `Suivre ${seller.shopName}`}
                  aria-pressed={followedSellers.includes(seller.id)}
                  onClick={() => toggleFollow(seller.id, seller.shopName)}
                >
                  {followedSellers.includes(seller.id) ? '✓' : '+'}
                </button>
              </div>
            ))}
            <button className="all-sellers-link" type="button" onClick={() => { setFeedTab('for-you'); setQuery('') }}>Explorer les vendeurs <span>→</span></button>
          </section>

          <section className="demo-side-note">
            <span className="demo-note-icon"><Icon name="bag" size={17} /></span>
            <p><strong>Vous avez repéré un article ?</strong><span>Ouvrez sa fiche pour retrouver toutes ses photos et vidéos, puis échangez avec le vendeur.</span></p>
          </section>

          <footer className="mini-footer"><span>À propos</span><span>Confidentialité</span><span>© 2026 V</span></footer>
        </aside>
      </div>

      <nav className="mobile-nav" aria-label="Navigation mobile">
        <button className="is-current" type="button" onClick={() => handleNavigation('home')}><Icon name="home" size={20} /><span>Accueil</span></button>
        <button type="button" onClick={() => handleNavigation('search')}><Icon name="search" size={20} /><span>Recherche</span></button>
        <button className="mobile-create" type="button" onClick={() => handleNavigation('create')}><span><Icon name="plus" size={21} /></span><span>Publier</span></button>
        <button type="button" onClick={() => handleNavigation('messages')}><Icon name="message" size={20} /><span>Messages</span></button>
        <button type="button" onClick={() => handleNavigation('profile')}><Avatar src={currentUser.avatar} initials={currentUser.initials} size="nav" /><span>Profil</span></button>
      </nav>

      {renderModal()}
      <div className={`toast${toastMessage ? ' is-visible' : ''}`} role="status" aria-live="polite">{toastMessage}</div>
    </div>
  )
}

export default App
