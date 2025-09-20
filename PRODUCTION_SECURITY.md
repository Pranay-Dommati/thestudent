# 🚀 Production Deployment Security Checklist

## ✅ Pre-Deployment Security Tasks

### 1. **Environment Variables**
- [ ] Generate new `SECRET_KEY` (64+ characters)
- [ ] Set `DEBUG=False`
- [ ] Configure all API keys (`GEMINI_API_KEY`, `YOUTUBE_API_KEY`, etc.)
- [ ] Set proper `ALLOWED_HOSTS` with your domain
- [ ] Configure `CORS_ALLOWED_ORIGINS` with your frontend domain
- [ ] Set `CSRF_TRUSTED_ORIGINS` with your domain
- [ ] Configure database credentials
- [ ] Set strong database password

### 2. **Database Security**
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Enable SSL for database connections (`DB_SSL_REQUIRE=true`)
- [ ] Create dedicated database user with minimal privileges
- [ ] Configure connection pooling (`DB_CONN_MAX_AGE=60`)

### 3. **Web Server Configuration**
- [ ] Use HTTPS everywhere (SSL certificate)
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set proper HTTP security headers
- [ ] Enable GZIP compression
- [ ] Configure static file serving
- [ ] Set up log rotation

### 4. **Authentication & Authorization**
- [ ] Review all `@permission_classes([AllowAny])` endpoints
- [ ] Ensure admin endpoints require `IsAdminUser`
- [ ] Configure JWT token lifetimes appropriately
- [ ] Test OAuth2 flows with production domains

### 5. **File Upload Security**
- [ ] Verify file upload limits are set
- [ ] Test file type validation
- [ ] Ensure uploaded files are not executable
- [ ] Configure proper file serving headers

### 6. **Monitoring & Logging**
- [ ] Configure centralized logging
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Monitor failed login attempts
- [ ] Set up performance monitoring
- [ ] Configure health checks

### 7. **Backup Strategy**
- [ ] Automate database backups
- [ ] Test backup restoration
- [ ] Backup uploaded files/media
- [ ] Document recovery procedures

## ⚠️ Security Warnings Fixed

1. **Hardcoded Secret Key**: Removed from `.env.example`
2. **Missing Rate Limiting**: Added to authentication endpoints
3. **Insufficient Input Validation**: Enhanced for course creation
4. **Missing Security Headers**: Added comprehensive CSP and security headers
5. **File Upload Vulnerabilities**: Already secured in previous work

## 🔧 Additional Recommendations

### Environment Specific Settings
```bash
# Development
DEBUG=True
CORS_ALLOW_ALL_ORIGINS=True

# Production  
DEBUG=False
CORS_ALLOW_ALL_ORIGINS=False
```

### Redis for Production Caching
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 86400,
    }
}
```

### Nginx Configuration Example
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /path/to/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /path/to/media/;
        add_header X-Content-Type-Options nosniff;
    }
}
```

## 🧪 Testing Commands

```bash
# Test security settings
python manage.py check --deploy

# Run security-focused tests  
python manage.py test authentication.tests.SecurityTests

# Check for known vulnerabilities
pip install safety
safety check

# Validate SSL configuration
nmap --script ssl-enum-ciphers -p 443 yourdomain.com
```

## 📋 Post-Deployment Verification

- [ ] Verify HTTPS redirects work
- [ ] Test login/logout flows
- [ ] Verify file uploads work correctly
- [ ] Check all API endpoints respond correctly
- [ ] Test admin interface access
- [ ] Verify rate limiting is working
- [ ] Check error pages are not revealing sensitive info
- [ ] Test CORS settings with frontend
- [ ] Verify security headers are present