import requests
import json

def test_direct_endpoint():
    """Test the direct Pro Learning endpoint"""
    url = "http://127.0.0.1:8000/api/courses/pro-learning-direct/save/"
    
    test_data = {
        "course_id": "test-course-456",
        "title": "Direct Test Course",
        "topics": {
            "Direct Test Topic": {
                "videos": [{"title": "Direct Test Video", "url": "https://example.com"}],
                "quizQuestions": [{"question": "Direct Test?", "options": ["A", "B"], "correct": 0}],
                "resources": [{"title": "Direct Test Resource", "url": "https://example.com"}]
            }
        }
    }
    
    print("🧪 Testing Direct Pro Learning endpoint...")
    print(f"📡 URL: {url}")
    
    try:
        response = requests.post(
            url, 
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ SUCCESS - Course created successfully!")
        elif response.status_code == 200:
            print("✅ SUCCESS - Request processed!")
        elif response.status_code == 401:
            print("🔐 AUTH REQUIRED - Still needs authentication")
        elif response.status_code == 405:
            print("❌ METHOD NOT ALLOWED - URL routing issue")
        elif response.status_code == 404:
            print("❌ NOT FOUND - Endpoint doesn't exist")
        else:
            print(f"ℹ️ Response: {response.status_code}")
        
        # Print response content
        try:
            response_data = response.json()
            print(f"📝 Response: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📝 Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Django server not running")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_direct_endpoint()
