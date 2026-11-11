// Client WebRTC minimal pour MediaMTX :
// - WHIP (vendeur) : publie la caméra du navigateur.
// - WHEP (acheteurs) : lit le live avec moins d'une seconde de retard.
// Pas de "trickle ICE" : on attend la collecte des candidats avant d'envoyer l'offre,
// ce qui suffit en réseau local et simplifie l'échange (une seule requête HTTP).

const ICE_GATHERING_TIMEOUT_MS = 2000

function waitForIceGathering(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const timer = window.setTimeout(done, ICE_GATHERING_TIMEOUT_MS)
    function done() {
      window.clearTimeout(timer)
      pc.removeEventListener('icegatheringstatechange', onChange)
      resolve()
    }
    function onChange() {
      if (pc.iceGatheringState === 'complete') done()
    }
    pc.addEventListener('icegatheringstatechange', onChange)
  })
}

function signalingError(status) {
  if (status === 401 || status === 403) return 'Diffusion non autorisée (jeton expiré ?).'
  if (status === 400 || status === 409) return 'Un autre live est déjà en cours.'
  if (status === 404) return 'Aucun live en cours.'
  return `Serveur live indisponible (${status}).`
}

async function negotiate(pc, url, headers = {}) {
  await pc.setLocalDescription(await pc.createOffer())
  await waitForIceGathering(pc)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp', ...headers },
    body: pc.localDescription.sdp,
  })
  if (!response.ok) throw new Error(signalingError(response.status))
  await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() })
}

// Préférer H.264 : lisible aussi par le secours HLS et décodé en matériel sur mobile.
function preferH264(transceiver) {
  const capabilities = window.RTCRtpSender?.getCapabilities?.('video')
  if (!capabilities || !transceiver.setCodecPreferences) return
  const h264 = capabilities.codecs.filter((codec) => codec.mimeType.toLowerCase() === 'video/h264')
  if (!h264.length) return
  const others = capabilities.codecs.filter((codec) => codec.mimeType.toLowerCase() !== 'video/h264')
  transceiver.setCodecPreferences([...h264, ...others])
}

export async function publishWhip(url, mediaStream, token) {
  const pc = new RTCPeerConnection()
  try {
    for (const track of mediaStream.getTracks()) {
      const transceiver = pc.addTransceiver(track, { direction: 'sendonly', streams: [mediaStream] })
      if (track.kind === 'video') preferH264(transceiver)
    }
    const query = `?token=${encodeURIComponent(token)}`
    await negotiate(pc, `${url}${query}`, { Authorization: `Bearer ${token}` })
    return pc
  } catch (error) {
    pc.close()
    throw error
  }
}

export async function playWhep(url, onStream) {
  const pc = new RTCPeerConnection()
  try {
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })
    const stream = new MediaStream()
    pc.addEventListener('track', (event) => {
      stream.addTrack(event.track)
      onStream(stream)
    })
    await negotiate(pc, url)
    return pc
  } catch (error) {
    pc.close()
    throw error
  }
}
