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

## Limites connues

- L'identification repose sur l'en-tête `X-Phone-Number`, sans mot de passe ni session :
  n'importe qui peut usurper un compte. À remplacer par une vraie authentification avant toute mise en ligne.
- `seed_demo` crée des comptes de démonstration (mot de passe `demo12345`).
- Les anciennes données SQLite de FastAPI ne sont pas migrées.
