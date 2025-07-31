import requests
import json

def test_pro_learning_endpoints():
    """Test all Pro Learning endpoints to verify URL routing"""
    base_url = "http://127.0.0.1:8000/api/courses/pro-learning"
    
    # Test data
    test_data = {
        "course_id": "test-course-123",
        "title": "Test Course",
        "topics": {
            "Test Topic": {
                "videos": [{"title": "Test Video", "url": "https://example.com"}],
                "quizQuestions": [{"question": "Test?", "options": ["A", "B"], "correct": 0}],
                "resources": [{"title": "Test Resource", "url": "https://example.com"}]
            }
        }
    }
    
    endpoints_to_test = [
        ("test/", "Test endpoint"),
        ("save-course/", "Main save endpoint"),
        ("save-from-storage-simple/", "Alternative save endpoint")
    ]
    
    print("🧪 Testing Pro Learning API endpoints...")
    print(f"📡 Base URL: {base_url}")
    
    for endpoint, description in endpoints_to_test:
        url = f"{base_url}/{endpoint}"
        print(f"\n🔍 Testing {description}: {url}")
        
        try:
            response = requests.post(
                url, 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCESS - Endpoint working!")
            elif response.status_code == 201:
                print("✅ SUCCESS - Course created!")
            elif response.status_code == 401:
                print("🔐 AUTH REQUIRED - Endpoint exists but needs authentication")
            elif response.status_code == 405:
                print("❌ METHOD NOT ALLOWED - URL routing issue")
            elif response.status_code == 404:
                print("❌ NOT FOUND - Endpoint doesn't exist")
            else:
                print(f"ℹ️ Response: {response.status_code}")
            
            # Print response content (first 200 chars)
            try:
                response_data = response.json()
                print(f"📝 Response: {str(response_data)[:200]}...")
            except:
                print(f"📝 Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print("❌ CONNECTION ERROR - Django server not running")
        except Exception as e:
            print(f"❌ ERROR: {e}")
    
    print("\n🎯 Summary:")
    print("If you see 405 errors, the URL routing is incorrect.")
    print("If you see 401 errors, the endpoints exist but need authentication.")
    print("If you see 200/201, the endpoints are working correctly!")

if __name__ == "__main__":
    test_pro_learning_endpoints()
