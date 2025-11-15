# AUTO-CONFIGURED SECURITY SETTINGS

## Overview
The Django settings have been updated to automatically configure security settings based on the `DEBUG` environment variable. This makes it easy to switch between development and production without manually changing security settings.

## How it Works

### When `DEBUG=True` (Development)
- ✅ **SECURE_SSL_REDIRECT = False** - Allow HTTP connections
- ✅ **SESSION_COOKIE_SECURE = False** - Allow session cookies over HTTP
- ✅ **CSRF_COOKIE_SECURE = False** - Allow CSRF cookies over HTTP  
- ✅ **SESSION_COOKIE_HTTPONLY = False** - Allow JavaScript access (for debugging)
- ✅ **CSRF_COOKIE_HTTPONLY = False** - Allow JavaScript access (for debugging)
- ✅ **SESSION_COOKIE_SAMESITE = 'Lax'** - Relaxed for local testing
- ✅ **CSRF_COOKIE_SAMESITE = 'Lax'** - Relaxed for local testing

### When `DEBUG=False` (Production)
- 🔒 **SECURE_SSL_REDIRECT = True** - Force HTTPS redirects
- 🔒 **SESSION_COOKIE_SECURE = True** - Require HTTPS for session cookies
- 🔒 **CSRF_COOKIE_SECURE = True** - Require HTTPS for CSRF cookies
- 🔒 **SESSION_COOKIE_HTTPONLY = True** - Block JavaScript access (security)
- 🔒 **CSRF_COOKIE_HTTPONLY = True** - Block JavaScript access (security)
- 🔒 **SESSION_COOKIE_SAMESITE = 'None'** - Cross-domain support with HTTPS
- 🔒 **CSRF_COOKIE_SAMESITE = 'None'** - Cross-domain support with HTTPS
- 🔒 **SECURE_HSTS_SECONDS = 31536000** - HTTP Strict Transport Security
- 🔒 **Additional security headers enabled**

## Environment Override
You can still override any setting by adding it to your .env file:
```env
# Force specific values (overrides auto-configuration)
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=None
```

## Deployment Process

### For Development:
1. Set `DEBUG=True` in your .env file
2. All security settings automatically become development-friendly
3. No need to change anything else

### For Production:
1. Set `DEBUG=False` in your .env file
2. All security settings automatically become production-secure
3. No need to manually configure CSRF/session settings

## Benefits
- ✅ **No Manual Configuration** - Just change DEBUG flag
- ✅ **Prevents Security Mistakes** - Automatic secure defaults in production
- ✅ **Easy Development** - Relaxed settings for local testing
- ✅ **Environment Override** - Still flexible when needed
- ✅ **Future-Proof** - Easy to deploy anywhere

## Current Status
- Django settings updated with auto-configuration
- Root .env file cleaned up (commented out manual overrides)
- Ready for both development and production use