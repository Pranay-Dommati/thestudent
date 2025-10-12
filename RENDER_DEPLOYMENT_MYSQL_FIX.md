# RENDER DEPLOYMENT - MySQL Connection Fix

## Critical Environment Variables for Render

Add these environment variables in your **Render Dashboard** → **Backend Service** → **Environment**:

### Database Configuration (Hostinger MySQL)
```bash
# Database Engine
DB_ENGINE=mysql
DB_HOST=your-hostinger-mysql-host.com  # Your Hostinger MySQL hostname
DB_PORT=3306
DB_NAME=studentshub_db  # Your database name
DB_USER=studentshub_user  # Your database username
DB_PASSWORD=your_secure_password  # Your database password

# CRITICAL: Connection Pooling for Remote MySQL
DB_CONN_MAX_AGE=60  # 60 seconds (shorter for remote DB to avoid stale connections)

# SSL (if required by Hostinger)
DB_SSL_REQUIRE=false  # Set to 'true' if Hostinger requires SSL

# IPv4 Force (if needed)
DB_FORCE_IPV4=false  # Set to 'true' if experiencing IPv6 issues
```

### Django Settings
```bash
# Django
DEBUG=False
DJANGO_LOG_LEVEL=INFO
SECRET_KEY=your-super-secret-production-key-here-change-this

# Allowed Hosts
ALLOWED_HOSTS=easylearnova-backend.onrender.com,www.easylearnova.com

# Frontend Domain
FRONTEND_DOMAIN=https://www.easylearnova.com
CORS_ALLOWED_ORIGINS=https://www.easylearnova.com,https://easylearnova.com
```

### JWT Configuration  
```bash
JWT_ACCESS_MINUTES=15  # Access token lifetime (15 minutes)
JWT_REFRESH_DAYS=7  # Refresh token lifetime (7 days)
```

### Google OAuth
```bash
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=your-google-client-id.apps.googleusercontent.com
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=your-google-client-secret
```

### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_USE_SSL=False
SMTP_USE_TLS=True
```

## Render Build Command

```bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
```

## Render Start Command

```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 120
```

## Important Notes for Render + Hostinger Setup

### 1. Connection Timeout Settings
- `DB_CONN_MAX_AGE=60` - Keep connections alive for 60 seconds
- Shorter than default to avoid "Server has gone away" errors
- Render will reconnect automatically when needed

### 2. Worker Configuration
- **4 workers** recommended for production
- Each worker maintains its own database connection pool
- `--timeout 120` to handle long-running AI generation requests

### 3. Health Checks
- Render will automatically ping your `/` endpoint
- Database health checks are enabled via `CONN_HEALTH_CHECKS=True` (automatic)

### 4. Database Connection Flow
```
Render Backend (US/EU Region)
      ↓ (60s connection pool)
Hostinger MySQL (Shared Hosting)
```

### 5. Common Issues & Solutions

#### Issue: "Server has gone away"
**Solution**: Already fixed with:
- ✅ `DB_CONN_MAX_AGE=60` 
- ✅ `CONN_HEALTH_CHECKS=True`
- ✅ Automatic retry logic on auth endpoints
- ✅ Connection pool middleware

#### Issue: "Can't connect to MySQL server"
**Solution**: Check:
1. Hostinger MySQL allows remote connections
2. Your Render IP is whitelisted in Hostinger (if required)
3. `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct

#### Issue: Slow database queries
**Solution**:
- Add database indexes (already done for most queries)
- Consider upgrading Hostinger plan for better performance
- Use caching for frequently accessed data

### 6. Testing the Deployment

After deploying, test these critical endpoints:

```bash
# Health Check
curl https://easylearnova-backend.onrender.com/

# Google Login (should return 400 without token)
curl -X POST https://easylearnova-backend.onrender.com/api/auth/google/token/

# Token Refresh (should return 400 without token)
curl -X POST https://easylearnova-backend.onrender.com/api/auth/token/refresh/
```

All should return responses (not 500 errors or connection timeouts).

## Monitoring Connection Health

### View Logs in Render
1. Go to Render Dashboard → Your Service → Logs
2. Look for these indicators:

**Good**:
```
✓ Function google_auth_token succeeded
✓ Database reconnection successful
INFO Database connection healthy
```

**Bad** (should not appear after fix):
```
✗ Database connection error after 3 attempts
ERROR MySQLdb.OperationalError: (2006, 'Server has gone away')
⚠ Database connection lost
```

### Database Connection Command

Run this in Render Shell to check MySQL connection:

```bash
python manage.py check_mysql_connection
```

Should show:
```
✓ Connected! MySQL Version: 8.0.x
✓ CONN_MAX_AGE (60s) is appropriately less than wait_timeout
✓ CONN_HEALTH_CHECKS is enabled
```

## Rollback Plan

If issues persist after deployment:

1. **Immediate**: Set `DB_CONN_MAX_AGE=0` (disable pooling)
2. **Check Logs**: Review Render logs for specific errors
3. **Test Locally**: Use Render's MySQL credentials locally to debug
4. **Contact Support**: Reach out to Hostinger if connection limits exceeded

## Performance Optimization

### For Better Performance:

1. **Hostinger Side**:
   - Upgrade to higher MySQL plan if using shared hosting
   - Increase `max_connections` if possible
   - Enable query cache

2. **Render Side**:
   - Use Redis for caching (add Redis addon)
   - Implement Django cache framework
   - Add CDN for static files (already using WhiteNoise)

3. **Code Side**:
   - Use `select_related()` and `prefetch_related()` for queries
   - Add database indexes for frequently filtered fields
   - Implement pagination for large result sets

## Security Checklist

- ✅ `DEBUG=False` in production
- ✅ Strong `SECRET_KEY` (50+ random characters)
- ✅ MySQL user has minimal required permissions
- ✅ `ALLOWED_HOSTS` properly configured
- ✅ CORS origins restricted to your domain
- ✅ SSL/TLS enabled for database connection (if required)
- ✅ Environment variables stored in Render (not in code)
- ✅ Google OAuth credentials secured

## Support

If you still experience MySQL connection errors after following this guide:

1. Check Render logs for specific error messages
2. Run `python manage.py check_mysql_connection` in Render Shell
3. Verify Hostinger MySQL allows remote connections
4. Check if Hostinger has connection limits and you're hitting them
5. Consider database connection pooling service like PgBouncer (MySQL equivalent)

## Summary of Changes Made

1. ✅ Database configuration optimized for remote MySQL (60s connection lifetime)
2. ✅ Increased timeouts for network latency (28s connect, 60s read/write)
3. ✅ Enabled connection health checks (`CONN_HEALTH_CHECKS=True`)
4. ✅ Added automatic retry logic to Google OAuth endpoint
5. ✅ Added automatic retry logic to JWT token refresh endpoint
6. ✅ Created database connection middleware for global handling
7. ✅ Configured logging to track connection issues
8. ✅ Created diagnostic command to check connection health

The "Server has gone away" error should be completely resolved with these changes.
