// Relais live : le navigateur envoie sa camera (MediaRecorder, WebM/MP4) par
// WebSocket, ffmpeg la reencode et la pousse en RTMP vers Owncast.
// Le navigateur ne connait jamais la cle de stream : il presente un jeton
// court signe par le backend Django (POST /api/live/start).
import crypto from 'node:crypto'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT || 8090)
const SECRET = process.env.LIVE_RELAY_SECRET || ''
const RTMP_URL = (process.env.OWNCAST_RTMP_URL || 'rtmp://127.0.0.1:1935/live').replace(/\/+$/, '')
const STREAM_KEY = process.env.OWNCAST_STREAM_KEY || ''

if (!SECRET || !STREAM_KEY) {
  console.error('LIVE_RELAY_SECRET et OWNCAST_STREAM_KEY sont obligatoires.')
  process.exit(1)
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [encoded, signature] = token.split('.')
  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('hex')
  const given = Buffer.from(signature || '', 'utf8')
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function startFfmpeg() {
  return spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning',
    // Faible latence : pas d'analyse longue du flux entrant, pas de tampon.
    '-fflags', '+genpts+nobuffer', '-flags', 'low_delay',
    '-probesize', '256k', '-analyzeduration', '500000',
    '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p',
    // Une image cle par seconde : Owncast (latence minimale, passthrough) coupe des segments de 1 s.
    '-r', '30', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
    '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '2500k',
    '-c:a', 'aac', '-ar', '44100', '-b:a', '128k',
    '-flush_packets', '1', '-f', 'flv', `${RTMP_URL}/${STREAM_KEY}`,
  ], { stdio: ['pipe', 'ignore', 'pipe'] })
}

let activeSession = null

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', live: Boolean(activeSession) }))
    return
  }
  res.writeHead(404).end()
})

const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024 })

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://relay')
  if (url.pathname !== '/live-ingest') {
    socket.destroy()
    return
  }
  const claims = verifyToken(url.searchParams.get('token'))
  if (!claims) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, claims))
})

wss.on('connection', (ws, claims) => {
  if (activeSession) {
    ws.close(4409, 'Un live est deja en cours.')
    return
  }

  const ffmpeg = startFfmpeg()
  activeSession = { ws, ffmpeg, seller: claims.sub }
  console.log(`Live demarre par ${claims.sub}`)

  ffmpeg.stderr.on('data', (chunk) => process.stderr.write(chunk))
  ffmpeg.stdin.on('error', () => {}) // EPIPE si ffmpeg s'arrete avant le navigateur.
  ffmpeg.on('close', (code) => {
    console.log(`ffmpeg termine (code ${code})`)
    if (activeSession?.ffmpeg === ffmpeg) activeSession = null
    if (ws.readyState === ws.OPEN) ws.close(code === 0 ? 1000 : 1011, 'Diffusion terminee.')
  })

  ws.on('message', (data) => {
    if (!ffmpeg.stdin.destroyed) ffmpeg.stdin.write(data)
  })
  ws.on('close', () => {
    console.log(`Live arrete par ${claims.sub}`)
    ffmpeg.stdin.end()
    setTimeout(() => ffmpeg.kill('SIGKILL'), 5000).unref()
  })
})

server.listen(PORT, () => console.log(`Relais live pret sur :${PORT}`))
