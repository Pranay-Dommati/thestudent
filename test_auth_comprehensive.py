#!/usr/bin/env python3
"""
Comprehensive authentication test script to identify and fix auth issues.
Tests all major auth endpoints and flows.
"""

import requests
import json
import sys
import os
from datetime import datetime

BASE_URL = 'http://127.0.0.1:8000'

def test_endpoint(method, endpoint, data=None, headers=None, expected_status=None):
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
            'success': True,
            'data': None,
            'error': None
        }
        
        try:
            result['data'] = response.json()
        except:
            result['data'] = response.text[:500] if response.text else None
            
        if expected_status and response.status_code != expected_status:
            result['success'] = False
            result['error'] = f"Expected {expected_status}, got {response.status_code}"
            
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

def print_test_result(result):
    """Pretty print test results."""
    status_icon = "✅" if result['success'] and result.get('status') in [200, 201] else "❌"
    print(f"{status_icon} {result['method']} {result['endpoint']} - Status: {result['status']}")
    
    if result['error']:
        print(f"   Error: {result['error']}")
    elif result['data']:
        if isinstance(result['data'], dict):
            if 'error' in result['data']:
                print(f"   API Error: {result['data']['error']}")
            elif 'message' in result['data']:
                print(f"   Message: {result['data']['message']}")
            elif 'tokens' in result['data']:
                print(f"   ✅ JWT Tokens received")
            elif 'user' in result['data']:
                user = result['data']['user']
                print(f"   User: {user.get('email', 'N/A')} (Superuser: {user.get('is_superuser', False)})")
        else:
            print(f"   Response: {str(result['data'])[:100]}...")
    print()

def main():
    print("🔍 EasyLearnova Authentication System Test")
    print("=" * 50)
    print(f"Testing against: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Check if server is responding
    print("1️⃣ Server Health Check")
    health_result = test_endpoint('GET', '/api/', expected_status=200)
    print_test_result(health_result)
    
    if not health_result['success']:
        print("❌ Server is not responding. Please ensure Django server is running.")
        return
    
    # Test 2: Test registration endpoint
    print("2️⃣ User Registration Test")
    test_user = {
        'email': 'test@example.com',
        'password': 'TestPass123!',
        'confirm_password': 'TestPass123!',
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    register_result = test_endpoint('POST', '/api/auth/register/', test_user)
    print_test_result(register_result)
    
    # Test 3: Test login endpoint
    print("3️⃣ User Login Test")
    login_data = {
        'email': 'test@example.com',
        'password': 'TestPass123!'
    }
    
    login_result = test_endpoint('POST', '/api/auth/login/', login_data)
    print_test_result(login_result)
    
    # Extract tokens if login was successful
    access_token = None
    refresh_token = None
    if login_result['success'] and login_result['data']:
        if isinstance(login_result['data'], dict):
            access_token = login_result['data'].get('access')
            refresh_token = login_result['data'].get('refresh')
    
    # Test 4: Test token refresh
    print("4️⃣ Token Refresh Test")
    if refresh_token:
        refresh_result = test_endpoint(
            'POST', 
            '/api/auth/token/refresh/', 
            {'refresh': refresh_token}
        )
        print_test_result(refresh_result)
        
        # Update access token if refresh was successful
        if refresh_result['success'] and refresh_result['data']:
            new_token = refresh_result['data'].get('access')
            if new_token:
                access_token = new_token
    else:
        print("❌ No refresh token available from login")
        print()
    
    # Test 5: Test authenticated endpoint (user profile)
    print("5️⃣ Authenticated Endpoint Test (User Profile)")
    if access_token:
        headers = {'Authorization': f'Bearer {access_token}'}
        profile_result = test_endpoint('GET', '/api/auth/profile/', headers=headers)
        print_test_result(profile_result)
    else:
        print("❌ No access token available")
        print()
    
    # Test 6: Test admin login
    print("6️⃣ Admin Login Test")
    # Try common admin credentials
    admin_creds = [
        {'email': 'admin@example.com', 'password': 'admin123'},
        {'email': 'admin@admin.com', 'password': 'admin'},
        {'email': 'superuser@example.com', 'password': 'superuser123'},
    ]
    
    admin_token = None
    for cred in admin_creds:
        admin_result = test_endpoint('POST', '/api/auth/admin-login/', cred)
        print(f"   Trying {cred['email']}...")
        print_test_result(admin_result)
        
        if admin_result['success'] and admin_result['data'] and 'tokens' in admin_result['data']:
            admin_token = admin_result['data']['tokens']['access']
            break
    
    # Test 7: Test admin verification
    print("7️⃣ Admin Token Verification Test")
    if admin_token:
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        verify_result = test_endpoint('GET', '/api/auth/verify-admin/', headers=admin_headers)
        print_test_result(verify_result)
    else:
        print("❌ No admin token available - create superuser first")
        print("   Run: python manage.py createsuperuser")
        print()
    
    # Test 8: Test course enrollment endpoints (the original issue)
    print("8️⃣ Course Enrollment Endpoints Test")
    
    # Test enrollment status (requires auth)
    if access_token:
        headers = {'Authorization': f'Bearer {access_token}'}
        enrollment_result = test_endpoint(
            'GET', 
            '/api/courses/school/enrollment-status/1/', 
            headers=headers
        )
        print_test_result(enrollment_result)
        
        # Test start course
        start_result = test_endpoint(
            'POST', 
            '/api/courses/school/start-predefined-course/1/', 
            headers=headers
        )
        print_test_result(start_result)
    else:
        print("❌ No access token for enrollment test")
        print()
    
    # Test 9: CORS and headers test
    print("9️⃣ CORS and Headers Test")
    cors_headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    cors_result = test_endpoint('OPTIONS', '/api/auth/login/', headers=cors_headers)
    print_test_result(cors_result)
    
    # Summary
    print("📊 SUMMARY & RECOMMENDATIONS")
    print("=" * 50)
    
    if not health_result['success']:
        print("🚨 CRITICAL: Django server is not running or not accessible")
        print("   → Run: python manage.py runserver 0.0.0.0:8000")
        
    if register_result['status'] == 400:
        print("⚠️  Registration may have validation issues")
        print("   → Check serializer validation and required fields")
        
    if login_result['status'] == 401:
        print("⚠️  Login failing - check credentials or user activation")
        print("   → Ensure test user exists and is active")
        
    if not access_token:
        print("🚨 CRITICAL: JWT token generation/retrieval failing")
        print("   → Check SIMPLE_JWT settings and token serialization")
        
    if not admin_token:
        print("⚠️  No admin access available")
        print("   → Create superuser: python manage.py createsuperuser")
        
    print("\n✅ Test completed. Check results above for specific issues.")

if __name__ == '__main__':
    main()