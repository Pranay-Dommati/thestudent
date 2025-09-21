# Project Overview: AI-Assisted Learning Platform

## Project concept at a glance

- Theme: Personalized, AI-assisted learning platform for students and professionals.
- Core idea: Combine curated “predefined” courses (School and Engineering) with “Pro Learning” AI-generated coursework tailored to a learner’s goals. Wrap it with robust tracking, certificates, and an AI assistant for content generation and discovery.
- Value: Faster content creation for educators, personalized learning paths for students, and measurable progress with certificates embeddable across platforms.

## What it does (capabilities)

- Predefined courses:
  - School courses by class level/board/subject with chapters, lessons, resources, and quizzes.
  - Engineering courses with sections, videos, resources, quizzes.
- AI-powered “Pro Learning”:
  - Users define a course idea; the system builds per-topic content across five tabs: reading, summary, videos, quiz, resources.
  - Overwrite-in-place update flow lets users iteratively refine content without creating duplicates.
- Learning progress and certificates:
  - Track per-lesson completion, user progress, and course completion percentages.
  - Generate certificates (PDFs) for Engineering courses; PDFs are iframe-embeddable with custom security headers.
- AI Assist and content discovery:
  - Topic classification from natural language (e.g., “learn DSA in C++”).
  - Server-side Gemini proxy for chat (throttled and authenticated) and helper endpoints for summary, resources, videos, and YouTube search.

## Who it’s for

- Students seeking structured curricula plus personalized AI-generated content.
- Educators/course creators who want to bootstrap materials quickly and keep improving them.
- Institutions needing progress tracking, certificates, and secure embedding in learning portals.

## Why it’s different

- Dual-mode learning: curated predefined courses + dynamic AI-generated “Pro Learning”.
- Practical scaffolding for content: standardized tabs, structured models, and APIs that are easy to automate against.
- Robust operational features: JWT auth, rate limiting, environment-driven DB selection, clean Postgres backup/restore flows, iframe-safe certificates.

## Architecture overview

- Frontend: Vite + React + Tailwind (frontend/). Dev proxy targets Django at 127.0.0.1:8000 for /api, /ai, /media.
- Backend: Django (backend/) with apps:
  - authentication: custom user (email as username), SimpleJWT, Google OAuth via social-auth.
  - courses: models for School/Engineering courses, lessons, quizzes, resources, tracking, certificates; Pro Learning models with UUIDs.
  - chatbotcourse: vector-based educational bot (TF-IDF) for Q&A fallback/local experiences.
  - backend/ai: AI endpoints (chat, topics, quiz, summary, resources, videos, YouTube search); Gemini integration with server-side keys.
  - feedback, newsletter: auxiliary features.
- Data layer:
  - Preferred: Postgres via Docker (docker-compose). Fallback: SQLite (env-driven in settings).
  - Backups: dump.sh/load.sh with Windows Git Bash compatibility.

## Key data models

- SchoolCourse and EngineeringCourse extend an abstract BaseCourse.
- Lessons link to chapters/sections; LessonResource, QuizQuestion, QuizResult represent learning material and outcomes.
- UserStartedPredefinedCourse and UserLessonProgress track engagement.
- ProLearningCourse (UUID) -> ProLearningTopic (UUID) with reading, summary, completion, and related ProLearningVideo, ProLearningResource, ProLearningQuizQuestion.
- Certification: PDF issuance for Engineering courses; unique per user/course.

## Security and policies

- Auth: Custom `authentication.User` (email login), SimpleJWT; some AI endpoints manually decode HS256 tokens for user_id.
- CORS/CSRF: Relaxed in DEV; environment variables required for production origin safety.
- Rate limiting: AI topic creation/status backed by Django cache; debug endpoints only in DEBUG.
- Certificates: custom middleware allows iframe embedding only for PDFs and sets CSP/X-Frame-Options accordingly.

## Notable conventions and patterns

- URL ordering is critical in `courses.urls`: specific routes first, then dynamic catch-alls to prevent 405/route capture problems.
- UUIDs for Pro Learning entities; API returns string UUIDs—persist and reuse across overwrites.
- AI chat is authenticated and throttled; other AI helpers are typically CSRF-exempt with strict JSON validation.
- Environment precedence: root `.env` overrides `backend/.env`. DB engine switches automatically based on `DB_ENGINE` or `DB_HOST`.

## Developer workflows

- Run backend:
  - Create `.env` (see `POSTGRES_MIGRATION.md`).
  - `docker compose up -d postgres`
  - `cd backend && python manage.py migrate && python manage.py runserver 0.0.0.0:8000`
- Run frontend: `cd frontend && npm install && npm run dev`
- Tests:
  - `backend/pytest.ini` sets `DJANGO_SETTINGS_MODULE=backend.settings`.
  - Integration tests: `backend/courses/tests/test_postgres_integration.py` (requires Postgres), `backend/courses/tests/test_save_course.py` (SimpleJWT).
  - VS Code task: “Run Postgres integration tests”.
- Data backup/restore:
  - `./dump.sh` creates `db_backup.dump` (commit for team sharing).
  - `./load.sh` restores from `db_backup.dump`. Both read `.env` and support Docker/local clients.

## Important API examples

- Pro Learning save: POST `/api/courses/pro-learning/save-course/`
  - Payload includes `course_name`, `title`, `overwrite`, and per-topic content with tabs.
  - Overwrite behavior updates in place (same UUID) when `overwrite: true`.
- AI topic classification: POST `/ai/classify-topics/` with `{ query: "learn DSA in C++" }`
  - Returns up to 4 topics: `[{ id, name, isActive }]`.
- Certificates:
  - Issue: GET `/api/courses/<course_id>/certificate/`
  - List: GET `/api/courses/certificates/`
  - PDFs served under `/media/certificates/*` and embeddable via middleware.

## Demo flow (suggested)

1. Login/register; optionally use Google OAuth.
2. Start a predefined course and complete a couple of lessons (observe progress, quizzes, and resources).
3. Create a Pro Learning course using the save endpoint or the UI; show overwriting with updated content.
4. Use AI topic classification to craft a tailored course outline from a natural query.
5. Issue a certificate for an Engineering course; show PDF embedding in an iframe.

## Roadmap ideas

- Richer Pro Learning authoring UI (drag-and-drop topic editing, AI rewrite prompts).
- Per-user rate limits backed by Redis in production; configurable plans/tiers.
- Analytics dashboards for educators (engagement, completion rates).
- Expand AI helpers: automated resource validation, plagiarism checks, and content alignment with curricula.
