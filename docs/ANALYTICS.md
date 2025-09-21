# Analytics Setup

This project uses a hybrid analytics approach:

- PostHog (client): quick product analytics, autocapture, funnels.
- Django Tracking app (server): structured, owned event log for key flows.

## Backend

Endpoints (all under `/api/analytics/`):
- `POST /track-activity/` – single event
- `POST /track-activity/bulk/` – batch events
- `GET /recent-events/` – last N events for admin UI (filters: last, feature, success, contains)
- `GET /recent-sessions/` – aggregated sessions for Replay tab (filters match recent-events)

Model: `tracking.UserActivity`

## Frontend

Initialize tracking early in `src/main.jsx`:

```
import tracking from './services/trackingService.js'
tracking.init()
```

Environment for PostHog (optional):
- `VITE_POSTHOG_KEY=phc_...`
- `VITE_POSTHOG_HOST=https://us.i.posthog.com`

Usage:

```
import tracking from '@/services/trackingService'
tracking.capture('pro_learning.save_attempted', { course_id: 'abc' }, { feature: 'pro_learning' })
```

Admin UI: `/admin-p/analytics` shows recent events and basic metrics. The Replay tab calls `/api/analytics/recent-sessions/` and provides a quick link to PostHog Recordings; search by the copied session_id (distinct_id).
