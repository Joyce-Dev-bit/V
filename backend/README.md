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
- `LIVE_TOKEN_SECRET` : secret de signature des jetons de live (caméra du navigateur).
- `LIVE_OBS_KEY` : clé pour diffuser depuis OBS/Streamlabs en RTMP.
- `LIVE_RTMP_HOST` : serveur RTMP affiché pour OBS (défaut `rtmp://127.0.0.1:1935`).
- `MEDIAMTX_API_URL` : API interne de MediaMTX lue pour le statut (défaut `http://127.0.0.1:9997`).
- `DJANGO_ALLOWED_HOSTS` doit contenir `host.docker.internal` (MediaMTX appelle le backend depuis Docker).

## Live direct depuis l'appli (MediaMTX)

```powershell
docker compose up -d   # à la racine du dépôt
```

- « Lancer le live » ouvre la caméra ; `POST /api/live/start` délivre un jeton signé (5 min) et le
  navigateur publie en WebRTC (WHIP) sur `/mediamtx/live/whip` (proxy Vite → MediaMTX :8889).
- MediaMTX fait valider chaque action par `POST /api/live/mediamtx-auth` : lecture libre,
  publication seulement avec un jeton valide ou la clé OBS. Un seul live à la fois.
- Les acheteurs lisent en WebRTC (WHEP, < 1 s) ; si le WebRTC ne passe pas, bascule en HLS faible latence.
- Pour les téléphones du réseau local, le fichier `.env` à la racine liste les IP annoncées
  (`LIVE_PUBLIC_HOSTS=127.0.0.1,<IP du PC>`) ; la caméra exige https sauf sur localhost.
- OBS/Streamlabs : serveur et clé affichés dans l'option avancée de la page Live.

## Limites connues

- L'identification repose sur l'en-tête `X-Phone-Number`, sans mot de passe ni session :
  n'importe qui peut usurper un compte. À remplacer par une vraie authentification avant toute mise en ligne.
- `seed_demo` crée des comptes de démonstration (mot de passe `demo12345`).
- Les anciennes données SQLite de FastAPI ne sont pas migrées.
