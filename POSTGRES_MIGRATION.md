# PostgreSQL Upgrade Runbook

This guide upgrades the Django backend from SQLite to PostgreSQL in a safe, repeatable way.

Prerequisites
- Docker Desktop installed (recommended), or a local PostgreSQL server
- Python venv activated for this repo
- Shell: Windows `bash.exe`

1) Create `.env`
- Copy `.env.example` to `.env` at the repo root and edit values as needed:
  - `DB_NAME=studentshub_db`
  - `DB_USER=postgres`
  - `DB_PASSWORD=your_strong_password`
  - `DB_HOST=localhost`
  - `DB_PORT=5432`
  - Optionally set `DEBUG=false`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` for prod.

2) Start PostgreSQL (Docker)
- From the repo root:
  - `docker compose up -d postgres` (or `docker-compose up -d postgres`)
- Verify it’s healthy:
  - `docker ps` should show `studentshub_postgres` with `healthy` status.

3) Apply Django migrations
- From the repo root:
  - `cd backend`
  - `python manage.py makemigrations`
  - `python manage.py migrate`

4) Backup SQLite and migrate data (optional)
- There’s a helper script you can run from the repo root:
  - `python migrate_to_postgresql.py`
- It will:
  - Backup SQLite DB and dump data into `sqlite_backup/`
  - Prompt you to confirm PostgreSQL is ready
  - Run `migrate` and then load backed-up data

5) Create a superuser (if needed)
- `cd backend`
- `python manage.py createsuperuser`

6) Verify
- From the repo root:
  - `python verify_postgres_data.py`
- You should see the PostgreSQL version and sample counts printed.

7) Run the server
- `cd backend`
- `python manage.py runserver 0.0.0.0:8000`

Notes
- Env-driven selection: if `DB_ENGINE=postgresql` or `DB_HOST` is set, Django uses Postgres. Otherwise, it falls back to SQLite.
- Production SSL: set `DB_SSL_REQUIRE=true` if your DB requires SSL.
- Connection pooling: tune `DB_CONN_MAX_AGE` (seconds) in `.env`.
- Docker data persists in the `postgres_data` named volume.
