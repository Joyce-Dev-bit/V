import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, Icon } from './components/common.jsx'

const API_CANDIDATES = [
  '',
  'http://127.0.0.1:8000',
]
const DEMO_PHONE_NUMBER = '+261341234567'
const MAX_REEL_SECONDS = 30
const REAL_VIDEO_LIBRARY = [
  {
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster_url: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1080&q=80',
    description: 'Big Buck Bunny - vidéo publique de démonstration.',
  },
  {
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster_url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1080&q=80',
    description: 'Elephants Dream - clip public pour le feed vidéo.',
  },
  {
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster_url: 'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1080&q=80',
    description: 'For Bigger Blazes - vidéo test publique.',
  },
  {
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80',
    description: 'For Bigger Escapes - contenu vidéo public.',
  },
]

export default function VideoInjection({ title = 'Vidéos backend', embedded = false, mode = 'grid' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [activeVideoId, setActiveVideoId] = useState(null)
  const [pendingLikes, setPendingLikes] = useState({})
  const [commentPanelVideoId, setCommentPanelVideoId] = useState(null)
  const [commentsByVideo, setCommentsByVideo] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentErrors, setCommentErrors] = useState({})
  const [pendingComments, setPendingComments] = useState({})
  const [followingByAuthor, setFollowingByAuthor] = useState({})
  const [pendingFollows, setPendingFollows] = useState({})
  const [pendingCommentLikes, setPendingCommentLikes] = useState({})
  const [pendingCommentDeletes, setPendingCommentDeletes] = useState({})
  const [isMuted, setIsMuted] = useState(true)
  const [viewerVideoId, setViewerVideoId] = useState(null)
  const videosRef = useRef(new Map())
  const feedRef = useRef(null)

  function closeViewer() {
    setViewerVideoId(null)
    setCommentPanelVideoId(null)
    setActiveVideoId(null)
  }

  useEffect(() => {
    if (viewerVideoId === null) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.getElementById(`video-${viewerVideoId}`)?.scrollIntoView({ block: 'start' })
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [viewerVideoId])

  useEffect(() => {
    if (viewerVideoId === null || commentPanelVideoId) return undefined

    function handleKey(event) {
      if (event.key === 'Escape') closeViewer()
      const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
      if (step) {
        event.preventDefault()
        const feed = feedRef.current
        feed?.scrollBy({ top: step * feed.clientHeight, behavior: 'smooth' })
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [viewerVideoId, commentPanelVideoId])

  const apiBases = useMemo(() => {
    if (!apiBase) return API_CANDIDATES
    return [apiBase, ...API_CANDIDATES.filter((base) => base !== apiBase)]
  }, [apiBase])

  function buildFallbackVideos() {
    return REAL_VIDEO_LIBRARY.map((item, index) => ({
      id: 100000 + index,
      description: item.description,
      video_url: item.video_url,
      poster_url: item.poster_url,
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
      liked_by_me: false,
      isExternal: true,
      author: {
        phone_number: 'source-publique',
        first_name: 'Vidéos',
        last_name: 'Publiques',
        display_name: 'Vidéos publiques',
        initials: 'VP',
      },
    }))
  }

  async function fetchFromApi(path, options = {}) {
    let lastError = 'Erreur API'
    for (const base of apiBases) {
      try {
        const response = await fetch(`${base}${path}`, options)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (base !== apiBase) setApiBase(base)
        return await response.json()
      } catch (requestError) {
        lastError = requestError?.message || 'Erreur API'
      }
    }
    throw new Error(lastError)
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchFromApi('/api/videos?limit=12', {
          headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
        })
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
        if (!cancelled) {
          setItems(list.length ? list : buildFallbackVideos())
          setLoading(false)
        }
      } catch (requestError) {
        if (!cancelled) {
          setItems(buildFallbackVideos())
          setError(`API vidéo indisponible (${requestError?.message || 'Erreur API'}) · Affichage de vidéos publiques`)
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [apiBases])

  useEffect(() => {
    if (mode !== 'reels' || !items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = Number(entry.target.getAttribute('data-video-id'))
          const video = videosRef.current.get(id)
          if (!video) return
          if (entry.isIntersecting) {
            setActiveVideoId(id)
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.7 },
    )

    videosRef.current.forEach((video, id) => {
      const article = video.closest('[data-video-id]')
      if (article) {
        article.setAttribute('data-video-id', String(id))
        observer.observe(article)
      }
    })

    return () => observer.disconnect()
  }, [items, mode, viewerVideoId])

  useEffect(() => {
    videosRef.current.forEach((video) => {
      video.muted = isMuted
    })
  }, [isMuted, viewerVideoId])

  function updateCommentsTree(nodes, commentId, mutate) {
    if (!Array.isArray(nodes)) return nodes
    return nodes.map((node) => {
      if (node.id === commentId) return mutate(node)
      if (!Array.isArray(node.replies) || node.replies.length === 0) return node
      return { ...node, replies: updateCommentsTree(node.replies, commentId, mutate) }
    })
  }

  async function toggleVideoLike(video) {
    if (video.isExternal) return
    if (pendingLikes[video.id]) return

    setPendingLikes((current) => ({ ...current, [video.id]: true }))
    const shouldLike = !video.liked_by_me
    setItems((current) =>
      current.map((item) =>
        item.id === video.id
          ? {
              ...item,
              liked_by_me: shouldLike,
              likes_count: Math.max(0, (item.likes_count || 0) + (shouldLike ? 1 : -1)),
            }
          : item,
      ),
    )

    try {
      const method = shouldLike ? 'POST' : 'DELETE'
      const payload = await fetchFromApi(`/api/videos/${video.id}/like`, {
        method,
        headers: {
          'X-Phone-Number': DEMO_PHONE_NUMBER,
        },
      })

      setItems((current) =>
        current.map((item) =>
          item.id === video.id
            ? {
                ...item,
                liked_by_me: Boolean(payload?.liked),
                likes_count: Number(payload?.likes_count ?? item.likes_count),
              }
            : item,
        ),
      )
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === video.id
            ? {
                ...item,
                liked_by_me: video.liked_by_me,
                likes_count: video.likes_count,
              }
            : item,
        ),
      )
    } finally {
      setPendingLikes((current) => ({ ...current, [video.id]: false }))
    }
  }

  async function openComments(videoId) {
    const currentVideo = items.find((video) => video.id === videoId)
    if (currentVideo?.isExternal) {
      setCommentPanelVideoId(videoId)
      setCommentsByVideo((current) => ({ ...current, [videoId]: [] }))
      setCommentErrors((current) => ({
        ...current,
        [videoId]: 'Commentaires disponibles uniquement pour les vidéos API backend.',
      }))
      return
    }

    setCommentPanelVideoId(videoId)
    if (commentsByVideo[videoId]) return

    try {
      const payload = await fetchFromApi(`/api/videos/${videoId}/comments`, {
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      setCommentsByVideo((current) => ({
        ...current,
        [videoId]: Array.isArray(payload?.items) ? payload.items : [],
      }))
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [videoId]: 'Impossible de charger les commentaires.',
      }))
    }
  }

  async function submitComment(videoId, event) {
    event.preventDefault()
    const currentVideo = items.find((video) => video.id === videoId)
    if (currentVideo?.isExternal) return
    const text = (commentDrafts[videoId] || '').trim()
    if (!text || pendingComments[videoId]) return

    setPendingComments((current) => ({ ...current, [videoId]: true }))
    setCommentErrors((current) => ({ ...current, [videoId]: '' }))

    try {
      const payload = await fetchFromApi(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Phone-Number': DEMO_PHONE_NUMBER,
        },
        body: JSON.stringify({ content: text }),
      })

      setCommentsByVideo((current) => ({
        ...current,
        [videoId]: Array.isArray(payload?.items) ? payload.items : [],
      }))
      setCommentDrafts((current) => ({ ...current, [videoId]: '' }))

      setItems((current) =>
        current.map((item) =>
          item.id === videoId
            ? {
                ...item,
                comments_count: Number(payload?.comments_count ?? item.comments_count),
              }
            : item,
        ),
      )
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [videoId]: 'Envoi impossible pour le moment.',
      }))
    } finally {
      setPendingComments((current) => ({ ...current, [videoId]: false }))
    }
  }

  async function shareVideo(videoId) {
    const shareUrl = `${window.location.origin}/videos#video-${videoId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vidéos backend', url: shareUrl })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      }
    } catch {
      // Ignore aborted share and clipboard restrictions in unsupported contexts.
    }
  }

  async function toggleFollowAuthor(phoneNumber) {
    if (phoneNumber === 'source-publique') return
    if (!phoneNumber || pendingFollows[phoneNumber]) return
    const isFollowing = Boolean(followingByAuthor[phoneNumber])
    setPendingFollows((current) => ({ ...current, [phoneNumber]: true }))

    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const payload = await fetchFromApi(`/api/profiles/${encodeURIComponent(phoneNumber)}/follow`, {
        method,
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      setFollowingByAuthor((current) => ({
        ...current,
        [phoneNumber]: Boolean(payload?.is_following),
      }))
    } catch {
      // Keep previous state if follow request fails.
    } finally {
      setPendingFollows((current) => ({ ...current, [phoneNumber]: false }))
    }
  }

  async function toggleCommentLike(videoId, comment) {
    const currentVideo = items.find((video) => video.id === videoId)
    if (currentVideo?.isExternal) return
    if (pendingCommentLikes[comment.id]) return
    const shouldLike = !comment.liked_by_me
    setPendingCommentLikes((current) => ({ ...current, [comment.id]: true }))

    setCommentsByVideo((current) => ({
      ...current,
      [videoId]: updateCommentsTree(current[videoId], comment.id, (node) => ({
        ...node,
        liked_by_me: shouldLike,
        likes_count: Math.max(0, (node.likes_count || 0) + (shouldLike ? 1 : -1)),
      })),
    }))

    try {
      const method = shouldLike ? 'POST' : 'DELETE'
      const payload = await fetchFromApi(`/api/comments/${comment.id}/like`, {
        method,
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      setCommentsByVideo((current) => ({
        ...current,
        [videoId]: Array.isArray(payload?.items) ? payload.items : current[videoId],
      }))
    } catch {
      setCommentsByVideo((current) => ({
        ...current,
        [videoId]: updateCommentsTree(current[videoId], comment.id, (node) => ({
          ...node,
          liked_by_me: comment.liked_by_me,
          likes_count: comment.likes_count,
        })),
      }))
    } finally {
      setPendingCommentLikes((current) => ({ ...current, [comment.id]: false }))
    }
  }

  async function deleteComment(videoId, comment) {
    const currentVideo = items.find((video) => video.id === videoId)
    if (currentVideo?.isExternal) return
    if (pendingCommentDeletes[comment.id]) return
    setPendingCommentDeletes((current) => ({ ...current, [comment.id]: true }))
    try {
      const payload = await fetchFromApi(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      setCommentsByVideo((current) => ({
        ...current,
        [videoId]: Array.isArray(payload?.items) ? payload.items : current[videoId],
      }))
      setItems((current) =>
        current.map((item) =>
          item.id === videoId
            ? {
                ...item,
                comments_count: Number(payload?.comments_count ?? item.comments_count),
              }
            : item,
        ),
      )
    } catch {
      // Keep list unchanged if delete fails.
    } finally {
      setPendingCommentDeletes((current) => ({ ...current, [comment.id]: false }))
    }
  }

  function enforceThirtySecondLimit(videoId) {
    const video = videosRef.current.get(videoId)
    if (!video) return
    if (video.duration && video.duration <= MAX_REEL_SECONDS) return
    if (video.currentTime >= MAX_REEL_SECONDS) {
      video.currentTime = 0
      if (!video.paused) video.play().catch(() => {})
    }
  }

  function renderCommentNodes(videoId, nodes, level = 0) {
    if (!Array.isArray(nodes) || !nodes.length) return null
    return nodes.map((comment) => (
      <article key={comment.id} className="video-comment-item" style={{ marginLeft: level ? 14 : 0 }}>
        <div className="video-comment-top">
          <p className="video-comment-author">{comment.author?.display_name || 'Profil'}</p>
          {comment.author?.phone_number === DEMO_PHONE_NUMBER && (
            <button
              type="button"
              className="video-comment-delete"
              onClick={() => deleteComment(videoId, comment)}
              disabled={Boolean(pendingCommentDeletes[comment.id])}
            >
              Supprimer
            </button>
          )}
        </div>
        <p className="video-comment-content">{comment.content}</p>
        <button
          type="button"
          className={`video-comment-like ${comment.liked_by_me ? 'is-liked' : ''}`}
          onClick={() => toggleCommentLike(videoId, comment)}
          disabled={Boolean(pendingCommentLikes[comment.id])}
        >
          <Icon name="heart" size={14} filled={Boolean(comment.liked_by_me)} />
          <span>{comment.likes_count || 0}</span>
        </button>
        {Array.isArray(comment.replies) && comment.replies.length > 0 && renderCommentNodes(videoId, comment.replies, level + 1)}
      </article>
    ))
  }

  const sectionStyle = embedded
    ? { margin: 0, padding: 0 }
    : { maxWidth: 1320, margin: '16px auto 0', padding: '0 24px' }

  const openedComments = commentPanelVideoId ? commentsByVideo[commentPanelVideoId] : null

  return (
    <section style={sectionStyle}>
      <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>{title}</h2>
      {loading && <p>Chargement des vidéos...</p>}
      {!loading && error && <p style={{ color: '#a33f3f' }}>{error}</p>}
      {!loading && !error && items.length === 0 && <p>Aucune vidéo trouvée.</p>}

      {mode === 'reels' ? (
        <>
        {!loading && items.length > 0 && (
          <div className="video-reels-grid" aria-label="Choisir une vidéo">
            {items.map((v) => (
              <button
                key={v.id}
                type="button"
                className="video-thumb"
                aria-label={`Ouvrir la vidéo : ${v.description || 'Sans description'}`}
                onClick={() => setViewerVideoId(v.id)}
              >
                <video src={v.video_url} poster={v.poster_url || ''} muted playsInline preload="metadata" tabIndex={-1} />
                <span className="video-thumb-play"><Icon name="play" size={18} /></span>
                <span className="video-thumb-meta">
                  <strong>{v.author?.display_name || 'Profil V'}</strong>
                  <small>{v.description || 'Sans description'}</small>
                  <em><Icon name="heart" size={12} /> {v.likes_count || 0}</em>
                </span>
              </button>
            ))}
          </div>
        )}
        {viewerVideoId !== null && (
        <div className="reels-viewer" role="dialog" aria-modal="true" aria-label="Lecteur vidéo plein écran">
          <button type="button" className="reels-viewer-close" onClick={closeViewer} aria-label="Fermer le lecteur vidéo">
            <Icon name="close" size={22} />
          </button>
        <div className="video-reels-feed" aria-label="Flux vertical de vidéos" ref={feedRef}>
          {items.map((v) => (
            <article key={v.id} className="video-reel-card" data-video-id={v.id} id={`video-${v.id}`}>
              <video
                ref={(node) => {
                  if (node) videosRef.current.set(v.id, node)
                  else videosRef.current.delete(v.id)
                }}
                src={v.video_url}
                poster={v.poster_url || ''}
                muted
                loop
                playsInline
                preload="metadata"
                className="video-reel-media"
                onTimeUpdate={() => enforceThirtySecondLimit(v.id)}
                onClick={() => {
                  const target = videosRef.current.get(v.id)
                  if (!target) return
                  if (target.paused) target.play().catch(() => {})
                  else target.pause()
                }}
              />
              <div className="video-reel-overlay">
                <div className="video-reel-profile">
                  <Avatar initials={v.author?.initials || 'V'} size="small" className="video-reel-avatar" />
                  <div>
                    <p className="video-reel-name">{v.author?.display_name || 'Profil V'}</p>
                    <p className="video-reel-handle">{v.author?.phone_number || ''}</p>
                  </div>
                  {v.author?.phone_number !== DEMO_PHONE_NUMBER && (
                    <button
                      type="button"
                      className={`video-follow-btn ${followingByAuthor[v.author?.phone_number] ? 'is-following' : ''}`}
                      onClick={() => toggleFollowAuthor(v.author?.phone_number)}
                      disabled={Boolean(pendingFollows[v.author?.phone_number])}
                    >
                      {followingByAuthor[v.author?.phone_number] ? 'Abonné' : 'Suivre'}
                    </button>
                  )}
                  <span className="video-reel-duration">30s</span>
                </div>
                <p className="video-reel-caption">{v.description || 'Sans description'}</p>
              </div>
              <div className="video-reel-actions" aria-label="Actions vidéo">
                <button
                  type="button"
                  className={`video-action ${v.liked_by_me ? 'is-liked' : ''}`}
                  onClick={() => toggleVideoLike(v)}
                  disabled={Boolean(pendingLikes[v.id])}
                  aria-label="Aimer la vidéo"
                >
                  <Icon name="heart" size={24} filled={Boolean(v.liked_by_me)} />
                  <span>{v.likes_count || 0}</span>
                </button>
                <button type="button" className="video-action" onClick={() => openComments(v.id)} aria-label="Commenter la vidéo">
                  <Icon name="comment" size={24} />
                  <span>{v.comments_count || 0}</span>
                </button>
                <button type="button" className="video-action" onClick={() => shareVideo(v.id)} aria-label="Partager la vidéo">
                  <Icon name="share" size={24} />
                  <span>Partager</span>
                </button>
                <button
                  type="button"
                  className={`video-action ${isMuted ? '' : 'is-audio-on'}`}
                  onClick={() => setIsMuted((current) => !current)}
                  aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  <Icon name={isMuted ? 'volumeOff' : 'volume'} size={24} />
                  <span>{isMuted ? 'Son off' : 'Son on'}</span>
                </button>
                <span className={`video-live-dot ${activeVideoId === v.id ? 'is-active' : ''}`} aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
        </div>
        )}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          {items.map((v) => (
            <article key={v.id} style={{ background: '#fff', border: '1px solid #ecebef', borderRadius: 12, padding: 8 }}>
              <video
                src={v.video_url}
                poster={v.poster_url || ''}
                controls
                muted
                playsInline
                preload="metadata"
                style={{ width: '100%', borderRadius: 10 }}
              />
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>{v.description || 'Sans description'}</p>
            </article>
          ))}
        </div>
      )}

      {commentPanelVideoId && (
        <div
          className="video-comments-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Commentaires"
          onMouseDown={(event) => event.target === event.currentTarget && setCommentPanelVideoId(null)}
          onKeyDown={(event) => event.key === 'Escape' && setCommentPanelVideoId(null)}
        >
          <div className="video-comments-panel">
            <div className="video-comments-head">
              <strong>Commentaires</strong>
              <button type="button" onClick={() => setCommentPanelVideoId(null)} aria-label="Fermer">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="video-comments-list">
              {commentErrors[commentPanelVideoId] && <p className="video-comments-error">{commentErrors[commentPanelVideoId]}</p>}
              {!commentErrors[commentPanelVideoId] && Array.isArray(openedComments) && openedComments.length > 0 && renderCommentNodes(commentPanelVideoId, openedComments)}
              {!commentErrors[commentPanelVideoId] && Array.isArray(openedComments) && openedComments.length === 0 && (
                <p className="video-comments-empty">Soyez le premier à commenter.</p>
              )}
              {!commentErrors[commentPanelVideoId] && !Array.isArray(openedComments) && <p className="video-comments-empty">Chargement…</p>}
            </div>
            <form className="video-comment-form" onSubmit={(event) => submitComment(commentPanelVideoId, event)}>
              <input
                value={commentDrafts[commentPanelVideoId] || ''}
                onChange={(event) =>
                  setCommentDrafts((current) => ({
                    ...current,
                    [commentPanelVideoId]: event.target.value,
                  }))
                }
                placeholder="Ajouter un commentaire"
                aria-label="Ajouter un commentaire"
              />
              <button type="submit" disabled={Boolean(pendingComments[commentPanelVideoId])}>Publier</button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
