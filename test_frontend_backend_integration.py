#!/usr/bin/env python3

import requests
import json
import sys

def test_authentication_and_learning_plan():
    """Test complete frontend-backend integration for AI learning plans"""
    
    base_url = 'http://127.0.0.1:8000'
    
    print("🔍 Testing Frontend-Backend Integration for AI Learning Plans")
    print("=" * 60)
    
    # Step 1: Test user authentication    print("\n1. Testing User Authentication...")
    
    # Try to register a new user
    register_data = {
        'email': 'testuser@example.com',
        'full_name': 'Test User',
        'password': 'testpass123'
    }
    
    try:
        response = requests.post(f'{base_url}/api/auth/register/', json=register_data)
        print(f"Register Response: {response.status_code} - {response.text}")
        
        if response.status_code == 400 and 'already exists' in response.text:
            print("✅ User already exists, proceeding with login...")
        elif response.status_code in [200, 201]:
            print("✅ User registered successfully!")
        else:
            print("❌ Registration failed")
    except Exception as e:
        print(f"❌ Registration error: {e}")
    
    # Login to get token
    login_data = {
        'email': 'testuser@example.com',
        'password': 'testpass123'
    }    
    try:
        response = requests.post(f'{base_url}/api/auth/login/', json=login_data)
        print(f"Login Response: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access') or token_data.get('tokens', {}).get('access')
            if access_token:
                print("✅ Login successful, got access token")
                headers = {'Authorization': f'Bearer {access_token}'}
            else:
                print(f"❌ No access token in response: {token_data}")
                return
        else:
            print(f"❌ Login failed: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Test learning plan generation
    print("\n2. Testing Learning Plan Generation...")
    
    plan_data = {
        'goal': 'Learn React.js fundamentals',
        'days': 7
    }
    
    try:
        response = requests.post(
            f'{base_url}/api/learning/generate-learning-plan/', 
            json=plan_data,
            headers=headers
        )
        print(f"Generate Plan Response: {response.status_code}")
        
        if response.status_code in [200, 201]:
            plan_response = response.json()
            plan_id = plan_response.get('id')
            print(f"✅ Learning plan created with ID: {plan_id}")
            print(f"Plan Title: {plan_response.get('title', 'N/A')}")
            
            # Step 3: Test fetching the created plan
            print(f"\n3. Testing Plan Retrieval for ID: {plan_id}...")
            
            try:
                response = requests.get(
                    f'{base_url}/api/learning/plans/{plan_id}/',
                    headers=headers
                )
                print(f"Get Plan Response: {response.status_code}")
                
                if response.status_code == 200:
                    plan_details = response.json()
                    print("✅ Plan retrieved successfully!")
                    print(f"Title: {plan_details.get('title')}")
                    print(f"Days count: {len(plan_details.get('days', []))}")
                    
                    # Show first day's videos
                    days = plan_details.get('days', [])
                    if days:
                        first_day = days[0]
                        videos = first_day.get('videos', [])
                        print(f"First day has {len(videos)} videos")
                        if videos:
                            print(f"First video: {videos[0].get('title', 'N/A')}")
                else:
                    print(f"❌ Failed to retrieve plan: {response.text}")
                    
            except Exception as e:
                print(f"❌ Plan retrieval error: {e}")
                
        else:
            print(f"❌ Plan generation failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Plan generation error: {e}")
    
    # Step 4: Test getting user's learning plans
    print("\n4. Testing User's Learning Plans List...")
    
    try:
        response = requests.get(
            f'{base_url}/api/learning/user-plans/',
            headers=headers
        )
        print(f"User Plans Response: {response.status_code}")
        
        if response.status_code == 200:
            user_plans = response.json()
            print(f"✅ Retrieved user plans: {user_plans.get('count', 0)} plans")
            plans = user_plans.get('plans', [])
            for i, plan in enumerate(plans[:3]):  # Show first 3
                print(f"  Plan {i+1}: {plan.get('title')} (ID: {plan.get('id')})")
        else:
            print(f"❌ Failed to get user plans: {response.text}")
            
    except Exception as e:
        print(f"❌ User plans error: {e}")
    
    print("\n" + "=" * 60)
    print("🏁 Integration test completed!")

if __name__ == "__main__":
    test_authentication_and_learning_plan()
