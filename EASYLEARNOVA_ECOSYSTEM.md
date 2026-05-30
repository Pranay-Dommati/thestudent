# EasyLearnova Ecosystem

<div align="center">

![EasyLearnova](https://img.shields.io/badge/EasyLearnova-AI%20Learning%20Platform-6366f1?style=for-the-badge&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render&logoColor=white)

**An AI-powered learning platform that generates personalized study packs, courses, and learning tools.**

[Live Site](https://easylearnova.com) · [Scrib AI](https://scrib.easylearnova.com) · [Backend API](https://easylearnova-backend.onrender.com/api)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [Infrastructure](#infrastructure)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Deployment](#deployment)

---

## Overview

EasyLearnova is a full-stack AI learning platform built over ~14 months. It helps students learn smarter through:

- **AI-generated study packs** — structured notes, quizzes, and summaries from any topic
- **Curated course library** — browse and enroll in hand-crafted courses
- **Code Visualizer** — visualize code execution step-by-step for learning
- **Scrib** — AI-powered document and PDF study tool
- **Company portal** — public-facing marketing and landing pages
- **Payment integration** — Razorpay live payments for premium content

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EasyLearnova Ecosystem                    │
├─────────────┬──────────────┬───────────────┬────────────────────┤
│  frontend/  │scrib-frontend│company-frontend│  courses-frontend  │
│  (Main App) │  (Scrib AI)  │  (Marketing)   │  (Course Catalog)  │
│  React+Vite │  React+Vite  │  React+Vite    │  React+Vite        │
│  Hostinger  │  Hostinger   │  Hostinger     │  Hostinger         │
└──────┬──────┴──────┬───────┴───────┬────────┴─────────┬──────────┘
       │             │               │                  │
       └─────────────┴───────────────┴──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Django Backend     │
                    │  (backend/backend/)  │
                    │  Render.com (Free)   │
                    │  Python 3.12         │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌───────▼───────┐   ┌───────▼───────┐
   │  Hostinger  │    │   AWS S3      │   │  AWS SES      │
   │  MySQL DB   │    │  (Scrib imgs) │   │  (Emails)     │
   └─────────────┘    └───────────────┘   └───────────────┘
          │
   ┌──────▼──────┐    ┌───────────────┐   ┌───────────────┐
   │  Razorpay   │    │   OpenAI API  │   │  Google APIs  │
   │  (Payments) │    │  (Image gen)  │   │  (OAuth/YT/   │
   └─────────────┘    └───────────────┘   │   Search)     │
                                          └───────────────┘
```

---

## Services

### 1. `frontend/` — Main Student App
The primary student-facing application. Students browse courses, enroll, track progress, take quizzes, generate AI study packs (ProLearning), and manage their profile.

- **URL:** `https://easylearnova.com`
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS
- **Key Features:**
  - Course browsing and enrollment
  - AI ProLearning study pack generation
  - Certificate generation and download
  - Google OAuth login
  - Razorpay payment flow
  - PostHog analytics + session recording

---

### 2. `scrib-frontend/` — Scrib AI App
A standalone AI study tool for generating structured notes and documents from topics. Users get a monthly allowance of AI generations.

- **URL:** `https://scrib.easylearnova.com`
- **Framework:** React 18 + Vite + TailwindCSS
- **Key Features:**
  - AI-generated study packs (text + images via OpenAI)
  - PDF export with S3 storage
  - Monthly generation limits (15/month per user)
  - Mobile-optimized layout
  - Generation history and preview

---

### 3. `company-frontend/` — Marketing / Landing Page
The public-facing company website — landing page, about, features, pricing, and contact.

- **URL:** `https://www.easylearnova.com`
- **Framework:** React 18 + Vite + TailwindCSS
- **Key Features:**
  - SEO-optimized landing pages
  - Blog / content pages
  - Pricing and feature showcase

---

### 4. `courses-frontend/` — Course Catalog
A dedicated interface for browsing and discovering the course library.

- **Framework:** React 18 + Vite + TailwindCSS
- **Key Features:**
  - Course search and filter
  - Category browsing
  - Course detail pages

---

### 5. `codevisualizer-frontend/` — Code Visualizer
An interactive tool for visualizing code execution step-by-step, designed for learners studying programming concepts.

- **URL:** `https://codevisualizer.easylearnova.com`
- **Framework:** React 18 + Vite
- **Backend:** Separate FastAPI service (`code-visualizer-api-ucco.onrender.com`)

---

### 6. `backend/` — Django REST API
The central backend powering all frontends. Handles authentication, course management, AI generation, payments, emails, and analytics.

- **URL:** `https://easylearnova-backend.onrender.com`
- **Framework:** Django 5.1 + Django REST Framework
- **Database:** MySQL (Hostinger)
- **Cache:** Redis (Render)
- **Key Apps:**
  - `authentication` — JWT auth, Google OAuth2, OTP email verification
  - `courses` — Course CRUD, enrollment, progress tracking, certificates
  - `scrib` — AI study pack generation (OpenAI + Gemini), S3 storage
  - `payments` — Razorpay integration, webhooks
  - `chatbotcourse` — AI chatbot for course-specific Q&A
  - `code_visualizer` — Code execution and visualization
  - `feedback` — User feedback collection
  - `newsletter` — Newsletter subscription management
  - `tracking` — Custom analytics and event tracking
  - `api` — Self-ping utility (keeps Render free tier alive)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + Vite |
| **Styling** | TailwindCSS |
| **Backend** | Django 5.1 + DRF |
| **Auth** | JWT (SimpleJWT) + Google OAuth2 (social-auth) |
| **Database** | MySQL 8 (Hostinger) |
| **Cache** | Redis (Render) |
| **AI - Text** | Google Gemini API |
| **AI - Images** | OpenAI gpt-image-2 |
| **Email** | AWS SES (boto3 API) |
| **File Storage** | AWS S3 (Scrib images) |
| **Payments** | Razorpay (live) |
| **Analytics** | PostHog |
| **Search** | Google Programmable Search API |
| **Static Files** | WhiteNoise |
| **Deployment** | Render (backend) + Hostinger (frontends) |

---

## Infrastructure

```
Production Deployment

Backend:    Render.com (Python 3.12, Singapore)
            └── Gunicorn + Django
            └── Redis cache (Render Redis)
            └── MySQL DB (Hostinger srv1990.hstgr.io)

Frontends:  Hostinger shared hosting
            └── Static Vite builds deployed via FTP/deploy.sh
            └── Apache with .htaccess for SPA routing

Email:      AWS SES (Mumbai ap-south-1)
Storage:    AWS S3 (Mumbai ap-south-1) — Scrib AI images
Payments:   Razorpay Live
Analytics:  PostHog (US cloud)
OAuth:      Google Cloud Console
```

---

## Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- MySQL or SQLite (for local dev)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/Pranay-Dommati/thestudent.git
cd thestudent
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r ../requirements.txt

# Copy env template and fill in your values
cp ../.env.example ../.env
# Edit ../.env with your credentials
```

### 3. Run Django
```bash
# From the backend/ directory
python manage.py migrate
python manage.py runserver
# Backend runs on http://127.0.0.1:8000
```

### 4. Set up a frontend (e.g. scrib-frontend)
```bash
cd ../scrib-frontend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
# Runs on http://localhost:5173
```

> Repeat step 4 for `frontend/`, `codevisualizer-frontend/`, `company-frontend/`, or `courses-frontend/` as needed.

---

## Environment Variables

Each sub-project has a `.env.example` file as a safe template. **Never commit `.env` files.**

| File | Purpose |
|------|---------|
| `.env.example` | Root template — backend variables |
| `frontend/.env.example` | Main app frontend variables |
| `scrib-frontend/.env.example` | Scrib AI frontend variables |
| `codevisualizer-frontend/.env.example` | Code visualizer variables |
| `company-frontend/.env.example` | Marketing site variables |
| `courses-frontend/.env.example` | Course catalog variables |
| `backend/.env.example` | Backend-specific overrides |

### Key Backend Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` for local dev, `False` for production |
| `DB_*` | MySQL database connection details |
| `OPENAI_API_KEY` | OpenAI API key for Scrib image generation |
| `GEMINI_API_KEY` | Google Gemini API key for AI text generation |
| `SCRIB_S3_*` | AWS IAM credentials for S3 image storage |
| `SES_AWS_*` | AWS IAM credentials for SES email sending |
| `RAZORPAY_*` | Razorpay API keys and webhook secret |
| `GOOGLE_OAUTH2_*` | Google Cloud OAuth2 client credentials |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `GOOGLE_SEARCH_API_KEY` | Google Programmable Search API key |

---

## API Overview

The Django backend exposes a REST API at `/api/`. Key endpoint groups:

| Prefix | Description |
|--------|-------------|
| `/api/auth/` | Registration, login, OTP verification, password reset |
| `/api/courses/` | Course listing, enrollment, progress, certificates |
| `/api/scrib/` | AI study pack generation and history |
| `/api/payments/` | Razorpay order creation and webhook |
| `/api/chatbot/` | AI chatbot for course Q&A (health check endpoint) |
| `/api/feedback/` | User feedback submission |
| `/api/newsletter/` | Newsletter subscription |
| `/api/tracking/` | Analytics event ingestion |
| `/ai/` | ProLearning AI generation endpoints |

Authentication uses **JWT Bearer tokens** (`Authorization: Bearer <token>`).

---

## Deployment

### Backend (Render)
Configured via [`render.yaml`](./render.yaml). The backend auto-deploys from the `dep-backend` branch.

```bash
# Build command (render.yaml → build.sh)
pip install -r requirements.txt
cd backend && python manage.py collectstatic --noinput
cd backend && python manage.py migrate

# Start command
cd backend && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

### Frontends (Hostinger)
Each frontend has a `deploy.sh` script for building and uploading to Hostinger via FTP/SSH.

```bash
# Example: deploy scrib-frontend
cd scrib-frontend
npm run build
# Then upload dist/ to Hostinger via deploy.sh
```

---

## Contributing

This is a personal/team project. If you're contributing:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Copy `.env.example` → `.env` and fill in credentials
4. Make your changes
5. Open a pull request

> **Security:** Never commit `.env` files. All env files are gitignored. Use `.env.example` as your template.

---

<div align="center">

Built with ❤️ by [Pranay Dommati](https://github.com/Pranay-Dommati)

</div>
