import requests
import json
import uuid

# Base URL for API
BASE_URL = "http://127.0.0.1:8000/api"

def test_learning_plan_endpoints():
    """Test the learning plan API endpoints"""
    print("Testing Learning Plan API Endpoints...")
    
    # Test listing all learning plans
    print("\n1. Testing GET /api/learning/plans/")
    try:
        response = requests.get(f"{BASE_URL}/learning/plans/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            plans = response.json()
            print(f"Found {len(plans)} learning plans")
            if plans:
                print(f"First plan title: {plans[0]['title']}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")
    
    # Test creating a new learning plan
    print("\n2. Testing POST /api/learning/plans/")
    try:
        # Create a simple test plan
        test_plan = {
            "goal": f"Test Learning Plan {uuid.uuid4()}",
            "days": [
                {
                    "day": 1,
                    "topic": "Getting Started",
                    "project_idea": "Hello World",
                    "youtube_query": "python tutorial beginners",
                    "videos": [
                        {
                            "title": "Test Video",
                            "description": "Test Description",
                            "video_id": "abc123",
                            "thumbnail_url": "https://example.com/thumbnail.jpg",
                            "channel_title": "Test Channel"
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/learning/plans/", 
            json=test_plan,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code in (200, 201):
            new_plan = response.json()
            print(f"Created plan with ID: {new_plan.get('id')}")
            
            # Test getting the specific plan
            print(f"\n3. Testing GET /api/learning/plans/{new_plan.get('id')}/")
            detail_response = requests.get(f"{BASE_URL}/learning/plans/{new_plan.get('id')}/")
            print(f"Status Code: {detail_response.status_code}")
            if detail_response.status_code == 200:
                plan_detail = detail_response.json()
                print(f"Retrieved plan title: {plan_detail.get('title')}")
                print(f"Number of days: {len(plan_detail.get('days', []))}")
            else:
                print(f"Error: {detail_response.text}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_learning_plan_endpoints()
