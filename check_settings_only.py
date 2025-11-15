#!/usr/bin/env python3
"""
Simple script to check Django CSRF settings without database dependency
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Import settings directly without full Django setup
try:
    from backend.settings import *
    
    print("🔍 Current Django CSRF Settings:")
    print(f"   DEBUG = {DEBUG}")
    print(f"   CSRF_COOKIE_SECURE = {globals().get('CSRF_COOKIE_SECURE', 'Not set')}")
    print(f"   CSRF_COOKIE_HTTPONLY = {globals().get('CSRF_COOKIE_HTTPONLY', 'Not set')}")
    print(f"   CSRF_COOKIE_SAMESITE = {globals().get('CSRF_COOKIE_SAMESITE', 'Not set')}")
    print(f"   SESSION_COOKIE_SECURE = {globals().get('SESSION_COOKIE_SECURE', 'Not set')}")
    print(f"   SESSION_COOKIE_HTTPONLY = {globals().get('SESSION_COOKIE_HTTPONLY', 'Not set')}")
    print(f"   SESSION_COOKIE_SAMESITE = {globals().get('SESSION_COOKIE_SAMESITE', 'Not set')}")
    
    print(f"\n📋 CSRF Middleware: {'django.middleware.csrf.CsrfViewMiddleware' in MIDDLEWARE}")
    print(f"📋 Allowed Hosts: {ALLOWED_HOSTS}")
    
    print(f"\n💡 Based on DEBUG={DEBUG}:")
    if DEBUG:
        print("   ✅ Should be development-friendly settings")
        print("   ✅ CSRF cookies should work over HTTP")
        print("   ✅ Try: http://127.0.0.1:8000/admin/")
    else:
        print("   🔒 Production settings active")
        print("   🔒 CSRF requires HTTPS")
        
except Exception as e:
    print(f"❌ Error loading settings: {e}")
    print("🔧 Try restarting the Django server to pick up new settings")