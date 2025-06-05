#!/usr/bin/env python3
"""
Test the API directly to see what's happening with learning plan creation and retrieval
"""

import requests
import json

BASE_URL = 'http://localhost:8000'

def test_learning_plan_creation_and_retrieval():
    """Test learning plan creation and retrieval directly"""
    print("🧪 Testing Learning Plan Creation and Retrieval")
    print("=" * 60)
    
    # Step 1: Login to get token
    print("1. Logging in...")
    login_data = {
        'email': 'sai@gmail.com',
        'password': 'password123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/api/auth/login/', json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return
            
        token = response.json().get('access')
        print(f"✅ Login successful")
        
        headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Create learning plan
    print("\n2. Creating learning plan...")
    plan_data = {
        "goal": "Learn Python in 3 days",
        "days": [
            {
                "day": 1,
                "topic": "Python Basics",
                "project_idea": "Create a calculator",
                "youtube_query": "python basics tutorial",
                "videos": [
                    {
                        "title": "Python Tutorial for Beginners",
                        "description": "Learn Python basics",
                        "video_id": "rfscVS0vtbw",
                        "thumbnail_url": "https://example.com/thumb.jpg",
                        "channel_title": "Test Channel"
                    }
                ]
            },
            {
                "day": 2,
                "topic": "Python Functions",
                "project_idea": "Create a function library",
                "youtube_query": "python functions tutorial",
                "videos": [
                    {
                        "title": "Python Functions Explained",
                        "description": "Learn about functions",
                        "video_id": "BVVdQuMnpW4",
                        "thumbnail_url": "https://example.com/thumb2.jpg",
                        "channel_title": "Test Channel"
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/api/learning/generate-learning-plan/',
            json=plan_data,
            headers=headers
        )
        
        print(f"Create Plan Response: {response.status_code}")
        
        if response.status_code in [200, 201]:
            creation_response = response.json()
            print("✅ Learning plan created!")
            print(f"Response structure: {json.dumps(creation_response, indent=2)}")
            
            # Extract the plan ID
            plan_id = creation_response.get('id')
            if plan_id:
                print(f"📋 Plan ID: {plan_id}")
                
                # Step 3: Retrieve the created plan
                print(f"\n3. Retrieving plan by ID: {plan_id}")
                
                try:
                    response = requests.get(
                        f'{BASE_URL}/api/learning/plans/{plan_id}/',
                        headers=headers
                    )
                    
                    print(f"Retrieve Plan Response: {response.status_code}")
                    
                    if response.status_code == 200:
                        plan_data = response.json()
                        print("✅ Plan retrieved successfully!")
                        print(f"Title: {plan_data.get('title')}")
                        print(f"Days count: {len(plan_data.get('days', []))}")
                        print(f"Plan structure: {json.dumps(plan_data, indent=2)}")
                        
                        # Check days structure
                        days = plan_data.get('days', [])
                        if days:
                            print(f"\n📅 Days structure:")
                            for i, day in enumerate(days):
                                print(f"  Day {i+1}: {day.get('topic', 'No topic')}")
                                videos = day.get('videos', [])
                                print(f"    Videos: {len(videos)}")
                                if videos:
                                    print(f"    First video: {videos[0].get('title', 'No title')}")
                        
                    else:
                        print(f"❌ Failed to retrieve plan: {response.status_code}")
                        print(f"Response: {response.text}")
                        
                except Exception as e:
                    print(f"❌ Error retrieving plan: {e}")
            else:
                print("❌ No plan ID in creation response")
                
        else:
            print(f"❌ Failed to create plan: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error creating plan: {e}")

if __name__ == '__main__':
    test_learning_plan_creation_and_retrieval()
