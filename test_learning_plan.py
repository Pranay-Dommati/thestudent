#!/usr/bin/env python3
"""
Quick test script to verify the learning plan API endpoints
"""
import requests
import json
import uuid

# Test the learning plan generation endpoint
def test_learning_plan_api():
    api_url = "http://127.0.0.1:8000/api/learning/generate-learning-plan/"
    
    # Test data - a simple learning plan
    test_data = {
        "goal": "Learn Python Programming",
        "days": [
            {
                "day": 1,
                "topic": "Python Basics",
                "project_idea": "Hello World Program",
                "youtube_query": "Python basics tutorial",
                "videos": [
                    {
                        "title": "Python Tutorial for Beginners",
                        "description": "Learn Python basics",
                        "video_id": "kqtD5dpn9C8",
                        "thumbnail_url": "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
                        "channel_title": "Programming with Mosh"
                    }
                ]
            },
            {
                "day": 2,
                "topic": "Variables and Data Types",
                "project_idea": "Calculator Program",
                "youtube_query": "Python variables tutorial",
                "videos": [
                    {
                        "title": "Python Variables and Data Types",
                        "description": "Understanding Python data types",
                        "video_id": "OH86oLzVzzw",
                        "thumbnail_url": "https://i.ytimg.com/vi/OH86oLzVzzw/hqdefault.jpg",
                        "channel_title": "Corey Schafer"
                    }
                ]
            }
        ]
    }
    
    try:
        print("Testing Learning Plan API...")
        print(f"POST {api_url}")
        
        response = requests.post(api_url, json=test_data, headers={'Content-Type': 'application/json'})
        
        print(f"Status Code: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 201:
            print("✅ Learning plan created successfully!")
            plan_data = response.json()
            plan_id = plan_data.get('id')
            
            # Test retrieving the created plan
            if plan_id:
                print(f"\nTesting plan retrieval...")
                get_url = f"http://127.0.0.1:8000/api/learning/plans/{plan_id}/"
                get_response = requests.get(get_url)
                print(f"GET {get_url}")
                print(f"Status Code: {get_response.status_code}")
                
                if get_response.status_code == 200:
                    print("✅ Learning plan retrieved successfully!")
                    print("Plan structure:")
                    retrieved_plan = get_response.json()
                    print(f"- ID: {retrieved_plan.get('id')}")
                    print(f"- Title: {retrieved_plan.get('title')}")
                    print(f"- Days: {len(retrieved_plan.get('days', []))}")
                    for day in retrieved_plan.get('days', []):
                        print(f"  - Day {day.get('day')}: {day.get('topic')} ({len(day.get('videos', []))} videos)")
                else:
                    print(f"❌ Failed to retrieve learning plan: {get_response.text}")
        else:
            print(f"❌ Failed to create learning plan: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure Django server is running on http://127.0.0.1:8000/")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_learning_plan_list():
    """Test the learning plans list endpoint"""
    list_url = "http://127.0.0.1:8000/api/learning/plans/"
    
    try:
        print(f"\nTesting Learning Plans List API...")
        print(f"GET {list_url}")
        
        response = requests.get(list_url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            plans = response.json()
            print(f"✅ Found {len(plans)} learning plans")
            for plan in plans:
                print(f"- {plan.get('title')} (ID: {plan.get('id')})")
        else:
            print(f"❌ Failed to get learning plans: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_learning_plan_api()
    test_learning_plan_list()
