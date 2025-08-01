#!/usr/bin/env python
"""
Quick test script to verify Google OAuth2 integration
"""

import requests
import json

# Test endpoints
BASE_URL = 'http://localhost:8000'

def test_google_auth_url():
    """Test getting Google auth URL"""
    print("🔍 Testing Google Auth URL endpoint...")
    try:
        response = requests.get(f'{BASE_URL}/api/auth/google/auth-url/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Auth URL generated: {data.get('auth_url', '')[:100]}...")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_existing_endpoints():
    """Test that existing endpoints still work"""
    print("\n🔍 Testing existing authentication endpoints...")
    
    # Test login endpoint
    response = requests.post(f'{BASE_URL}/api/auth/login/', json={
        'email': 'nonexistent@example.com',
        'password': 'wrongpassword'
    })
    print(f"Login endpoint status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Login endpoint working (correctly rejecting invalid credentials)")
    
    # Test register endpoint structure
    response = requests.post(f'{BASE_URL}/api/auth/register/', json={})
    print(f"Register endpoint status: {response.status_code}")
    if response.status_code == 400:
        print("✅ Register endpoint working (correctly rejecting empty data)")

def test_server_running():
    """Test if Django server is running"""
    print("🔍 Testing if Django server is running...")
    try:
        response = requests.get(f'{BASE_URL}/admin/')
        if response.status_code in [200, 301, 302, 403]:
            print("✅ Django server is running")
            return True
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not running: {str(e)}")
        print("Start the server with: cd backend && python manage.py runserver")
        return False

if __name__ == '__main__':
    print("🚀 Testing Google OAuth2 Integration\n")
    
    if test_server_running():
        test_google_auth_url()
        test_existing_endpoints()
    
    print("\n📋 Next Steps:")
    print("1. Set up Google Cloud Console OAuth2 credentials")
    print("2. Update .env file with your actual Client ID and Secret")
    print("3. Test with real Google authentication")
    print("4. Implement frontend integration")
