"""
Test script to verify if different users on localhost are properly isolated
"""

import requests
import json

API_BASE = 'http://localhost:8000/api'

def test_authentication_and_rate_limits():
    print("🧪 TESTING CROSS-BROWSER RATE LIMIT ISOLATION")
    print("=" * 50)
    
    # Test user credentials (using your exact credentials)
    users = [
        {"email": "nagaraj@gmail.com", "password": "nagaraj"},
        {"email": "bannyd@gmail.com", "password": "bannyddd"}
    ]
    
    user_tokens = {}
    
    # Step 1: Login both users and get tokens
    for i, user in enumerate(users):
        print(f"\n📝 Step {i+1}: Logging in {user['email']}")
        
        try:
            response = requests.post(f"{API_BASE}/auth/login/", json=user)
            
            if response.status_code == 200:
                data = response.json()
                user_tokens[user['email']] = data['access']
                print(f"✅ Login successful for {user['email']} (ID: {data['user']['id']})")
            else:
                print(f"❌ Login failed for {user['email']}: {response.text}")
                
        except Exception as e:
            print(f"❌ Login error for {user['email']}: {e}")
    
    # Step 2: Check rate limits for each user
    for email, token in user_tokens.items():
        print(f"\n🔍 Checking rate limits for {email}")
        
        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                rate_info = data['rate_limit_info']
                print(f"📊 Rate limits: {rate_info['daily_used']}/{rate_info['daily_limit']} used")
            else:
                print(f"❌ Rate limit check failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Rate limit check error: {e}")
    
    # Step 3: Check debug information for each user
    for email, token in user_tokens.items():
        print(f"\n🔧 Debug info for {email}")
        
        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{API_BASE}/../ai/debug-rate-limit-cache/", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                debug_info = data['debug_info']
                req_info = debug_info['request_info']
                cache_info = debug_info['cache_info']
                
                print(f"👤 User ID: {req_info['user_id']}")
                print(f"📧 User Email: {req_info['user_email']}")
                print(f"🔑 Cache Key: {req_info['cache_key']}")
                print(f"💾 Cache Exists: {cache_info['cache_key_exists']}")
                print(f"📦 Cache Data: {cache_info['cache_data']}")
                print(f"🔑 All Topic Keys: {cache_info['all_topic_cache_keys']}")
                
            else:
                print(f"❌ Debug check failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Debug check error: {e}")
    
    # Step 4: Analysis
    print(f"\n📋 ANALYSIS:")
    if len(user_tokens) >= 2:
        print("✅ Both users authenticated successfully")
        print("🔍 Check if cache keys are different for each user")
        print("⚠️  If cache keys are the same, there's a backend issue")
        print("💡 If users show the same rate limit usage, investigate further")
    else:
        print("❌ Could not authenticate both users - check credentials")

if __name__ == "__main__":
    test_authentication_and_rate_limits()
