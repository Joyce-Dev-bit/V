# Backend V (Django)

API JSON Django (routes `/api/*`) consommée par le frontend React.

## Lancement

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py seed_demo
.\.venv\Scripts\python manage.py runserver 8000
```

Le port 8000 est celui attendu par le proxy Vite du frontend.

## Tests

```powershell
.\.venv\Scripts\python manage.py test
```

## Variables d'environnement

- `DJANGO_DEBUG` (défaut `1`) ; en production mettre `0`.
- `DJANGO_SECRET_KEY` : obligatoire quand `DJANGO_DEBUG=0`.
- `DJANGO_ALLOWED_HOSTS` : hôtes autorisés, séparés par des virgules.
- `CORS_ALLOWED_ORIGINS` : origines autorisées, séparées par des virgules.
- `OWNCAST_BASE_URL` : URL de ton serveur Owncast (défaut `http://127.0.0.1:8080`).
- `OWNCAST_HLS_PATH` : chemin HLS lu par le frontend (défaut `/hls/stream.m3u8`).
- `OWNCAST_ADMIN_PATH` : chemin du dashboard admin Owncast (défaut `/admin`).
- `OWNCAST_RTMP_SERVER` : URL RTMP a configurer dans OBS/Streamlabs (défaut `rtmp://127.0.0.1/live`).
- `OWNCAST_STREAM_KEY` : cle de stream a afficher dans la page live.
- `LIVE_RELAY_SECRET` : secret partagé avec le relais pour signer les jetons de live.

## Live direct depuis l'appli

Owncast et le relais caméra (`relay/`) tournent dans Docker :

```powershell
docker compose up -d --build   # à la racine du dépôt
```

- `backend/.env` et `relay/.env` doivent partager le même `LIVE_RELAY_SECRET`,
  et `relay/.env` contient la clé de stream Owncast (`OWNCAST_STREAM_KEY`).
- Sur la page Live, « Lancer le live » ouvre la caméra ; `POST /api/live/start` délivre un jeton
  signé valable 5 min, le navigateur envoie la vidéo en WebSocket sur `/live-ingest` (proxy Vite → port 8090),
  et le relais la pousse en RTMP vers Owncast via ffmpeg. Un seul live à la fois.
- La caméra n'est accessible qu'en `https` ou sur `localhost` (pour un téléphone, il faut servir l'appli en https).
- OBS/Streamlabs restent possibles (option avancée sur la page Live).
- Faible latence (~2-3 s) : dans l'admin Owncast > Video, mettre la latence au minimum et la variante
  en « passthrough » (le relais envoie déjà une image clé par seconde). Ces réglages sont stockés dans
  le volume Docker `owncast-data` ; à refaire seulement si ce volume est supprimé.

## Limites connues

- L'identification repose sur l'en-tête `X-Phone-Number`, sans mot de passe ni session :
  n'importe qui peut usurper un compte. À remplacer par une vraie authentification avant toute mise en ligne.
- `seed_demo` crée des comptes de démonstration (mot de passe `demo12345`).
- Les anciennes données SQLite de FastAPI ne sont pas migrées.
