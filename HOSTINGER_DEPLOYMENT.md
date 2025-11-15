# Deploying Django Backend to Hostinger (Python App + Passenger)

This guide gets your `backend/` Django app running on Hostinger with static files via WhiteNoise and MySQL.

## 1) Prep your repo locally

- Ensure these files exist (already added):
  - `backend/passenger_wsgi.py`
  - `backend/backend/settings.py` uses `WhiteNoiseMiddleware` and Manifest storage in production.
  - `.env.example` with production vars.
- Commit and push to your repo.

## 2) Create Python App on Hostinger

- In Hostinger hPanel > Advanced > Python Apps > Create Application
  - Application root: e.g. `app/backend` (or upload this repo and set app root to `backend`)
  - Application startup file: `passenger_wsgi.py`
  - Python version: 3.10+ (match your local if possible)
- After the app is created, open the Terminal for that app and:
  - Create a virtualenv if not auto-created.
  - Install dependencies:
    - `pip install -r requirements.txt`

## 3) Environment variables (.env)

- Create a `.env` file in the repo root and/or `backend/`. Our settings load from both, without overriding earlier values.
- Start with `.env.example` and fill values:
  - `DEBUG=False`
  - `SECRET_KEY=<generate-unique>`
  - `ALLOWED_HOSTS=easylearnova.com,www.easylearnova.com`
  - `CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com`
  - `CSRF_TRUSTED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com`
  - `FRONTEND_ORIGINS=https://easylearnova.com,https://www.easylearnova.com` (for iframe of certificate PDFs)
  - MySQL credentials from Hostinger (DB name, user, password)
  - OAuth/API keys

## 4) Database (MySQL)

- Create a MySQL database in hPanel and a user, then set:
  - `DB_ENGINE=mysql`
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_NAME=<yourdb>`
  - `DB_USER=<youruser>`
  - `DB_PASSWORD=<yourpass>`
- We include a PyMySQL fallback in `backend/backend/__init__.py` to avoid native driver issues.

## 5) Static & Media files

- Static files are served by WhiteNoise inside the app. Run:
  - `python backend/manage.py collectstatic --noinput`
- Media uploads live under `backend/media/`. You can serve via a subdomain or through Django; for high traffic consider object storage.

## 6) Migrations & superuser

- Run migrations on the server:
  - `python backend/manage.py migrate --noinput`
- Create an admin user if needed:
  - `python backend/manage.py createsuperuser`

## 7) Passenger restart

- After updating code or env vars, restart app in hPanel (Restart button) or create `tmp/restart.txt` in app root.

## 8) Configure domain

- Point your domain to the app’s public directory. For Python App + Passenger, Hostinger routes URLs to your app root.
- Ensure `ALLOWED_HOSTS` and CORS/CSRF envs include your exact domain with scheme where needed.

## 9) Health check

- Visit `/admin/` to confirm it loads.
- Check static assets load (CSS/JS). If 404, verify `collectstatic` and WhiteNoise config.

## 10) Common issues

- 400 Bad Request: domain not in `ALLOWED_HOSTS`.
- CORS/CSRF errors: ensure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` are set with `https://`.
- DB errors: verify credentials and that MySQL user has permissions.
- Static not updating: run `collectstatic` and restart Passenger.

