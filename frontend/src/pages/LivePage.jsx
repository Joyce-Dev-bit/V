import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Icon } from '../components/common.jsx'

export default function LivePage({ navigate, path }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/live/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.detail || 'Impossible de charger Owncast.')
        if (!cancelled) setStream(payload)
      } catch (requestError) {
        if (!cancelled) setError(requestError?.message || 'Impossible de charger Owncast.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadConfig()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream?.playback_url) return undefined

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.playback_url
      video.play().catch(() => {})
      return undefined
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      })
      hls.loadSource(stream.playback_url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          setError('Lecture live indisponible pour le moment. Verifie qu\'Owncast est en direct.')
        }
      })
      hlsRef.current = hls
      return () => hls.destroy()
    }

    setError('Ce navigateur ne supporte pas la lecture HLS.')
    return undefined
  }, [stream])

  useEffect(
    () => () => {
      if (hlsRef.current) hlsRef.current.destroy()
    },
    [],
  )

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
              <h1>Connexion a Owncast...</h1>
              <p className="live-setup-subtitle">Chargement de la configuration du serveur live.</p>
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
                <span className="live-badge"><span className="live-dot" /> LIVE</span>
                <h1>Lancer un live</h1>
                <p className="live-setup-subtitle">
                  Utilisez un logiciel de diffusion (OBS, Streamlabs) vers Owncast,
                  puis le flux apparaitra automatiquement dans le lecteur en dessous.
                </p>
                <div className="live-form">
                  <label htmlFor="live-rtmp">Serveur RTMP</label>
                  <input
                    id="live-rtmp"
                    type="text"
                    value={stream.rtmp_server || ''}
                    readOnly
                  />
                  <label htmlFor="live-key">Cle de stream</label>
                  <input id="live-key" type="text" value={stream.stream_key || 'Configure OWNCAST_STREAM_KEY'} readOnly />
                  <label htmlFor="live-playback">Lecture HLS</label>
                  <input id="live-playback" type="text" value={stream.playback_url || ''} readOnly />
                  {error && <p className="live-error" role="alert">{error}</p>}
                  <div className="live-action-row">
                    <a className="live-start-btn" href={stream.admin_url} target="_blank" rel="noreferrer">Ouvrir Owncast Admin</a>
                  </div>
                </div>
                <p className="live-hint">
                  Statut: {stream.online ? 'en direct' : 'hors ligne'} · spectateurs: {stream.viewer_count ?? 0}
                </p>
              </div>
            </section>

            <section className="live-player">
              <div className="live-player-topbar">
                <span className="live-badge is-on-air"><span className="live-dot" /> EN DIRECT</span>
                <span className="live-player-quality">{stream.online ? 'online' : 'offline'}</span>
              </div>
              <div className="live-player-stage">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="live-player-video"
                />
              </div>
              <p className="live-player-source">{stream.playback_url}</p>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
