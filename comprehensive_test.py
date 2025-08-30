"""
Comprehensive test to investigate ALL possible causes of shared rate limits
This will check for session bleeding, IP-based rate limiting, and other issues
"""

import requests
import json

API_BASE = 'http://localhost:8000/api'

def comprehensive_rate_limit_investigation():
    print("🔬 COMPREHENSIVE RATE LIMIT INVESTIGATION")
    print("=" * 60)
    print("Testing for ALL possible causes of shared rate limits")
    
    # Your exact credentials
    users = [
        {"email": "nagaraj@gmail.com", "password": "nagaraj", "name": "nagaraj (Edge)"},
        {"email": "bannyd@gmail.com", "password": "bannyddd", "name": "bannyd (Chrome)"}
    ]
    
    user_tokens = {}
    
    # Step 1: Test anonymous rate limiting first
    print(f"\n🔍 STEP 1: Testing anonymous (unauthenticated) rate limiting...")
    
    # Test anonymous rate limit status
    anon_response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/")
    if anon_response.status_code == 200:
        anon_stats = anon_response.json()['rate_limit_info']
        print(f"📊 Anonymous user: {anon_stats.get('daily_used', 0)}/{anon_stats.get('daily_limit', 16)} topics used")
    else:
        print(f"❌ Anonymous rate limit check failed: {anon_response.status_code}")
    
    # Step 2: Login both users
    print(f"\n🔐 STEP 2: Logging in both users...")
    for user in users:
        response = requests.post(f"{API_BASE}/auth/login/", json=user)
        if response.status_code == 200:
            data = response.json()
            user_tokens[user['name']] = {
                'token': data['access'],
                'user_id': data['user']['id'],
                'email': user['email']
            }
            print(f"✅ {user['name']} logged in (ID: {data['user']['id']})")
        else:
            print(f"❌ {user['name']} login failed: {response.text}")
            return
    
    # Step 3: Check if authentication is working properly
    print(f"\n🔍 STEP 3: Verifying authentication isolation...")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        
        # Check profile endpoint
        profile_response = requests.get(f"{API_BASE}/auth/profile/", headers=headers)
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print(f"👤 {name}: Profile verified - ID: {profile_data['id']}, Email: {profile_data['email']}")
        else:
            print(f"❌ {name}: Profile verification failed")
    
    # Step 4: Check rate limit fallback behavior
    print(f"\n🔍 STEP 4: Testing rate limit fallback mechanisms...")
    
    for name, user_data in user_tokens.items():
        print(f"\n--- {name} DEBUGGING ---")
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        
        # Get debug info
        debug_response = requests.get(f"{API_BASE}/../ai/debug-rate-limit-cache/", headers=headers)
        if debug_response.status_code == 200:
            debug_data = debug_response.json()['debug_info']
            req_info = debug_data['request_info']
            
            print(f"🔑 Authentication Status: {req_info['user_authenticated']}")
            print(f"👤 User ID: {req_info['user_id']}")
            print(f"📧 Email: {req_info['user_email']}")
            print(f"🌐 IP Address: {req_info['user_ip']}")
            print(f"🔑 Cache Key: {req_info['cache_key']}")
            
            # Check if falling back to IP-based rate limiting
            if 'ip_' in req_info['cache_key']:
                print(f"⚠️  WARNING: Using IP-based rate limiting instead of user-based!")
            elif 'user_' in req_info['cache_key']:
                print(f"✅ Using user-based rate limiting (correct)")
        else:
            print(f"❌ Debug failed for {name}")
    
    # Step 5: Test the specific issue - create topics and monitor
    print(f"\n🧪 STEP 5: Testing cross-browser rate limit behavior...")
    
    nagaraj_name = "nagaraj (Edge)"
    bannyd_name = "bannyd (Chrome)"
    
    # Initial state
    print(f"\n📊 INITIAL STATE:")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        if response.status_code == 200:
            stats = response.json()['rate_limit_info']
            print(f"   {name}: {stats.get('daily_used', 0)}/16 topics")
    
    # nagaraj creates ONE topic
    print(f"\n🚀 {nagaraj_name} creates ONE topic...")
    nagaraj_headers = {'Authorization': f'Bearer {user_tokens[nagaraj_name]["token"]}'}
    
    # Use a simple query to create exactly 1 topic
    create_response = requests.post(f"{API_BASE}/../ai/create-course-topics/", 
                                  headers=nagaraj_headers,
                                  json={"topics": [{"id": 1, "name": "Test Topic", "isActive": True}]})
    
    if create_response.status_code == 200:
        create_data = create_response.json()
        if 'usage_stats' in create_data:
            stats = create_data['usage_stats']
            print(f"✅ {nagaraj_name} created 1 topic: {stats.get('daily_used', 0)}/16")
        else:
            print(f"✅ {nagaraj_name} created topic successfully")
    elif create_response.status_code == 429:
        print(f"⚠️  {nagaraj_name} hit rate limit: {create_response.json().get('message', 'Rate limited')}")
    else:
        print(f"❌ {nagaraj_name} topic creation failed: {create_response.status_code}")
        print(create_response.text[:300])
    
    # Immediately check bannyd's status
    print(f"\n📊 IMMEDIATELY AFTER {nagaraj_name}'s action:")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        if response.status_code == 200:
            stats = response.json()['rate_limit_info']
            usage = stats.get('daily_used', 0)
            print(f"   {name}: {usage}/16 topics")
            
            # Flag potential issues
            if name == bannyd_name and usage > 0:
                print(f"   🚨 POTENTIAL BUG: {bannyd_name} shows {usage} usage after {nagaraj_name}'s action!")
        else:
            print(f"   ❌ {name}: Status check failed")
    
    # Step 6: Test IP-based rate limiting theory
    print(f"\n🔍 STEP 6: Testing IP-based rate limiting theory...")
    
    # Test with no auth headers (should fall back to IP)
    print(f"\nTesting anonymous rate limit after authenticated user activity...")
    anon_response_after = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/")
    if anon_response_after.status_code == 200:
        anon_stats_after = anon_response_after.json()['rate_limit_info']
        anon_usage_after = anon_stats_after.get('daily_used', 0)
        print(f"📊 Anonymous user after auth activity: {anon_usage_after}/16 topics")
        
        if anon_usage_after > 0:
            print(f"🚨 POSSIBLE ISSUE: Anonymous shows {anon_usage_after} usage - could indicate IP-based rate limiting interference")
    
    # Step 7: Test with invalid tokens
    print(f"\n🔍 STEP 7: Testing with invalid authentication...")
    
    invalid_headers = {'Authorization': 'Bearer invalid_token_12345'}
    invalid_response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=invalid_headers)
    if invalid_response.status_code == 200:
        invalid_stats = invalid_response.json()['rate_limit_info']
        invalid_usage = invalid_stats.get('daily_used', 0)
        print(f"📊 Invalid token user: {invalid_usage}/16 topics")
        
        if invalid_usage > 0:
            print(f"🚨 CRITICAL: Invalid token shows {invalid_usage} usage - indicates IP-based fallback is being used!")
    
    print(f"\n🎯 INVESTIGATION SUMMARY:")
    print(f"1. If both users show the same usage → Backend bug in user isolation")
    print(f"2. If anonymous/invalid tokens show usage → IP-based rate limiting interference")
    print(f"3. If cache keys use 'ip_' instead of 'user_' → Authentication failure")
    print(f"4. If different browsers still share limits → Check for proxy/network issues")

if __name__ == "__main__":
    comprehensive_rate_limit_investigation()
