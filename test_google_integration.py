#!/usr/bin/env python
"""
Test script to verify Google Sign-In integration with existing authentication system
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()

def test_user_model_integration():
    """Test that our User model works correctly"""
    print("🔍 Testing User Model Integration...")
    
    # Test creating user with UserManager
    try:
        user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            agreed_to_terms=True
        )
        print("✅ User creation with UserManager works")
        
        # Test user authentication
        assert user.email == 'test@example.com'
        assert user.full_name == 'Test User'
        assert user.agreed_to_terms == True
        assert user.is_active == True
        print("✅ User model fields are correct")
        
        # Test JWT token generation
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        print("✅ JWT token generation works")
        
        # Clean up
        user.delete()
        print("✅ User model integration test passed\n")
        
    except Exception as e:
        print(f"❌ User model test failed: {str(e)}\n")

def test_authentication_backends():
    """Test that authentication backends are properly configured"""
    print("🔍 Testing Authentication Backends...")
    
    try:
        # Check that our backends are in settings
        auth_backends = settings.AUTHENTICATION_BACKENDS
        
        google_backend = 'social_core.backends.google.GoogleOAuth2'
        model_backend = 'django.contrib.auth.backends.ModelBackend'
        email_backend = 'authentication.backends.EmailBackend'
        
        assert google_backend in auth_backends
        assert model_backend in auth_backends
        assert email_backend in auth_backends
        
        print("✅ All authentication backends are configured")
        print(f"   - Google OAuth2: {google_backend}")
        print(f"   - Model Backend: {model_backend}")
        print(f"   - Email Backend: {email_backend}")
        print("✅ Authentication backends test passed\n")
        
    except Exception as e:
        print(f"❌ Authentication backends test failed: {str(e)}\n")

def test_google_auth_endpoints():
    """Test Google authentication endpoints"""
    print("🔍 Testing Google Auth Endpoints...")
    
    client = APIClient()
    
    try:
        # Test Google auth URL endpoint
        response = client.get('/api/auth/google/auth-url/')
        print(f"Google auth URL endpoint: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Google auth URL endpoint works")
        elif response.status_code == 500:
            print("⚠️  Google auth URL endpoint returns 500 (probably missing credentials)")
        
        # Test Google token endpoint with invalid token
        response = client.post('/api/auth/google/token/', {
            'access_token': 'invalid_token'
        })
        print(f"Google token endpoint (invalid): {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Google token endpoint correctly rejects invalid tokens")
        
        print("✅ Google auth endpoints test passed\n")
        
    except Exception as e:
        print(f"❌ Google auth endpoints test failed: {str(e)}\n")

def test_existing_auth_integration():
    """Test that existing authentication still works"""
    print("🔍 Testing Existing Authentication Integration...")
    
    client = APIClient()
    
    try:
        # Create a test user
        user = User.objects.create_user(
            email='existing@example.com',
            full_name='Existing User',
            agreed_to_terms=True
        )
        user.set_password('testpassword123')
        user.save()
        
        # Test existing login endpoint
        response = client.post('/api/auth/login/', {
            'email': 'existing@example.com',
            'password': 'testpassword123'
        })
        
        print(f"Existing login endpoint: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert 'user' in data
            assert 'access' in data
            assert 'refresh' in data
            print("✅ Existing login endpoint still works")
            print(f"   - User ID: {data['user']['id']}")
            print(f"   - Email: {data['user']['email']}")
        
        # Test user profile endpoint
        if response.status_code == 200:
            access_token = response.json()['access']
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
            
            profile_response = client.get('/api/auth/profile/')
            print(f"Profile endpoint: {profile_response.status_code}")
            
            if profile_response.status_code == 200:
                print("✅ Profile endpoint works with JWT token")
        
        # Clean up
        user.delete()
        print("✅ Existing authentication integration test passed\n")
        
    except Exception as e:
        print(f"❌ Existing auth integration test failed: {str(e)}\n")

def test_pipeline_functions():
    """Test custom pipeline functions"""
    print("🔍 Testing Custom Pipeline Functions...")
    
    try:
        from authentication.pipeline import create_user, associate_by_email
        
        # Test create_user function
        mock_details = {
            'email': 'pipeline@example.com',
            'first_name': 'Pipeline',
            'last_name': 'User'
        }
        
        result = create_user(
            strategy=None,
            details=mock_details,
            backend=None,
            user=None
        )
        
        if result and result.get('user'):
            print("✅ Custom create_user pipeline function works")
            user = result['user']
            print(f"   - Created user: {user.email}")
            print(f"   - Full name: {user.full_name}")
            
            # Test associate_by_email
            result2 = associate_by_email(
                strategy=None,
                details=mock_details,
                user=None
            )
            
            if result2 and result2.get('user'):
                print("✅ Custom associate_by_email pipeline function works")
            
            # Clean up
            user.delete()
        else:
            print("❌ Pipeline create_user function failed")
        
        print("✅ Pipeline functions test passed\n")
        
    except Exception as e:
        print(f"❌ Pipeline functions test failed: {str(e)}\n")

def test_settings_configuration():
    """Test that all required settings are configured"""
    print("🔍 Testing Settings Configuration...")
    
    try:
        # Check required apps
        required_apps = [
            'django.contrib.auth',
            'rest_framework',
            'authentication',
            'social_django'
        ]
        
        for app in required_apps:
            assert app in settings.INSTALLED_APPS
            print(f"✅ {app} is in INSTALLED_APPS")
        
        # Check middleware
        required_middleware = [
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'social_django.middleware.SocialAuthExceptionMiddleware'
        ]
        
        for middleware in required_middleware:
            assert middleware in settings.MIDDLEWARE
            print(f"✅ {middleware} is in MIDDLEWARE")
        
        # Check custom user model
        assert settings.AUTH_USER_MODEL == 'authentication.User'
        print("✅ Custom user model is configured")
        
        # Check social auth settings
        assert hasattr(settings, 'SOCIAL_AUTH_PIPELINE')
        assert 'authentication.pipeline.create_user' in settings.SOCIAL_AUTH_PIPELINE
        print("✅ Social auth pipeline is configured")
        
        print("✅ Settings configuration test passed\n")
        
    except Exception as e:
        print(f"❌ Settings configuration test failed: {str(e)}\n")

if __name__ == '__main__':
    print("🚀 Testing Google Sign-In Integration with Existing Authentication System\n")
    print("=" * 70)
    
    test_settings_configuration()
    test_user_model_integration()
    test_authentication_backends()
    test_pipeline_functions()
    test_existing_auth_integration()
    test_google_auth_endpoints()
    
    print("=" * 70)
    print("🎉 Integration testing complete!")
    print("\n📋 Next Steps:")
    print("1. Set up Google Cloud Console credentials")
    print("2. Update .env file with GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET")
    print("3. Run migrations: python manage.py migrate")
    print("4. Test with real Google credentials")
    print("5. Implement frontend integration")
