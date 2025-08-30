"""
Test the exact chat workflow that you're experiencing the issue with
This mimics what happens when you use the chat page
"""

import requests
import json

API_BASE = 'http://localhost:8000/api'

def test_chat_rate_limiting():
    print("🧪 TESTING CHAT RATE LIMITING (Your Exact Issue)")
    print("=" * 60)
    
    # Your exact credentials
    users = [
        {"email": "nagaraj@gmail.com", "password": "nagaraj", "name": "User 1 (nagaraj)"},
        {"email": "bannyd@gmail.com", "password": "bannyddd", "name": "User 2 (bannyd)"}
    ]
    
    user_tokens = {}
    
    # Step 1: Login both users
    print("🔐 Step 1: Logging in both users...")
    for user in users:
        response = requests.post(f"{API_BASE}/auth/login/", json=user)
        if response.status_code == 200:
            data = response.json()
            user_tokens[user['email']] = {
                'token': data['access'],
                'user_id': data['user']['id'],
                'name': user['name']
            }
            print(f"✅ {user['name']} logged in successfully (ID: {data['user']['id']})")
        else:
            print(f"❌ {user['name']} login failed: {response.text}")
            return
    
    if len(user_tokens) != 2:
        print("❌ Could not login both users")
        return
    
    # Step 2: Check initial rate limits
    print(f"\n📊 Step 2: Checking initial rate limits...")
    for email, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            stats = data['rate_limit_info']
            print(f"📊 {user_data['name']}: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)} topics used")
        else:
            print(f"❌ {user_data['name']}: Rate limit check failed")
    
    # Step 3: User 1 creates topics via chat workflow
    user1_email = "nagaraj@gmail.com"
    user1_data = user_tokens[user1_email]
    
    print(f"\n🗨️  Step 3: {user1_data['name']} creates topics via chat...")
    
    # First, classify topics (this is what happens in chat)
    headers = {'Authorization': f'Bearer {user1_data["token"]}'}
    classify_response = requests.post(f"{API_BASE}/../ai/classify-topics/", 
                                    headers=headers,
                                    json={"query": "I want to learn Python programming and data structures"})
    
    if classify_response.status_code == 200:
        classify_data = classify_response.json()
        topics = classify_data.get('topics', [])
        print(f"✅ {user1_data['name']} classified {len(topics)} topics")
        
        # Now create course with these topics (this is what happens when user confirms)
        if topics:
            create_response = requests.post(f"{API_BASE}/../ai/create-course-topics/", 
                                          headers=headers,
                                          json={"topics": topics})
            
            if create_response.status_code == 200:
                create_data = create_response.json()
                if 'usage_stats' in create_data:
                    stats = create_data['usage_stats']
                    print(f"📊 {user1_data['name']} after creation: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)} topics used")
                else:
                    print(f"✅ {user1_data['name']} created course successfully")
            elif create_response.status_code == 429:
                print(f"⚠️  {user1_data['name']} hit rate limit: {create_response.json().get('message', 'Rate limited')}")
            else:
                print(f"❌ {user1_data['name']} course creation failed: {create_response.status_code}")
                print(create_response.text[:200])
    else:
        print(f"❌ {user1_data['name']} topic classification failed: {classify_response.status_code}")
        print(classify_response.text[:200])
    
    # Step 4: Check User 2's rate limits immediately after User 1's action
    user2_email = "bannyd@gmail.com"
    user2_data = user_tokens[user2_email]
    
    print(f"\n🔍 Step 4: Checking {user2_data['name']} rate limits after {user1_data['name']}'s action...")
    
    headers = {'Authorization': f'Bearer {user2_data["token"]}'}
    response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        stats = data['rate_limit_info']
        user2_usage = stats.get('daily_used', 0)
        print(f"📊 {user2_data['name']}: {user2_usage}/{stats.get('daily_limit', 16)} topics used")
        
        if user2_usage == 0:
            print(f"✅ EXCELLENT! {user2_data['name']}'s rate limits are independent")
        else:
            print(f"🚨 BUG CONFIRMED! {user2_data['name']} shows {user2_usage} usage after {user1_data['name']}'s action!")
            print(f"🔧 This indicates a rate limiting bug in the backend")
    else:
        print(f"❌ {user2_data['name']} rate limit check failed")
    
    # Step 5: User 2 creates topics to further verify
    print(f"\n🗨️  Step 5: {user2_data['name']} creates topics...")
    
    headers = {'Authorization': f'Bearer {user2_data["token"]}'}
    classify_response = requests.post(f"{API_BASE}/../ai/classify-topics/", 
                                    headers=headers,
                                    json={"query": "I want to learn JavaScript and web development"})
    
    if classify_response.status_code == 200:
        classify_data = classify_response.json()
        topics = classify_data.get('topics', [])
        print(f"✅ {user2_data['name']} classified {len(topics)} topics")
        
        if topics:
            create_response = requests.post(f"{API_BASE}/../ai/create-course-topics/", 
                                          headers=headers,
                                          json={"topics": topics})
            
            if create_response.status_code == 200:
                create_data = create_response.json()
                if 'usage_stats' in create_data:
                    stats = create_data['usage_stats']
                    print(f"📊 {user2_data['name']} after creation: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)} topics used")
            elif create_response.status_code == 429:
                print(f"⚠️  {user2_data['name']} hit rate limit: {create_response.json().get('message', 'Rate limited')}")
            else:
                print(f"❌ {user2_data['name']} course creation failed: {create_response.status_code}")
    
    # Step 6: Final comparison
    print(f"\n📊 Step 6: Final rate limit comparison...")
    for email, user_data in user_tokens.items():
        headers = {'Authorization': f'Bearer {user_data["token"]}'}
        response = requests.get(f"{API_BASE}/../ai/get-topic-rate-limit-status/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            stats = data['rate_limit_info']
            print(f"📊 {user_data['name']}: {stats.get('daily_used', 0)}/{stats.get('daily_limit', 16)} topics used")
        else:
            print(f"❌ {user_data['name']}: Final check failed")
    
    print(f"\n🎯 CONCLUSION:")
    print(f"If both users show the same usage, there's a backend rate limiting bug!")
    print(f"If users show different usage, the system is working correctly.")
    print(f"Your issue might be frontend caching or session management.")

if __name__ == "__main__":
    test_chat_rate_limiting()
