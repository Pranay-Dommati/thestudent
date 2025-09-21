# PostHog Session Replay and Reverse Proxy Setup

This guide hardens PostHog tracking and Session Replay for both localhost and production, and shows how to avoid ad/tracking blockers with a reverse proxy.

## 1) Localhost (Vite 5173 + Django 8000)

Env (frontend/.env.local):

```
VITE_PUBLIC_POSTHOG_KEY=YOUR_KEY
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# Optional quality-of-life
VITE_POSTHOG_APP_URL=https://us.posthog.com
# Toggles
VITE_POSTHOG_AUTOCAPTURE=true
VITE_POSTHOG_DISABLE_SESSION_RECORDING=false
VITE_POSTHOG_PERSISTENCE=localStorage
```

In your browser, disable ad/tracking blockers while testing.

Enable Session Replay in PostHog → Project Settings → Session Replay.

## 2) Production (e.g., easylearnova.com)

Two options:

- A) Use PostHog Cloud directly (simplest):
  - Keep `VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`

- B) Reverse proxy via your own subdomain (recommended to avoid blocking):
  - Create `analytics.easylearnova.com`
  - Nginx example:

```
server {
    listen 443 ssl;
    server_name analytics.easylearnova.com;

    location / {
        proxy_pass https://us.i.posthog.com/;
        proxy_set_header Host us.i.posthog.com;
        proxy_set_header X-Forwarded-For $remote_addr;
    }

    location /static/ {
        proxy_pass https://us-assets.i.posthog.com/static/;
        proxy_set_header Host us-assets.i.posthog.com;
    }
}
```

Then set:

```
VITE_PUBLIC_POSTHOG_HOST=https://analytics.easylearnova.com
```

## 3) Admin Replay Workflow

- Visit `/admin-p/analytics` → Replay tab
- Copy a session id, click "Open PostHog", paste session id to find its recording

## 4) Custom Event Strategy

You already have a backend `/api/analytics/track-activity/bulk/` endpoint and a frontend buffer. Continue capturing app-specific events there.

- Pros: Structured, queryable data you own
- Hybrid: PostHog for product analytics + replay; Django for precise events

## 5) Troubleshooting

- No recordings: Ensure Session Replay is enabled; disable blockers locally
- 403/blocked: Use the reverse proxy option and update `VITE_PUBLIC_POSTHOG_HOST`
- Identifier mismatch: We set PostHog distinct_id = your session_id for easy search
