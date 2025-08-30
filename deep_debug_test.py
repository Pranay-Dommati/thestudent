"""
Deep debug test to check cache keys and detect any rate limit bleeding
"""

import requests
import json
import time

API_BASE = 'http://localhost:8000/api'

def deep_debug_rate_limits():
    print("🔍 DEEP DEBUG: Rate Limit Cache Investigation")
    print("=" * 60)
    
    # Your exact credentials
    users = [
        {"email": "nagaraj@gmail.com", "password": "nagaraj", "name": "nagaraj"},
        {"email": "bannyd@gmail.com", "password": "bannyddd", "name": "bannyd"}
    ]
    
    user_tokens = {}
    
    # Step 1: Login both users
    print("🔐 Logging in both users...")
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
            print(f"❌ {user['name']} login failed")
            return
    
    # Step 2: Get detailed debug info for both users
    print(f"\n🔧 Getting detailed debug information...")
    for name, user_data in user_tokens.items():
        print(f"\n--- {name.upper()} DEBUG INFO ---")
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        
        response = requests.get(f"{API_BASE}/../ai/debug-rate-limit-cache/", headers=headers)
        if response.status_code == 200:
            debug_data = response.json()['debug_info']
            req_info = debug_data['request_info']
            cache_info = debug_data['cache_info']
            
            print(f"👤 User ID: {req_info['user_id']}")
            print(f"📧 Email: {req_info['user_email']}")
            print(f"🌐 IP: {req_info['user_ip']}")
            print(f"🔑 Cache Key: {req_info['cache_key']}")
            print(f"💾 Cache Exists: {cache_info['cache_key_exists']}")
            print(f"📦 Cache Data: {cache_info['cache_data']}")
        else:
            print(f"❌ Debug failed for {name}")
    
    # Step 3: nagaraj creates topics and we monitor both caches
    print(f"\n🧪 STEP 3: nagaraj creates topics, monitoring both caches...")
    
    nagaraj_headers = {'Authorization': f'Bearer {user_tokens["nagaraj"]["token"]}'}
    
    # Before creation - check both caches
    print(f"\n📊 BEFORE nagaraj creates topics:")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        if response.status_code == 200:
            stats = response.json()['rate_limit_info']
            print(f"   {name}: {stats.get('daily_used', 0)}/16 topics")
    
    # nagaraj creates topics
    print(f"\n🚀 nagaraj creating topics...")
    classify_response = requests.post(f"{API_BASE}/../ai/classify-topics/", 
                                    headers=nagaraj_headers,
                                    json={"query": "Learn Python and machine learning algorithms"})
    
    if classify_response.status_code == 200:
        topics = classify_response.json().get('topics', [])
        print(f"✅ nagaraj classified {len(topics)} topics")
        
        if topics:
            # Create course with topics
            create_response = requests.post(f"{API_BASE}/../ai/create-course-topics/", 
                                          headers=nagaraj_headers,
                                          json={"topics": topics})
            
            if create_response.status_code == 200:
                print(f"✅ nagaraj created course successfully")
            else:
                print(f"❌ nagaraj course creation failed: {create_response.status_code}")
                print(create_response.text[:200])
    
    # After creation - check both caches immediately
    print(f"\n📊 IMMEDIATELY AFTER nagaraj creates topics:")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        if response.status_code == 200:
            stats = response.json()['rate_limit_info']
            usage = stats.get('daily_used', 0)
            print(f"   {name}: {usage}/16 topics")
            
            if name == "bannyd" and usage > 0:
                print(f"   🚨 BUG DETECTED! bannyd shows {usage} usage after nagaraj's action!")
    
    # Step 4: Get cache debug info again
    print(f"\n🔧 CACHE DEBUG AFTER nagaraj's action:")
    for name, user_data in user_tokens.items():
        print(f"\n--- {name.upper()} CACHE AFTER ---")
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        
        response = requests.get(f"{API_BASE}/../ai/debug-rate-limit-cache/", headers=headers)
        if response.status_code == 200:
            debug_data = response.json()['debug_info']
            cache_info = debug_data['cache_info']
            
            print(f"💾 Cache Exists: {cache_info['cache_key_exists']}")
            print(f"📦 Cache Data: {cache_info['cache_data']}")
    
    # Step 5: bannyd creates topics
    print(f"\n🧪 STEP 5: bannyd creates topics...")
    
    bannyd_headers = {'Authorization': f'Bearer {user_tokens["bannyd"]["token"]}'}
    
    classify_response = requests.post(f"{API_BASE}/../ai/classify-topics/", 
                                    headers=bannyd_headers,
                                    json={"query": "Learn JavaScript and React development"})
    
    if classify_response.status_code == 200:
        topics = classify_response.json().get('topics', [])
        print(f"✅ bannyd classified {len(topics)} topics")
        
        if topics:
            create_response = requests.post(f"{API_BASE}/../ai/create-course-topics/", 
                                          headers=bannyd_headers,
                                          json={"topics": topics})
            
            if create_response.status_code == 200:
                print(f"✅ bannyd created course successfully")
            else:
                print(f"❌ bannyd course creation failed: {create_response.status_code}")
    
    # Final check
    print(f"\n📊 FINAL RATE LIMIT STATUS:")
    for name, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        if response.status_code == 200:
            stats = response.json()['rate_limit_info']
            print(f"   {name}: {stats.get('daily_used', 0)}/16 topics")

if __name__ == "__main__":
    deep_debug_rate_limits()
