# Frontend Deployment to Hostinger (Vite + React)

This project’s frontend is a Vite React app in `frontend/`. Follow these steps to deploy it to Hostinger so it talks to your Django backend at https://www.easylearnova.com.

## 1) Set API base URL

The app reads `VITE_API_BASE_URL` at build time (see `frontend/src/utils/apiOrigin.js`). For production with your Django backend under the same domain, use:

- If backend is accessible at https://www.easylearnova.com and API is under `/api`:
  - `VITE_API_BASE_URL=https://www.easylearnova.com/api`
- If backend is on a subdomain (e.g., api.easylearnova.com), then:
  - `VITE_API_BASE_URL=https://api.easylearnova.com/api`

You can provide this as an environment variable when building or in a `.env.production` file inside `frontend/`.

Example `.env.production` (place in `frontend/`):
```
VITE_API_BASE_URL=https://www.easylearnova.com/api
```

## 2) Build the frontend

From the `frontend/` directory:
- Install deps: `npm ci` (or `npm install`)
- Build: `npm run build`

This produces a `frontend/dist/` folder with static assets.

## 3) Deploy static files to Hostinger

Option A: Use hPanel’s File Manager
- Compress the `frontend/dist/` folder into `dist.zip` locally.
- Upload `dist.zip` to `public_html/`.
- Extract so that the contents of `dist` (index.html, assets/) are directly under `public_html/`.

Option B: FTP
- Connect via FTP and upload the contents of `frontend/dist/` into `public_html/`.

## 4) Configure SPA routing (.htaccess)

Vite SPA needs to serve `index.html` for unknown routes so the client-side router can take over. Create/ensure `public_html/.htaccess` contains:

```
RewriteEngine On
# Serve files directly if they exist
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
# Otherwise, rewrite everything to index.html
RewriteRule ^ index.html [L]
```

If you already have `.htaccess`, merge these rules without duplicating `RewriteEngine On`.

## 5) Verify

- Go to https://www.easylearnova.com
- Navigate through app routes (e.g., /courses, /login) directly in the URL bar to confirm SPA fallback works.
- Open DevTools → Network tab and confirm API requests go to `https://www.easylearnova.com/api/...` and succeed (CORS/CSRF must be set in backend env, which is already covered).

## 6) Common issues

- White page or 404 on deep links: SPA rewrite rules missing in `.htaccess`.
- API calls failing with CORS: confirm backend `CORS_ALLOWED_ORIGINS` includes `https://www.easylearnova.com`.
- Cookies not set on login: ensure backend cookies use `SameSite=None` and HTTPS, and domain matches.
- Stale assets: clear browser cache or bump the build (Vite adds hashes to avoid this normally).

## 7) Optional: Separate subdomain

If you serve the frontend at `https://www.easylearnova.com` and backend at `https://api.easylearnova.com`:
- Frontend build: `VITE_API_BASE_URL=https://api.easylearnova.com/api`
- Backend env: add both to CORS/CSRF and set `ALLOWED_HOSTS=api.easylearnova.com,easylearnova.com,www.easylearnova.com`.

---

Once these steps are complete, your frontend will be live on Hostinger and talking to the Django backend using the configured API base URL.
