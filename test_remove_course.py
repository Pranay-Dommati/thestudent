import requests
import json

# Test script for the new remove course functionality
API_URL = 'http://localhost:8000'

def test_remove_course_functionality():
    """
    Test the complete remove course functionality
    """
    print("🧪 Testing Remove Course Functionality")
    print("=" * 50)
    
    # You'll need to replace this with a valid token
    # Get this from your browser's localStorage or login first
    token = "your_token_here"
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # 1. First, get enrolled courses to see what we have
        print("1. Getting enrolled courses...")
        response = requests.get(f'{API_URL}/api/courses/enrolled/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data['success'] and data['courses']:
                print(f"✅ Found {len(data['courses'])} enrolled courses")
                for i, course in enumerate(data['courses']):
                    print(f"   Course {i+1}: ID={course.get('id', 'N/A')}, Name='{course.get('title', 'N/A')}'")
                
                # Test delete functionality with first course
                if data['courses']:
                    test_course = data['courses'][0]
                    enrollment_id = test_course.get('id')
                    
                    if enrollment_id:
                        print(f"\n2. Testing delete for enrollment ID: {enrollment_id}")
                        delete_response = requests.delete(
                            f'{API_URL}/api/courses/enrollment/{enrollment_id}/', 
                            headers=headers
                        )
                        
                        print(f"Delete response status: {delete_response.status_code}")
                        print(f"Delete response: {delete_response.json()}")
                        
                        if delete_response.status_code == 200:
                            print("✅ Delete functionality working!")
                        else:
                            print("❌ Delete functionality failed")
                    else:
                        print("❌ No enrollment ID found in course data")
            else:
                print("❌ No enrolled courses found or API call failed")
        else:
            print(f"❌ Failed to get enrolled courses: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

def print_instructions():
    """
    Print instructions for manual testing
    """
    print("\n" + "=" * 60)
    print("📋 MANUAL TESTING INSTRUCTIONS")
    print("=" * 60)
    print("1. Open your browser and navigate to the Learning Hub")
    print("2. Make sure you have some enrolled courses")
    print("3. Look for the new 'Remove' button on each course card")
    print("4. Click the Remove button and confirm the deletion")
    print("5. Verify the course is removed from the list")
    print("\n🔧 Backend Features Implemented:")
    print("   ✅ Delete enrollment endpoint: DELETE /api/courses/enrollment/<id>/")
    print("   ✅ Authentication check (only owner can delete)")
    print("   ✅ Error handling and proper HTTP status codes")
    print("   ✅ Course info returned in response")
    print("\n🎨 Frontend Features Implemented:")
    print("   ✅ Fixed card sizes (h-48 for images, h-40 for content)")
    print("   ✅ Load more functionality (shows 4 courses initially)")
    print("   ✅ Remove button with confirmation dialog")
    print("   ✅ Loading state during removal")
    print("   ✅ Toast notifications for success/error")
    print("   ✅ Grid layout with hover effects")

if __name__ == "__main__":
    print_instructions()
    print("\n📝 To test the API directly, update the token in this script and run:")
    print("python test_remove_course.py")
