#!/usr/bin/env python3
"""
Simple script to test CSRF configuration and create admin user if needed
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model

def check_csrf_settings():
    """Check current CSRF settings"""
    print("🔍 Current CSRF Settings:")
    print(f"   DEBUG = {settings.DEBUG}")
    print(f"   CSRF_COOKIE_SECURE = {settings.CSRF_COOKIE_SECURE}")
    print(f"   CSRF_COOKIE_HTTPONLY = {settings.CSRF_COOKIE_HTTPONLY}")
    print(f"   CSRF_COOKIE_SAMESITE = {settings.CSRF_COOKIE_SAMESITE}")
    print(f"   SESSION_COOKIE_SECURE = {settings.SESSION_COOKIE_SECURE}")
    print(f"   SESSION_COOKIE_HTTPONLY = {settings.SESSION_COOKIE_HTTPONLY}")
    print(f"   SESSION_COOKIE_SAMESITE = {settings.SESSION_COOKIE_SAMESITE}")
    print(f"   ALLOWED_HOSTS = {settings.ALLOWED_HOSTS}")
    
    print(f"\n📋 CSRF Middleware enabled: {'django.middleware.csrf.CsrfViewMiddleware' in settings.MIDDLEWARE}")

def create_admin_user():
    """Create admin user if it doesn't exist"""
    User = get_user_model()
    
    try:
        admin_user = User.objects.get(username='admin')
        print(f"✅ Admin user already exists: {admin_user.username}")
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Created admin user: {admin_user.username}")
        print(f"   Password: admin123")
    
    return admin_user

if __name__ == "__main__":
    print("🚀 Django Configuration Check\n")
    
    check_csrf_settings()
    print()
    create_admin_user()
    
    print(f"\n💡 Recommendations:")
    if settings.DEBUG:
        print("   - You're in DEBUG mode, CSRF should be relaxed")
        print("   - Try accessing: http://127.0.0.1:8000/admin/")
        print("   - Login with: admin / admin123")
    else:
        print("   - You're in PRODUCTION mode, CSRF is strict")
        print("   - Make sure you're using HTTPS in production")