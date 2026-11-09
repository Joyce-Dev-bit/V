import { useEffect, useMemo, useRef, useState } from 'react'
import { currentUser, initialPosts, initialProducts } from '../data/demoData.js'

export default function useHomePage({ searchRef, feedRef }) {
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
  const [messagingOpen, setMessagingOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [productContexts, setProductContexts] = useState({})
  const [demoPurchases, setDemoPurchases] = useState([])
  const [feedTab, setFeedTab] = useState('for-you')
  const [toastMessage, setToastMessage] = useState('')
  const [draftMedia, setDraftMedia] = useState(null)
  const [draftError, setDraftError] = useState('')
  const toastTimer = useRef(null)
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
  }, [searchRef])

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const messageContacts = useMemo(() => {
    const contacts = new Map()
    posts.forEach((post) => {
      if (post.sellerId !== currentUser.id && !contacts.has(post.sellerId)) {
        contacts.set(post.sellerId, {
          id: post.sellerId,
          name: post.sellerName,
          shopName: post.shopName,
          handle: post.handle,
          initials: post.initials,
          avatar: post.avatar,
        })
      }
    })
    return [...contacts.values()]
  }, [posts])

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
    setModal(null)
    if (seller) {
      setSelectedContactId(seller.sellerId)
      setProductContexts((current) => ({ ...current, [seller.sellerId]: seller.name }))
    }
    setMessagingOpen(true)
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


  return {
    products, posts, query, setQuery, activeCategory, setActiveCategory,
    likedPosts, followedSellers, expandedComments, setExpandedComments,
    commentDrafts, setCommentDrafts, modal, setModal, profileTab, setProfileTab,
    publishProductId, setPublishProductId, messagingOpen, setMessagingOpen,
    selectedContactId, setSelectedContactId, productContexts, demoPurchases,
    feedTab, setFeedTab, toastMessage, draftMedia, draftError, setDraftError,
    productById, messageContacts, filteredPosts,
    showToast, focusSearch, toggleLike, toggleFollow, sharePost, addComment,
    openProduct, openMessages, updateDraftMedia, publishPost, startDemoPurchase,
    handleNavigation,
  }
}
