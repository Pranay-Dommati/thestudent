# Production Certificate Deployment Guide

This guide lists the exact backend settings and environment variables required so certificate PDFs issue and display correctly in production (Render API + Hostinger site).

## Backend settings summary

- Certificates are generated under `MEDIA_ROOT/certificates/*.pdf` and served via `/media/certificates/*.pdf`.
- Middleware `CertificateFrameMiddleware` enables embedding PDFs by removing `X-Frame-Options` and setting CSP `frame-ancestors` from `FRONTEND_ORIGINS`.
- Serializer returns absolute `download_url` using `request.build_absolute_uri`.

## Required environment variables

Set these on your backend (Render) environment:

- ALLOWED_HOSTS=easylearnova.com,www.easylearnova.com,<api-host>
- DEBUG=false
- CORS_ALLOWED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
- CSRF_TRUSTED_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
- FRONTEND_ORIGINS=https://easylearnova.com,https://www.easylearnova.com
- MEDIA_URL=/media/
- MEDIA_ROOT=/opt/render/project/src/backend/media   # or a mounted persistent volume path

Optional security headers (already defaulted):
- X_FRAME_OPTIONS=SAMEORIGIN (middleware strips it for certificate PDFs)

JWT and DB variables as per your environment.

## Render (API) notes

- Ensure media directory is persisted across deploys:
  - Use a persistent disk and set MEDIA_ROOT to that mount path, or
  - Use object storage (future enhancement).
- If you add a reverse proxy (nginx), do NOT add a global `X-Frame-Options: DENY`. If present, remove for `/media/certificates/` or rely only on CSP.

## Hostinger (Frontend) notes

- Frontend calls API base URL (VITE_API_BASE_URL) must point to Render API.
- Certificates embed via canvas/iframe. No extra CORS needed if backend has `CORS_ALLOWED_ORIGINS` set.
- If Hostinger injects `X-Frame-Options`, ensure it does not apply to PDFs fetched from API domain.

## Quick validation checklist

1) After deploy, open:
- GET https://<api-host>/api/courses/<id>/progress/   => percentage 100
- POST https://<api-host>/api/courses/<id>/certificate/ => 200/201 with download_url
- GET https://<api-host>/media/certificates/<filename>.pdf => 200, headers include:
  - Content-Security-Policy: frame-ancestors 'self' https://easylearnova.com https://www.easylearnova.com
  - Access-Control-Allow-Origin: *
  - Content-Type: application/pdf

2) On production frontend page, check that the certificate preview appears and Download PDF works.

## Troubleshooting

- 403/404 on media: confirm MEDIA_URL/ROOT and static serve rule in `backend/urls.py` (production fallback is already present).
- CORS preflight errors: ensure CORS_ALLOWED_ORIGINS includes frontend origins exactly (scheme + host).
- Frame blocked: remove global `X-Frame-Options` at proxy; CSP frame-ancestors governs embedding for PDFs.
- 1406 MySQL errors: fixed by migration to CharField(36) for `Certification.certificate_id`.
