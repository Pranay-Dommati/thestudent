import requests
import json
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Base URL for API
BASE_URL = "http://127.0.0.1:8000/api"

def test_learning_plan_endpoints():
    """Test the learning plan API endpoints"""
    logging.info("Testing Learning Plan API Endpoints...")
    
    # Test listing all learning plans
    logging.info("\n1. Testing GET /api/learning/plans/")
    try:
        response = requests.get(f"{BASE_URL}/learning/plans/")
        logging.info(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            plans = response.json()
            logging.info(f"Found {len(plans)} learning plans")
            if plans:
                logging.info(f"First plan title: {plans[0]['title']}")
        else:
            logging.error(f"Error: {response.text}")
    except Exception as e:
        logging.exception(f"Exception: {str(e)}")
    
    # Test creating a new learning plan
    logging.info("\n2. Testing POST /api/learning/plans/")
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
        
        logging.info(f"Status Code: {response.status_code}")
        if response.status_code in (200, 201):
            new_plan = response.json()
            logging.info(f"Created plan with ID: {new_plan.get('id')}")
            
            # Test getting the specific plan
            logging.info(f"\n3. Testing GET /api/learning/plans/{new_plan.get('id')}/")
            detail_response = requests.get(f"{BASE_URL}/learning/plans/{new_plan.get('id')}/")
            logging.info(f"Status Code: {detail_response.status_code}")
            if detail_response.status_code == 200:
                plan_detail = detail_response.json()
                logging.info(f"Retrieved plan title: {plan_detail.get('title')}")
                logging.info(f"Number of days: {len(plan_detail.get('days', []))}")
            else:
                logging.error(f"Error: {detail_response.text}")
        else:
            logging.error(f"Error: {response.text}")
    except Exception as e:
        logging.exception(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_learning_plan_endpoints()
