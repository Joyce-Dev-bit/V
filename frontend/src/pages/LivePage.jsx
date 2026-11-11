import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Icon } from '../components/common.jsx'
import { initialPosts, initialProducts } from '../data/demoData.js'
import { createOrder } from '../data/ordersStore.js'
import { formatPrice } from '../utils/formatPrice.js'

// Même compte de démonstration que la page vidéos (en attendant une vraie authentification).
const DEMO_PHONE_NUMBER = '+261341234567'
const POLL_INTERVAL_MS = 8000
const RECORDER_TIMESLICE_MS = 250
const RECORDER_MIME_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']

function productImage(productId) {
  return initialPosts.find((post) => post.productId === productId && post.mediaType === 'image')?.media ?? ''
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.detail || 'Erreur serveur.')
  return payload
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Caméra indisponible : ouvre l’appli en https ou sur localhost.')
  }
  const video = { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true })
  } catch (error) {
    if (error?.name === 'NotAllowedError') throw new Error('Accès à la caméra refusé.')
    // Pas de micro disponible : on diffuse au moins la vidéo.
    return navigator.mediaDevices.getUserMedia({ video, audio: false })
  }
}

function relayCloseMessage(code) {
  if (code === 4409) return 'Un autre live est déjà en cours.'
  if (code === 1011) return 'Le relais a interrompu la diffusion (Owncast injoignable ?).'
  return 'Connexion au relais live perdue.'
}

export default function LivePage({ navigate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stream, setStream] = useState(null)
  const [featured, setFeatured] = useState(null)
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [productError, setProductError] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [broadcast, setBroadcast] = useState('idle') // idle | starting | live
  const [broadcastError, setBroadcastError] = useState('')
  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const sessionRef = useRef(null)

  // Configuration Owncast + statut + produit en vente, rafraîchis régulièrement.
  useEffect(() => {
    let cancelled = false

    async function refresh() {
      try {
        const payload = await fetchJson('/api/live/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
        if (cancelled) return
        setStream(payload)
        setFeatured(payload.featured_product ?? null)
      } catch (requestError) {
        if (!cancelled) setError(requestError?.message || 'Impossible de charger Owncast.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refresh()
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const playbackUrl = stream?.playback_url
  const isOnline = Boolean(stream?.online)

  // (Re)branche le lecteur HLS quand le flux passe en ligne.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackUrl || !isOnline) return undefined

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl
      video.play().catch(() => {})
      return () => video.removeAttribute('src')
    }

    if (!Hls.isSupported()) {
      setError('Ce navigateur ne supporte pas la lecture HLS.')
      return undefined
    }

    // Segments de 1 s côté Owncast : on reste à ~2 segments du direct et on accélère
    // légèrement la lecture pour rattraper si le lecteur prend du retard.
    const hls = new Hls({
      lowLatencyMode: true,
      backBufferLength: 10,
      liveSyncDurationCount: 2,
      liveMaxLatencyDurationCount: 5,
      maxLiveSyncPlaybackRate: 1.5,
    })
    hls.loadSource(playbackUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setError('')
      video.play().catch(() => {})
    })
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data?.fatal) setError("Lecture live indisponible pour le moment. Vérifie qu'Owncast est en direct.")
    })
    return () => hls.destroy()
  }, [playbackUrl, isOnline])

  function teardown() {
    const session = sessionRef.current
    sessionRef.current = null
    if (!session) return
    session.stopping = true
    if (session.recorder?.state === 'recording') session.recorder.stop()
    if (session.socket && session.socket.readyState <= WebSocket.OPEN) session.socket.close(1000)
    session.media?.getTracks().forEach((track) => track.stop())
    if (previewRef.current) previewRef.current.srcObject = null
  }

  // Coupe caméra et connexion si on quitte la page en plein live.
  useEffect(() => () => teardown(), [])

  async function startLive() {
    setBroadcastError('')
    setBroadcast('starting')
    const session = { stopping: false }
    sessionRef.current = session

    try {
      session.media = await openCamera()
      if (previewRef.current) {
        previewRef.current.srcObject = session.media
        previewRef.current.play().catch(() => {})
      }

      const { token, ingest_path: ingestPath } = await fetchJson('/api/live/start', {
        method: 'POST',
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      const mimeType = RECORDER_MIME_TYPES.find((type) => window.MediaRecorder?.isTypeSupported(type))
      if (!window.MediaRecorder || !mimeType) throw new Error('Ce navigateur ne sait pas enregistrer la caméra.')

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const socket = new WebSocket(`${protocol}//${window.location.host}${ingestPath}?token=${encodeURIComponent(token)}`)
      session.socket = socket

      await new Promise((resolve, reject) => {
        socket.onopen = resolve
        socket.onerror = () => reject(new Error('Relais live injoignable (docker compose up -d ?).'))
      })
      if (session.stopping) return

      const recorder = new MediaRecorder(session.media, { mimeType, videoBitsPerSecond: 2_500_000 })
      session.recorder = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data)
      }
      socket.onclose = (event) => {
        if (session.stopping) return
        setBroadcastError(relayCloseMessage(event.code))
        teardown()
        setBroadcast('idle')
      }
      recorder.start(RECORDER_TIMESLICE_MS)
      setBroadcast('live')
    } catch (startError) {
      if (sessionRef.current === session) {
        teardown()
        setBroadcast('idle')
        setBroadcastError(startError?.message || 'Impossible de lancer le live.')
      }
    }
  }

  function stopLive() {
    teardown()
    setBroadcast('idle')
  }

  async function featureProduct() {
    const product = initialProducts.find((item) => item.id === selectedId)
    if (!product) return
    setSaving(true)
    setProductError('')
    try {
      const payload = await fetchJson('/api/live/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Phone-Number': DEMO_PHONE_NUMBER },
        body: JSON.stringify({ ...product, image_url: productImage(product.id) }),
      })
      setFeatured(payload.featured_product)
      setLastOrder(null)
    } catch (requestError) {
      setProductError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function clearProduct() {
    setSaving(true)
    setProductError('')
    try {
      await fetchJson('/api/live/product', {
        method: 'DELETE',
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      setFeatured(null)
    } catch (requestError) {
      setProductError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function buyFeatured() {
    if (!featured) return
    setLastOrder(createOrder({ product: featured, price: featured.price }))
  }

  const isBroadcasting = broadcast !== 'idle'

  return (
    <div className="app-shell">
      <header className="live-header">
        <button type="button" className="live-back-btn" onClick={(event) => navigate(event, '/')}>
          <Icon name="arrowLeft" size={20} /> Accueil
        </button>
        <span className="live-header-title"><span className="v-mark">V</span> Live</span>
        <span className="live-header-spacer" />
      </header>
      <main className="live-page">
        {loading && (
          <section className="live-setup">
            <div className="live-setup-card">
              <span className="live-badge"><span className="live-dot" /> LIVE</span>
              <h1>Connexion au serveur live...</h1>
            </div>
          </section>
        )}

        {!loading && !stream && (
          <section className="live-setup">
            <div className="live-setup-card">
              <span className="live-badge"><span className="live-dot" /> LIVE</span>
              <h1>Serveur live indisponible</h1>
              {error && <p className="live-error" role="alert">{error}</p>}
            </div>
          </section>
        )}

        {!loading && stream && (
          <>
            <section className="live-setup">
              <div className="live-setup-card">
                <span className={`live-badge${broadcast === 'live' ? ' is-on-air' : ''}`}>
                  <span className="live-dot" /> {broadcast === 'live' ? 'VOUS ÊTES EN DIRECT' : 'LIVE'}
                </span>
                <h1>Vendre en direct</h1>
                <p className="live-setup-subtitle">
                  Choisis le produit, puis lance le live : ta caméra est diffusée directement,
                  les acheteurs voient le produit avec un bouton « Acheter ».
                </p>

                <video
                  ref={previewRef}
                  className="live-camera-preview"
                  hidden={!isBroadcasting}
                  muted
                  playsInline
                  autoPlay
                />

                <div className="live-form">
                  <label htmlFor="live-product">Produit à vendre</label>
                  <select id="live-product" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                    {initialProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatPrice(product.price)} ({product.stock} en stock)
                      </option>
                    ))}
                  </select>
                  {productError && <p className="live-error" role="alert">{productError}</p>}
                  <div className="live-action-row">
                    <button type="button" className="live-secondary-btn" onClick={featureProduct} disabled={saving}>
                      {featured ? 'Changer le produit affiché' : 'Afficher ce produit'}
                    </button>
                    {featured && (
                      <button type="button" className="live-secondary-btn" onClick={clearProduct} disabled={saving}>
                        Retirer
                      </button>
                    )}
                  </div>

                  {broadcastError && <p className="live-error" role="alert">{broadcastError}</p>}
                  {isBroadcasting ? (
                    <button type="button" className="live-start-btn live-stop-btn" onClick={stopLive}>
                      {broadcast === 'starting' ? 'Connexion… (annuler)' : 'Arrêter le live'}
                    </button>
                  ) : (
                    <button type="button" className="live-start-btn" onClick={startLive}>
                      <span className="live-dot" /> Lancer le live
                    </button>
                  )}
                </div>

                <details className="live-advanced">
                  <summary>Diffuser avec OBS / Streamlabs (option avancée)</summary>
                  <div className="live-form">
                    <label htmlFor="live-rtmp">Serveur RTMP</label>
                    <input id="live-rtmp" type="text" value={stream.rtmp_server || ''} readOnly />
                    <label htmlFor="live-key">Clé de stream</label>
                    <input id="live-key" type="text" value={stream.stream_key || 'Configure OWNCAST_STREAM_KEY'} readOnly />
                    <a className="live-secondary-btn" href={stream.admin_url} target="_blank" rel="noreferrer">
                      Owncast Admin
                    </a>
                  </div>
                </details>

                <p className="live-hint">
                  Statut : {isOnline ? 'en direct' : 'hors ligne'} · spectateurs : {stream.viewer_count ?? 0}
                </p>
              </div>
            </section>

            <section className="live-player">
              <div className="live-player-topbar">
                <span className={`live-badge${isOnline ? ' is-on-air' : ''}`}>
                  <span className="live-dot" /> {isOnline ? 'EN DIRECT' : 'HORS LIGNE'}
                </span>
                <span className="live-player-quality">{stream.viewer_count ?? 0} spectateur(s)</span>
              </div>
              <div className="live-player-stage">
                <div className="live-player-frame">
                  <video ref={videoRef} controls autoPlay muted playsInline className="live-player-video" />
                  {!isOnline && (
                    <p className="live-player-offline">
                      {broadcast === 'live'
                        ? 'Ton live démarre… il apparaît ici après quelques secondes.'
                        : 'Aucun live pour le moment.'}
                      {error && <><br />{error}</>}
                    </p>
                  )}
                  {featured && (
                    <aside className="live-product-card" aria-label="Produit en vente">
                      {featured.image_url && <img src={featured.image_url} alt="" />}
                      <div className="live-product-info">
                        <strong>{featured.name}</strong>
                        <span className="live-product-price">{formatPrice(featured.price)}</span>
                        <span className="live-product-meta">
                          {featured.sellerName} · {featured.stock > 0 ? `${featured.stock} en stock` : 'Rupture'}
                        </span>
                        {lastOrder?.productId === featured.id ? (
                          <span className="live-product-done">Commande envoyée au vendeur ✓</span>
                        ) : (
                          <button type="button" onClick={buyFeatured} disabled={featured.stock <= 0}>
                            Acheter
                          </button>
                        )}
                      </div>
                    </aside>
                  )}
                </div>
              </div>
              <p className="live-player-source">{playbackUrl}</p>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
