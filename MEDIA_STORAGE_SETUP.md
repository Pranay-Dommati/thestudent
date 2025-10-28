# Robust Media Storage and Thumbnails

This project now supports persistent media storage via Cloudinary, with safe thumbnail URLs and fallbacks to avoid broken images.

## What changed
- Optional Cloudinary integration added (enabled via environment variables)
- Backend now validates thumbnail existence and returns a safe URL with a placeholder fallback
- Dependencies added: `cloudinary`, `django-cloudinary-storage`

## Enable Cloudinary (recommended for production)
1. Create a Cloudinary account and get your credentials
   - Cloud name
   - API key
   - API secret
2. Set environment variables in your production environment:
   - Either a single connection string:
     - `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
   - Or individual vars supported by the library
3. Optionally set:
   - `USE_CLOUDINARY=true` (not required if `CLOUDINARY_URL` is present)
   - `CLOUDINARY_MEDIA_PREFIX=media` (where uploads are grouped)
   - `DEFAULT_THUMBNAIL_PLACEHOLDER=<https-url>` for a custom fallback image

When Cloudinary is enabled, Django uses `MediaCloudinaryStorage` for media. Static files still use WhiteNoise.

## Local development (default)
- Without Cloudinary environment variables, the app stores media under `backend/media/` and serves thumbnail URLs pointing to `/media/...`.

## Thumbnail fallback behavior
- The API now checks if a course thumbnail file exists before returning its URL.
- If a file is missing (for example, on ephemeral storage), the API returns a placeholder URL instead of a broken link.
- Configure a custom placeholder via `DEFAULT_THUMBNAIL_PLACEHOLDER`.

## Notes
- After enabling Cloudinary, new uploads are stored remotely and returned as absolute HTTPS URLs.
- Consider migrating any existing local media files to Cloudinary if you need them retained in production.
- Existing diagnostic scripts in the repo (e.g., `check_media_serving.py`, `fix_course_thumbnails.py`) can help audit and clean up references.
