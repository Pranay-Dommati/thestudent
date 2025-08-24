#!/usr/bin/env python3
"""
Debug Google OAuth Configuration
This script helps verify your Google OAuth setup is correct.
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import django
    django.setup()
    from django.conf import settings
    
    print("🔍 Google OAuth Configuration Debug")
    print("=" * 50)
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    client_id = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID', 'NOT SET')
    client_secret = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET', 'NOT SET')
    
    print(f"GOOGLE_OAUTH2_CLIENT_ID: {client_id[:20]}...")
    print(f"GOOGLE_OAUTH2_CLIENT_SECRET: {'SET' if client_secret != 'NOT SET' else 'NOT SET'}")
    
    # Check Django settings
    print("\n⚙️ Django Settings:")
    print(f"SOCIAL_AUTH_GOOGLE_OAUTH2_KEY: {getattr(settings, 'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY', 'NOT SET')[:20]}...")
    print(f"SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET: {'SET' if getattr(settings, 'SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET', '') else 'NOT SET'}")
    print(f"SOCIAL_AUTH_LOGIN_REDIRECT_URL: {getattr(settings, 'SOCIAL_AUTH_LOGIN_REDIRECT_URL', 'NOT SET')}")
    
    # Check CORS settings
    print("\n🌐 CORS Settings:")
    print(f"CORS_ALLOW_ALL_ORIGINS: {getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)}")
    print(f"CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', [])}")
    
    # Check if we're in DEBUG mode
    print(f"\n🐛 DEBUG Mode: {settings.DEBUG}")
    
    print("\n✅ Configuration looks good!")
    print("\n📋 Next Steps:")
    print("1. Make sure your Google Cloud Console has these settings:")
    print("   Authorized JavaScript origins:")
    print("   - http://localhost:5175")
    print("   - http://localhost:5173")
    print("   - http://127.0.0.1:5175")
    print("   - http://127.0.0.1:5173")
    print("\n   Authorized redirect URIs:")
    print("   - http://localhost:8000/api/auth/google/callback/")
    print("   - http://127.0.0.1:8000/api/auth/google/callback/")
    
    print("\n2. Your frontend should be running on: http://localhost:5175")
    print("3. Your backend should be running on: http://localhost:8000")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure you're running this from the project root directory.")
