"""
Real-world test: Create topics with each user and verify isolation
"""

import requests
import json

API_BASE = 'http://localhost:8000/api'

def test_topic_creation_isolation():
    print("🧪 TESTING TOPIC CREATION ISOLATION")
    print("=" * 50)
    
    # Login both users
    users = [
        {"email": "nagaraj@gmail.com", "password": "nagaraj"},
        {"email": "bannyd@gmail.com", "password": "bannyddd"}
    ]
    
    user_tokens = {}
    
    # Step 1: Login both users
    for user in users:
        response = requests.post(f"{API_BASE}/auth/login/", json=user)
        if response.status_code == 200:
            data = response.json()
            user_tokens[user['email']] = data['access']
            print(f"✅ {user['email']} logged in (ID: {data['user']['id']})")
    
    if len(user_tokens) != 2:
        print("❌ Could not login both users")
        return
    
    # Step 2: User 1 creates some topics
    print(f"\n📝 User 1 (nagaraj@gmail.com) creating topics...")
    
    headers = {'Authorization': f'Bearer {user_tokens["nagaraj@gmail.com"]}'}
    response = requests.post(f"{API_BASE}/../ai/topics/", 
                           headers=headers,
                           json={"query": "Create course on Python programming basics and advanced concepts"})
    
    if response.status_code == 200:
        data = response.json()
        topic_count = len(data.get('topics', []))
        print(f"✅ User 1 created {topic_count} topics")
        if 'usage_stats' in data:
            stats = data['usage_stats']
            print(f"📊 User 1 usage: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)}")
    else:
        print(f"❌ User 1 topic creation failed: {response.status_code}")
        print(response.text[:200])
    
    # Step 3: Check User 2's rate limits (should still be 0)
    print(f"\n🔍 Checking User 2 (bannyd@gmail.com) rate limits...")
    
    headers = {'Authorization': f'Bearer {user_tokens["bannyd@gmail.com"]}'}
    response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        stats = data['rate_limit_info']
        print(f"📊 User 2 usage: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)}")
        
        if stats.get('daily_used', 0) == 0:
            print("✅ PERFECT! User 2's rate limits are independent - showing 0 usage")
        else:
            print(f"❌ BUG CONFIRMED! User 2 shows {stats.get('daily_used', 0)} usage when it should be 0")
    else:
        print(f"❌ User 2 rate limit check failed: {response.status_code}")
    
    # Step 4: User 2 creates topics to verify independence
    print(f"\n📝 User 2 (bannyd@gmail.com) creating topics...")
    
    headers = {'Authorization': f'Bearer {user_tokens["bannyd@gmail.com"]}'}
    response = requests.post(f"{API_BASE}/../ai/topics/", 
                           headers=headers,
                           json={"query": "Create course on JavaScript fundamentals"})
    
    if response.status_code == 200:
        data = response.json()
        topic_count = len(data.get('topics', []))
        print(f"✅ User 2 created {topic_count} topics")
        if 'usage_stats' in data:
            stats = data['usage_stats']
            print(f"📊 User 2 usage: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)}")
    else:
        print(f"❌ User 2 topic creation failed: {response.status_code}")
        print(response.text[:200])
    
    # Step 5: Final verification - check both users
    print(f"\n🔍 FINAL VERIFICATION:")
    
    for email, token in user_tokens.items():
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            stats = data['rate_limit_info']
            print(f"📊 {email}: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)} topics used")
        else:
            print(f"❌ {email}: Rate limit check failed")
    
    print(f"\n🎯 CONCLUSION:")
    print(f"If both users show different usage counts, rate limiting is working correctly!")
    print(f"If both users show the same usage counts, there's a backend bug.")

if __name__ == "__main__":
    test_topic_creation_isolation()
