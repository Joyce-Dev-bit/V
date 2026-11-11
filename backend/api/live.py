"""Helpers d'integration Owncast pour la page live.

Owncast est un serveur de diffusion live auto-heberge. Cette couche
retourne la configuration utile au frontend et l'etat en direct.
"""

import json
import os
from urllib.error import URLError
from urllib.request import urlopen


def _normalize_base_url(raw_url):
    if not isinstance(raw_url, str) or not raw_url.strip():
        return 'http://127.0.0.1:8080'
    return raw_url.strip().rstrip('/')


def _normalize_path(raw_path, fallback):
    value = raw_path.strip() if isinstance(raw_path, str) and raw_path.strip() else fallback
    return value if value.startswith('/') else f'/{value}'


def owncast_runtime_config():
    base_url = _normalize_base_url(os.environ.get('OWNCAST_BASE_URL', 'http://127.0.0.1:8080'))
    hls_path = _normalize_path(os.environ.get('OWNCAST_HLS_PATH', '/hls/stream.m3u8'), '/hls/stream.m3u8')
    admin_path = _normalize_path(os.environ.get('OWNCAST_ADMIN_PATH', '/admin'), '/admin')

    stream_key = os.environ.get('OWNCAST_STREAM_KEY', '').strip()
    rtmp_server = os.environ.get('OWNCAST_RTMP_SERVER', '').strip() or 'rtmp://127.0.0.1/live'

    return {
        'provider': 'owncast',
        'base_url': base_url,
        'playback_url': f'{base_url}{hls_path}',
        'admin_url': f'{base_url}{admin_path}',
        'rtmp_server': rtmp_server,
        'stream_key': stream_key,
    }


def owncast_status(base_url):
    """Lit l'etat d'Owncast via /api/status si disponible."""
    status_url = f'{base_url}/api/status'
    default_status = {
        'online': False,
        'viewer_count': 0,
        'status_url': status_url,
        'status_source': 'fallback',
    }

    try:
        with urlopen(status_url, timeout=4) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except (URLError, ValueError, TimeoutError, OSError):
        return default_status

    return {
        'online': bool(payload.get('online')),
        'viewer_count': int(payload.get('viewerCount') or payload.get('viewer_count') or 0),
        'status_url': status_url,
        'status_source': 'owncast',
    }


def owncast_live_payload():
    config = owncast_runtime_config()
    status = owncast_status(config['base_url'])
    return {**config, **status}


# --- Live direct depuis le navigateur -------------------------------------
# Le backend signe un jeton court (HMAC) que le relais (dossier relay/) verifie
# avant d'accepter le flux camera. La cle de stream Owncast reste cote serveur.

LIVE_TOKEN_TTL_SECONDS = 300


def _relay_secret():
    secret = os.environ.get('LIVE_RELAY_SECRET', '').strip()
    return secret.encode('utf-8') if secret else None


def issue_live_token(phone_number, now=None):
    """Retourne un jeton `payload.signature` ou None si le relais n'est pas configure."""
    import base64
    import hashlib
    import hmac
    import time

    secret = _relay_secret()
    if secret is None:
        return None
    expires_at = int((now or time.time()) + LIVE_TOKEN_TTL_SECONDS)
    payload = json.dumps({'sub': phone_number, 'exp': expires_at}, separators=(',', ':')).encode('utf-8')
    encoded = base64.urlsafe_b64encode(payload).rstrip(b'=').decode('ascii')
    signature = hmac.new(secret, encoded.encode('ascii'), hashlib.sha256).hexdigest()
    return {'token': f'{encoded}.{signature}', 'expires_at': expires_at}
