"""Integration MediaMTX pour la page live.

- Le vendeur publie sa camera depuis le navigateur en WebRTC (WHIP) : le backend
  lui delivre un jeton court signe (HMAC), que MediaMTX fait verifier via
  `mediamtx_authorize` (authentification HTTP de MediaMTX).
- Les acheteurs lisent en WebRTC (WHEP, < 1 s de retard) ou en HLS en secours.
- OBS/Streamlabs peuvent publier en RTMP avec la cle `LIVE_OBS_KEY`.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from urllib.error import URLError
from urllib.parse import parse_qs
from urllib.request import urlopen

LIVE_PATH = 'live'
LIVE_TOKEN_TTL_SECONDS = 300

# Chemins publics, servis par le proxy Vite (voir frontend/vite.config.js).
WHIP_PATH = f'/mediamtx/{LIVE_PATH}/whip'
WHEP_PATH = f'/mediamtx/{LIVE_PATH}/whep'
HLS_PATH = f'/live-hls/{LIVE_PATH}/index.m3u8'


def _env(name, default=''):
    return os.environ.get(name, default).strip()


def _secret():
    secret = _env('LIVE_TOKEN_SECRET')
    return secret.encode('utf-8') if secret else None


def _b64encode(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode('ascii')


def _b64decode(text):
    return base64.urlsafe_b64decode(text + '=' * (-len(text) % 4))


def issue_live_token(phone_number, now=None):
    """Jeton `payload.signature` autorisant a publier pendant LIVE_TOKEN_TTL_SECONDS."""
    secret = _secret()
    if secret is None:
        return None
    expires_at = int((now or time.time()) + LIVE_TOKEN_TTL_SECONDS)
    payload = json.dumps({'sub': phone_number, 'exp': expires_at}, separators=(',', ':')).encode('utf-8')
    encoded = _b64encode(payload)
    signature = hmac.new(secret, encoded.encode('ascii'), hashlib.sha256).hexdigest()
    return {'token': f'{encoded}.{signature}', 'expires_at': expires_at}


def verify_live_token(token, now=None):
    """Retourne le numero du vendeur si le jeton est valide et non expire, sinon None."""
    secret = _secret()
    if secret is None or not isinstance(token, str) or token.count('.') != 1:
        return None
    encoded, signature = token.split('.')
    expected = hmac.new(secret, encoded.encode('ascii', 'ignore'), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        payload = json.loads(_b64decode(encoded))
    except (ValueError, TypeError):
        return None
    if not isinstance(payload, dict) or not isinstance(payload.get('exp'), int):
        return None
    if payload['exp'] < (now or time.time()):
        return None
    return payload.get('sub')


def mediamtx_authorize(request_data):
    """Decide si MediaMTX autorise une action (corps JSON de son authentification HTTP)."""
    action = request_data.get('action')
    if action in ('read', 'playback'):
        return True
    if action != 'publish' or request_data.get('path') != LIVE_PATH:
        return False

    # Navigateur (WHIP) : jeton en "Authorization: Bearer" ou en ?token=.
    query = parse_qs(request_data.get('query') or '')
    for candidate in (request_data.get('token'), *query.get('token', [])):
        if candidate and verify_live_token(candidate):
            return True

    # OBS/Streamlabs (RTMP) : rtmp://hote/live?user=obs&pass=<LIVE_OBS_KEY>
    obs_key = _env('LIVE_OBS_KEY')
    password = request_data.get('password') or ''
    return bool(obs_key) and hmac.compare_digest(password.encode(), obs_key.encode())


def mediamtx_config():
    rtmp_host = _env('LIVE_RTMP_HOST', 'rtmp://127.0.0.1:1935')
    return {
        'provider': 'mediamtx',
        'whep_url': WHEP_PATH,
        'hls_url': HLS_PATH,
        'rtmp_server': rtmp_host.rstrip('/'),
    }


def obs_settings():
    key = _env('LIVE_OBS_KEY')
    if not key:
        return None
    return {
        'rtmp_server': mediamtx_config()['rtmp_server'],
        'stream_key': f'{LIVE_PATH}?user=obs&pass={key}',
    }


def mediamtx_status():
    """Lit l'etat du chemin "live" via l'API interne de MediaMTX."""
    api_url = _env('MEDIAMTX_API_URL', 'http://127.0.0.1:9997').rstrip('/')
    try:
        with urlopen(f'{api_url}/v3/paths/get/{LIVE_PATH}', timeout=3) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except (URLError, ValueError, TimeoutError, OSError):
        # 404 (aucune source) ou MediaMTX arrete : hors ligne.
        return {'online': False, 'viewer_count': 0}

    online = bool(payload.get('online', payload.get('ready')))
    readers = payload.get('readers') or []
    viewers = sum(1 for reader in readers if isinstance(reader, dict) and reader.get('type') != 'hlsMuxer')
    return {'online': online, 'viewer_count': viewers}


def live_payload():
    return {**mediamtx_config(), **mediamtx_status()}
