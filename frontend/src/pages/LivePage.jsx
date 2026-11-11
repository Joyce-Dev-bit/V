import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Icon } from '../components/common.jsx'
import { initialPosts, initialProducts } from '../data/demoData.js'
import { createOrder } from '../data/ordersStore.js'
import { formatPrice } from '../utils/formatPrice.js'
import { playWhep, publishWhip } from '../utils/webrtcLive.js'

// Même compte de démonstration que la page vidéos (en attendant une vraie authentification).
const DEMO_PHONE_NUMBER = '+261341234567'
const POLL_INTERVAL_MS = 4000

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
  const video = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' }
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true })
  } catch (error) {
    if (error?.name === 'NotAllowedError') throw new Error('Accès à la caméra refusé.')
    // Pas de micro disponible : on diffuse au moins la vidéo.
    return navigator.mediaDevices.getUserMedia({ video, audio: false })
  }
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
  const [playback, setPlayback] = useState('') // '' | webrtc | hls
  const [obs, setObs] = useState(null)
  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const sessionRef = useRef(null)
  const refreshRef = useRef(() => {})

  // Configuration + statut MediaMTX + produit en vente, rafraîchis régulièrement.
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
        if (!cancelled) setError(requestError?.message || 'Impossible de joindre le serveur live.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refreshRef.current = refresh
    refresh()
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const whepUrl = stream?.whep_url
  const hlsUrl = stream?.hls_url
  const isOnline = Boolean(stream?.online)

  // Lecteur acheteur : WebRTC (< 1 s) en priorité, HLS faible latence en secours.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !whepUrl || !isOnline) return undefined

    let cancelled = false
    let pc = null
    let hls = null

    function startHls() {
      if (cancelled || !hlsUrl) return
      video.srcObject = null
      setPlayback('hls')
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl
        video.play().catch(() => {})
        return
      }
      if (!Hls.isSupported()) {
        setError('Ce navigateur ne supporte ni WebRTC ni HLS.')
        return
      }
      hls = new Hls({ lowLatencyMode: true, backBufferLength: 10, maxLiveSyncPlaybackRate: 1.5 })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) setError('Lecture live indisponible pour le moment.')
      })
    }

    playWhep(whepUrl, (mediaStream) => {
      if (cancelled) return
      video.srcObject = mediaStream
      video.play().catch(() => {})
    })
      .then((connection) => {
        if (cancelled) {
          connection.close()
          return
        }
        pc = connection
        setError('')
        setPlayback('webrtc')
        pc.addEventListener('connectionstatechange', () => {
          if (pc.connectionState === 'failed' && !cancelled) {
            pc.close()
            startHls()
          }
        })
      })
      .catch(startHls)

    return () => {
      cancelled = true
      pc?.close()
      hls?.destroy()
      video.srcObject = null
      video.removeAttribute('src')
      setPlayback('')
    }
  }, [whepUrl, hlsUrl, isOnline])

  function teardown() {
    const session = sessionRef.current
    sessionRef.current = null
    if (!session) return
    session.stopping = true
    session.pc?.close()
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

      const { token, whip_url: whipUrl } = await fetchJson('/api/live/start', {
        method: 'POST',
        headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER },
      })
      if (session.stopping) return

      const pc = await publishWhip(whipUrl, session.media, token)
      if (session.stopping) {
        pc.close()
        return
      }
      session.pc = pc
      pc.addEventListener('connectionstatechange', () => {
        if (session.stopping) return
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setBroadcastError('Connexion au serveur live perdue.')
          teardown()
          setBroadcast('idle')
        }
      })
      setBroadcast('live')
      window.setTimeout(() => refreshRef.current(), 800)
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
    window.setTimeout(() => refreshRef.current(), 800)
  }

  async function loadObsSettings(event) {
    if (!event.currentTarget.open || obs) return
    try {
      setObs(await fetchJson('/api/live/obs', { headers: { 'X-Phone-Number': DEMO_PHONE_NUMBER } }))
    } catch (requestError) {
      setObs({ error: requestError.message })
    }
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

                <details className="live-advanced" onToggle={loadObsSettings}>
                  <summary>Diffuser avec OBS / Streamlabs (option avancée)</summary>
                  <div className="live-form">
                    {obs?.error && <p className="live-error" role="alert">{obs.error}</p>}
                    <label htmlFor="live-rtmp">Serveur</label>
                    <input id="live-rtmp" type="text" value={obs?.rtmp_server ?? 'Chargement…'} readOnly />
                    <label htmlFor="live-key">Clé de stream</label>
                    <input id="live-key" type="text" value={obs?.stream_key ?? 'Chargement…'} readOnly />
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
                <span className="live-player-quality">
                  {stream.viewer_count ?? 0} spectateur(s){playback && ` · ${playback === 'webrtc' ? 'temps réel' : 'HLS'}`}
                </span>
              </div>
              <div className="live-player-stage">
                <div className="live-player-frame">
                  <video ref={videoRef} controls autoPlay muted playsInline className="live-player-video" />
                  {!isOnline && (
                    <p className="live-player-offline">
                      {broadcast === 'live'
                        ? 'Ton live démarre…'
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
            </section>
          </>
        )}
      </main>
    </div>
  )
}
