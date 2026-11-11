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

## Limites connues

- L'identification repose sur l'en-tête `X-Phone-Number`, sans mot de passe ni session :
  n'importe qui peut usurper un compte. À remplacer par une vraie authentification avant toute mise en ligne.
- `seed_demo` crée des comptes de démonstration (mot de passe `demo12345`).
- Les anciennes données SQLite de FastAPI ne sont pas migrées.
