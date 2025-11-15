#!/usr/bin/env python3
"""
Test Google OAuth and database fetch issues
Diagnose and fix authentication and CORS problems
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = 'http://127.0.0.1:8000'

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint and return detailed results."""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        response = requests.request(
            method=method,
            url=url,
            json=data,
            headers=headers or {},
            timeout=10
        )
        
        result = {
            'endpoint': endpoint,
            'method': method,
            'status': response.status_code,
            'success': response.status_code < 400,
            'data': None,
            'error': None
        }
        
        try:
            result['data'] = response.json()
        except:
            result['data'] = response.text[:500] if response.text else None
            
        return result
        
    except Exception as e:
        return {
            'endpoint': endpoint,
            'method': method,
            'status': None,
            'success': False,
            'data': None,
            'error': str(e)
        }

def print_result(result):
    """Print test results with color coding."""
    status_icon = "✅" if result['success'] else "❌"
    print(f"{status_icon} {result['method']} {result['endpoint']} - Status: {result['status']}")
    
    if result['error']:
        print(f"   Error: {result['error']}")
    elif result['data']:
        if isinstance(result['data'], dict):
            if 'error' in result['data']:
                print(f"   API Error: {result['data']['error']}")
            else:
                print(f"   ✅ Response received")
        else:
            print(f"   Response: {str(result['data'])[:100]}...")
    print()

def main():
    print("🔍 Google Auth & Database Fetch Diagnostic")
    print("=" * 50)
    print(f"Testing against: {BASE_URL}")
    print()
    
    # Test 1: Server health
    print("1️⃣ Server Health Check")
    health = test_endpoint('GET', '/api/')
    print_result(health)
    
    if not health['success']:
        print("❌ Server not responding. Is Django running?")
        return
    
    # Test 2: CORS preflight
    print("2️⃣ CORS Preflight Test")
    cors_headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    cors_result = test_endpoint('OPTIONS', '/api/auth/login/', headers=cors_headers)
    print_result(cors_result)
    
    # Test 3: Google OAuth endpoints
    print("3️⃣ Google OAuth Endpoints")
    
    # Test Google auth URL generation
    google_url = test_endpoint('GET', '/api/auth/google/auth-url/')
    print_result(google_url)
    
    # Test Google token endpoint (without token - should return 400)
    google_token = test_endpoint('POST', '/api/auth/google/token/', {})
    print_result(google_token)
    
    # Test 4: Database listing endpoints
    print("4️⃣ Database Listing Endpoints")
    
    # Test school courses
    school_courses = test_endpoint('GET', '/api/courses/school/')
    print_result(school_courses)
    
    # Test engineering courses  
    eng_courses = test_endpoint('GET', '/api/courses/engineering/')
    print_result(eng_courses)
    
    # Test pro learning courses
    pro_courses = test_endpoint('GET', '/api/courses/pro-learning/')
    print_result(pro_courses)
    
    # Test 5: Authentication required endpoints
    print("5️⃣ Auth Required Endpoints (should return 401)")
    
    # Test enrollment status (requires auth)
    enrollment = test_endpoint('GET', '/api/courses/school/enrollment-status/1/')
    print_result(enrollment)
    
    # Test user profile (requires auth)
    profile = test_endpoint('GET', '/api/auth/profile/')
    print_result(profile)
    
    # Test 6: Admin endpoints
    print("6️⃣ Admin Endpoints")
    
    # Test admin login
    admin_login = test_endpoint('POST', '/api/auth/admin-login/', {
        'email': 'admin@example.com',
        'password': 'admin123'
    })
    print_result(admin_login)
    
    print("📋 DIAGNOSIS SUMMARY")
    print("=" * 50)
    
    if not health['success']:
        print("🚨 CRITICAL: Django server not running")
        print("   Fix: cd backend && python manage.py runserver 127.0.0.1:8000")
    
    if not cors_result['success']:
        print("🚨 CORS Issue: Frontend can't communicate with backend")
        print("   Fix: Check CORS_ALLOWED_ORIGINS in settings.py")
    
    if google_url['status'] == 500:
        print("🚨 Google OAuth not configured")
        print("   Fix: Set GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET in .env")
    
    if not school_courses['success']:
        print("🚨 Database connection issue")
        print("   Fix: Check database settings in .env")
    
    print("\n✅ Diagnostic complete!")

if __name__ == '__main__':
    main()