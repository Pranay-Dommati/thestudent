# AI agent working notes for this repo

This repo is a full‑stack app with a Django backend and a Vite/React frontend. Use these notes to be productive quickly and avoid common pitfalls.

## Architecture and boundaries
- Backend (Django) lives under `backend/` with apps: `authentication`, `courses`, `chatbotcourse`, `feedback`, `newsletter`, and `backend/ai` (AI endpoints).
- Root URL config: `backend/backend/urls.py` mounts:
  - `'' -> courses.urls`
  - `/api/auth/ -> authentication.urls`
  - `/api/chatbot/ -> chatbotcourse.urls`
  - `/ai/ -> backend.ai.urls` (AI features: chat, topics, quiz, summary, resources, videos)
  - Static media served in dev; certificate PDFs live under `/media/certificates/`.
- Data: PostgreSQL via Docker (`docker-compose.yml`) is preferred; SQLite is the fallback. Selection is env‑driven in `backend/backend/settings.py`:
  - If `DB_ENGINE=postgresql` or `DB_HOST` is set → use Postgres, else SQLite.
  - Settings load both root `.env` and `backend/.env` (root takes precedence: do not rely on overrides from `backend/.env`).
- Auth: Custom `authentication.User` (email is the username). SimpleJWT is configured; some endpoints manually decode HS256 JWT with `user_id` (see `backend/ai/views.py`).
- Frontend: `frontend/` (Vite + React + Tailwind). Dev proxy forwards `/api`, `/ai`, `/media` to `http://127.0.0.1:8000` (`frontend/vite.config.js`).

## Project conventions and gotchas
- URL routing order matters in `backend/courses/urls.py`:
  - Put specific routes (e.g., `api/courses/enroll/`) BEFORE the dynamic catch‑all `api/courses/<str:course_id>/...` to avoid route capture and 405s.
- UUID primary keys are used for most “Pro Learning” models (`ProLearningCourse`, `ProLearningTopic`, etc.). API responses carry UUID strings.
- AI endpoints under `/ai/`:
  - `chat/` requires `IsAuthenticated` and is throttled; most others are `@csrf_exempt` and validate JSON bodies.
  - Topic creation is rate‑limited via Django cache (`backend/ai/rate_limiter.py`), with status/debug endpoints: `/ai/rate-limit-status/`, `/ai/debug-rate-limit-cache/` (debug only in `DEBUG` mode).
- Certificates can be embedded in iframes; custom middleware `backend/backend/middleware.py` sets `X-Frame-Options` and CSP for `/media/certificates/*.pdf`.
- External integrations: Google OAuth (via `social-auth-app-django`), Gemini API (`GEMINI_API_KEY`), YouTube/Programmable Search (`GOOGLE_*` keys). Keep keys in env only.

## Core developer workflows
- Backend setup
  - Create `.env` at repo root (see `POSTGRES_MIGRATION.md` for keys). Start DB: `docker compose up -d postgres`.
  - Migrate: `cd backend && python manage.py migrate`.
  - Run server: `python manage.py runserver 0.0.0.0:8000`.
- Frontend setup
  - `cd frontend && npm install && npm run dev` (Vite proxy will route `/api` and `/ai`).
- Tests (pytest)
  - Config: `backend/pytest.ini` (`DJANGO_SETTINGS_MODULE=backend.settings`).
  - Useful: run the VS Code task “Run Postgres integration tests”, or run `pytest backend/courses/tests/test_postgres_integration.py -q` (requires Postgres engine active).
  - Another integration test: `backend/courses/tests/test_save_course.py` (uses SimpleJWT `AccessToken.for_user`).
- DB backup/restore for sharing data
  - Dump: `./dump.sh` → writes `db_backup.dump` at repo root.
  - Load: `./load.sh` → restores `db_backup.dump`. Scripts read root `.env` and support both Docker and local clients; Windows Git Bash path issues handled.

## API shapes and examples
- Save Pro Learning course (bypasses DRF viewset): `POST /api/courses/pro-learning/save-course/`
  - Minimal payload (see test): `{'course_name': 'python_basics', 'title': 'Python Basics', 'overwrite': true, 'topics': { 'Intro': { 'content': { 'reading': '...', 'summary': '...', 'videos': [...], 'quiz': [...], 'resources': [...] }}}}`
  - Returns `{ course: { id: <uuid>, course_name: '...', ... } }`. Subsequent saves with `overwrite: true` update in place.
- AI topic classification: `POST /ai/classify-topics/` with `{ query: 'learn DSA in C++' }` → returns `topics: [{ id, name, isActive }]` (max 4 topics); rate‑limit checked separately.
- Certificates: `GET /api/courses/<course_id>/certificate/` issues a certificate; list via `GET /api/courses/certificates/`; PDFs served from `/media/certificates/...` and iframe‑embeddable.

## Files worth skimming first
- Backend settings and URLs: `backend/backend/settings.py`, `backend/backend/urls.py`
- AI endpoints and helpers: `backend/backend/ai/views.py`, `backend/backend/ai/*.py`
- Courses models and routes: `backend/courses/models.py`, `backend/courses/urls.py`, `backend/courses/pro_learning_urls.py`
- Auth: `backend/authentication/models.py`, `backend/authentication/urls.py`, `backend/authentication/backends.py`
- Dev infra: `docker-compose.yml`, `requirements.txt`, `frontend/vite.config.js`

If any section is unclear or you need more details (e.g., expected payloads for less‑used endpoints, local sample data steps), tell me what to expand and I’ll refine this doc.
